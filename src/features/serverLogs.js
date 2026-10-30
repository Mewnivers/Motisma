import { Events, EmbedBuilder, AuditLogEvent, ChannelType } from 'discord.js';
import { config } from '../config.js';

/**
 * Server event logs: posts embeds in `config.logChannelId` for 8 kinds of events,
 * each gated by its own dashboard switch (guilds.logs_*, hydrated into config as
 * logsJoins, logsLeaves, …). A kind whose switch is off is a no-op, so turning a
 * toggle in the dashboard takes effect on the next config refresh (every 5 min)
 * without a restart.
 *
 * Intents: GuildMembers (joins/leaves/roles/boosts/timeouts), GuildMessages
 * (+ MessageContent to read deleted/edited content), GuildModeration (bans),
 * Guilds (channels), GuildVoiceStates (voice). Audit-log lookups need the bot to
 * have "View Audit Log"; they are best-effort and never throw.
 */

// One colour per kind, for readability (no per-guild customisation).
const COLORS = {
  join: 0x81c784, // green
  leave: 0xe57373, // red
  ban: 0xc62828, // dark red
  unban: 0x81c784,
  kick: 0xef6c00, // orange
  timeout: 0xff8f00,
  timeoutEnd: 0x81c784,
  messageDelete: 0xe57373,
  messageEdit: 0xffb74d,
  roles: 0x64b5f6, // blue
  channelCreate: 0x81c784,
  channelDelete: 0xe57373,
  voice: 0x4dd0e1, // cyan
  boost: 0xf06292, // pink
  boostEnd: 0x90a4ae,
};

export const CONTENT_UNAVAILABLE =
  '(contenu non disponible — message hors cache ou intent Message Content désactivé)';

const nowUnix = () => Math.floor(Date.now() / 1000);

const CHANNEL_TYPES = {
  [ChannelType.GuildText]: 'Salon textuel',
  [ChannelType.GuildVoice]: 'Salon vocal',
  [ChannelType.GuildCategory]: 'Catégorie',
  [ChannelType.GuildAnnouncement]: "Salon d'annonces",
  [ChannelType.GuildStageVoice]: 'Salon de conférence',
  [ChannelType.GuildForum]: 'Forum',
};
const channelTypeLabel = (t) => CHANNEL_TYPES[t] ?? 'Salon';

// --- Pure helpers (testable without a Discord client) -----------------------

/** Message content for an embed field, with an explicit fallback when empty. */
export function contentOrFallback(content) {
  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) return CONTENT_UNAVAILABLE;
  return text.length > 1024 ? `${text.slice(0, 1021)}…` : text;
}

/**
 * Decide whether a GuildMemberRemove is a voluntary leave or the side effect of
 * a ban/kick, from the best-matching recent audit entry (or null).
 * @param {{type:'ban'|'kick', targetId?:string, createdTimestamp?:number}|null} entry
 * @returns {'leave'|'ban'|'kick'}
 */
export function classifyRemoval(entry, { memberId, now = Date.now(), windowMs = 5000 } = {}) {
  if (!entry) return 'leave';
  if (entry.targetId && memberId && entry.targetId !== memberId) return 'leave';
  if (typeof entry.createdTimestamp === 'number' && now - entry.createdTimestamp > windowMs) return 'leave';
  return entry.type === 'ban' || entry.type === 'kick' ? entry.type : 'leave';
}

/** "@exec · exec#tag" for an audit entry's executor, or "—". */
function executorText(entry) {
  const ex = entry?.executor;
  return ex ? `${ex} · ${ex.tag}` : '—';
}

/** Embed for a deleted message, with the required fields and content fallback. */
export function buildMessageDeleteEmbed({ author, content, channel, sentAtUnix, deletedBy }) {
  const embed = new EmbedBuilder().setColor(COLORS.messageDelete).setTitle('🗑️ Message supprimé').setTimestamp();
  if (author) embed.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL?.() });
  embed.addFields(
    { name: 'Auteur', value: author ? `${author} · ${author.tag}` : '—' },
    { name: 'Salon', value: channel ? `${channel}` : '—', inline: true },
    { name: 'Envoyé', value: sentAtUnix ? `<t:${sentAtUnix}:F>` : '—', inline: true },
    { name: 'Supprimé par', value: deletedBy || '—', inline: true },
    { name: 'Contenu', value: contentOrFallback(content) },
  );
  return embed;
}

function infoEmbed(color, title, fields) {
  return new EmbedBuilder().setColor(color).setTitle(title).addFields(fields).setTimestamp();
}

// --- Discord plumbing -------------------------------------------------------

/**
 * Post a log embed to `config.logChannelId`. No-op if the kind's switch is off,
 * if no log channel is set, or if the event is from another guild.
 * @param {import('discord.js').Guild} guild
 * @param {'joins'|'leaves'|'messages'|'moderation'|'roles'|'channels'|'voice'|'boosts'} kind
 */
export async function sendLog(guild, kind, payload) {
  if (!guild || guild.id !== config.guildId) return;
  if (!config.logChannelId) return;
  if (!config[`logs${kind[0].toUpperCase()}${kind.slice(1)}`]) return;
  const channel = await guild.channels.fetch(config.logChannelId).catch(() => null);
  if (!channel?.isTextBased?.()) return;
  await channel.send(payload).catch((e) =>
    console.error(`[serverLogs] Failed to send the ${kind} log:`, e?.message ?? e),
  );
}

/** Best-effort audit-log lookup: recent entry of `type` targeting `targetId`. */
export async function findAuditEntry(guild, type, targetId, { windowMs = 8000 } = {}) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 5 });
    const now = Date.now();
    return (
      logs.entries.find((e) => e.target?.id === targetId && now - e.createdTimestamp < windowMs) ?? null
    );
  } catch {
    return null; // missing "View Audit Log" perm or API hiccup → degrade quietly
  }
}

// --- Handlers ---------------------------------------------------------------

async function onMemberAdd(member) {
  if (member.guild.id !== config.guildId) return;
  const user = member.user;
  const embed = infoEmbed(COLORS.join, "📥 Arrivée d'un membre", [
    { name: 'Membre', value: `${member} · ${user.tag}` },
    { name: 'Compte créé', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
    { name: 'Arrivé', value: `<t:${nowUnix()}:F>`, inline: true },
  ]).setThumbnail(user.displayAvatarURL());
  await sendLog(member.guild, 'joins', { embeds: [embed] });
}

async function onMemberRemove(member) {
  const guild = member.guild;
  if (guild.id !== config.guildId) return;
  if (!config.logChannelId) return;
  if (!config.logsLeaves && !config.logsModeration) return; // nothing to log → skip audit calls
  const user = member.user;

  // A ban also fires GuildMemberRemove: let onGuildBanAdd own it, skip here.
  const banEntry = await findAuditEntry(guild, AuditLogEvent.MemberBanAdd, user.id);
  if (banEntry) return;

  const kickEntry = await findAuditEntry(guild, AuditLogEvent.MemberKick, user.id);
  const kind = classifyRemoval(
    kickEntry ? { type: 'kick', targetId: user.id, createdTimestamp: kickEntry.createdTimestamp } : null,
    { memberId: user.id },
  );

  if (kind === 'kick') {
    const embed = infoEmbed(COLORS.kick, '👢 Membre expulsé (kick)', [
      { name: 'Membre', value: `${user} · ${user.tag}` },
      { name: 'Par', value: executorText(kickEntry), inline: true },
      { name: 'Quand', value: `<t:${nowUnix()}:F>`, inline: true },
      { name: 'Raison', value: kickEntry?.reason || '—' },
    ]).setThumbnail(user.displayAvatarURL());
    await sendLog(guild, 'moderation', { embeds: [embed] });
    return;
  }

  // Voluntary leave: who + when, no executor/reason.
  const embed = infoEmbed(COLORS.leave, "📤 Départ d'un membre", [
    { name: 'Membre', value: `${user} · ${user.tag}` },
    { name: 'Parti', value: `<t:${nowUnix()}:F>`, inline: true },
  ]).setThumbnail(user.displayAvatarURL());
  await sendLog(guild, 'leaves', { embeds: [embed] });
}

async function onGuildBanAdd(ban) {
  const guild = ban.guild;
  if (guild.id !== config.guildId) return;
  const user = ban.user;
  const entry = await findAuditEntry(guild, AuditLogEvent.MemberBanAdd, user.id);
  const embed = infoEmbed(COLORS.ban, '🔨 Membre banni', [
    { name: 'Membre', value: `${user} · ${user.tag}` },
    { name: 'Par', value: executorText(entry), inline: true },
    { name: 'Quand', value: `<t:${nowUnix()}:F>`, inline: true },
    { name: 'Raison', value: ban.reason || entry?.reason || '—' },
  ]).setThumbnail(user.displayAvatarURL());
  await sendLog(guild, 'moderation', { embeds: [embed] });
}

async function onGuildBanRemove(ban) {
  const guild = ban.guild;
  if (guild.id !== config.guildId) return;
  const user = ban.user;
  const entry = await findAuditEntry(guild, AuditLogEvent.MemberBanRemove, user.id);
  const embed = infoEmbed(COLORS.unban, '♻️ Débannissement', [
    { name: 'Membre', value: `${user} · ${user.tag}` },
    { name: 'Par', value: executorText(entry), inline: true },
    { name: 'Quand', value: `<t:${nowUnix()}:F>`, inline: true },
  ]).setThumbnail(user.displayAvatarURL());
  await sendLog(guild, 'moderation', { embeds: [embed] });
}

async function onMessageDelete(message) {
  const guild = message.guild;
  if (!guild || guild.id !== config.guildId) return;
  if (!config.logChannelId || !config.logsMessages) return;
  if (message.author?.bot) return;

  // Best-effort: who deleted it (audit log target = the message author).
  let deletedBy = '—';
  if (message.author?.id) {
    const entry = await findAuditEntry(guild, AuditLogEvent.MessageDelete, message.author.id);
    deletedBy = entry ? executorText(entry) : "probablement l'auteur";
  }

  const embed = buildMessageDeleteEmbed({
    author: message.author ?? null,
    content: message.content,
    channel: message.channel ?? null,
    sentAtUnix: message.createdTimestamp ? Math.floor(message.createdTimestamp / 1000) : null,
    deletedBy,
  });
  await sendLog(guild, 'messages', { embeds: [embed] });
}

async function onMessageUpdate(oldMessage, newMessage) {
  const guild = newMessage.guild;
  if (!guild || guild.id !== config.guildId) return;
  if (!config.logChannelId || !config.logsMessages) return;
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return; // embeds loading / pin → ignore

  const author = newMessage.author;
  const embed = new EmbedBuilder().setColor(COLORS.messageEdit).setTitle('✏️ Message édité').setTimestamp();
  if (author) embed.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL?.() });
  embed.addFields(
    { name: 'Auteur', value: author ? `${author} · ${author.tag}` : '—' },
    { name: 'Salon', value: newMessage.channel ? `${newMessage.channel}` : '—', inline: true },
    { name: 'Lien', value: newMessage.url ? `[aller au message](${newMessage.url})` : '—', inline: true },
    { name: 'Avant', value: contentOrFallback(oldMessage.content) },
    { name: 'Après', value: contentOrFallback(newMessage.content) },
  );
  await sendLog(guild, 'messages', { embeds: [embed] });
}

// GuildMemberUpdate drives three independent concerns (roles / boosts /
// timeouts), each behind its own switch. One listener dispatches by what changed.
async function onGuildMemberUpdate(oldMember, newMember) {
  const guild = newMember.guild;
  if (guild.id !== config.guildId) return;
  if (!config.logChannelId) return;

  // --- Role changes (logs_roles) ---
  if (config.logsRoles && oldMember.roles?.cache && newMember.roles?.cache) {
    const before = oldMember.roles.cache;
    const after = newMember.roles.cache;
    const added = [...after.values()].filter((r) => !before.has(r.id));
    const removed = [...before.values()].filter((r) => !after.has(r.id));
    if (added.length || removed.length) {
      const fields = [{ name: 'Membre', value: `${newMember} · ${newMember.user.tag}` }];
      if (added.length) fields.push({ name: 'Rôles ajoutés', value: added.map((r) => `${r}`).join(', ') });
      if (removed.length) fields.push({ name: 'Rôles retirés', value: removed.map((r) => `${r}`).join(', ') });
      await sendLog(guild, 'roles', { embeds: [infoEmbed(COLORS.roles, '🏷️ Rôles modifiés', fields)] });
    }
  }

  // --- Boost changes (logs_boosts) ---
  if (config.logsBoosts && oldMember.premiumSinceTimestamp !== newMember.premiumSinceTimestamp) {
    const started = !oldMember.premiumSinceTimestamp && !!newMember.premiumSinceTimestamp;
    const embed = infoEmbed(started ? COLORS.boost : COLORS.boostEnd, started ? '💎 Nouveau boost' : '💔 Boost retiré', [
      { name: 'Membre', value: `${newMember} · ${newMember.user.tag}` },
      { name: 'Quand', value: `<t:${nowUnix()}:F>`, inline: true },
    ]);
    await sendLog(guild, 'boosts', { embeds: [embed] });
  }

  // --- Timeout changes (logs_moderation) ---
  if (config.logsModeration) {
    const before = oldMember.communicationDisabledUntilTimestamp || 0;
    const after = newMember.communicationDisabledUntilTimestamp || 0;
    if (before !== after) {
      const applied = after > Date.now();
      const entry = await findAuditEntry(guild, AuditLogEvent.MemberUpdate, newMember.id);
      const fields = [
        { name: 'Membre', value: `${newMember} · ${newMember.user.tag}` },
        { name: 'Par', value: executorText(entry), inline: true },
      ];
      if (applied) fields.push({ name: "Jusqu'à", value: `<t:${Math.floor(after / 1000)}:F>`, inline: true });
      fields.push({ name: 'Raison', value: entry?.reason || '—' });
      const embed = infoEmbed(applied ? COLORS.timeout : COLORS.timeoutEnd, applied ? '🔇 Timeout appliqué' : '🔊 Timeout levé', fields);
      await sendLog(guild, 'moderation', { embeds: [embed] });
    }
  }
}

async function onChannelCreate(channel) {
  if (!channel.guild || channel.guild.id !== config.guildId) return;
  const embed = infoEmbed(COLORS.channelCreate, '📁 Salon créé', [
    { name: 'Salon', value: `${channel} · \`${channel.name}\`` },
    { name: 'Type', value: channelTypeLabel(channel.type), inline: true },
    { name: 'Quand', value: `<t:${nowUnix()}:F>`, inline: true },
  ]);
  await sendLog(channel.guild, 'channels', { embeds: [embed] });
}

async function onChannelDelete(channel) {
  if (!channel.guild || channel.guild.id !== config.guildId) return;
  const embed = infoEmbed(COLORS.channelDelete, '🗑️ Salon supprimé', [
    { name: 'Salon', value: `\`${channel.name}\`` },
    { name: 'Type', value: channelTypeLabel(channel.type), inline: true },
    { name: 'Quand', value: `<t:${nowUnix()}:F>`, inline: true },
  ]);
  await sendLog(channel.guild, 'channels', { embeds: [embed] });
}

async function onVoiceStateUpdate(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  if (!guild || guild.id !== config.guildId) return;
  if (!config.logChannelId || !config.logsVoice) return;
  const oldCh = oldState.channelId;
  const newCh = newState.channelId;
  if (oldCh === newCh) return; // mute/deaf/stream toggles — not a channel move

  const member = newState.member || oldState.member;
  const who = member ? `${member} · ${member.user.tag}` : '—';
  const chName = (state, id) => (state.channel ? `${state.channel}` : `\`${id}\``);

  let title;
  let fields;
  if (!oldCh && newCh) {
    title = '🔊 Arrivée en vocal';
    fields = [{ name: 'Membre', value: who }, { name: 'Salon', value: chName(newState, newCh), inline: true }];
  } else if (oldCh && !newCh) {
    title = '🔇 Départ du vocal';
    fields = [{ name: 'Membre', value: who }, { name: 'Salon', value: chName(oldState, oldCh), inline: true }];
  } else {
    title = '🔀 Changement de salon vocal';
    fields = [
      { name: 'Membre', value: who },
      { name: 'De', value: chName(oldState, oldCh), inline: true },
      { name: 'Vers', value: chName(newState, newCh), inline: true },
    ];
  }
  await sendLog(guild, 'voice', { embeds: [infoEmbed(COLORS.voice, title, fields)] });
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerServerLogs(client) {
  client.on(Events.GuildMemberAdd, onMemberAdd);
  client.on(Events.GuildMemberRemove, onMemberRemove);
  client.on(Events.GuildMemberUpdate, onGuildMemberUpdate);
  client.on(Events.GuildBanAdd, onGuildBanAdd);
  client.on(Events.GuildBanRemove, onGuildBanRemove);
  client.on(Events.MessageDelete, onMessageDelete);
  client.on(Events.MessageUpdate, onMessageUpdate);
  client.on(Events.ChannelCreate, onChannelCreate);
  client.on(Events.ChannelDelete, onChannelDelete);
  client.on(Events.VoiceStateUpdate, onVoiceStateUpdate);
}
