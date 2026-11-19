// Rattrapage infos-go : range dans un forum les N derniers messages d'un salon
// source, du plus ancien au plus récent, avec exactement le code du bot
// (fileInfo de src/features/infosGo.js) et les mêmes clés bot_kv que la règle
// cible : le bot en ligne continue ensuite les mêmes posts de thème.
// Le salon source est en LECTURE SEULE : seul messages.fetch y est appelé.
// Token et clés lus dans l'environnement du conteneur du bot.
// Usage : node scripts/infos-go-rattrapage.mjs <salon source (id ou nom)> <guilde:source:forum>
//         [--limit 50] [--dry-run] [--depuis <messageId>]
// Depuis le VPS, passer par scripts/infos-go-rattrapage.sh (une seule exécution à la fois).
import { Client, ChannelType, Events, GatewayIntentBits } from 'discord.js';
import { classify, downloadBuffer, fileInfo, THEMES, parseBackfillArgs, selectBackfill, asBackfill } from '../src/features/infosGo.js';
import { getState, setState, pool } from '../src/db.js';

function fail(msg) {
  console.error(`rattrapage : ${msg}`);
  process.exit(1);
}

let args;
try {
  args = parseBackfillArgs(process.argv.slice(2));
} catch (err) {
  fail(err.message);
}
const { rule, limit, dryRun, depuis } = args;

// Guilds seul : pas d'événement de message, le bot en ligne n'est pas doublé.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((resolve) => (client.isReady() ? resolve() : client.once(Events.ClientReady, resolve)));

try {
  // Salon source : un id, ou un nom cherché dans la guilde GUILD_ID.
  let source;
  if (/^\d+$/.test(args.source)) {
    source = await client.channels.fetch(args.source).catch(() => null);
  } else {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const all = await guild.channels.fetch();
    const found = [...all.values()].filter((c) => c?.name?.toLowerCase().includes(args.source.toLowerCase()));
    if (found.length !== 1) fail(`« ${args.source} » : ${found.length} salons trouvés (${found.map((c) => `${c.name} ${c.id}`).join(', ')}).`);
    source = found[0];
  }
  if (!source?.messages) fail(`salon source introuvable ou sans messages : ${args.source}`);

  // Garde-fou : on n'écrit que dans le forum de la règle, et il doit être dans sa guilde.
  const forum = await client.channels.fetch(rule.forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum || forum.guildId !== rule.guildId) {
    fail(`le forum ${rule.forumId} n'est pas un forum de la guilde ${rule.guildId}.`);
  }
  if (source.guildId === rule.guildId && source.id === rule.sourceId) {
    fail('la source est le salon source de la règle : le bot en ligne le range déjà.');
  }
  console.log(`source : #${source.name} (${source.id}, guilde ${source.guildId}) -> forum ${forum.name} (${forum.id}, guilde ${forum.guildId})${dryRun ? ' [essai à blanc]' : ''}`);

  // Pages de 100 jusqu'à avoir `limit` messages normaux (ou la fin du salon).
  const fetched = [];
  let before;
  for (let page = 0; page < 20; page++) {
    const batch = await source.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    fetched.push(...batch.values());
    if (batch.size < 100 || fetched.filter((m) => m.type === 0).length >= limit) break;
    before = batch.last().id;
  }
  const todo = selectBackfill(fetched, { limit, depuis });
  console.log(`${fetched.length} messages lus, ${todo.length} à ranger.`);

  let theme = null;
  let note = '';
  const deps = {
    rules: [rule],
    download: downloadBuffer,
    classify: async (text, images) => {
      try {
        theme = await classify(text, images);
        note = `Claude : ${theme}`;
      } catch (err) {
        note = `Claude en erreur : ${err.message}`;
        throw err;
      }
      return theme;
    },
    store: dryRun ? { get: async () => null, set: async () => {} } : { get: getState, set: setState },
    // Essai à blanc : un faux forum, rien n'est envoyé.
    fetchChannel: dryRun
      ? async () => ({ availableTags: [], threads: { create: async () => ({ id: 'essai', pin: async () => {} }) } })
      : (id) => client.channels.fetch(id),
  };

  for (const [i, message] of todo.entries()) {
    theme = null;
    note = '';
    const extrait = (message.content || '(sans texte)').replace(/\s+/g, ' ').slice(0, 60);
    try {
      await fileInfo(asBackfill(message, rule), deps);
    } catch (err) {
      fail(`arrêt sur ${message.id} (${err.message}). Reprendre avec --depuis ${message.id}`);
    }
    const final = theme === 'programme' || THEMES.includes(theme) ? theme : 'Divers';
    console.log(
      `[${i + 1}/${todo.length}] ${message.createdAt.toISOString()} ${message.id} -> ${final} (${note}, ${message.attachments.size} pièce(s) jointe(s)) | ${extrait}`,
    );
  }
  console.log(dryRun ? 'Essai à blanc terminé, rien envoyé.' : 'Rattrapage terminé.');
} finally {
  client.destroy();
  await pool?.end();
}
