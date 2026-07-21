import { Events } from 'discord.js';
import { config } from '../config.js';
import { getState, setState, hasDb } from '../db.js';

/**
 * Announce a YouTube channel's new uploads in a Discord channel.
 *
 * Detection goes through the public Atom feed YouTube exposes per channel: no
 * API key, no quota, no Google project to maintain — unlike the Data API v3.
 * The feed carries the ~15 most recent uploads.
 *
 * The publication date of the last announced video is kept in the DB, so a
 * restart never re-posts and never skips.
 */

const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

// YouTube caches the feed for a few minutes; polling tighter buys nothing.
const POLL_MS = 10 * 60 * 1000;

const LAST_KEY = 'youtube:lastPublished';
const RESOLVED_KEY = 'youtube:resolvedChannel';

// Bot application emoji opening the announcement (a red YouTube play badge).
const YOUTUBE_EMOJI = '<:youtube:1529071453952151723>';

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' };

/** Decode the XML entities YouTube escapes inside <title>. */
function decodeEntities(text) {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/**
 * Pull the channel name and its uploads out of a feed document. YouTube
 * generates it with a stable shape, so extracting four fields directly beats
 * adding an XML parser dependency.
 * @returns {{author: string, videos: {id: string, title: string, url: string, published: string}[]}}
 */
export function parseFeed(xml) {
  // The feed-level <author><name> is the channel name. Entries repeat it, so
  // the first match is taken before splitting the document into entries.
  const author = decodeEntities(/<author>\s*<name>([^<]*)<\/name>/.exec(xml)?.[1] ?? '').trim();

  const videos = [];
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(entry)?.[1];
    if (!id || !published) continue;
    videos.push({
      id,
      title: decodeEntities(/<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? '').trim(),
      url: `https://www.youtube.com/watch?v=${id}`,
      published,
    });
  }
  return { author, videos };
}

/** Extract a channel id from a raw config value, or null if it holds a handle. */
function directChannelId(value) {
  if (/^UC[\w-]{22}$/.test(value)) return value;
  return /channel\/(UC[\w-]{22})/.exec(value)?.[1] ?? null;
}

/**
 * Turn the configured value into a channel id. The feed endpoint only accepts
 * ids, but a handle ("@FRESHBY") is what people actually have at hand, so a
 * handle is resolved once by reading the channel page and then cached.
 */
async function resolveChannelId(value) {
  const direct = directChannelId(value);
  if (direct) return direct;

  const handle = /@([\w.-]+)/.exec(value)?.[1];
  if (!handle) return null;

  // The cache stores the handle it was built from: changing the config value
  // must not keep pointing at the previous channel.
  const cached = await getState(RESOLVED_KEY).catch(() => null);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.handle === handle) return parsed.id;
    } catch {
      // Corrupt entry: fall through and resolve again.
    }
  }

  const res = await fetch(`https://www.youtube.com/@${handle}`, {
    headers: { 'accept-language': 'fr,en;q=0.8' },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) return null;

  const html = await res.text();
  const id = /"channelId":"(UC[\w-]{22})"/.exec(html)?.[1] ?? /channel\/(UC[\w-]{22})/.exec(html)?.[1] ?? null;
  if (id) await setState(RESOLVED_KEY, JSON.stringify({ handle, id })).catch(() => {});
  return id;
}

/** The message posted for one video. No mention: announcements must not ping. */
function videoMessage(author, video) {
  const who = author || 'la chaîne';
  const quote = video.title ? `\n\n> ${video.title}` : '';
  return {
    content: `${YOUTUBE_EMOJI} **Nouvelle vidéo !** » \`${who}\`${quote}\n\n${video.url}`,
    allowedMentions: { parse: [] },
  };
}

let running = false;

/**
 * One poll: fetch the feed, post whatever is newer than the last announced
 * video, and move the marker forward.
 * @param {import('discord.js').Client} client
 */
async function tick(client) {
  const source = config.youtubeChannelId;
  const targetId = config.youtubeAnnounceChannelId;
  if (!source || !targetId) return; // Not configured: the watcher stays off.

  // Without a DB the marker cannot persist, so the watcher would either spam on
  // every restart or never post. Refusing loudly beats behaving unpredictably.
  if (!hasDb()) {
    console.warn('[youtube] No DATABASE_URL: the video watcher is disabled.');
    return;
  }

  if (running) return; // A slow poll must not overlap the next one.
  running = true;
  try {
    const channelId = await resolveChannelId(source);
    if (!channelId) {
      console.error(`[youtube] Could not resolve a channel id from "${source}".`);
      return;
    }

    const res = await fetch(FEED_URL + channelId, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (!res?.ok) {
      console.error(`[youtube] Feed request failed (${res ? `HTTP ${res.status}` : 'network error'}).`);
      return;
    }

    const { author, videos } = parseFeed(await res.text());
    if (!videos.length) return;

    const newest = videos.reduce((a, b) => (a.published > b.published ? a : b));
    const last = await getState(LAST_KEY);

    // First run: remember where we are instead of flooding the channel with the
    // whole backlog the feed carries.
    if (!last) {
      await setState(LAST_KEY, newest.published);
      console.log(`[youtube] Baseline set at ${newest.published}; nothing posted.`);
      return;
    }

    const fresh = videos.filter((v) => v.published > last).sort((a, b) => a.published.localeCompare(b.published));
    if (!fresh.length) return;

    const channel = await client.channels.fetch(targetId).catch(() => null);
    if (!channel?.isTextBased()) {
      console.error(`[youtube] Channel ${targetId} is unreachable or not text-based.`);
      return;
    }

    // Oldest first, and the marker moves after each send: an error mid-way
    // leaves the already-posted videos behind, never re-posting them.
    for (const video of fresh) {
      await channel.send(videoMessage(author, video));
      await setState(LAST_KEY, video.published);
      console.log(`[youtube] Announced ${video.id} (${video.published}).`);
    }
  } finally {
    running = false;
  }
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerYoutube(client) {
  client.once(Events.ClientReady, (c) => {
    const run = () => tick(c).catch((e) => console.error('[youtube] Poll failed:', e?.message ?? e));
    run(); // Catch up on whatever went out while the bot was down.
    setInterval(run, POLL_MS);
  });
}
