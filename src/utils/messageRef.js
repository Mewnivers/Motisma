// Helpers to target an existing message from a slash-command option: parse a
// message link (or bare id) and fetch a message the bot is allowed to edit.
// A bot can only edit its OWN messages, hence the author check.

// Link shape: https://discord.com/channels/<guildId>/<channelId>/<messageId>
export function parseMessageRef(input, fallbackChannelId) {
  const trimmed = input.trim();
  const link = trimmed.match(/channels\/\d+\/(\d+)\/(\d+)/);
  if (link) return { channelId: link[1], messageId: link[2] };
  if (/^\d{17,20}$/.test(trimmed)) return { channelId: fallbackChannelId, messageId: trimmed };
  return null;
}

/**
 * Resolve a `lien` option (link or id) to a message the bot authored.
 * @returns {Promise<{message: import('discord.js').Message} | {error: string}>}
 *   `message` on success, or `error` — a ready-to-show ephemeral message.
 */
export async function fetchOwnMessage(interaction, lien) {
  const ref = parseMessageRef(lien, interaction.channelId);
  if (!ref) {
    return { error: 'Donne le **lien** du message (clic droit → Copier le lien du message) ou son **ID**.' };
  }

  const channel = await interaction.client.channels.fetch(ref.channelId).catch(() => null);
  const message = channel?.messages ? await channel.messages.fetch(ref.messageId).catch(() => null) : null;
  if (!message) {
    return { error: 'Message introuvable (mauvais lien/ID, ou je n’ai pas accès à ce salon).' };
  }
  if (message.author.id !== interaction.client.user.id) {
    return { error: 'Je ne peux modifier que **mes propres** messages, pas celui d’un membre.' };
  }
  return { message };
}
