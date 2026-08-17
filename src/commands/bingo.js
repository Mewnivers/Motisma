import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, EmbedBuilder } from 'discord.js';

// /bingo lets a moderator publish a bingo image and later swap it out.
//  - create: the BOT posts the image, so the message is editable afterwards.
//  - update: re-uploads a new image and drops the old attachment (the
//    `attachments` array is the source of truth — what isn't listed is removed).
//    The message keeps its id, place, reactions and replies; Discord only lets a
//    bot edit its OWN messages, hence the "create with the bot first" flow.

// Accept png/jpg/gif/webp. contentType can be null on upload, so the file name
// extension is a fallback.
function isImage(attachment) {
  return (
    attachment.contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(attachment.name ?? '')
  );
}

// Parse the "message" option: a full Discord message link, or a bare message id
// (which then targets the channel where the command is run).
// Link shape: https://discord.com/channels/<guildId>/<channelId>/<messageId>
function parseMessageRef(input, fallbackChannelId) {
  const trimmed = input.trim();
  const link = trimmed.match(/channels\/\d+\/(\d+)\/(\d+)/);
  if (link) return { channelId: link[1], messageId: link[2] };
  if (/^\d{17,20}$/.test(trimmed)) return { channelId: fallbackChannelId, messageId: trimmed };
  return null;
}

export const data = new SlashCommandBuilder()
  .setName('bingo')
  .setDescription('Publier et mettre à jour l’image d’un bingo (admin).')
  // Only members with "Manage Server" see and can use this command.
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('create')
      .setDescription('Publier un nouveau bingo (le bot poste l’image dans ce salon).')
      .addAttachmentOption((opt) =>
        opt.setName('image').setDescription('L’image du bingo.').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('texte').setDescription('Texte affiché au-dessus de l’image (optionnel).'),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('update')
      .setDescription('Remplacer l’image d’un bingo déjà posté par le bot.')
      .addStringOption((opt) =>
        opt.setName('lien').setDescription('Lien du message à modifier.').setRequired(true),
      )
      .addAttachmentOption((opt) =>
        opt.setName('image').setDescription('La nouvelle image.').setRequired(true),
      ),
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'create') return createBingo(interaction);
  if (sub === 'update') return updateBingo(interaction);
}

// Post a new bingo message with the bot as author, so it can be edited later.
async function createBingo(interaction) {
  const image = interaction.options.getAttachment('image', true);
  const texte = interaction.options.getString('texte') ?? '';

  await interaction.deferReply({ ephemeral: true });

  if (!isImage(image)) {
    await interaction.editReply('Le fichier fourni n’est pas une image (png, jpg, gif, webp).');
    return;
  }

  const file = new AttachmentBuilder(image.url, { name: image.name || 'bingo.png' });
  const message = await interaction.channel
    .send({ content: texte || undefined, files: [file] })
    .catch((error) => {
      console.error('[bingo] Publish failed:', error);
      return null;
    });
  if (!message) {
    await interaction.editReply('Impossible de publier ici (permissions manquantes ?).');
    return;
  }

  await interaction.editReply(
    `Bingo publié. ✅ ${message.url}\nPour changer l’image plus tard : \`/bingo update\` avec ce lien.`,
  );
}

// Swap the image of an existing bingo message the bot posted.
async function updateBingo(interaction) {
  const raw = interaction.options.getString('lien', true);
  const image = interaction.options.getAttachment('image', true);

  await interaction.deferReply({ ephemeral: true });

  if (!isImage(image)) {
    await interaction.editReply('Le fichier fourni n’est pas une image (png, jpg, gif, webp).');
    return;
  }

  const ref = parseMessageRef(raw, interaction.channelId);
  if (!ref) {
    await interaction.editReply(
      'Donne le **lien** du message (clic droit → Copier le lien du message) ou son **ID**.',
    );
    return;
  }

  const channel = await interaction.client.channels.fetch(ref.channelId).catch(() => null);
  const message = channel?.messages ? await channel.messages.fetch(ref.messageId).catch(() => null) : null;
  if (!message) {
    await interaction.editReply('Message introuvable (mauvais lien/ID, ou je n’ai pas accès à ce salon).');
    return;
  }

  // A bot can only edit its own messages.
  if (message.author.id !== interaction.client.user.id) {
    await interaction.editReply(
      'Je ne peux modifier que **mes propres** messages, pas celui d’un membre. Publie d’abord le bingo avec `/bingo create`.',
    );
    return;
  }

  const name = image.name || 'bingo.png';
  const file = new AttachmentBuilder(image.url, { name });

  // Base edit: drop every old attachment, add the new image.
  const edit = { attachments: [], files: [file] };

  // If an embed displayed the old image via "attachment://…", repoint it to the
  // new file so the embed keeps showing an image after the swap.
  const usesAttachmentImage = message.embeds.some(
    (e) => e.image?.url?.startsWith('attachment://') || e.thumbnail?.url?.startsWith('attachment://'),
  );
  if (usesAttachmentImage) {
    edit.embeds = message.embeds.map((e) => {
      const b = EmbedBuilder.from(e);
      if (e.image?.url?.startsWith('attachment://')) b.setImage(`attachment://${name}`);
      if (e.thumbnail?.url?.startsWith('attachment://')) b.setThumbnail(`attachment://${name}`);
      return b;
    });
  }

  try {
    await message.edit(edit);
  } catch (error) {
    console.error('[bingo] Update failed:', error);
    await interaction.editReply(
      'Échec de la modification (image trop lourde, ou permissions manquantes). Réessaie avec une image plus légère.',
    );
    return;
  }

  await interaction.editReply(`Image du bingo remplacée. ✅ ${message.url}`);
}
