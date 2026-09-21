import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

// /say makes the bot post a message in a chosen channel. The command author
// stays hidden: the invoker only gets an ephemeral confirmation (nobody else
// sees the command), and the posted message shows the bot as author.
export const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Faire parler le bot dans un salon (admin).')
  // Only members with "Manage Server" see and can use this command.
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName('salon')
      .setDescription('Salon où poster le message.')
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.AnnouncementThread,
      )
      .setRequired(true),
  )
  .addStringOption((opt) =>
    opt
      .setName('message')
      .setDescription('Texte à envoyer (utilise \\n pour un retour à la ligne).')
      .setMaxLength(2000)
      .setRequired(true),
  );

export async function execute(interaction) {
  const channel = interaction.options.getChannel('salon', true);
  const raw = interaction.options.getString('message', true);
  // Slash-command inputs can't hold real line breaks, so let admins type \n.
  const content = raw.replace(/\\n/g, '\n').trim();

  // Ephemeral: the reply is visible only to the invoker, so the command stays
  // invisible to everyone else.
  await interaction.deferReply({ ephemeral: true });

  if (!content) {
    await interaction.editReply('Le message est vide.');
    return;
  }
  if (!channel.isTextBased?.()) {
    await interaction.editReply('Ce salon ne peut pas recevoir de message.');
    return;
  }

  const sent = await channel.send({ content }).catch((error) => {
    console.error('[say] Send failed:', error);
    return null;
  });
  if (!sent) {
    await interaction.editReply(`Impossible d’envoyer dans ${channel} (permissions manquantes ?).`);
    return;
  }

  // Trace who spoke through the bot (the posted message itself keeps no author).
  console.log(`[say] ${interaction.user.tag} → #${channel.name}: ${content.slice(0, 80)}`);

  await interaction.editReply(`Message envoyé dans ${channel}. ✅ ${sent.url}`);
}
