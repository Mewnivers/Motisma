import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('rdv')
  .setDescription('Create a temporary thread to organize an outing.')
  .addStringOption((opt) =>
    opt.setName('place').setDescription('Where the outing takes place').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('time').setDescription('When it starts (e.g. 14:30)').setRequired(true),
  );

export async function execute(interaction) {
  const place = interaction.options.getString('place', true);
  const time = interaction.options.getString('time', true);

  if (!interaction.channel?.threads) {
    await interaction.reply({
      content: 'This command must be used in a text channel that supports threads.',
      ephemeral: true,
    });
    return;
  }

  const thread = await interaction.channel.threads.create({
    name: `Outing — ${place} ${time}`,
    autoArchiveDuration: 1440, // 24h; the thread archives itself afterwards
    type: ChannelType.PublicThread,
    reason: `Outing created by ${interaction.user.tag}`,
  });

  const embed = new EmbedBuilder()
    .setTitle('New outing')
    .addFields(
      { name: 'Place', value: place, inline: true },
      { name: 'Time', value: time, inline: true },
      { name: 'Organizer', value: `<@${interaction.user.id}>`, inline: true },
    )
    .setDescription('Join this thread to sign up. A reminder will be sent before the start.');

  await thread.send({ embeds: [embed] });
  await thread.members.add(interaction.user.id);

  await interaction.reply({
    content: `Outing created: ${thread}`,
    ephemeral: true,
  });
}
