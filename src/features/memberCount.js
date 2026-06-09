import { Events } from 'discord.js';
import { config } from '../config.js';

/**
 * Keeps a voice channel's name in sync with the server member count,
 * displayed as "Membres : {nb}".
 *
 * Discord rate-limits channel renames hard (about 2 per 10 minutes per
 * channel), so updates are coalesced and never fire more often than
 * MIN_INTERVAL_MS. A burst of joins/leaves results in a single rename.
 *
 * Requirements:
 *  - GuildMembers privileged intent (already enabled for /map).
 *  - The bot needs the "Manage Channels" permission on the target channel.
 */
const MIN_INTERVAL_MS = 6 * 60 * 1000;

let lastEditAt = 0;
let timer = null;

function channelName(count) {
  return `Membres : ${count}`;
}

async function applyUpdate(client) {
  timer = null;

  const channelId = config.memberCountChannelId;
  if (!channelId) return;

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return;

  let channel;
  try {
    channel = await client.channels.fetch(channelId);
  } catch {
    console.warn(`[memberCount] Channel ${channelId} not found or inaccessible.`);
    return;
  }
  if (!channel) return;

  // Count humans only (exclude bots). Requires the GuildMembers intent.
  const members = await guild.members.fetch();
  const humans = members.filter((m) => !m.user.bot).size;

  const name = channelName(humans);
  if (channel.name === name) {
    lastEditAt = Date.now();
    return;
  }

  try {
    await channel.setName(name);
    lastEditAt = Date.now();
    console.log(`[memberCount] Updated channel to "${name}".`);
  } catch (error) {
    console.error('[memberCount] Failed to rename channel:', error);
  }
}

/** Coalesce updates and respect the rename rate limit. */
function schedule(client) {
  if (timer) return;
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastEditAt));
  timer = setTimeout(() => applyUpdate(client), wait);
}

/**
 * Wire up the member-count channel on a discord.js client.
 * @param {import('discord.js').Client} client
 */
export function registerMemberCount(client) {
  if (!config.memberCountChannelId) {
    console.warn('[memberCount] No MEMBER_COUNT_CHANNEL_ID configured; feature disabled.');
    return;
  }

  client.once(Events.ClientReady, () => applyUpdate(client));
  client.on(Events.GuildMemberAdd, (member) => {
    if (member.guild.id === config.guildId) schedule(client);
  });
  client.on(Events.GuildMemberRemove, (member) => {
    if (member.guild.id === config.guildId) schedule(client);
  });
}
