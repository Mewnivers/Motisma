// Prépare un forum de logs : crée les 4 posts (Arrivées et départs, Modération,
// Messages, Autres) avec leur message d'accueil (LOG_POSTS_WELCOME de
// src/features/serverLogs.js) et garde leurs ids dans bot_kv
// (logs-forum:<forum>:<nom>), les clés que le bot en ligne relit.
// Ne recrée jamais un post déjà connu. Token et base lus dans l'environnement du conteneur.
// Usage : node scripts/logs-forum-init.mjs <id du forum>
// Depuis le VPS, passer par scripts/logs-forum-init.sh.
import { ChannelType, Client, Events, GatewayIntentBits } from 'discord.js';
import { ensureLogPosts } from '../src/features/serverLogs.js';
import { pool } from '../src/db.js';

const forumId = process.argv[2];
if (!/^\d+$/.test(forumId ?? '')) {
  console.error('usage : logs-forum-init <id du forum>');
  process.exit(1);
}
if (!pool) {
  console.error('logs-forum-init : pas de DATABASE_URL, les ids des posts ne seraient pas gardés.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((resolve) => (client.isReady() ? resolve() : client.once(Events.ClientReady, resolve)));

try {
  const forum = await client.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) throw new Error(`${forumId} n'est pas un forum visible par le bot`);
  console.log(`Forum « ${forum.name} » (${forum.id}), serveur « ${forum.guild.name} »`);
  for (const { name, id, created } of await ensureLogPosts(forum.guild, forum)) {
    console.log(`${created ? 'créé  ' : 'existe'} ${name} -> ${id}`);
  }
} catch (err) {
  console.error(`logs-forum-init : ${err.message}`);
  process.exitCode = 1;
} finally {
  client.destroy();
  await pool.end();
}
