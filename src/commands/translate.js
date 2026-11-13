import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { targetLanguage, translate as claudeTranslate } from '../services/translate.js';

/**
 * Message context-menu command "Traduire" — right-click a message → Apps →
 * Traduire. Open to every member; the translation is ephemeral (only the
 * member who clicked sees it), in their Discord language (FR, EN, ES, else FR).
 */
export const data = new ContextMenuCommandBuilder()
  .setName('Traduire')
  .setType(ApplicationCommandType.Message);

export async function execute(interaction, { translate = claudeTranslate } = {}) {
  const text = interaction.targetMessage.content?.trim();
  if (!text) {
    await interaction.reply({ content: 'Ce message ne contient pas de texte à traduire.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  try {
    const translated = await translate(text, targetLanguage(interaction.locale));
    await interaction.editReply({ content: translated.slice(0, 2000) });
  } catch (error) {
    console.error('[traduire]', error.message);
    await interaction.editReply({ content: 'Traduction indisponible pour le moment, réessaie plus tard.' });
  }
}
