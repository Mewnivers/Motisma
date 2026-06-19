import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { config } from '../../config.js';
import {
  hasDb,
  resetPogoStats,
  resetPogoProfile,
  deletePogoProfile,
  resetXp,
} from '../../db.js';

/**
 * Admin cleanup: reset a player's stored data. Handy to start the classement
 * over from a clean slate (e.g. when stale test stats block a fresh capture
 * via the anti-cheat "stats can only go up" rule).
 *   /reset-joueur membre:<user> donnees:<tout|classement|profil|niveau>
 */
export const data = new SlashCommandBuilder()
  .setName('reset-joueur')
  .setDescription('Réinitialise les données d’un joueur (admin).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addUserOption((o) =>
    o.setName('membre').setDescription('Le joueur à réinitialiser').setRequired(true),
  )
  .addStringOption((o) =>
    o
      .setName('donnees')
      .setDescription('Quelles données effacer (défaut : classement)')
      .addChoices(
        { name: 'Tout (profil + classement + niveau)', value: 'tout' },
        { name: 'Classement (niveau, XP, captures, distance, PokéStops, équipe)', value: 'classement' },
        { name: 'Profil (pseudo + code ami)', value: 'profil' },
        { name: 'Niveau (XP de messagerie)', value: 'niveau' },
      ),
  );

// Best-effort removal of the classement + team roles (ignored if not configured
// or if the bot's role isn't high enough).
async function removeRoles(interaction, userId) {
  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  const ids = [config.classementRoleId, ...Object.values(config.teamRoles)].filter(Boolean);
  const toRemove = ids.filter((id) => member.roles.cache.has(id));
  if (toRemove.length) await member.roles.remove(toRemove, 'Reset joueur (admin)').catch(() => {});
}

export async function execute(interaction) {
  if (!hasDb()) {
    await interaction.reply({ content: 'La base de données est indisponible.', ephemeral: true });
    return;
  }

  const user = interaction.options.getUser('membre', true);
  const scope = interaction.options.getString('donnees') ?? 'classement';
  const cleared = [];

  if (scope === 'tout') {
    await deletePogoProfile(user.id);
    await resetXp(user.id);
    await removeRoles(interaction, user.id);
    cleared.push('profil Pokémon GO', 'stats du classement', 'participation au classement', 'XP de niveau', 'rôles classement/équipe');
  } else if (scope === 'classement') {
    await resetPogoStats(user.id);
    cleared.push('stats du classement (niveau, XP, captures, distance, PokéStops, équipe)');
  } else if (scope === 'profil') {
    await resetPogoProfile(user.id);
    cleared.push('pseudo + code ami');
  } else if (scope === 'niveau') {
    await resetXp(user.id);
    cleared.push('XP de niveau (messagerie)');
  }

  await interaction.reply({
    content: `🧹 Données réinitialisées pour <@${user.id}> :\n${cleared.map((c) => `• ${c}`).join('\n')}`,
    ephemeral: true,
    allowedMentions: { parse: [] },
  });
}
