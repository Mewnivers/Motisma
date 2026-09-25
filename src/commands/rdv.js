import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { config } from '../config.js';
import { getInfoEmbed, saveOuting } from '../db.js';
import { buildTemplateMessage } from '../embeds/renderInfoEmbed.js';
import { renderPanel, usesVar } from '../features/rdvPanel.js';
import { scheduleChannelDeletion } from '../features/rdvControls.js';
import { computeHoraire, computeClose } from '../features/rdvTime.js';

const PREFIX = '・';
const BRAND = 0x5865f2;

const BTN_STYLE = {
  Primary: ButtonStyle.Primary,
  Secondary: ButtonStyle.Secondary,
  Success: ButtonStyle.Success,
  Danger: ButtonStyle.Danger,
};

/** Bouton /rdv : applique la config (label/couleur/emoji) éditée, sinon les défauts. */
function rdvButton(customId, cfg, defLabel, defStyle, defEmoji) {
  const b = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel((cfg?.label || defLabel).slice(0, 80))
    .setStyle(BTN_STYLE[cfg?.style] || defStyle);
  const emoji = cfg && 'emoji' in cfg ? cfg.emoji : defEmoji;
  if (emoji) {
    try {
      b.setEmoji(emoji);
    } catch {
      // emoji invalide (mal formé) → on l'ignore.
    }
  }
  return b;
}

/** Embed d'annonce (public) : plus soigné, avec un bouton « Je participe ». */
export function buildAnnounceEmbed({ place, horaire, description, organizerId, closeLabel }) {
  return new EmbedBuilder()
    .setColor(BRAND)
    .setAuthor({ name: 'Nouvelle sortie' })
    .setTitle(`📣 ${place}`)
    .setDescription(
      [
        `<@${organizerId}> organise une sortie ! Clique sur **Je participe** pour rejoindre le salon privé. 🎉`,
        description ? `\n> ${description}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .addFields(
      { name: '📍 Lieu', value: place, inline: true },
      { name: '🕒 Horaire', value: horaire, inline: true },
    )
    .setFooter({ text: `🕒 Salon fermé automatiquement le ${closeLabel}` });
}

/** Turn free text into a channel-name-safe slug (lowercase, no accents). */
function slug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Construit la définition de /rdv. `withDescription` ajoute l'option optionnelle. */
function makeData({ withDescription }) {
  const b = new SlashCommandBuilder()
    .setName('rdv')
    .setDescription('Créer un salon temporaire pour organiser une sortie.')
    .addStringOption((opt) =>
      opt.setName('place').setDescription('Où se déroule la sortie').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('time').setDescription('À quelle heure (ex. 15h)').setRequired(true),
    );
  if (withDescription) {
    b.addStringOption((opt) =>
      opt.setName('description').setDescription('Petit mot sur la sortie (optionnel)').setMaxLength(300),
    );
  }
  b.addIntegerOption((opt) =>
    opt
      .setName('duree')
      .setDescription('Durée de la sortie en minutes (par défaut 45).')
      .setMinValue(5)
      .setMaxValue(1440),
  );
  return b;
}

// Définition statique (avec description) : utilisée au chargement pour le nom.
export const data = makeData({ withDescription: true });

// Définition dynamique pour le déploiement : n'inclut « description » que si un
// modèle rdv (annonce / salon / terminée) contient la variable {description}.
export async function buildData() {
  const keys = ['rdv_annonce', 'rdv_salon', 'rdv_termine'];
  let uses = false;
  for (const key of keys) {
    const row = await getInfoEmbed(config.guildId, key).catch(() => null);
    if (usesVar(row, 'description')) {
      uses = true;
      break;
    }
  }
  return makeData({ withDescription: uses });
}

export async function execute(interaction) {
  const place = interaction.options.getString('place', true);
  const time = interaction.options.getString('time', true);
  const description = interaction.options.getString('description');
  const duree = interaction.options.getInteger('duree') ?? 45;

  await interaction.deferReply({ ephemeral: true });

  // Horaire (début normalisé + fin = début + durée) et fermeture auto (minuit J+1).
  const { startEpoch, heureDebut, heureFin, horaire } = computeHoraire(time, duree);
  const { deleteAt, closeLabel } = computeClose(startEpoch);

  const name = `${PREFIX}${[slug(place), slug(time)].filter(Boolean).join('-') || 'sortie'}`.slice(
    0,
    100,
  );

  const organizerId = interaction.user.id;

  // Serveur de test dédié à /rdv : on y utilise la catégorie/annonce de test.
  const isTestGuild = config.rdvTestGuildId && interaction.guild.id === config.rdvTestGuildId;
  const rdvCategoryId = isTestGuild ? config.rdvTestCategoryId : config.rdvCategoryId;
  const rdvAnnounceChannelId = isTestGuild ? config.rdvTestAnnounceChannelId : config.rdvAnnounceChannelId;

  // Salon privé : caché à @everyone, visible par l'organisateur et le bot.
  const channel = await interaction.guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: rdvCategoryId || undefined,
    topic: `rdv-expire:${deleteAt}`,
    reason: `Sortie créée par ${interaction.user.tag}`,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: organizerId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ],
  });

  // Le staff (rôles validateurs) voit aussi le salon (best-effort).
  for (const rid of config.validatorRoleIds || []) {
    await channel.permissionOverwrites.edit(rid, { ViewChannel: true }).catch(() => {});
  }

  // Variables des modèles, remplies pour cette sortie.
  const vars = {
    lieu: place,
    heure: heureDebut, // alias rétro-compat (= heure de début)
    heure_debut: heureDebut,
    heure_fin: heureFin,
    duree: String(duree), // conservé pour /rdv-modifier (recalcul de l'heure de fin)
    organisateur: `<@${organizerId}>`,
    description: description || '',
    fermeture: closeLabel,
  };

  // Panneau du salon : modèle éditable « rdv_salon » avec {participants} et
  // {inscrits} (mis à jour à chaque inscription) + boutons.
  const panelTpl = await getInfoEmbed(config.guildId, 'rdv_salon').catch(() => null);
  const panelEmbed = await renderPanel({ vars, participants: [organizerId] });
  const panelBtns = (panelTpl && panelTpl.buttons) || {};
  const panelRow = new ActionRowBuilder().addComponents(
    rdvButton('rdv:leave', panelBtns.leave, 'Se désinscrire et quitter', ButtonStyle.Danger, '🚪'),
    rdvButton(`rdv:close:${organizerId}`, panelBtns.close, 'Fermer la sortie', ButtonStyle.Secondary, '🔒'),
  );
  const panel = await channel.send({ embeds: [panelEmbed], components: [panelRow] });
  await panel.pin().catch(() => {});

  scheduleChannelDeletion(channel, deleteAt);

  // Annonce publique avec un bouton « Je participe » qui donne l'accès au salon.
  let announceRef = null;
  if (rdvAnnounceChannelId) {
    const announceChannel = await interaction.guild.channels
      .fetch(rdvAnnounceChannelId)
      .catch(() => null);

    if (announceChannel?.isTextBased()) {
      // Modèle éditable via le dashboard (info_embeds « rdv_annonce ») ; repli
      // sur l'embed codé si le modèle n'est pas configuré. Le mode (texte /
      // embed / les deux) est appliqué par buildTemplateMessage.
      const tpl = await getInfoEmbed(config.guildId, 'rdv_annonce').catch(() => null);
      const joinRow = new ActionRowBuilder().addComponents(
        rdvButton(`rdv:join:${channel.id}:${panel.id}`, tpl?.buttons?.join, 'Je participe', ButtonStyle.Success, '🙋'),
      );
      const fallbackEmbed = buildAnnounceEmbed({ place, horaire, description, organizerId, closeLabel });
      const payload = buildTemplateMessage(tpl, vars, { components: [joinRow], fallbackEmbed });
      const announceMsg = await announceChannel.send(payload).catch(() => null);
      if (announceMsg) announceRef = { channelId: announceChannel.id, messageId: announceMsg.id };
    }
  }

  // Mémorise la sortie : permet de re-générer l'embed « terminée » (avec le bon
  // nombre de participants) à la fermeture, même après un redémarrage du bot.
  await saveOuting(channel.id, {
    guildId: interaction.guild.id,
    announceChannelId: announceRef?.channelId,
    announceMessageId: announceRef?.messageId,
    panelMessageId: panel.id,
    organizerId,
    participants: [organizerId],
    vars,
  }).catch(() => {});

  await interaction.editReply(`Salon privé créé : ${channel} — l'annonce « Je participe » est publiée.`);
}
