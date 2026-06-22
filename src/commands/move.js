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

  // Step 1: pick a destination. Channels, forums AND posts/threads are allowed:
  // Discord doesn't reliably LIST every thread up front, but as soon as you TYPE
  // a post's name in the search box it finds it — so a moderator can jump
  // straight to a specific post. Picking a forum/channel instead offers its
  // posts in a second step (see features/moveControls.js).
  const row = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`move:${message.channelId}:${message.id}`)
      .setPlaceholder('Salon, forum ou post (tape le nom pour chercher)')
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildForum,
        ChannelType.GuildMedia,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.AnnouncementThread,
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
