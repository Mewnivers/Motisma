<div align="center">

<img src="docs/assets/logo.svg" alt="Logo Motisma'Pau" width="120" height="120">

# Motisma'Pau

**Le bot Discord de la communauté Pokémon GO de Pau.**

[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![discord.js](https://img.shields.io/badge/discord.js-14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

[English version](README.en.md)

</div>

---

> **Dépôt du bot seul.** Le site web et l'API (connexion Discord, classement en ligne) vivent dans un dépôt séparé, privé : PoGo-Pau. Les deux projets partagent la même base PostgreSQL.

## Ce que ça fait

Motisma'Pau a deux buts : montrer à chaque joueur qu'il n'est pas isolé, et faciliter les sorties, sans jamais exposer d'information personnelle.

1. **Accueillir.** Un nouvel arrivant reçoit un rôle « en attente » et poste ses captures de profil. Un modérateur valide d'un clic. Le pseudo et le profil sont mis à jour, puis un message de bienvenue est envoyé.
2. **Organiser.** `/rdv` ouvre un salon temporaire pour une sortie (lieu, heure, durée). Les membres s'inscrivent avec un bouton. Le salon se ferme tout seul.
3. **Compter.** `/map` affiche le nombre de joueurs par secteur de Pau, à partir des rôles que les joueurs se donnent eux-mêmes.
4. **Classer.** Chaque joueur déclare ses stats (niveau, XP, Pokédex…). `/classement-pogo` affiche le classement de la communauté.
5. **Animer.** Niveaux par message, salons vocaux temporaires, jeux, sondages, annonces YouTube.

Si une clé Gemini est configurée, le bot lit aussi les captures de profil pour détecter le nom de dresseur. Sans clé, cette lecture reste désactivée.

## Aperçu

L'image générée par `/map` : un compteur par secteur de Pau.

<img src="docs/assets/readme/carte-bot.png" alt="Carte des secteurs de Pau générée par la commande /map, avec un compteur de joueurs par secteur" width="100%">

*Compteurs de démonstration. Un secteur n'affiche son compteur qu'à partir de 3 joueurs.*

## Architecture

<div align="center">
<img src="docs/assets/architecture.svg" alt="Schéma d'architecture : Discord, bot, PostgreSQL, API Gemini facultative, et le dépôt séparé PoGo-Pau (site et API) relié à la même base" width="900">
</div>

Le bot parle à Discord et lit ou écrit dans PostgreSQL (les tables sont créées au démarrage si elles n'existent pas). Le site et l'API, dans le dépôt PoGo-Pau, utilisent la même base. Cette base est démarrée par ce dépôt-là.

| Dossier | Rôle | Pile |
|---|---|---|
| `src/` | Bot Discord : commandes (`commands/`) et fonctionnalités (`features/`) | Node.js, discord.js 14 |
| `scripts/` | Scripts de développement (aperçu de la carte, essai de `/rdv`) | Node.js |
| `assets/` | Géométrie des secteurs, image d'exemple de profil | GeoJSON, PNG |
| `Dockerfile`, `docker-compose.yml` | Image et service du bot | Docker, Compose |

## Fonctionnalités

| Module | Ce qu'il fait |
|---|---|
| `verification` | Rôle « en attente », lecture des captures, validation par réaction d'un modérateur |
| `visionExtract` | Lit une capture de profil avec l'API Gemini pour détecter le nom de dresseur. Facultatif : sans clé, le module reste inactif |
| `welcome` | Message de bienvenue à la validation |
| `teamRole` | Détecte l'équipe (Sagesse, Bravoure, Intuition) depuis la capture et attribue le rôle |
| `rdv*` | Sorties : salon temporaire, inscriptions, modification, fermeture automatique |
| `classement` | Classement mensuel des stats, rappel par message privé, alerte staff si une capture semble retouchée |
| `leveling` | XP par message (15 à 25, au plus une fois par minute et par membre), niveaux, rôles de récompense |
| `tempVoice` | Salon vocal « rejoindre pour créer », supprimé quand il se vide |
| `languageWatch` | Réponse aux gros mots, avec mise en sourdine de quelques secondes |
| `youtube` | Annonce les nouvelles vidéos d'une chaîne |
| `forumHeart` | Réagit avec ❤️ aux images postées dans un forum |
| `forumKeepAlive` | Désarchive des posts de forum pour que leurs mentions restent lisibles |
| `helpControls`, `moveControls` | Boutons de `/help` et du menu « Déplacer » |

## Commandes

| Commande | Description |
|---|---|
| `/help` | Aide et liste des commandes |
| `/rdv` | Crée un salon temporaire pour une sortie (lieu, heure, durée, description) |
| `/rdv-modifier` | Modifie une sortie déjà ouverte |
| `/set-pogo` | Enregistre ton nom de jeu et ton code ami |
| `/userinfo` | Affiche le profil d'un membre |
| `/niveau` | Affiche ton niveau et ton XP |
| `/classement` | Top 10 des membres par XP |
| `/classement-pogo voir` | Classement Pokémon GO (niveau, XP, Pokédex) |
| `/classement-pogo rejoindre`, `/classement-pogo quitter` | Rejoint ou quitte le classement (rappel mensuel) |
| `/avatar` | Affiche l'avatar d'un membre ou d'un bot |
| `/sondage` | Crée un sondage avec réactions |
| `/quiz`, `/pendu`, `/morpion`, `/devinette` | Jeux : « Qui est ce Pokémon ? », pendu, morpion, plus ou moins |

Commandes réservées au staff :

| Commande | Description |
|---|---|
| `/map` | Joueurs par secteur, en image PNG (permission « Gérer le serveur ») |
| `/clear` | Supprime des messages récents (permission « Gérer les messages ») |
| `/embed` | Publie ou met à jour un embed d'information |
| `/say` | Fait parler le bot dans un salon |
| `/bingo create`, `/bingo update` | Publie ou met à jour l'image d'un bingo |
| `/reset-joueur` | Réinitialise les données d'un joueur |
| `/test`, `/test-log` | Simulent l'arrivée d'un membre et affichent un exemple de log |
| Menu contextuel « Déplacer » | Déplace un message vers un autre salon |

## Confidentialité

- Aucune géolocalisation, aucune adresse, aucune position individuelle.
- L'aire est **déclarative et volontaire** : le joueur choisit lui-même son rôle de secteur.
- La carte n'affiche que des totaux par secteur. Un secteur ne montre son compteur qu'à partir de **3 joueurs** (`MIN_VISIBLE_PLAYERS`), pour qu'aucun joueur isolé ne soit identifiable.
- Si la clé Gemini est configurée, les captures de profil sont envoyées à l'API Gemini pour lecture. Sans clé, rien n'est envoyé.

## Installation

Prérequis : Docker avec Compose, Node.js 18 ou plus, et un bot créé sur le [portail développeur Discord](https://discord.com/developers/applications) avec les intents privilégiés **Server Members** et **Message Content** activés.

**La base de données n'est pas dans ce dépôt.** Le `docker-compose.yml` ne lance que le service `bot`. Il le branche sur un réseau Docker externe nommé `mewnivers` et vise une base joignable à l'adresse `db:5432` (utilisateur `rotom`, base `rotom`). Ce réseau et cette base sont créés par le `docker-compose` du dépôt PoGo-Pau : il faut donc démarrer cette stack d'abord. `POSTGRES_PASSWORD` doit avoir la même valeur dans les deux dépôts.

```bash
git clone <url-du-depot> Motisma
cd Motisma
cp .env.example .env       # puis remplis au minimum DISCORD_TOKEN, CLIENT_ID, GUILD_ID, POSTGRES_PASSWORD
docker compose up -d --build
```

Les commandes slash s'enregistrent une fois, puis à chaque changement de commande :

```bash
npm install
npm run deploy
```

**Sans PoGo-Pau (bot seul).** Il te faut ta propre base PostgreSQL. Deux options, déduites du compose et de `.env.example` (non vérifié : ces commandes n'ont pas été exécutées) :

- Hors Docker : définis `DATABASE_URL` dans `.env` vers ta base, puis lance `npm start`. Les tables sont créées au démarrage.
- Avec Compose : crée le réseau (`docker network create mewnivers`) et démarre un conteneur PostgreSQL nommé `db` sur ce réseau, avec l'utilisateur `rotom`, la base `rotom` et le mot de passe de `POSTGRES_PASSWORD`. Puis lance `docker compose up -d --build`.

Sans `DATABASE_URL`, le bot démarre mais les profils Pokémon GO sont désactivés.

## Configuration

Toute la configuration passe par le fichier `.env` (modèle : `.env.example`). Ne le commite jamais.

**Discord et base de données**

| Variable | Rôle |
|---|---|
| `DISCORD_TOKEN` | Jeton du bot |
| `CLIENT_ID` | ID de l'application, nécessaire à l'enregistrement des commandes |
| `GUILD_ID` | ID du serveur Discord |
| `POSTGRES_PASSWORD` | Mot de passe de la base PostgreSQL démarrée par PoGo-Pau, identique des deux côtés |
| `DATABASE_URL` | Chaîne de connexion. Injectée par Compose ; à définir seulement hors Docker |

**Rôles et salons**

| Variable | Rôle |
|---|---|
| `VERIFICATION_ROLE_ID` | Rôle « en attente » donné aux arrivants |
| `MEMBER_ROLE_ID` | Rôle membre donné à la validation |
| `VERIFICATION_CHANNEL_ID` | Limite la vérification à un seul salon |
| `TEMP_VOICE_HUB_ID` | Salon vocal « rejoindre pour créer » |
| `TEMP_VOICE_CATEGORY_ID` | Catégorie des salons vocaux temporaires |
| `RDV_CATEGORY_ID` | Catégorie des salons de sortie `/rdv` |
| `RDV_ANNOUNCE_CHANNEL_ID` | Salon où `/rdv` annonce les sorties |
| `WELCOME_CHANNEL_ID` | Salon du message de bienvenue |
| `LOG_CHANNEL_ID` | Salon de logs du staff |
| `AMBASSADOR_ROLE_ID` | Rôle listé comme ambassadeur dans l'embed de présentation |
| `TEAM_ROLE_MYSTIC`, `TEAM_ROLE_VALOR`, `TEAM_ROLE_INSTINCT` | Rôles des trois équipes, attribués automatiquement |

**Fonctionnalités facultatives**

| Variable | Rôle |
|---|---|
| `GEMINI_API_KEY` | Clé Gemini pour lire les captures de profil. Vide : désactivé |
| `VISION_MODEL` | Modèle de vision (par défaut `gemini-2.5-flash`) |
| `LEVELUP_CHANNEL_ID` | Salon des annonces de niveau |
| `LEVEL_ROLES` | Rôles de récompense par niveau, au format `10:idRole,20:idRole` |
| `FORUM_HEART_CHANNEL_ID` | Forum où le bot réagit avec ❤️ |
| `FORUM_KEEPALIVE_IDS` | Posts de forum à désarchiver régulièrement |
| `CLASSEMENT_ROLE_ID` | Rôle synchronisé avec la participation au classement |
| `CLASSEMENT_REMINDER_DAY`, `CLASSEMENT_REMINDER_HOUR` | Jour (1 à 28) et heure du rappel mensuel |
| `CLASSEMENT_ADMIN_CHANNEL_ID` | Salon staff alerté si une capture semble retouchée |
| `LANGUAGE_TIMEOUT_MILD`, `LANGUAGE_TIMEOUT_STRONG` | Durée de mise en sourdine (secondes, 0 pour désactiver) |
| `PRESENCE_TEXT`, `PRESENCE_EMOJI`, `PRESENCE_GAME`, `PRESENCE_GAME_TYPE`, `PRESENCE_STATUS` | Statut et activité affichés par le bot |

## Développement

```bash
# Nécessite une base PostgreSQL et DATABASE_URL dans .env
npm install
npm start
```

Les secteurs de `/map` sont définis dans `src/config/sectors.js` (un rôle Discord par secteur) ; la géométrie est dans `assets/sectors.geojson`.

`package.json` ne définit ni tests ni lint. Voir aussi [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licence

Publié sous licence [MIT](LICENSE).

---

Projet communautaire, sans lien avec Niantic ni The Pokémon Company. Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK inc.
