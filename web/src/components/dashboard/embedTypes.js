// web/src/components/dashboard/embedTypes.js
// Métadonnées des embeds info éditables (v1 : 5 clés).
export const EMBED_TYPES = [
  { key: 'reglement', label: 'Règlement', icon: 'scroll', desc: 'Les règles du serveur.' },
  { key: 'suggestions', label: 'Suggestions', icon: 'message', desc: 'La boîte à suggestions.' },
  { key: 'verification', label: 'Vérification', icon: 'shield', desc: 'Écran d’accueil des nouveaux.', lockImage: true, note: 'L’image d’exemple est gérée par le bot.' },
  { key: 'motisma', label: 'Motisma (le bot)', icon: 'star', desc: 'Présentation du bot.', lockThumbnail: true, note: 'La miniature (avatar du bot) est gérée par le bot.' },
  { key: 'classement', label: 'Classement', icon: 'medal', desc: 'Invitation au classement.', note: 'Le bouton « Participer » est conservé automatiquement.' },
];

export const EMBED_BY_KEY = Object.fromEntries(EMBED_TYPES.map((m) => [m.key, m]));
