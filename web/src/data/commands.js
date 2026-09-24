// Miroir statique du catalogue /help du bot (src/help/help.js).
// ⚠️ À garder à jour à la main : si tu ajoutes/retires une commande côté bot,
// pense à répercuter ici. Le groupe « Administration » (admin: true) n'est
// affiché qu'aux administrateurs connectés.

export const COMMAND_GROUPS = [
  {
    title: 'Profil & Pokémon GO',
    commands: [
      { name: '/set-pogo', emoji: '🎮', short: 'Enregistre ton nom de dresseur et ton code ami.', example: '/set-pogo nom:RedAsh code:1234 5678 9012' },
      { name: '/userinfo', emoji: '👤', short: 'Affiche ton profil, ou celui d’un membre.', example: '/userinfo membre:@Dresseur' },
      { name: '/classement-pogo', emoji: '🔴', short: 'Classement PoGo : envoie une capture de ton profil en MP, le bot lit tes stats.', example: '/classement-pogo rejoindre' },
    ],
  },
  {
    title: 'Progression sur le serveur',
    commands: [
      { name: '/niveau', emoji: '⭐', short: 'Ta barre de progression et ton XP (gagné en discutant).', example: '/niveau' },
      { name: '/classement', emoji: '🏆', short: 'Le top 10 des membres les plus actifs.', example: '/classement' },
    ],
  },
  {
    title: 'Sorties',
    commands: [
      { name: '/rdv', emoji: '📅', short: 'Organise une sortie : salon dédié, inscriptions par bouton, fermeture auto.', example: '/rdv place:Parc Beaumont time:15h' },
    ],
  },
  {
    title: 'Pour se détendre',
    commands: [
      { name: '/quiz', emoji: '🔍', short: 'Qui est ce Pokémon ? Devine la silhouette.', example: '/quiz' },
      { name: '/pendu', emoji: '🎮', short: 'Le jeu du pendu, version Pokémon.', example: '/pendu' },
      { name: '/morpion', emoji: '⭕', short: 'Défie un membre au morpion.', example: '/morpion adversaire:@Dresseur' },
      { name: '/devinette', emoji: '🎯', short: 'Plus ou moins : devine le nombre entre 1 et 100.', example: '/devinette' },
      { name: '/sondage', emoji: '📊', short: 'Crée un sondage (Oui/Non ou jusqu’à 10 choix).', example: '/sondage question:On sort ce soir ?' },
    ],
  },
  {
    title: 'Aide',
    commands: [
      { name: '/help', emoji: '❓', short: 'La liste des commandes et le détail de chacune.', example: '/help' },
    ],
  },
  {
    title: 'Administration',
    admin: true,
    commands: [
      { name: '/embed', emoji: '📋', short: 'Publie un embed d’information (règlement, vérification…).', example: '/embed type: Règlement' },
      { name: '/say', emoji: '🗣️', short: 'Fait parler le bot dans un salon.', example: '/say message:Bonjour ! salon:#général' },
      { name: '/clear', emoji: '🧹', short: 'Supprime des messages récents (filtre par membre possible).', example: '/clear nombre:10' },
      { name: '/test', emoji: '🧪', short: 'Outils de test du parcours d’arrivée des nouveaux.', example: '/test arrivee' },
    ],
  },
];
