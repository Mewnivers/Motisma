// Retire le lien « [Source](…) » des messages de Motisma déjà postés dans un
// forum infos-go (les membres n'ont pas accès au salon source). Ne modifie que
// le texte (PATCH content seul : fichiers et embeds intacts), relit chaque
// message par GET. Un post archivé (les archives des programmes) est
// désarchivé le temps des modifications puis réarchivé.
// Usage : node scripts/infos-go-sans-source.mjs <id du forum> [--dry-run]
// Depuis le VPS, passer par scripts/infos-go-sans-source.sh.
import { ChannelType, Client, Events, GatewayIntentBits, Routes } from 'discord.js';
import { stripSource } from '../src/features/infosGo.js';

const [forumId, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
if (!/^\d+$/.test(forumId ?? '') || rest.some((a) => a !== '--dry-run')) {
  console.error('usage : infos-go-sans-source <id du forum> [--dry-run]');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((resolve) => (client.isReady() ? resolve() : client.once(Events.ClientReady, resolve)));

const byId = (a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1);
async function allMessages(thread) {
  const all = [];
  for (let before; ; ) {
    const batch = await thread.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    all.push(...batch.values());
    if (batch.size < 100) return all.sort(byId);
    before = batch.last().id;
  }
}
const oneLine = (s) => JSON.stringify(s.length > 160 ? `${s.slice(0, 160)}…` : s);

try {
  const forum = await client.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) throw new Error(`${forumId} n'est pas un forum visible par le bot`);
  console.log(`Forum « ${forum.name} » (${forum.id}), serveur « ${forum.guild.name} »${dryRun ? ', ESSAI À BLANC' : ''}`);
  const threads = [...(await forum.threads.fetchActive()).threads.values(), ...(await forum.threads.fetchArchived()).threads.values()];

  // Read everything first.
  const plan = [];
  for (const t of threads.sort(byId)) {
    const edits = [];
    for (const m of await allMessages(t)) {
      if (m.author.id !== client.user.id) continue;
      const content = stripSource(m.content);
      if (content === m.content) continue;
      if (!content && !m.attachments.size && !m.embeds.length) throw new Error(`${t.id}/${m.id} : message vide sans le lien, rien fait`);
      edits.push({ m, content });
    }
    console.log(`${String(edits.length).padStart(3)} à modifier  ${t.id} « ${t.name} »${t.archived ? ' (archivé)' : ''}`);
    plan.push({ thread: t, edits });
  }
  const samples = plan.flatMap((p) => p.edits).slice(0, 3);
  for (const { m, content } of samples) console.log(`\navant ${m.id} : ${oneLine(m.content)}\naprès ${m.id} : ${oneLine(content)}`);
  console.log(`\ntotal : ${plan.reduce((n, p) => n + p.edits.length, 0)} message(s) dans ${plan.filter((p) => p.edits.length).length} post(s)`);

  if (!dryRun) {
    for (const { thread, edits } of plan.filter((p) => p.edits.length)) {
      const wasArchived = thread.archived;
      if (wasArchived) await thread.setArchived(false);
      try {
        for (const { m, content } of edits) {
          await client.rest.patch(Routes.channelMessage(thread.id, m.id), { body: { content } });
          const back = await client.rest.get(Routes.channelMessage(thread.id, m.id));
          if (back.content !== content || back.attachments.length !== m.attachments.size || back.embeds.length !== m.embeds.length) {
            throw new Error(`${thread.id}/${m.id} relu différent (texte, fichiers ou embeds) : arrêt`);
          }
        }
        console.log(`modifié  ${edits.length} message(s) dans « ${thread.name} », relus`);
      } finally {
        if (wasArchived) await thread.setArchived(true).catch((err) => console.error(`« ${thread.name} » non réarchivé : ${err.message}`));
      }
    }
  }
} catch (err) {
  console.error(`infos-go-sans-source : ${err.message}`);
  process.exitCode = 1;
} finally {
  client.destroy();
}
