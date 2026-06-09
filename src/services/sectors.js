import { sectors, MIN_VISIBLE_PLAYERS } from '../config/sectors.js';

/**
 * Count how many guild members hold each sector role.
 * Requires the GuildMembers privileged intent (enabled in the Developer Portal).
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<Array<{ name: string, count: number, visible: boolean }>>}
 */
export async function countBySector(guild) {
  await guild.members.fetch();

  return sectors.map((sector) => {
    const role = sector.roleId ? guild.roles.cache.get(sector.roleId) : null;
    const count = role ? role.members.size : 0;
    return { name: sector.name, count, visible: count >= MIN_VISIBLE_PLAYERS };
  });
}
