import { Events, PermissionFlagsBits } from 'discord.js';
import { config } from '../config.js';
import { getOuting, deleteOuting, setOutingParticipants, getInfoEmbed } from '../db.js';
import { buildTemplateMessage } from '../embeds/renderInfoEmbed.js';
import { renderPanel } from './rdvPanel.js';

const MAX_DELAY = 2 ** 31 - 1; // setTimeout cap (~24.8 days)
const EMPTY = 'Personne pour l’instant.';

/** Liste de mentions à partir d'ids (ou message « personne »). */
const mentionsList = (ids) => (ids.length ? ids.map((id) => `<@${id}>`).join('\n') : EMPTY);

/** Embed « terminée » de repli si le modèle rdv_termine n'est pas configuré. */
function buildTermineEmbed(vars) {
  return {
    color: 0x99aab5,
    title: '🏁 Sortie terminée',
    description: 'Merci à celles et ceux qui étaient présent·es ! 🎉',
    fields: [
      { name: '📍 Lieu', value: vars.lieu || '—', inline: true },
      { name: '👥 Participants', value: String(vars.participants ?? 0), inline: true },
    ],
  };
}

/**
 * Fin d'une sortie /rdv : remplace le message d'annonce par l'embed
 * « terminée » (modèle rdv_termine, avec le nombre et la liste d'inscrits) et
 * retire le bouton « Je participe ». À appeler AVANT de supprimer le salon.
 * @param {import('discord.js').Guild} guild
 * @param {string} channelId  salon de la sortie
 */
async function finishOuting(guild, channelId) {
  const outing = await getOuting(channelId).catch(() => null);
  if (!outing) return;

  // Toujours nettoyer la ligne, même si l'édition de l'annonce échoue.
  try {
    if (outing.announce_channel_id && outing.announce_message_id) {
      const ids = outing.participants || [];
      const vars = {
        ...(outing.vars || {}),
        participants: String(ids.length),
        inscrits: mentionsList(ids),
      };
      const annCh = await guild.channels.fetch(outing.announce_channel_id).catch(() => null);
      const annMsg = annCh?.isTextBased?.()
        ? await annCh.messages.fetch(outing.announce_message_id).catch(() => null)
        : null;
      if (annMsg) {
        const tpl = await getInfoEmbed(config.guildId, 'rdv_termine').catch(() => null);
        const payload = buildTemplateMessage(tpl, vars, {
          components: [], // retire le bouton « Je participe »
          fallbackEmbed: buildTermineEmbed(vars),
        });
        await annMsg.edit(payload).catch(() => {});
      }
    }
  } finally {
    await deleteOuting(channelId).catch(() => {});
  }
}

/**
 * Schedule a meetup channel to be deleted at `deleteAt` (epoch ms).
 * The process is long-lived (pm2); on restart, deletions are rescheduled
 * from each channel's topic marker `rdv-expire:<epoch>`.
 */
export function scheduleChannelDeletion(channel, deleteAt) {
  const delay = Math.max(0, Math.min(MAX_DELAY, deleteAt - Date.now()));
  setTimeout(async () => {
    await finishOuting(channel.guild, channel.id).catch(() => {});
    channel.delete('Sortie terminée (fermeture automatique)').catch(() => {});
  }, delay);
}

/** Re-rend le panneau du salon avec la liste d'inscrits à jour (best-effort). */
async function refreshPanel(outing, ids, panel) {
  if (!panel || !outing) return;
  const embed = await renderPanel({ ...outing, participants: ids });
  await panel.edit({ embeds: [embed] }).catch(() => {});
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

  const outing = await getOuting(channelId).catch(() => null);
  const ids = outing?.participants || [];
  const already = ids.includes(uid);
  if (!already && outing) {
    const next = [...ids, uid];
    await setOutingParticipants(channelId, next).catch(() => {});
    const panel = panelId ? await channel.messages.fetch(panelId).catch(() => null) : null;
    await refreshPanel(outing, next, panel);
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

  const outing = await getOuting(channel.id).catch(() => null);
  // L'organisateur ne peut pas quitter son propre salon.
  if (outing?.organizer_id && outing.organizer_id === uid) {
    await interaction.reply({ ephemeral: true, content: 'Tu es l’organisateur — tu ne peux pas quitter la sortie.' });
    return;
  }

  if (outing) {
    const next = (outing.participants || []).filter((id) => id !== uid);
    await setOutingParticipants(channel.id, next).catch(() => {});
    await refreshPanel(outing, next, panel);
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
  await finishOuting(interaction.guild, interaction.channel.id).catch(() => {});
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
