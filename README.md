<img src="docs/assets/motisma.png" alt="" width="96" align="right">

# Motisma

Motisma est le bot Discord de la communauté Pokémon GO de Pau.

[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)
[![Node.js 22](https://img.shields.io/badge/node-22-brightgreen)](.nvmrc)

[English version](README.en.md)

Quand quelqu'un arrive sur le serveur, il reçoit un rôle « en attente » et poste une capture de son profil Pokémon GO. Un modérateur valide d'une réaction, le bot renomme le membre et lui souhaite la bienvenue. Pour une sortie, `/rdv` ouvre un salon privé où l'on s'inscrit avec un bouton ; le salon disparaît le lendemain à minuit, heure de Paris. Chaque message rapporte un peu d'XP, et il y a un classement Pokémon GO mis à jour par capture d'écran. Le reste, ce sont des petits jeux, des sondages et l'annonce des nouvelles vidéos d'une chaîne YouTube.

Le bot ne demande jamais de position. Des captures, il n'enregistre en base que les stats lues, jamais l'image. La lecture passe par l'API Gemini, et seulement si une clé est configurée.

## Aperçu

Aperçus reconstitués avec les vrais messages du bot et des données fictives, ce ne sont pas des captures de Discord.

<img src="docs/assets/readme/rdv.webp" alt="Annonce d'une sortie au Parc Beaumont de 15h00 à 15h45, avec le bouton Je participe" width="720">

L'annonce publiée par `/rdv` dans le salon des sorties.

<img src="docs/assets/readme/classement.webp" alt="Réponse à /classement : les dix membres qui ont le plus d'XP, avec leur niveau" width="720">

`/classement` : le top 10 des membres par XP.

<img src="docs/assets/readme/niveau.webp" alt="Réponse à /niveau, visible seulement par son auteur : niveau 6 et barre de progression vers le niveau 7" width="720">

`/niveau` : la réponse n'est visible que par celui qui l'a demandée.

## Commandes

| Commande | Ce qu'elle fait | Qui |
|---|---|---|
| `/rdv` | Crée un salon temporaire pour une sortie (45 minutes par défaut) | Tout le monde |
| `/rdv-modifier` | Change le lieu, l'heure, la durée ou la description d'une sortie ouverte | L'organisateur, ou « Gérer les salons » |
| `/set-pogo` | Enregistre ton nom de dresseur et ton code ami | Tout le monde |
| `/classement-pogo` | `voir` le classement (niveau, XP, Pokémon capturés, distance, PokéStops, œufs), le `rejoindre` ou le `quitter` | Tout le monde |
| `/niveau`, `/classement` | Ton niveau et ton XP ; le top 10 du serveur | Tout le monde |
| `/quiz`, `/pendu`, `/morpion`, `/devinette` | Qui est ce Pokémon, pendu, morpion, plus ou moins | Tout le monde |
| `/sondage` | Sondage à réactions, jusqu'à 10 choix (Oui / Non s'il n'y en a pas) | Tout le monde |
| `/help`, `/userinfo`, `/avatar` | Aide, profil d'un membre, avatar | Tout le monde |
| `/clear` | Supprime de 1 à 100 messages récents | « Gérer les messages » |
| Menu « Déplacer » sur un message | Déplace un message vers un autre salon ou un post de forum | « Gérer les messages » |
| `/embed`, `/say`, `/bingo` | Publie un embed d'information, fait parler le bot, publie l'image d'un bingo | « Gérer le serveur » |
| `/reset-joueur` | Efface tout ou partie des données d'un joueur | « Gérer le serveur » |
| `/test`, `/test-log` | Simulent une arrivée et affichent un exemple de log | « Gérer le serveur » |

## Installation

1. Il faut Node.js 22, une base PostgreSQL et un bot créé sur le [portail développeur Discord](https://discord.com/developers/applications), avec l'intent privilégié **Server Members**. Si tu mets une clé Gemini, active aussi **Message Content**.
2. Copie `.env.example` en `.env` et remplis-le (voir plus bas).
3. `npm install`
4. `npm run deploy` enregistre les commandes slash sur le serveur. À relancer quand une commande change.
5. `npm start`

Avec Docker, remplace la dernière étape par `docker compose up -d --build`. Le `docker-compose.yml` ne lance que le bot : il le branche sur un réseau Docker externe `mewnivers` et attend une base PostgreSQL nommée `db` sur ce réseau (utilisateur et base `rotom`, mot de passe `POSTGRES_PASSWORD`).

## Configuration

Tout passe par `.env`, qui ne doit jamais être commité. Pour démarrer, quatre valeurs comptent :

| Variable | Rôle |
|---|---|
| `DISCORD_TOKEN` | Jeton du bot |
| `CLIENT_ID` | ID de l'application, utilisé par `npm run deploy` |
| `GUILD_ID` | ID du serveur |
| `DATABASE_URL` | Connexion PostgreSQL hors Docker. Avec Compose, elle est construite à partir de `POSTGRES_PASSWORD` |

Sans `DATABASE_URL`, le bot démarre quand même, mais sans profils Pokémon GO. Les rôles, les salons et les options (Gemini, YouTube, niveaux, statut) sont tous décrits dans [`.env.example`](.env.example), qui fait référence.

## Développement et licence

```bash
npm run check   # syntaxe de src/ et scripts/
npm test
```

Les deux tournent aussi en CI sur chaque pull request. Pour contribuer, lis [CONTRIBUTING.md](CONTRIBUTING.md) ; pour signaler une faille, [SECURITY.md](SECURITY.md). La doc technique (base de données, embeds) est dans [docs/](docs/README.md).

Licence [MIT](LICENSE). Projet de fans, sans lien avec Niantic ni The Pokémon Company.
