import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { fetchOwnMessage } from '../utils/messageRef.js';
import { buildReglementEmbed } from '../embeds/reglement.js';
import { buildVerificationEmbed } from '../embeds/verification.js';
import { buildSuggestionsEmbed } from '../embeds/suggestions.js';
import { buildPresentationEmbed } from '../embeds/presentation.js';
import { buildBotPresentationEmbed } from '../embeds/botPresentation.js';
import { buildRessourcesEmbed } from '../embeds/ressources.js';
import { buildClassementEmbed, buildClassementComponents } from '../embeds/classement.js';
import { exampleImageAttachment } from '../embeds/exampleImage.js';

/**
 * Registry of publishable info embeds. To add one: create its builder in
 * src/embeds/, then add an entry here (the `value` becomes the choice).
 * `components` is optional (e.g. an embed with an interactive button).
 */
const EMBEDS = {
  reglement: { label: 'Règlement', build: buildReglementEmbed },
  verification: { label: 'Vérification', build: buildVerificationEmbed, files: () => [exampleImageAttachment()].filter(Boolean) },
  suggestions: { label: 'Suggestions', build: buildSuggestionsEmbed },
  presentation: { label: 'Présentation', build: buildPresentationEmbed },
  motisma: { label: 'Motisma (le bot)', build: buildBotPresentationEmbed },
  ressources: { label: 'Salons à connaître', build: buildRessourcesEmbed },
  classement: { label: 'Classement PoGo', build: buildClassementEmbed, components: buildClassementComponents },
};

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Publier ou mettre à jour un embed d’information du serveur (admin).')
  .addStringOption((opt) =>
    opt
      .setName('type')
      .setDescription('Quel embed publier')
      .setRequired(true)
      .addChoices(
        ...Object.entries(EMBEDS).map(([value, { label }]) => ({ name: label, value })),
      ),
  )
  .addStringOption((opt) =>
    opt
      .setName('lien')
      .setDescription('Lien du message à mettre à jour (vide = publier un nouveau message).'),
  )
  // Only members with "Manage Server" see and can use this command.
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const type = interaction.options.getString('type', true);
  const lien = interaction.options.getString('lien');
  const entry = EMBEDS[type];

  if (!entry) {
    await interaction.reply({ content: 'Embed inconnu.', ephemeral: true });
    return;
  }

  const embed = await entry.build(interaction);
  const components = entry.components ? [await entry.components(interaction)] : [];
  const files = entry.files ? entry.files(interaction) : [];

  // With a link: rebuild the embed and edit that message in place (no repost).
  if (lien) {
    await interaction.deferReply({ ephemeral: true });
    const { message, error } = await fetchOwnMessage(interaction, lien);
    if (error) {
      await interaction.editReply(error);
      return;
    }
    try {
      // `attachments: []` drops the old files; the entry's files are re-attached
      // so an embed image (attachment://…) keeps showing after the edit.
      await message.edit({ embeds: [embed], components, files, attachments: [] });
    } catch (e) {
      console.error('[embed] Update failed:', e);
      await interaction.editReply('Échec de la modification (permissions manquantes ?).');
      return;
    }
    await interaction.editReply(`Embed « ${entry.label} » mis à jour. ✅ ${message.url}`);
    return;
  }

  // Otherwise, post a fresh message (default behaviour).
  const sent = await interaction.channel.send({ embeds: [embed], components, files });
  await interaction.reply({ content: `Embed « ${entry.label} » publié ici. ✅ ${sent.url}`, ephemeral: true });
}
