// web/src/components/dashboard/embedTypes.js
// Métadonnées des embeds info éditables.

// Les deux embeds d'une sortie /rdv, édités ensemble sur une même page.
const RDV_ANNONCE = {
  key: 'rdv_annonce',
  label: 'Annonce (salon Annonce)',
  template: true,
  message: true, // choix message simple / embed / message + embed
  vars: ['{lieu}', '{heure_debut}', '{heure_fin}', '{organisateur}', '{description}', '{fermeture}'],
  note: 'Posté dans le salon Annonce. Personnalise le bouton ci-dessous.',
  buttons: [{ role: 'join', name: 'Bouton d’inscription', label: 'Je participe', style: 'Success', emoji: '🙋' }],
};
const RDV_SALON = {
  key: 'rdv_salon',
  label: 'Panneau du salon',
  template: true,
  vars: ['{lieu}', '{heure_debut}', '{heure_fin}', '{organisateur}', '{description}', '{fermeture}'],
  note: 'Posté dans le salon. La liste des participants est ajoutée automatiquement.',
  buttons: [
    { role: 'leave', name: 'Bouton pour se désinscrire / quitter', label: 'Se désinscrire et quitter', style: 'Danger', emoji: '🚪' },
    { role: 'close', name: 'Bouton pour fermer la sortie (organisateur)', label: 'Fermer la sortie', style: 'Secondary', emoji: '🔒' },
  ],
};

export const EMBED_TYPES = [
  { key: 'reglement', label: 'Règlement', icon: 'scroll', desc: 'Les règles du serveur.' },
  { key: 'suggestions', label: 'Suggestions', icon: 'message', desc: 'La boîte à suggestions.' },
  { key: 'verification', label: 'Vérification', icon: 'shield', desc: 'Écran d’accueil des nouveaux.', lockImage: true, note: 'L’image d’exemple est gérée par le bot.' },
  { key: 'motisma', label: 'Motisma (le bot)', icon: 'star', desc: 'Présentation du bot.', lockThumbnail: true, note: 'La miniature (avatar du bot) est gérée par le bot.' },
  { key: 'classement', label: 'Classement', icon: 'medal', desc: 'Invitation au classement.', note: 'Le bouton « Participer » est conservé automatiquement.' },
  {
    key: 'rendez-vous',
    label: 'Rendez-vous',
    icon: 'calendar',
    desc: 'Les deux embeds d’une sortie /rdv (annonce + salon).',
    group: [RDV_ANNONCE, RDV_SALON],
  },
];

export const EMBED_BY_KEY = Object.fromEntries([
  ...EMBED_TYPES.map((m) => [m.key, m]),
  [RDV_ANNONCE.key, RDV_ANNONCE],
  [RDV_SALON.key, RDV_SALON],
]);
