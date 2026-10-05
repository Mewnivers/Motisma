# Journal des modifications

Les changements notables du projet sont consignés ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet utilise le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Intégration continue GitHub Actions : vérification de syntaxe, tests et construction de l'image Docker.
- Scripts `npm run check` et `npm test`.
- Fichier `.nvmrc`, mises à jour Dependabot, `CODEOWNERS`, code de conduite.

### Modifié

- L'image Docker tourne avec l'utilisateur non privilégié `node` et `NODE_ENV=production`.
- Node.js 22 minimum (`engines`), aligné sur l'image Docker.

## [0.1.0] - 2026-10-05

Première version du bot seul, après la séparation du site et de l'API dans un dépôt distinct.

### Ajouté

- Sorties `/rdv` : salon temporaire, inscription par bouton, fermeture automatique, modification avec `/rdv-modifier`.
- Profils Pokémon GO : `/set-pogo`, lecture des captures de profil (API Gemini, facultative), détection de l'équipe.
- Classement Pokémon GO mensuel (`/classement-pogo`) avec rappel par message privé et alerte du staff.
- Niveaux par XP de discussion (`/niveau`, `/classement`) et rôles de récompense.
- Mini-jeux : `/quiz`, `/pendu`, `/morpion`, `/devinette` ; sondages avec `/sondage`.
- Vérification des nouveaux arrivants, message de bienvenue et logs du staff.
- Embeds d'information publiés avec `/embed`, contenu modifiable depuis la table `info_embeds`.
- Salons vocaux temporaires, réactions automatiques sur les forums, maintien des posts de forum actifs, annonce des vidéos YouTube.
- Outils du staff : `/clear`, `/say`, `/bingo`, `/reset-joueur`, menu « Déplacer ».
- Déploiement avec Docker Compose et schéma PostgreSQL créé au démarrage.
