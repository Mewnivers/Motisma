import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { config } from '../config.js';
import { getOuting, getOpenOutings, setOutingVars, getInfoEmbed } from '../db.js';
import { buildTemplateMessage } from '../embeds/renderInfoEmbed.js';
import { renderPanel } from '../features/rdvPanel.js';
import { computeHoraire } from '../features/rdvTime.js';
import { buildAnnounceEmbed } from './rdv.js';

export const data = new SlashCommandBuilder()
  .setName('rdv-modifier')
  .setDescription('Modifier une sortie /rdv déjà ouverte.')
  .addStringOption((opt) =>
    opt.setName('sortie').setDescription('La sortie à modifier').setRequired(true).setAutocomplete(true),
  )
  .addStringOption((opt) => opt.setName('lieu').setDescription('Nouveau lieu'))
  .addStringOption((opt) => opt.setName('heure').setDescription('Nouvelle heure de début (ex. 16h)'))
  .addIntegerOption((opt) =>
    opt.setName('duree').setDescription('Nouvelle durée en minutes').setMinValue(5).setMaxValue(1440),
  )
  .addStringOption((opt) => opt.setName('description').setDescription('Nouvelle description').setMaxLength(300));

/** Autocomplétion de l'option « sortie » : les sorties ouvertes du serveur. */
export async function autocomplete(interaction) {
  const guildId = interaction.guild?.id ?? config.guildId;
  const rows = await getOpenOutings(guildId).catch(() => []);
  const q = String(interaction.options.getFocused() || '').toLowerCase();
  const choices = rows
    .map((r) => {
      const v = r.vars || {};
      const name = `${v.lieu || 'Sortie'} — ${v.heure_debut || ''}`.trim().slice(0, 100);
      return { name, value: r.channel_id };
    })
    .filter((c) => c.name.toLowerCase().includes(q))
    .slice(0, 25);
  await interaction.respond(choices).catch(() => {});
}

export async function execute(interaction) {
  const channelId = interaction.options.getString('sortie', true);
  const outing = await getOuting(channelId).catch(() => null);
  if (!outing) {
    await interaction.reply({ ephemeral: true, content: 'Sortie introuvable (elle est peut-être déjà fermée).' });
    return;
  }

  // Réservée à l'organisateur ou à un admin (comme « Fermer la sortie »).
  const isOrganizer = outing.organizer_id && outing.organizer_id === interaction.user.id;
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
  if (!isOrganizer && !isAdmin) {
    await interaction.reply({ ephemeral: true, content: 'Seul l’organisateur ou un admin peut modifier cette sortie.' });
    return;
  }

  const lieu = interaction.options.getString('lieu');
  const heure = interaction.options.getString('heure');
  const duree = interaction.options.getInteger('duree');
  const description = interaction.options.getString('description');

  if (lieu == null && heure == null && duree == null && description == null) {
    await interaction.reply({
      ephemeral: true,
      content: 'Indique au moins un champ à modifier (lieu, heure, durée ou description).',
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const vars = { ...(outing.vars || {}) };
  const changes = [];
  if (lieu != null) {
    vars.lieu = lieu;
    changes.push('lieu');
  }
  if (description != null) {
    vars.description = description;
    changes.push('description');
  }
  if (heure != null || duree != null) {
    const timeStr = heure ?? vars.heure_debut ?? '';
    const dur = duree ?? Number(vars.duree ?? 45);
    const h = computeHoraire(timeStr, dur);
    vars.heure = h.heureDebut;
    vars.heure_debut = h.heureDebut;
    vars.heure_fin = h.heureFin;
    vars.duree = String(dur);
    if (heure != null) changes.push('heure');
    if (duree != null) changes.push('durée');
  }

  await setOutingVars(channelId, vars).catch(() => {});

  // Re-rend le panneau du salon (on n'envoie pas components → boutons conservés).
  const salon = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (salon && outing.panel_message_id) {
    const panel = await salon.messages.fetch(outing.panel_message_id).catch(() => null);
    if (panel) {
      const embed = await renderPanel({ vars, participants: outing.participants || [] });
      await panel.edit({ embeds: [embed] }).catch(() => {});
    }
  }

  // Re-rend l'annonce (le bouton « Je participe » est conservé : pas de components).
  if (outing.announce_channel_id && outing.announce_message_id) {
    const annCh = await interaction.guild.channels.fetch(outing.announce_channel_id).catch(() => null);
    const annMsg = annCh?.isTextBased?.()
      ? await annCh.messages.fetch(outing.announce_message_id).catch(() => null)
      : null;
    if (annMsg) {
      const tpl = await getInfoEmbed(config.guildId, 'rdv_annonce').catch(() => null);
      const fallbackEmbed = buildAnnounceEmbed({
        place: vars.lieu,
        horaire: `${vars.heure_debut} → ${vars.heure_fin}`,
        description: vars.description,
        organizerId: outing.organizer_id,
        closeLabel: vars.fermeture,
      });
      const { content, embeds } = buildTemplateMessage(tpl, vars, { fallbackEmbed });
      await annMsg.edit({ content, embeds }).catch(() => {});
    }
  }

  await interaction.editReply(`Sortie mise à jour : ${changes.join(', ')}. ✅`);
}
