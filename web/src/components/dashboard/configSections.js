// Config modules of the dashboard, one per sidebar entry (MEE6-style).
// Each field = [column, label, kind]. kind drives the control:
// role | channel | voice | category | int | text.
export const CONFIG_SECTIONS = [
  {
    key: 'verification',
    label: 'Vérification',
    icon: 'shield',
    desc: 'Rôles et salon d’arrivée des nouveaux membres.',
    fields: [
      ['verification_role_id', 'Rôle en attente', 'role'],
      ['member_role_id', 'Rôle membre (Dresseur)', 'role'],
      ['verification_channel_id', 'Salon de vérification', 'channel'],
      ['validator_role_ids', 'Rôles pouvant valider', 'roles'],
    ],
    // Messages shown on this same page (feature = config + messages together).
    messageKeys: [
      'verification_detection',
      'verification_tamper',
      'verification_validated',
      'verification_refused',
    ],
  },
  {
    key: 'accueil',
    label: 'Accueil',
    icon: 'megaphone',
    desc: 'Salon et message de bienvenue des nouveaux membres.',
    fields: [['welcome_channel_id', 'Salon de bienvenue', 'channel']],
    messageKeys: ['welcome'],
  },
  {
    key: 'logs',
    label: 'Logs',
    icon: 'scroll',
    desc: 'Journal du staff : salon, types de logs à recevoir et embed.',
    fields: [
      ['log_channel_id', 'Salon de logs staff', 'channel'],
      ['logs_verification', 'Vérifications (validations / refus)', 'boolean'],
      ['logs_joins', 'Arrivées de membres', 'boolean'],
      ['logs_leaves', 'Départs de membres', 'boolean'],
      ['logs_messages', 'Messages supprimés / édités', 'boolean'],
      ['logs_moderation', 'Sanctions (ban, exclusion, timeout)', 'boolean'],
      ['logs_roles', 'Changements de rôles', 'boolean'],
      ['logs_channels', 'Salons créés / supprimés', 'boolean'],
      ['logs_voice', 'Activité vocale', 'boolean'],
      ['logs_boosts', 'Boosts du serveur', 'boolean'],
    ],
  },
  {
    key: 'voice',
    label: 'Vocal temporaire',
    icon: 'mic',
    desc: 'Salon « hub » qui crée des vocaux personnels.',
    // Pick the category first; the channel selectors are then filtered to it.
    filterByCategory: true,
    fields: [
      ['temp_voice_category_id', 'Catégorie des vocaux créés', 'category'],
      ['temp_voice_hub_id', 'Salon « hub » (rejoindre pour créer)', 'voice'],
    ],
  },
  {
    key: 'rdv',
    label: 'Rendez-vous',
    icon: 'calendar',
    desc: 'Salons des sorties et raids organisés via /rdv.',
    fields: [
      ['rdv_category_id', 'Catégorie des /rdv', 'category'],
      ['rdv_announce_channel_id', 'Salon d’annonce des /rdv', 'channel'],
    ],
  },
  {
    key: 'levels',
    label: 'Niveaux',
    icon: 'star',
    desc: 'XP de discussion, récompenses par palier et message.',
    fields: [
      ['levelup_channel_id', 'Salon des passages de niveau', 'channel'],
      ['level_roles', 'Rôles par palier', 'levelroles'],
    ],
    messageKeys: ['levelup'],
  },
  {
    key: 'teams',
    label: 'Rôles d’équipe',
    icon: 'flag',
    desc: 'Rôles attribués selon l’équipe Pokémon GO.',
    fields: [
      ['team_role_mystic', 'Sagesse (Mystic)', 'role'],
      ['team_role_valor', 'Bravoure (Valor)', 'role'],
      ['team_role_instinct', 'Intuition (Instinct)', 'role'],
    ],
  },
  {
    key: 'classement',
    label: 'Classement',
    icon: 'medal',
    desc: 'Participation au classement mensuel et rappels.',
    fields: [
      ['classement_role_id', 'Rôle des participants', 'role'],
      ['classement_admin_channel_id', 'Salon d’alerte staff', 'channel'],
      ['classement_reminder_day', 'Jour du rappel (1-28)', 'int'],
      ['classement_reminder_hour', 'Heure du rappel (0-23)', 'int'],
    ],
    messageKeys: [
      'classement_join_ok',
      'classement_join_closed',
      'classement_onboarding',
      'classement_reminder',
      'classement_not_participant',
      'classement_nothing_read',
      'classement_capture_refused',
    ],
  },
  {
    key: 'presence',
    label: 'Présence du bot',
    icon: 'activity',
    desc: 'Statut et activité affichés par le bot.',
    fields: [
      ['presence_text', 'Statut personnalisé', 'text'],
      ['presence_emoji', 'Emoji du statut', 'text'],
      ['presence_game', 'Activité « Joue à »', 'text'],
      ['presence_game_type', 'Type (playing/watching/…)', 'text'],
      ['presence_status', 'État (online/idle/dnd/…)', 'text'],
    ],
  },
  {
    key: 'language',
    label: 'Modération langage',
    icon: 'message',
    desc: 'Durée des exclusions temporaires (timeout).',
    fields: [
      ['language_timeout_mild', 'Timeout léger (secondes)', 'int'],
      ['language_timeout_strong', 'Timeout fort (secondes)', 'int'],
    ],
  },
  {
    key: 'misc',
    label: 'Divers',
    icon: 'gear',
    desc: 'Réglages annexes : réactions automatiques et rôles mis en avant.',
    // Grouped into labelled sub-sections instead of one flat list.
    groups: [
      {
        title: 'Réactions automatiques aux images',
        desc: 'Le bot ajoute les emojis choisis aux images postées dans chaque salon (ou forum) configuré.',
        fields: [
          ['forum_heart_enabled', 'Activer les réactions automatiques', 'boolean'],
          ['auto_reactions', 'Règles (salon → emojis)', 'reactions'],
        ],
      },
      {
        title: 'Ambassadeurs',
        desc: 'Rôle mis en avant dans l’embed de présentation du serveur.',
        fields: [['ambassador_role_id', 'Rôle ambassadeurs', 'role']],
      },
    ],
  },
];
