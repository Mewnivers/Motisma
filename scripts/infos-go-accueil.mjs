// Met le message d'accueil (INFOS_GO_WELCOME de src/features/infosGo.js) en tête
// des posts de thème déjà créés d'un forum infos-go. Discord ne sait pas insérer
// un message : tout est décalé d'un cran (planWelcomeShift), en partant de la fin
// pour lire chaque message avant de l'écraser. Les ids des posts ne changent pas,
// rien n'est supprimé. Seulement les posts dont tous les messages sont de Motisma.
// Usage : node scripts/infos-go-accueil.mjs <id du forum> [--dry-run]
// Depuis le VPS, passer par scripts/infos-go-accueil.sh.
import { ChannelType, Client, Events, GatewayIntentBits } from 'discord.js';
import { INFOS_GO_WELCOME, planWelcomeShift, downloadBuffer } from '../src/features/infosGo.js';

const [forumId, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
if (!/^\d+$/.test(forumId ?? '') || rest.some((a) => a !== '--dry-run')) {
  console.error('usage : infos-go-accueil <id du forum> [--dry-run]');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((resolve) => (client.isReady() ? resolve() : client.once(Events.ClientReady, resolve)));

const describe = (m) => `${(m.content.split('\n')[0] || '(sans texte)').slice(0, 60)} + ${m.attachments.size} pièce(s) jointe(s)`;

/** Copy of a message: same text (Source line included), files re-uploaded, rich embeds. */
async function copyOf(m) {
  const files = [];
  for (const a of m.attachments.values()) files.push({ attachment: await downloadBuffer(a.url), name: a.name });
  return {
    content: m.content,
    files,
    attachments: [],
    embeds: m.embeds.filter((e) => (e.data?.type ?? 'rich') === 'rich'),
    allowedMentions: { parse: [] },
  };
}

try {
  const forum = await client.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) throw new Error(`${forumId} n'est pas un forum visible par le bot`);
  console.log(`Forum « ${forum.name} » (${forum.id}), serveur « ${forum.guild.name} »${dryRun ? ', ESSAI À BLANC' : ''}`);
  const threads = [...(await forum.threads.fetchActive()).threads.values(), ...(await forum.threads.fetchArchived()).threads.values()];
  for (const thread of threads.filter((t) => t.name in INFOS_GO_WELCOME)) {
    const messages = [...(await thread.messages.fetch({ limit: 100 })).values()];
    if (messages.length === 100) { console.log(`ignoré  ${thread.name} : 100 messages ou plus, à faire à la main`); continue; }
    if (messages.some((m) => m.author.id !== client.user.id)) { console.log(`ignoré  ${thread.name} : un message n'est pas de Motisma`); continue; }
    const plan = planWelcomeShift(messages, INFOS_GO_WELCOME[thread.name]);
    if (!plan.length) { console.log(`existe  ${thread.name} (${thread.id}) : commence déjà par l'accueil`); continue; }
    console.log(`décalé  ${thread.name} (${thread.id}) : ${plan.filter((s) => s.edit).length} modifié(s), 1 envoyé`);
    const byId = new Map(messages.map((m) => [m.id, m]));
    // From the end: each source is read before it is overwritten.
    for (const step of [...plan].reverse()) {
      const what = step.welcome ? 'accueil' : describe(step.from);
      console.log(`  ${step.send ? 'envoi        ' : `modif ${step.edit}`} <- ${what}`);
      if (dryRun) continue;
      if (step.send) await thread.send(await copyOf(step.from));
      else if (step.welcome) await byId.get(step.edit).edit({ content: step.welcome, files: [], attachments: [], embeds: [], allowedMentions: { parse: [] } });
      else await byId.get(step.edit).edit(await copyOf(step.from));
    }
  }
} catch (err) {
  console.error(`infos-go-accueil : ${err.message}`);
  process.exitCode = 1;
} finally {
  client.destroy();
}
