<div align="center">

<img src="docs/assets/motisma.png" alt="Photo de profil de Motisma" width="120" height="120">

# Motisma'Pau

**Le bot Discord de la communauté Pokémon GO de Pau.**

[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![discord.js](https://img.shields.io/badge/discord.js-14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

<img src="docs/assets/readme/apercu-rdv.webp" alt="Annonce d’une sortie avec la commande /rdv, aperçu reconstitué" width="100%">

<sub>Annonce d'une sortie avec /rdv (aperçu reconstitué, données fictives).</sub>

[English version](README.en.md)

</div>

---

## Ce que ça fait

Motisma'Pau a deux buts : montrer à chaque joueur qu'il n'est pas isolé, et faciliter les sorties, sans jamais exposer d'information personnelle.

1. **Accueillir.** Un nouvel arrivant reçoit un rôle « en attente » et poste ses captures de profil. Un modérateur valide d'un clic (réaction ✅). Le profil est mis à jour, puis un message de bienvenue est envoyé.
2. **Organiser.** `/rdv` ouvre un salon temporaire pour une sortie (lieu, heure, durée). Les membres s'inscrivent avec un bouton. Le salon est supprimé automatiquement à minuit (heure de Paris) le lendemain du début de la sortie.
3. **Classer.** Les joueurs envoient une capture de profil au bot en message privé pour mettre à jour leurs stats. `/classement-pogo` affiche le classement de la communauté.
4. **Animer.** Niveaux par message, salons vocaux temporaires, jeux, sondages, annonces YouTube.

La lecture des captures de profil passe par l'API Gemini et demande une clé. Sans clé, elle reste désactivée.

## Aperçu

Aperçus reconstitués à partir des vrais messages du bot, avec des données fictives ; ce ne sont pas des captures de Discord.

<table>
<tr><td width="50%" valign="top"><b>/rdv — annoncer une sortie</b><br><img src="docs/assets/readme/apercu-rdv.webp" alt="Annonce de sortie du bot avec le bouton Je participe" width="100%"></td><td width="50%" valign="top"><b>/sondage — créer un sondage</b><br><img src="docs/assets/readme/apercu-sondage.webp" alt="Sondage avec trois choix et réactions numérotées" width="100%"></td></tr>
<tr><td width="50%" valign="top"><b>/niveau — niveau et XP</b><br><img src="docs/assets/readme/apercu-niveau.webp" alt="Embed de niveau avec barre de progression" width="100%"></td><td width="50%" valign="top"><b>/classement — top 10 par XP</b><br><img src="docs/assets/readme/apercu-classement.webp" alt="Top 10 des membres par XP" width="100%"></td></tr>
<tr><td width="50%" valign="top"><b>/classement-pogo voir — classement Pokémon GO</b><br><img src="docs/assets/readme/apercu-pogo.webp" alt="Classement Pokémon GO avec boutons de catégorie" width="100%"></td><td width="50%" valign="top"><b>/help — aide et menu des commandes</b><br><img src="docs/assets/readme/apercu-help.webp" alt="Aide du bot avec le menu de choix d’une commande" width="100%"></td></tr>
<tr><td width="50%" valign="top"><b>/pendu — le jeu du pendu</b><br><img src="docs/assets/readme/apercu-pendu.webp" alt="Partie de pendu en cours" width="100%"></td><td width="50%" valign="top"><b>Message de bienvenue</b><br><img src="docs/assets/readme/apercu-bienvenue.webp" alt="Message de bienvenue après validation d’un nouveau membre" width="100%"></td></tr>
</table>

## Architecture

<div align="center">
<img src="docs/assets/architecture.svg" alt="Schéma d'architecture : Discord, bot, PostgreSQL, et l'API Gemini en option" width="900">
</div>

Le bot dialogue avec Discord et lit ou écrit dans PostgreSQL. Les tables sont créées au démarrage si elles n'existent pas.

| Dossier | Rôle | Pile |
|---|---|---|
| `src/` | Bot Discord : commandes (`commands/`) et fonctionnalités (`features/`) | Node.js, discord.js 14 |
| `scripts/` | Scripts de développement : enregistrement de `/rdv` et `/rdv-modifier` seuls sur un serveur de test | Node.js |
| `assets/` | Image d'exemple de profil | PNG |
| `Dockerfile`, `docker-compose.yml` | Image et service du bot | Docker, Compose |

## Fonctionnalités

| Module | Ce qu'il fait |
|---|---|
| `verification` | Rôle « en attente », lecture des captures, validation par réaction ✅ d'un modérateur |
| `visionExtract` | Lit une capture de profil avec l'API Gemini pour détecter le nom de dresseur. Facultatif : sans clé, le module reste inactif |
| `welcome` | Message de bienvenue tiré au hasard à la validation |
| `teamRole` | Détecte l'équipe (Sagesse, Bravoure, Intuition) depuis la capture et attribue le rôle |
| `rdv*` | Sorties : salon temporaire, inscriptions, modification, suppression automatique |
| `classement` | Classement mensuel des stats, rappel par message privé, alerte staff si une capture semble retouchée ou si les stats régressent |
| `leveling` | XP par message (15 à 25, au plus une fois par minute et par membre), niveaux, rôles de récompense |
| `tempVoice` | Salon vocal « rejoindre pour créer », supprimé dès qu'il se vide |
| `languageWatch` | Réponse aux gros mots, avec mise en sourdine de quelques secondes |
| `youtube` | Annonce les nouvelles vidéos d'une chaîne (flux public, sans clé d'API, vérification toutes les 10 minutes) |
| `forumHeart` | Réagit avec ❤️ aux images postées dans un forum ou un post de forum |
| `forumKeepAlive` | Désarchive des posts de forum pour que leurs mentions restent lisibles |
| `helpControls`, `moveControls` | Menu de `/help` et sélection de la destination du menu « Déplacer » |

## Commandes

| Commande | Description |
|---|---|
| `/help` | Affiche l'aide et la liste des commandes |
| `/rdv` | Crée un salon temporaire pour une sortie (lieu, heure, description, durée de 45 minutes par défaut) |
| `/rdv-modifier` | Modifie une sortie `/rdv` déjà ouverte (son organisateur, ou un membre avec la permission « Gérer les salons ») |
| `/set-pogo` | Enregistre ton nom de jeu et ton code ami (12 chiffres) |
| `/userinfo` | Affiche le profil d'un membre |
| `/niveau` | Affiche ton niveau et ton XP |
| `/classement` | Top 10 des membres par XP |
| `/classement-pogo voir` | Classement Pokémon GO, au choix : niveau, XP totale, Pokémon capturés, distance, PokéStops, œufs éclos |
| `/classement-pogo rejoindre`, `/classement-pogo quitter` | Rejoint ou quitte le classement (rappel mensuel) |
| `/avatar` | Affiche l'avatar d'un membre ou d'un bot |
| `/sondage` | Crée un sondage avec réactions (jusqu'à 10 choix, Oui / Non sans choix) |
| `/quiz`, `/pendu`, `/morpion`, `/devinette` | Jeux : « Qui est ce Pokémon ? », pendu, morpion, plus ou moins |

Commandes réservées au staff :

| Commande | Permission | Description |
|---|---|---|
| `/clear` | Gérer les messages | Supprime des messages récents (1 à 100) |
| `/embed` | Gérer le serveur | Publie ou met à jour un embed d'information |
| `/say` | Gérer le serveur | Fait parler le bot dans un salon |
| `/bingo create`, `/bingo update` | Gérer le serveur | Publie ou met à jour l'image d'un bingo |
| `/reset-joueur` | Gérer le serveur | Réinitialise tout ou partie des données d'un joueur |
| `/test`, `/test-log` | Gérer le serveur | Simulent l'arrivée d'un membre et affichent un exemple de log de vérification |
| Menu contextuel « Déplacer » | Gérer les messages | Déplace un message vers un autre salon ou un post de forum |

## Confidentialité

- Aucune géolocalisation, aucune adresse, aucune position : le bot ne demande ni ne stocke de position.
- Par membre, la base PostgreSQL contient l'identifiant Discord, le nom de dresseur et le code ami (si renseignés avec `/set-pogo`), les stats lues sur les captures (niveau, XP, Pokémon capturés, distance, PokéStops, œufs éclos, équipe), la participation au classement et l'XP gagnée en discutant. Détail dans [docs/base-de-donnees.md](docs/base-de-donnees.md).
- Les captures de profil ne sont pas conservées dans la base : seules les stats lues le sont. Lors de la vérification d'un nouvel arrivant, la capture est republiée dans le salon de logs du staff, s'il est configuré.
- Une sortie `/rdv` garde son organisateur et ses inscrits tant qu'elle est ouverte ; la ligne est supprimée à la fermeture.
- `/reset-joueur` permet au staff d'effacer tout ou partie des données d'un joueur.
- Si la clé Gemini est configurée, les captures de profil sont envoyées à l'API Gemini pour lecture. Sans clé, rien n'est envoyé.

## Installation

Prérequis : Docker avec Compose, Node.js 18 ou plus, et un bot créé sur le [portail développeur Discord](https://discord.com/developers/applications) avec l'intent privilégié **Server Members** activé. Si tu configures `GEMINI_API_KEY`, active aussi **Message Content** : le bot le déclare dans ce cas seulement.

**La base de données.** Le `docker-compose.yml` ne lance que le service `bot`. Il le branche sur un réseau Docker externe nommé `mewnivers` et construit `DATABASE_URL` vers `db:5432` (utilisateur `rotom`, base `rotom`, mot de passe `POSTGRES_PASSWORD`). Il faut donc une base PostgreSQL nommée `db` sur ce réseau avant de lancer le bot. Pour faire tourner le bot seul, tu peux la démarrer toi-même (non vérifié : ces commandes n'ont pas été exécutées) :

```bash
docker network create mewnivers
docker run -d --name db --network mewnivers --restart unless-stopped \
  -e POSTGRES_USER=rotom -e POSTGRES_PASSWORD=<ton-mot-de-passe> -e POSTGRES_DB=rotom \
  -v motisma-db:/var/lib/postgresql/data postgres:16
```

Utilise le même mot de passe dans `POSTGRES_PASSWORD` du `.env`.

Ensuite, installe et lance le bot :

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

**Hors Docker.** Définis `DATABASE_URL` dans `.env` vers ta propre base PostgreSQL, puis lance `npm start`. Sans `DATABASE_URL`, le bot démarre mais les profils Pokémon GO sont désactivés.

## Configuration

Toute la configuration passe par le fichier `.env` (modèle : `.env.example`). Ne le commite jamais.

**Discord et base de données**

| Variable | Rôle |
|---|---|
| `DISCORD_TOKEN` | Jeton du bot |
| `CLIENT_ID` | ID de l'application, nécessaire à l'enregistrement des commandes |
| `GUILD_ID` | ID du serveur Discord |
| `POSTGRES_PASSWORD` | Mot de passe de la base PostgreSQL, utilisé par Compose pour construire `DATABASE_URL` |
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
| `LOG_CHANNEL_ID` | Salon de logs du staff (vide : aucun log) |
| `AMBASSADOR_ROLE_ID` | Rôle listé comme ambassadeur dans l'embed de présentation |
| `TEAM_ROLE_MYSTIC`, `TEAM_ROLE_VALOR`, `TEAM_ROLE_INSTINCT` | Rôles des trois équipes, attribués automatiquement |

**Fonctionnalités facultatives**

| Variable | Rôle |
|---|---|
| `GEMINI_API_KEY` | Clé Gemini pour lire les captures de profil. Vide : désactivé |
| `VISION_MODEL` | Modèle de vision (par défaut `gemini-2.5-flash`) |
| `LEVELUP_CHANNEL_ID` | Salon des annonces de niveau (sinon le salon du message) |
| `LEVEL_ROLES` | Rôles de récompense par niveau, au format `10:idRole,20:idRole` |
| `FORUM_HEART_CHANNEL_ID` | Forum ou post de forum où le bot réagit avec ❤️ |
| `FORUM_KEEPALIVE_IDS` | Posts de forum à désarchiver régulièrement |
| `CLASSEMENT_ROLE_ID` | Rôle synchronisé avec la participation au classement |
| `CLASSEMENT_REMINDER_DAY`, `CLASSEMENT_REMINDER_HOUR` | Jour (1 à 28, défaut 1) et heure (0 à 23, défaut 10) du rappel mensuel |
| `CLASSEMENT_ADMIN_CHANNEL_ID` | Salon staff alerté si une capture semble retouchée ou si les stats régressent |
| `LANGUAGE_TIMEOUT_MILD`, `LANGUAGE_TIMEOUT_STRONG` | Durée de mise en sourdine en secondes (défaut 10 et 30, 0 pour désactiver) |
| `PRESENCE_TEXT`, `PRESENCE_EMOJI`, `PRESENCE_GAME`, `PRESENCE_GAME_TYPE`, `PRESENCE_STATUS` | Statut et activité affichés par le bot |

## Développement

```bash
# Nécessite une base PostgreSQL et DATABASE_URL dans .env
npm install
npm start
```

`package.json` ne définit ni tests ni lint.

## Licence

Publié sous licence [MIT](LICENSE).

---

Projet communautaire, sans lien avec Niantic ni The Pokémon Company. Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK inc.
