// web/src/components/dashboard/embedTypes.js
// Métadonnées des embeds info éditables (v1 : 5 clés).
export const EMBED_TYPES = [
  { key: 'reglement', label: 'Règlement', icon: 'scroll', desc: 'Les règles du serveur.' },
  { key: 'suggestions', label: 'Suggestions', icon: 'message', desc: 'La boîte à suggestions.' },
  { key: 'verification', label: 'Vérification', icon: 'shield', desc: 'Écran d’accueil des nouveaux.', lockImage: true, note: 'L’image d’exemple est gérée par le bot.' },
  { key: 'motisma', label: 'Motisma (le bot)', icon: 'star', desc: 'Présentation du bot.', lockThumbnail: true, note: 'La miniature (avatar du bot) est gérée par le bot.' },
  { key: 'classement', label: 'Classement', icon: 'medal', desc: 'Invitation au classement.', note: 'Le bouton « Participer » est conservé automatiquement.' },
  {
    key: 'rdv_annonce',
    label: 'Rendez-vous — Annonce',
    icon: 'calendar',
    desc: 'L’annonce d’une sortie /rdv (salon Annonce).',
    template: true,
    vars: ['{lieu}', '{heure}', '{organisateur}', '{description}', '{fermeture}'],
    note: 'Modèle : les variables ci-dessous sont remplies à chaque sortie. Le bouton « Je participe » est ajouté automatiquement.',
  },
  {
    key: 'rdv_salon',
    label: 'Rendez-vous — Salon',
    icon: 'calendar',
    desc: 'Le panneau posté dans le salon de la sortie.',
    template: true,
    vars: ['{lieu}', '{heure}', '{organisateur}', '{description}', '{fermeture}'],
    note: 'Modèle : les variables sont remplies à chaque sortie. La liste des participants et le bouton « Se désinscrire et quitter » sont ajoutés automatiquement.',
  },
];

export const EMBED_BY_KEY = Object.fromEntries(EMBED_TYPES.map((m) => [m.key, m]));
