// infos-go: every new message of a source channel (🎨・g47ix, fed by an
// announcement follow) is copied into the permanent post of its theme in a
// forum (📚・infos-go). The weekly programme gets its own pinned post each week;
// the previous one is unpinned and kept. The theme comes from the Claude API; any doubt or error = Divers.
// The original is never deleted. Enabled per guild by INFOS_GO, see .env.example.

import { Events } from 'discord.js';

export const THEMES = ['Raids', 'Événements', 'Community Day', 'Heures vedettes', 'Recherches', 'Passe GO', 'Divers'];
const PROGRAMME = 'programme';
const PROGRAMME_TITLE = 'Programme de la semaine';
const MODEL = 'claude-haiku-5-5';
const MONTHLY = 'programme-mois'; // monthly programme: filed under Événements, never pinned
const MAX_BASE64_BYTES = 3.75 * 1024 * 1024; // 5 MB once base64-encoded (API limit)
const MAX_IMAGES = 4; // enough to classify, caps the cost

/**
 * First message of each theme post, like the ・logs posts: one emoji, what lands there.
 * The weekly programme has none: each programme is its own post.
 * Custom emojis must belong to a guild the bot is in (here: Pokémon GO - Pau).
 */
export const INFOS_GO_WELCOME = {
  'Raids':
    "<:pass_raid:1519020978296983552> Les boss de raid arrivent ici : raids Méga, Dynamax et Gigamax, heures de raids et les meilleurs counters pour les battre. La dernière annonce est tout en bas, il ne reste qu'à trouver un groupe !",
  'Événements':
    "Tout ce qui anime le jeu atterrit ici : événements, saisons, GO Fest, bonus du moment et programme du mois. La dernière annonce est toujours en bas <a:Party_blob:1529145371513590003>",
  'Community Day':
    "<a:Pokemonball:1531352075609571449> Chaque Journée Communauté passe par ici : le Pokémon vedette, son attaque exclusive, les bonus et les horaires. De quoi préparer ses Poké Balls à l'avance.",
  'Heures vedettes':
    "Le rendez-vous du jeudi soir : le Pokémon vedette et le bonus de chaque heure vedette arrivent ici. Une heure, pas une minute de plus, alors on ne la rate pas <:shiny:1519251122336825355>",
  'Recherches':
    "<a:Eveee:1529918494727082064> Études de terrain, recherches spéciales et temporaires : les quêtes du moment et leurs récompenses sont rangées ici. Pratique pour savoir quelle Pokéstop tourner.",
  'Passe GO':
    "<a:Meowthmoney:1519057385770061934> Le Passe GO de chaque mois atterrit ici : paliers, récompenses et ce qu'il faut faire pour les débloquer. Le plus récent est tout en bas.",
  'Divers':
    "Ce qui ne rentre dans aucune autre case finit ici : mises à jour du jeu, nouveautés et petites infos en vrac. Ça vaut le coup d'y jeter un œil de temps en temps <a:Mewlove:1519057678410711171>",
};

// Discord's content-type is not reliable (PNG files announced as image/jpeg):
// the API checks the real type, so read it from the first bytes.
export function sniffImageType(buf) {
  if (buf.length >= 8 && buf.readUInt32BE(0) === 0x89504e47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'image/gif';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

/** "guildId:sourceId:forumId, …" → [{ guildId, sourceId, forumId }]. */
export function parseRules(raw) {
  return String(raw ?? '')
    .split(/[\s,]+/)
    .map((s) => s.split(':'))
    .filter((p) => p.length === 3 && p.every(Boolean))
    .map(([guildId, sourceId, forumId]) => ({ guildId, sourceId, forumId }));
}

const SYSTEM =
  'Tu ranges des infographies Pokémon GO (en français) dans un forum Discord. ' +
  'Choisis le thème du message : ' +
  '« Raids » (boss de raid, raids Méga, Dynamax, Gigamax, heures de raids) ; ' +
  '« Événements » (événements, saisons, GO Fest, bonus d’événement) ; ' +
  '« Community Day » (Journée Communauté, Community Day Classique) ; ' +
  '« Heures vedettes » (heure vedette du jeudi) ; ' +
  '« Recherches » (études de terrain, recherches spéciales ou temporaires, récompenses de quêtes) ; ' +
  '« Passe GO » (Passe GO du mois, ex. « Passe GO : Octobre », paliers et récompenses du Passe) ; ' +
  '« programme » UNIQUEMENT pour le programme de la semaine (les 7 jours à venir, récapitulatif hebdomadaire) ; ' +
  '« programme-mois » pour un programme ou calendrier du mois entier (ex. « Programme de NOVEMBRE ») ; ' +
  '« Divers » pour tout le reste ou en cas de doute.';

async function ask(key, content) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 64,
      thinking: { type: 'disabled' },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: { theme: { type: 'string', enum: [...THEMES, PROGRAMME, MONTHLY] } },
            required: ['theme'],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = await res.json().then((b) => b?.error?.message).catch(() => null);
    throw Object.assign(new Error(`API Anthropic : HTTP ${res.status}${detail ? ` : ${detail}` : ''}`), { status: res.status });
  }
  const body = await res.json();
  const out = body.content?.find((b) => b.type === 'text')?.text;
  return JSON.parse(out).theme;
}

/**
 * Ask Claude for the theme of an info. Resolves to one of THEMES or 'programme'
 * (a monthly programme comes back as Événements). Images the API refuses (400)
 * are dropped and the text alone is classified. Throws on any other failure
 * (the caller files it under Divers).
 * @param {string} text
 * @param {({ data: Buffer, mediaType: string } | { url: string })[]} images
 */
export async function classify(text, images) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY manquante');

  const textBlock = { type: 'text', text: text?.trim() || '(pas de texte, seulement les images)' };
  const imageBlocks = images.map((img) => ({
    type: 'image',
    source: img.url
      ? { type: 'url', url: img.url }
      : { type: 'base64', media_type: img.mediaType, data: img.data.toString('base64') },
  }));

  let theme;
  try {
    theme = await ask(key, [...imageBlocks, textBlock]);
  } catch (err) {
    if (err.status !== 400 || !imageBlocks.length || !text?.trim()) throw err;
    console.error('[infos-go] images refusées, classement sur le texte seul :', err.message);
    theme = await ask(key, [textBlock]);
  }
  return theme === MONTHLY ? 'Événements' : theme;
}

export async function downloadBuffer(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Message to post: text (cut to fit) + source link, files re-uploaded, rich embeds. */
function buildPayload(message, files) {
  const source = `\n-# [Source](${message.url})`;
  const text = (message.content ?? '').slice(0, 2000 - source.length);
  return {
    content: `${text}${source}`.trim(),
    files,
    // Link previews (image, video…) come back from the URLs in the text.
    embeds: (message.embeds ?? []).filter((e) => (e.data?.type ?? e.type ?? 'rich') === 'rich'),
    allowedMentions: { parse: [] },
  };
}

/**
 * File one message of a source channel into its forum.
 * @param {*} message  discord.js Message
 * @param {{ rules, classify, store: { get, set }, download, fetchChannel }} deps
 */
export async function fileInfo(message, deps) {
  const rule = deps.rules.find((r) => r.guildId === message.guildId && r.sourceId === message.channelId);
  if (!rule) return;

  // Download each attachment once: the CDN URL expires, the re-upload does not.
  // A failed download falls back to the URL (discord.js retries it at send time).
  const files = [];
  const images = [];
  for (const a of message.attachments.values()) {
    try {
      const data = await deps.download(a.url);
      files.push({ attachment: data, name: a.name });
      const mediaType = sniffImageType(data);
      if (mediaType && images.length < MAX_IMAGES) {
        // Too heavy for base64: Claude fetches it by its (fresh) CDN URL.
        images.push(data.length <= MAX_BASE64_BYTES ? { data, mediaType } : { url: a.url });
      }
    } catch {
      files.push({ attachment: a.url, name: a.name });
    }
  }

  let theme;
  try {
    theme = await deps.classify(message.content, images);
  } catch (err) {
    console.error('[infos-go] classement impossible, Divers :', err.message);
  }
  if (theme !== PROGRAMME && !THEMES.includes(theme)) theme = 'Divers';

  const forum = await deps.fetchChannel(rule.forumId);
  const payload = buildPayload(message, files);
  const key = `infos-go:${rule.guildId}:${theme}`;
  const knownId = await deps.store.get(key);

  if (theme === PROGRAMME) {
    const post = await forum.threads.create({ name: PROGRAMME_TITLE, message: payload });
    await deps.store.set(key, post.id);
    if (knownId) {
      const old = await deps.fetchChannel(knownId).catch(() => null);
      // Old programmes stay in the forum, only unpinned (one pin per forum).
      if (old) await old.unpin().catch((err) => console.error('[infos-go] désépinglage impossible :', err.message));
    }
    await post.pin().catch((err) => console.error('[infos-go] épinglage impossible :', err.message));
    return;
  }

  const known = knownId ? await deps.fetchChannel(knownId).catch(() => null) : null;
  if (known) {
    await known.send(payload);
    return;
  }
  const tag = forum.availableTags.find((t) => t.name === theme);
  const welcome = { content: INFOS_GO_WELCOME[theme], allowedMentions: { parse: [] } };
  const post = await forum.threads.create({ name: theme, message: welcome, appliedTags: tag ? [tag.id] : [] });
  await deps.store.set(key, post.id);
  await post.send(payload);
}

/**
 * Existing post that starts with an announcement: Discord cannot insert a
 * message, so shift everything down one place. The first message becomes the
 * welcome, each next message takes the previous one's content, the last
 * announcement is sent again at the end. Every message must be the bot's own.
 * @param {{ id: string, content: string }[]} messages  the whole post, any order
 * @returns {({ edit: string, welcome: string } | { edit: string, from: object } | { send: true, from: object })[]}
 */
export function planWelcomeShift(messages, welcome) {
  const ordered = [...messages].sort(byId);
  if (!ordered.length || ordered[0].content === welcome) return [];
  return [
    { edit: ordered[0].id, welcome },
    ...ordered.slice(1).map((m, i) => ({ edit: m.id, from: ordered[i] })),
    { send: true, from: ordered.at(-1) },
  ];
}

// --- Backfill (scripts/infos-go-rattrapage.mjs) ---

const BACKFILL_USAGE =
  'usage : infos-go-rattrapage <salon source (id ou nom)> <guilde:source:forum> [--limit N] [--dry-run] [--depuis <messageId>]';

/** CLI args → { source, rule, limit, dryRun, depuis }. Throws the usage on anything odd. */
export function parseBackfillArgs(argv) {
  const out = { source: null, rule: null, limit: 50, dryRun: false, depuis: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--limit') out.limit = Number(argv[++i]);
    else if (a === '--depuis') out.depuis = argv[++i] ?? '';
    else if (a.startsWith('--')) throw new Error(BACKFILL_USAGE);
    else positional.push(a);
  }
  const rules = parseRules(positional[1]);
  if (positional.length !== 2 || rules.length !== 1 || !(Number.isInteger(out.limit) && out.limit > 0) || out.depuis === '') {
    throw new Error(BACKFILL_USAGE);
  }
  return { ...out, source: positional[0], rule: rules[0] };
}

const byId = (a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0);

/** Normal messages only (type 0: no follow notice, pin notice…), the `limit` newest, oldest first. */
export function selectBackfill(messages, { limit, depuis = null }) {
  const kept = [...messages].filter((m) => m.type === 0).sort(byId).slice(-limit);
  return depuis ? kept.filter((m) => BigInt(m.id) >= BigInt(depuis)) : kept;
}

/** What fileInfo reads, as if the message came from the rule's source channel. Read only: no methods. */
export function asBackfill(message, rule) {
  return {
    id: message.id,
    guildId: rule.guildId,
    channelId: rule.sourceId,
    url: message.url,
    content: message.content,
    attachments: message.attachments,
    embeds: message.embeds,
  };
}

/**
 * @param {import('discord.js').Client} client
 * @param {{ rules, store }} opts  rules from INFOS_GO, store = bot_kv getState/setState
 */
export function registerInfosGo(client, { rules, store }) {
  if (!rules.length) return;
  const deps = {
    rules,
    store,
    classify,
    download: downloadBuffer,
    fetchChannel: (id) => client.channels.fetch(id),
  };
  // One message at a time: keeps the order and never creates a theme post twice.
  let queue = Promise.resolve();
  client.on(Events.MessageCreate, (message) => {
    if (message.author?.id === client.user?.id) return;
    queue = queue
      .then(() => fileInfo(message, deps))
      .catch((err) => console.error('[infos-go] rangement échoué :', message.url, err));
  });
  console.log(`[infos-go] actif pour ${rules.length} serveur(s).`);
}
