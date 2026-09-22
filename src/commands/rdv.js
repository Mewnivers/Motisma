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
import { getInfoEmbed } from '../db.js';
import { contentToEmbed } from '../embeds/renderInfoEmbed.js';
import { scheduleChannelDeletion } from '../features/rdvControls.js';

const PREFIX = '・';
const PARIS = 'Europe/Paris';
const BRAND = 0x5865f2;

/** Remplace {var} par sa valeur dans une chaîne. */
function applyVars(s, vars) {
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

/** Applique les variables à toutes les chaînes d'une ligne info_embeds. */
function substituteRow(row, vars) {
  return {
    ...row,
    title: applyVars(row.title, vars),
    description: applyVars(row.description, vars),
    footer_text: applyVars(row.footer_text, vars),
    fields: (row.fields || []).map((f) => ({
      name: applyVars(f.name, vars),
      value: applyVars(f.value, vars),
      inline: Boolean(f.inline),
    })),
  };
}

const rowHasContent = (row) =>
  Boolean(row && (row.title || row.description || (row.fields && row.fields.length)));

/** Embed posté dans le salon privé : infos + liste des participants. */
export function buildPanelEmbed({ place, time, description, organizerId, ids, closeLabel }) {
  return new EmbedBuilder()
    .setColor(BRAND)
    .setTitle('🗓️ Sortie')
    .setDescription(
      [description ? `${description}\n` : null, '-# Bouton ci-dessous pour te désinscrire et quitter le salon.']
        .filter(Boolean)
        .join('\n'),
    )
    .addFields(
      { name: '📍 Lieu', value: place, inline: true },
      { name: '🕒 Heure', value: time, inline: true },
      { name: '👤 Organisateur', value: `<@${organizerId}>`, inline: true },
      {
        name: `Participants (${ids.length})`,
        value: ids.length ? ids.map((id) => `<@${id}>`).join('\n') : 'Personne pour l’instant.',
        inline: false,
      },
    )
    .setFooter({ text: `🕒 Fermeture automatique du salon le ${closeLabel}` });
}

/** Embed d'annonce (public) : plus soigné, avec un bouton « Je participe ». */
function buildAnnounceEmbed({ place, time, description, organizerId, closeLabel }) {
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
      { name: '🕒 Heure', value: time, inline: true },
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

// --- Time parsing (interpret the typed time as Europe/Paris wall-clock) ---
function partsInTz(epoch, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const o = {};
  for (const p of dtf.formatToParts(new Date(epoch))) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return o;
}

function wallClockToEpoch(y, mo, d, hh, mm, tz) {
  const naive = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const p = partsInTz(naive, tz);
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - naive;
  return naive - offset;
}

/** Returns the event start epoch (next occurrence of the typed time in Paris). */
function eventStartEpoch(timeStr) {
  const m = timeStr.match(/(\d{1,2})(?:\s*[h:]\s*(\d{1,2}))?/i);
  if (!m) return Date.now() + 24 * 60 * 60 * 1000; // unparsable -> clean up in 24h
  const hh = Math.min(23, parseInt(m[1], 10));
  const mm = m[2] ? Math.min(59, parseInt(m[2], 10)) : 0;

  const now = Date.now();
  const today = partsInTz(now, PARIS);
  let epoch = wallClockToEpoch(today.year, today.month, today.day, hh, mm, PARIS);
  if (epoch <= now) {
    const tomorrow = partsInTz(now + 24 * 60 * 60 * 1000, PARIS);
    epoch = wallClockToEpoch(tomorrow.year, tomorrow.month, tomorrow.day, hh, mm, PARIS);
  }
  return epoch;
}

export const data = new SlashCommandBuilder()
  .setName('rdv')
  .setDescription('Créer un salon temporaire pour organiser une sortie.')
  .addStringOption((opt) =>
    opt.setName('place').setDescription('Où se déroule la sortie').setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName('time').setDescription('À quelle heure (ex. 15h)').setRequired(true),
  )
  .addStringOption((opt) =>
    opt
      .setName('description')
      .setDescription('Petit mot sur la sortie (optionnel)')
      .setMaxLength(300),
  );

export async function execute(interaction) {
  const place = interaction.options.getString('place', true);
  const time = interaction.options.getString('time', true);
  const description = interaction.options.getString('description');

  await interaction.deferReply({ ephemeral: true });

  const deleteAt = eventStartEpoch(time) + 60 * 60 * 1000; // 1h after the meetup
  const c = partsInTz(deleteAt, PARIS);
  const pad = (n) => String(n).padStart(2, '0');
  const closeLabel = `${pad(c.day)}/${pad(c.month)} à ${pad(c.hour)}h${pad(c.minute)}`;

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
    heure: time,
    organisateur: `<@${organizerId}>`,
    description: description || '',
    fermeture: closeLabel,
  };

  // Panneau du salon : modèle éditable « rdv_salon » + liste des participants
  // (ajoutée automatiquement) + bouton pour quitter.
  const panelTpl = await getInfoEmbed(config.guildId, 'rdv_salon').catch(() => null);
  let panelEmbed;
  if (rowHasContent(panelTpl)) {
    panelEmbed = contentToEmbed(substituteRow(panelTpl, vars));
    panelEmbed.fields = [
      ...(panelEmbed.fields || []),
      { name: 'Participants (1)', value: `<@${organizerId}>`, inline: false },
    ];
  } else {
    panelEmbed = buildPanelEmbed({ place, time, description, organizerId, ids: [organizerId], closeLabel });
  }
  const leaveRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('rdv:leave')
      .setLabel('Se désinscrire et quitter')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger),
  );
  const panel = await channel.send({ embeds: [panelEmbed], components: [leaveRow] });
  await panel.pin().catch(() => {});

  scheduleChannelDeletion(channel, deleteAt);

  // Annonce publique avec un bouton « Je participe » qui donne l'accès au salon.
  if (rdvAnnounceChannelId) {
    const announceChannel = await interaction.guild.channels
      .fetch(rdvAnnounceChannelId)
      .catch(() => null);

    if (announceChannel?.isTextBased()) {
      // Modèle éditable via le dashboard (info_embeds « rdv_annonce ») ; repli
      // sur l'embed codé si le modèle n'a pas encore été configuré.
      const tpl = await getInfoEmbed(config.guildId, 'rdv_annonce').catch(() => null);
      const announce = rowHasContent(tpl)
        ? contentToEmbed(substituteRow(tpl, vars))
        : buildAnnounceEmbed({ place, time, description, organizerId, closeLabel });
      const joinRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rdv:join:${channel.id}:${panel.id}`)
          .setLabel('Je participe')
          .setEmoji('🙋')
          .setStyle(ButtonStyle.Success),
      );
      await announceChannel.send({ embeds: [announce], components: [joinRow] }).catch(() => {});
    }
  }

  await interaction.editReply(`Salon privé créé : ${channel} — l'annonce « Je participe » est publiée.`);
}
