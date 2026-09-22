import { EmbedBuilder, Events, PermissionFlagsBits } from 'discord.js';
import { config } from '../config.js';

const MAX_DELAY = 2 ** 31 - 1; // setTimeout cap (~24.8 days)
const PARTICIPANTS_PREFIX = 'Participants';

/**
 * Schedule a meetup channel to be deleted at `deleteAt` (epoch ms).
 * The process is long-lived (pm2); on restart, deletions are rescheduled
 * from each channel's topic marker `rdv-expire:<epoch>`.
 */
export function scheduleChannelDeletion(channel, deleteAt) {
  const delay = Math.max(0, Math.min(MAX_DELAY, deleteAt - Date.now()));
  setTimeout(() => {
    channel.delete('Sortie terminée (1h après l’heure prévue)').catch(() => {});
  }, delay);
}

function getParticipantIds(embed) {
  const field = embed?.fields?.find((f) => f.name.startsWith(PARTICIPANTS_PREFIX));
  return field ? [...field.value.matchAll(/<@!?(\d+)>/g)].map((m) => m[1]) : [];
}

function withParticipants(embed, ids) {
  const fields = embed.fields.map((f) =>
    f.name.startsWith(PARTICIPANTS_PREFIX)
      ? {
          name: `${PARTICIPANTS_PREFIX} (${ids.length})`,
          value: ids.length ? ids.map((id) => `<@${id}>`).join('\n') : 'Personne pour l’instant.',
          inline: false,
        }
      : { name: f.name, value: f.value, inline: f.inline },
  );
  return EmbedBuilder.from(embed).setFields(fields);
}

// "Je participe" (annonce) -> donne l'accès au salon + ajoute à la liste.
async function join(interaction) {
  const [, , channelId, panelId] = interaction.customId.split(':');
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    await interaction.reply({ ephemeral: true, content: 'Cette sortie n’existe plus.' });
    return;
  }

  const uid = interaction.user.id;
  try {
    await channel.permissionOverwrites.edit(uid, { ViewChannel: true, SendMessages: true });
  } catch {
    await interaction.reply({
      ephemeral: true,
      content: 'Impossible de te donner accès au salon (permissions du bot ?).',
    });
    return;
  }

  const panel = panelId ? await channel.messages.fetch(panelId).catch(() => null) : null;
  const ids = panel?.embeds[0] ? getParticipantIds(panel.embeds[0]) : [];
  const already = ids.includes(uid);
  if (panel?.embeds[0] && !already) {
    await panel.edit({ embeds: [withParticipants(panel.embeds[0], [...ids, uid])] }).catch(() => {});
  }

  await interaction.reply({
    ephemeral: true,
    content: already
      ? `Tu participes déjà — c’est par ici : ${channel}.`
      : `Tu participes ! 🎉 Rendez-vous dans ${channel}.`,
  });
}

// "Se désinscrire et quitter" (panneau du salon) -> retire l'accès + la liste.
async function leave(interaction) {
  const channel = interaction.channel;
  const panel = interaction.message;
  const uid = interaction.user.id;

  // L'organisateur ne peut pas quitter son propre salon.
  const orgField = panel?.embeds[0]?.fields?.find((f) => f.name.includes('Organisateur'));
  const organizerId = orgField?.value.match(/<@!?(\d+)>/)?.[1];
  if (organizerId === uid) {
    await interaction.reply({ ephemeral: true, content: 'Tu es l’organisateur — tu ne peux pas quitter la sortie.' });
    return;
  }

  if (panel?.embeds[0]) {
    const ids = getParticipantIds(panel.embeds[0]).filter((id) => id !== uid);
    await panel.edit({ embeds: [withParticipants(panel.embeds[0], ids)] }).catch(() => {});
  }
  await channel.permissionOverwrites.delete(uid).catch(() => {});

  await interaction.reply({ ephemeral: true, content: 'Tu t’es désinscrit·e et tu as quitté le salon. 👋' });
}

// "Fermer la sortie" (panneau) -> l'organisateur (ou un admin) supprime le salon.
async function close(interaction) {
  const [, , organizerId] = interaction.customId.split(':');
  const canClose =
    interaction.user.id === organizerId ||
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
  if (!canClose) {
    await interaction.reply({ ephemeral: true, content: 'Seul l’organisateur peut fermer la sortie.' });
    return;
  }
  await interaction.reply({ ephemeral: true, content: 'Sortie fermée, le salon va être supprimé. 👋' });
  await interaction.channel.delete('Sortie fermée par l’organisateur').catch(() => {});
}

async function onButton(interaction) {
  if (!interaction.isButton()) return;
  const id = interaction.customId;
  if (id.startsWith('rdv:join:')) return join(interaction);
  if (id === 'rdv:leave') return leave(interaction);
  if (id.startsWith('rdv:close:')) return close(interaction);
}

// On startup, reschedule deletions for meetup channels left by a previous run.
function rescheduleAll(client) {
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild || !config.rdvCategoryId) return;
  for (const channel of guild.channels.cache.values()) {
    if (channel.parentId !== config.rdvCategoryId) continue;
    const match = channel.topic?.match(/rdv-expire:(\d+)/);
    if (match) scheduleChannelDeletion(channel, Number(match[1]));
  }
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerRdvControls(client) {
  client.once(Events.ClientReady, () => rescheduleAll(client));
  client.on(Events.InteractionCreate, onButton);
}
