import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

/**
 * Show a member's (or bot's) avatar in full size, with download links in each
 * format. If the member has a server-specific avatar, the big image shows it and
 * the global avatar appears as a thumbnail.
 *   /avatar [membre]
 */
export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Affiche l’avatar d’un membre ou d’un bot.')
  .addUserOption((o) =>
    o.setName('membre').setDescription('Le membre ou le bot (par défaut toi-même)'),
  );

// Download links for each available image format (gif first if animated).
function formatLinks(target) {
  const animated = target.displayAvatarURL().includes('.gif');
  const exts = animated ? ['gif', 'png', 'webp'] : ['png', 'jpg', 'webp'];
  return exts
    .map((e) => `[${e.toUpperCase()}](${target.displayAvatarURL({ extension: e, size: 4096 })})`)
    .join(' • ');
}

export async function execute(interaction) {
  const user = interaction.options.getUser('membre') ?? interaction.user;
  const member = interaction.inGuild()
    ? await interaction.guild.members.fetch(user.id).catch(() => null)
    : null;

  const hasGuildAvatar = Boolean(member?.avatar);
  const display = member ?? user; // member.displayAvatarURL() prefers the guild avatar

  const embed = new EmbedBuilder()
    .setColor(member?.displayColor || 0xffffff)
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setTitle(`Avatar de ${user.username}`)
    .setImage(display.displayAvatarURL({ size: 4096 }))
    .setDescription(`📥 ${formatLinks(display)}`);

  if (hasGuildAvatar) {
    embed.setThumbnail(user.displayAvatarURL({ size: 256 })); // global avatar, small
    embed.setFooter({ text: 'Grande image : avatar du serveur · vignette : avatar global' });
  }

  await interaction.reply({ embeds: [embed] });
}
