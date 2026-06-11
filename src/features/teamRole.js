import { config } from '../config.js';

/**
 * Pokémon GO teams, keyed by the value the vision returns (the colour of the
 * level number / XP bar). Used for the embed tint and the auto team role.
 */
export const TEAMS = {
  mystic: { label: 'Sagesse', color: 0x1f8bff, emoji: '🔵' },
  valor: { label: 'Bravoure', color: 0xff4554, emoji: '🔴' },
  instinct: { label: 'Intuition', color: 0xffcc1f, emoji: '🟡' },
};

/**
 * Give a member their team role (exclusive: removes the other two team roles).
 * No-op if the team is unknown or no role is configured for it.
 * @param {import('discord.js').GuildMember} member
 * @param {'mystic'|'valor'|'instinct'|null} team
 * @returns {Promise<boolean>} whether the role was assigned
 */
export async function applyTeamRole(member, team, reason = 'Équipe Pokémon GO détectée') {
  if (!member || !team) return false;
  const roleId = config.teamRoles?.[team];
  if (!roleId) return false;

  try {
    await member.roles.add(roleId, reason);
    // Keep team membership exclusive: drop any other team role the member has.
    const others = Object.entries(config.teamRoles)
      .filter(([key, id]) => id && key !== team && member.roles.cache.has(id))
      .map(([, id]) => id);
    if (others.length) await member.roles.remove(others, 'Changement d’équipe').catch(() => {});
    return true;
  } catch (error) {
    console.error('[team] Failed to assign the team role:', error?.message ?? error);
    return false;
  }
}
