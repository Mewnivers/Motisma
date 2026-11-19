// Range les anciens « Programme de la semaine » d'un forum infos-go : garde le
// plus récent (épinglé), recopie chaque plus ancien, du plus vieux au plus
// récent, dans le post « Archives des programmes » (créé avec son accueil s'il
// manque, id dans bot_kv), relit chaque copie par GET (texte et nombre de
// fichiers), et seulement si tout correspond supprime les anciens posts.
// --supprimer-test supprime aussi le post « Test déplacement ».
// Usage : node scripts/infos-go-archives.mjs <id du forum> [--dry-run] [--supprimer-test]
// Depuis le VPS, passer par scripts/infos-go-archives.sh.
import { ChannelFlags, ChannelType, Client, Events, GatewayIntentBits } from 'discord.js';
import { ARCHIVE_TITLE, archivePost, copyMessage, downloadBuffer } from '../src/features/infosGo.js';
import { getState, setState, pool } from '../src/db.js';

const PROGRAMME_TITLE = 'Programme de la semaine';
const TEST_TITLE = 'Test déplacement';
const FLAGS = ['--dry-run', '--supprimer-test'];

const [forumId, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
const deleteTest = rest.includes('--supprimer-test');
if (!/^\d+$/.test(forumId ?? '') || rest.some((a) => !FLAGS.includes(a))) {
  console.error('usage : infos-go-archives <id du forum> [--dry-run] [--supprimer-test]');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((resolve) => (client.isReady() ? resolve() : client.once(Events.ClientReady, resolve)));

const byId = (a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1);
const oldestFirst = async (thread) => [...(await thread.messages.fetch({ limit: 100 })).values()].sort(byId);
const allThreads = async (forum) => [...(await forum.threads.fetchActive()).threads.values(), ...(await forum.threads.fetchArchived()).threads.values()];
const day = (t) => t.createdAt.toISOString().slice(0, 10);

try {
  const forum = await client.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) throw new Error(`${forumId} n'est pas un forum visible par le bot`);
  console.log(`Forum « ${forum.name} » (${forum.id}), serveur « ${forum.guild.name} »${dryRun ? ', ESSAI À BLANC' : ''}`);
  const threads = await allThreads(forum);
  const programmes = threads.filter((t) => t.name === PROGRAMME_TITLE).sort(byId);
  const tests = threads.filter((t) => t.name === TEST_TITLE);
  const keep = programmes.at(-1);
  const old = programmes.slice(0, -1);
  const kvKey = `infos-go:${forum.guildId}:programme`;

  if (keep) console.log(`gardé    ${keep.id} (${day(keep)})${keep.flags.has(ChannelFlags.Pinned) ? ', épinglé' : ', PAS épinglé'} ; bot_kv ${kvKey} = ${await getState(kvKey)}`);
  const archiveId = await getState(`infos-go:${forum.guildId}:archives`);
  const knownArchive = archiveId ? threads.find((t) => t.id === archiveId) : null;
  console.log(knownArchive ? `archives ${knownArchive.id} (existe)` : `archives « ${ARCHIVE_TITLE} » à créer`);

  // Read every old programme first: all of Motisma, under 100 messages.
  const plan = [];
  for (const t of old) {
    const messages = await oldestFirst(t);
    if (messages.length === 100 || messages.some((m) => m.author.id !== client.user.id)) throw new Error(`${t.id} : 100 messages ou un message pas de Motisma, rien fait`);
    console.log(`archivé  ${t.id} (${day(t)}) : ${messages.length} message(s), ${messages.reduce((n, m) => n + m.attachments.size, 0)} fichier(s), puis supprimé`);
    plan.push({ thread: t, messages });
  }
  for (const t of tests) console.log(`${deleteTest ? 'supprimé' : 'ignoré  '} ${t.id} « ${t.name} »${deleteTest ? '' : ' (sans --supprimer-test)'}`);

  if (!dryRun) {
    const archive = await archivePost(forum, forum.guildId, { store: { get: getState, set: setState }, fetchChannel: (id) => client.channels.fetch(id) });
    // 1. Copy, oldest first.
    const copies = [];
    for (const { messages } of plan) {
      for (const m of messages) copies.push({ source: m, sent: await archive.send(await copyMessage(m, downloadBuffer)) });
    }
    // 2. Read every copy back by GET before deleting anything.
    for (const { source, sent } of copies) {
      const back = await archive.messages.fetch({ message: sent.id, force: true });
      if (back.content !== source.content || back.attachments.size !== source.attachments.size) {
        throw new Error(`copie ${sent.id} différente de ${source.id} (texte ou fichiers) : rien supprimé`);
      }
    }
    console.log(`relu     ${copies.length} copie(s) dans ${archive.id}, conformes`);
    // 3. Delete.
    for (const { thread } of plan) await thread.delete('Programme recopié dans les archives');
    if (deleteTest) for (const t of tests) await t.delete('Post de test');
    if (keep && (await getState(kvKey)) !== keep.id) await setState(kvKey, keep.id);
    if (keep && !keep.flags.has(ChannelFlags.Pinned)) await keep.pin();

    // 4. Recount.
    const after = await allThreads(forum);
    console.log(`après    ${after.length} post(s) : ${after.map((t) => t.name).sort().join(', ')}`);
    console.log(`après    archives : ${(await oldestFirst(archive)).length} message(s) (accueil compris)`);
  }
} catch (err) {
  console.error(`infos-go-archives : ${err.message}`);
  process.exitCode = 1;
} finally {
  client.destroy();
  await pool?.end();
}
