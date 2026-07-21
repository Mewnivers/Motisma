import { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';

const BRAND = 0xffffff; // white

// Bot application emoji, used as the embed's brand mark. Custom emoji only
// render in an embed's description and field values — never in the title, a
// field name or the footer — so it opens the description rather than the title.
const PIN = '<:pushpin_1f4cc:1528857210187288689>';

// Trailing blank line spacing one category from the next. Discord strips
// trailing whitespace from a field, so the line carries a zero-width space to
// survive. Same convention as the resource channels embed.
const GAP = '\n​';

// Separator between the Conseil 4 mentions, kept on a single line. A custom
// emoji renders here because the mentions sit in a field value (never possible
// in a title / field name / footer). Bot application emoji: a mini Pokéball.
const MEMBER_SEP = ' <:pokeball:1529068808541831240> ';

// Badge shown next to Conseil 4 members who are also ambassadors. Bot
// application emoji: a purple pentagon with a white star (generated, crisp).
const AMBASSADOR_EMOJI = '<:ambassadeur:1529095444817252505>';

/**
 * The members holding a role, as mentions on a single line separated by the
 * Pokéball. Members who also hold `badgeRoleId` get `badge` appended. Resolved
 * live so the embed never lists someone who has left the team.
 * @param {import('discord.js').Guild} guild
 * @param {string} roleId
 * @param {string} [badgeRoleId]  role earning an extra badge (e.g. ambassadors)
 * @param {string} [badge]        emoji appended to members holding badgeRoleId
 * @returns {Promise<string>}
 */
async function roleMembers(guild, roleId, badgeRoleId, badge) {
  if (!roleId) return 'À venir !';
  try {
    // Fetch members first: the role's member list is only populated for
    // members already in cache.
    await guild.members.fetch();
    const role = guild.roles.cache.get(roleId);
    if (!role) return 'À venir !';
    const mentions = [...role.members.values()]
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((m) => (badgeRoleId && badge && m.roles.cache.has(badgeRoleId) ? `${badge} ${m}` : m.toString()));
    return mentions.length ? mentions.join(MEMBER_SEP) : 'À venir !';
  } catch {
    return 'Indisponible pour le moment.';
  }
}

/**
 * Server presentation embed: what the server is for, plus the live list of the
 * Conseil 4 — the role gathering the staff and the ambassadors.
 *
 * Headings are set in caps and stay emoji-free, matching the resource channels
 * embed the two are published next to.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<EmbedBuilder>}
 */
export async function buildPresentationEmbed(interaction) {
  const council = await roleMembers(
    interaction.guild,
    config.councilRoleId,
    config.ambassadorRoleId,
    AMBASSADOR_EMOJI,
  );

  return new EmbedBuilder()
    .setColor(BRAND)
    .setTitle('Motisma’Pau — Communauté Pokémon GO de Pau')
    .setDescription(`${PIN} Bienvenue ! Ici se retrouvent les dresseurs de **Pau et ses environs** pour jouer ensemble.`)
    .addFields(
      {
        name: 'LE BUT DU SERVEUR',
        value:
          [
            'Rassembler la communauté Pokémon GO locale, **dans la bonne humeur et en toute sécurité** :',
            '• voir qu’on n’est jamais seul à jouer dans son coin,',
            '• organiser facilement des **sorties et des raids**,',
            '• s’entraider (PvP, échanges, conseils),',
            '… sans jamais exposer d’adresse ou de position perso.',
          ].join('\n') + GAP,
      },
      {
        name: 'LE CONSEIL 4',
        value:
          'Le **staff et les ambassadeurs** du serveur : une équipe de passionnés qui **l’entretient au quotidien** ' +
          'pour garder une **ambiance agréable, conviviale et sûre** — animation, organisation des sorties, ' +
          `modération et coups de main.\n\n${council}` +
          GAP,
      },
      {
        name: 'UNE QUESTION ?',
        value:
          'Pose-la directement dans les **salons de discussion** : toute la communauté (et le Conseil 4) se fera un ' +
          'plaisir de t’aider. Pas besoin de MP !',
      },
    )
    .setFooter({ text: 'Bon jeu, et à bientôt sur le terrain — Motisma’Pau' });
}
