// Met à jour le message d'accueil (premier message) des posts « Arrivées et
// départs » et « Autres » d'un forum de logs déjà préparé, avec le texte
// actuel de LOG_POSTS_WELCOME (src/features/serverLogs.js). Le bot ne poste
// l'accueil qu'à la création d'un post : sans ce script, les anciens textes
// restent. Ne touche qu'aux messages de Motisma, PATCH content seul, relu par GET.
// Usage : node scripts/logs-textes-accueil.mjs <id du forum> [--dry-run]
// Depuis le VPS, passer par scripts/logs-textes-accueil.sh.
import { ChannelType, Client, Events, GatewayIntentBits, Routes } from 'discord.js';
import { LOG_POSTS_WELCOME } from '../src/features/serverLogs.js';

const NAMES = ['Arrivées et départs', 'Autres'];
const [forumId, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
if (!/^\d+$/.test(forumId ?? '') || rest.some((a) => a !== '--dry-run')) {
  console.error('usage : logs-textes-accueil <id du forum> [--dry-run]');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((resolve) => (client.isReady() ? resolve() : client.once(Events.ClientReady, resolve)));

try {
  const forum = await client.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) throw new Error(`${forumId} n'est pas un forum visible par le bot`);
  console.log(`Forum « ${forum.name} » (${forum.id}), serveur « ${forum.guild.name} »${dryRun ? ', ESSAI À BLANC' : ''}`);
  const threads = [...(await forum.threads.fetchActive()).threads.values(), ...(await forum.threads.fetchArchived()).threads.values()];

  // Read everything first.
  const plan = [];
  for (const name of NAMES) {
    const found = threads.filter((t) => t.name === name);
    if (found.length !== 1) throw new Error(`${found.length} post(s) « ${name} » dans ce forum, rien fait`);
    const [thread] = found;
    const starter = await thread.fetchStarterMessage();
    if (starter.author.id !== client.user.id) throw new Error(`accueil de « ${name} » pas écrit par Motisma, rien fait`);
    const content = LOG_POSTS_WELCOME[name];
    console.log(`\n« ${name} » ${thread.id}${thread.archived ? ' (archivé)' : ''}`);
    console.log(`avant : ${starter.content}`);
    if (starter.content === content) {
      console.log('déjà à jour');
      continue;
    }
    console.log(`après : ${content}`);
    plan.push({ thread, starter, content });
  }
  console.log(`\ntotal : ${plan.length} message(s) à modifier`);

  if (!dryRun) {
    for (const { thread, starter, content } of plan) {
      const wasArchived = thread.archived;
      if (wasArchived) await thread.setArchived(false);
      try {
        await client.rest.patch(Routes.channelMessage(thread.id, starter.id), { body: { content, allowed_mentions: { parse: [] } } });
        const back = await client.rest.get(Routes.channelMessage(thread.id, starter.id));
        if (back.content !== content) throw new Error(`« ${thread.name} » relu différent : arrêt`);
        console.log(`modifié  « ${thread.name} », relu`);
      } finally {
        if (wasArchived) await thread.setArchived(true).catch((err) => console.error(`« ${thread.name} » non réarchivé : ${err.message}`));
      }
    }
  }
} catch (err) {
  console.error(`logs-textes-accueil : ${err.message}`);
  process.exitCode = 1;
} finally {
  client.destroy();
}
