// Miroir statique du catalogue /help du bot (src/help/help.js).
// ⚠️ À garder à jour à la main : si tu ajoutes/retires une commande côté bot,
// pense à répercuter ici. Le groupe « Administration » (admin: true) n'est
// affiché qu'aux administrateurs connectés. `icon` = nom d'icône (Icons.jsx).

export const COMMAND_GROUPS = [
  {
    title: 'Profil & Pokémon GO',
    icon: 'users',
    commands: [
      { name: '/set-pogo', short: 'Enregistre ton nom de dresseur et ton code ami.', example: '/set-pogo nom:RedAsh code:1234 5678 9012' },
      { name: '/userinfo', short: 'Affiche ton profil, ou celui d’un membre.', example: '/userinfo membre:@Dresseur' },
      { name: '/classement-pogo', short: 'Classement PoGo : envoie une capture de ton profil en MP, le bot lit tes stats.', example: '/classement-pogo rejoindre' },
    ],
  },
  {
    title: 'Progression sur le serveur',
    icon: 'activity',
    commands: [
      { name: '/niveau', short: 'Ta barre de progression et ton XP (gagné en discutant).', example: '/niveau' },
      { name: '/classement', short: 'Le top 10 des membres les plus actifs.', example: '/classement' },
    ],
  },
  {
    title: 'Sorties',
    icon: 'calendar',
    commands: [
      { name: '/rdv', short: 'Organise une sortie : salon dédié, inscriptions par bouton, fermeture auto.', example: '/rdv place:Parc Beaumont time:15h' },
    ],
  },
  {
    title: 'Pour se détendre',
    icon: 'smile',
    commands: [
      { name: '/quiz', short: 'Qui est ce Pokémon ? Devine la silhouette.', example: '/quiz' },
      { name: '/pendu', short: 'Le jeu du pendu, version Pokémon.', example: '/pendu' },
      { name: '/morpion', short: 'Défie un membre au morpion.', example: '/morpion adversaire:@Dresseur' },
      { name: '/devinette', short: 'Plus ou moins : devine le nombre entre 1 et 100.', example: '/devinette' },
      { name: '/sondage', short: 'Crée un sondage (Oui/Non ou jusqu’à 10 choix).', example: '/sondage question:On sort ce soir ?' },
    ],
  },
  {
    title: 'Aide',
    icon: 'book',
    commands: [
      { name: '/help', short: 'La liste des commandes et le détail de chacune.', example: '/help' },
    ],
  },
  {
    title: 'Administration',
    icon: 'shield',
    admin: true,
    commands: [
      { name: '/embed', short: 'Publie un embed d’information (règlement, vérification…).', example: '/embed type: Règlement' },
      { name: '/say', short: 'Fait parler le bot dans un salon.', example: '/say message:Bonjour ! salon:#général' },
      { name: '/clear', short: 'Supprime des messages récents (filtre par membre possible).', example: '/clear nombre:10' },
      { name: '/test', short: 'Outils de test du parcours d’arrivée des nouveaux.', example: '/test arrivee' },
    ],
  },
];
