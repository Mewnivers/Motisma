// Catalog of customisable bot messages, grouped by category for the sidebar.
// `pool: true` → the content holds several lines (one per line); the bot picks
// one at random. `channel: true` → posted to a channel (ephemeral N/A).
export const MESSAGE_GROUPS = [
  {
    group: 'Modération langage',
    items: [
      {
        key: 'language_fun',
        label: 'Avertissement léger',
        icon: 'message',
        desc: 'Rappel humoristique. Une ligne = un message tiré au hasard.',
        vars: ['{attack}'],
        channel: true,
        pool: true,
      },
      {
        key: 'language_stern',
        label: 'Avertissement ferme',
        icon: 'message',
        desc: 'Rappel sévère. Une ligne = un message tiré au hasard.',
        vars: [],
        channel: true,
        pool: true,
      },
    ],
  },
];

// Messages shown directly on a feature's config page (not in the standalone
// Messages category). Their metadata is still needed to render the editors.
export const FEATURE_MESSAGES = [
  {
    key: 'classement_join_ok',
    label: 'Inscription (MP ouvert)',
    icon: 'medal',
    desc: 'Confirmation d’inscription quand le MP a pu être envoyé.',
    vars: [],
    channel: false,
  },
  {
    key: 'classement_join_closed',
    label: 'Inscription (MP fermé)',
    icon: 'medal',
    desc: 'Confirmation d’inscription quand le MP est bloqué.',
    vars: [],
    channel: false,
  },
  {
    key: 'classement_onboarding',
    label: 'Message d’accueil (MP)',
    icon: 'medal',
    desc: 'MP envoyé à l’inscription au classement.',
    vars: [],
    channel: false,
  },
  {
    key: 'classement_reminder',
    label: 'Rappel mensuel',
    icon: 'medal',
    desc: 'MP envoyé chaque mois pour rafraîchir les stats.',
    vars: [],
    channel: false,
  },
  {
    key: 'classement_not_participant',
    label: 'Non inscrit',
    icon: 'medal',
    desc: 'Réponse quand un non-inscrit envoie une capture.',
    vars: [],
    channel: false,
  },
  {
    key: 'classement_nothing_read',
    label: 'Capture illisible',
    icon: 'medal',
    desc: 'Réponse quand rien n’a pu être lu sur la capture.',
    vars: [],
    channel: false,
  },
  {
    key: 'classement_capture_refused',
    label: 'Capture refusée',
    icon: 'medal',
    desc: 'Réponse quand la capture est refusée (truquée / stats en baisse).',
    vars: ['{detail}'],
    channel: false,
  },
  {
    key: 'welcome',
    label: 'Bienvenue',
    icon: 'megaphone',
    desc: 'Posté dans le salon de bienvenue quand un membre est validé. Une ligne = un message tiré au hasard.',
    vars: ['{user}'],
    channel: true,
    pool: true,
  },
  {
    key: 'levelup',
    label: 'Passage de niveau',
    icon: 'star',
    desc: 'Posté quand un membre passe un niveau. Le bot tire un message au hasard.',
    vars: ['{user}', '{level}'],
    channel: true,
    pool: true,
  },
  {
    key: 'verification_detection',
    label: 'Détection du pseudo',
    icon: 'shield',
    desc: 'Posté sous la capture d’un nouvel arrivant.',
    vars: ['{namePart}', '{teamPart}'],
    channel: true,
  },
  {
    key: 'verification_tamper',
    label: 'Photo suspecte',
    icon: 'shield',
    desc: 'Alerte quand la photo semble truquée.',
    vars: ['{tamperReason}'],
    channel: true,
  },
  {
    key: 'verification_validated',
    label: 'Membre validé',
    icon: 'shield',
    desc: 'Posté quand un modo valide un nouvel arrivant.',
    vars: ['{target}', '{user}', '{suffix}'],
    channel: true,
  },
  {
    key: 'verification_refused',
    label: 'Demande refusée',
    icon: 'shield',
    desc: 'Posté quand un modo refuse une vérification.',
    vars: ['{target}', '{user}'],
    channel: true,
  },
];

// Flat list of all message metas (for lookup by key), incl. ones attached to a
// config page rather than the Messages category.
export const MESSAGE_TYPES = [...MESSAGE_GROUPS.flatMap((g) => g.items), ...FEATURE_MESSAGES];

export const MESSAGE_BY_KEY = Object.fromEntries(MESSAGE_TYPES.map((m) => [m.key, m]));
