import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';

/**
 * Message context-menu command "Déplacer" — right-click a message → Apps →
 * Déplacer, then pick a destination channel. The actual move (webhook copy +
 * delete original) is handled in features/moveControls.js.
 */
export const data = new ContextMenuCommandBuilder()
  .setName('Déplacer')
  .setType(ApplicationCommandType.Message)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const message = interaction.targetMessage;

  // Step 1: pick a parent channel (text / announcement / forum / media). Threads
  // and forum posts are NOT listed here — Discord's native picker surfaces them
  // unreliably — they're offered in a second step (see features/moveControls.js).
  const row = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`move:${message.channelId}:${message.id}`)
      .setPlaceholder('Salon ou forum de destination')
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildForum,
        ChannelType.GuildMedia,
      )
      .setMinValues(1)
      .setMaxValues(1),
  );

  await interaction.reply({
    content: `Déplacer le message de ${message.author} vers… ?`,
    components: [row],
    ephemeral: true,
  });
}
