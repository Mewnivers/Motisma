import { Events } from 'discord.js';
import { translate as claudeTranslate } from '../services/translate.js';

// Language buttons offered by "Traduire" when the message is already in the
// member's language. customId: traduire:<lang>:<channelId>:<messageId>.
// The reply is ephemeral, so updating it keeps it ephemeral.
export async function onButton(interaction, { translate = claudeTranslate } = {}) {
  if (!interaction.isButton() || !interaction.customId.startsWith('traduire:')) return;
  const [, lang, channelId, messageId] = interaction.customId.split(':');

  await interaction.deferUpdate();
  try {
    const channel = await interaction.client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);
    const translated = await translate(message.content, lang);
    await interaction.editReply({ content: (translated ?? message.content).slice(0, 2000), components: [] });
  } catch (error) {
    console.error('[traduire]', error.message);
    await interaction.editReply({ content: 'Traduction indisponible pour le moment, réessaie plus tard.', components: [] });
  }
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerTranslateControls(client) {
  client.on(Events.InteractionCreate, (interaction) => onButton(interaction));
}
