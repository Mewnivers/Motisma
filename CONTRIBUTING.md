# Contribuer à Motisma

Merci de votre intérêt. Les contributions sont bienvenues : code, documentation ou retours d'usage.

## Prérequis

- Node.js 18 ou plus récent
- npm
- PostgreSQL (optionnel : sans `DATABASE_URL`, les fonctions qui dépendent de la base sont désactivées)
- Un bot Discord créé sur le [portail développeur](https://discord.com/developers/applications)

## Installation

```bash
git clone https://github.com/Mewnivers/Motisma.git
cd Motisma
npm install
```

## Configuration

1. Copier `.env.example` vers `.env`.
2. Renseigner les valeurs (au minimum `DISCORD_TOKEN`, `CLIENT_ID` et `GUILD_ID`).
3. Ne jamais commiter `.env`. Il est ignoré par git. Si un secret est exposé par erreur, le régénérer aussitôt depuis le portail développeur.

## Commandes

| Commande | Effet |
|---|---|
| `npm start` | Lance le bot |
| `npm run deploy` | Enregistre les commandes slash sur le serveur |
| `node --test src/embeds/renderInfoEmbed.test.js` | Lance le test existant |

Relancer `npm run deploy` quand le nom, la description ou les options d'une commande changent.

## Structure du dépôt

| Dossier | Contenu |
|---|---|
| `src/commands/` | Commandes slash (`administration/` pour celles réservées au staff) |
| `src/features/` | Comportements du bot : accueil, niveaux, vérification, classement, vocaux temporaires… |
| `src/embeds/` | Constructeurs d'embeds |
| `assets/` | Images utilisées par le bot |
| `scripts/` | Scripts utilitaires de développement |
| `docs/` | Documentation ([base de données](docs/base-de-donnees.md), [embeds](docs/embeds.md)) |

## Confidentialité

Le projet n'expose jamais d'informations personnelles :

- Aucune géolocalisation, aucune adresse, aucune position : le bot ne demande ni ne stocke de position.
- Par membre, la base PostgreSQL contient l'identifiant Discord, le nom de dresseur et le code ami (si renseignés avec `/set-pogo`), les stats lues sur les captures (niveau, XP, Pokémon capturés, distance, PokéStops, œufs éclos, équipe), la participation au classement et l'XP gagnée en discutant. Détail dans [docs/base-de-donnees.md](docs/base-de-donnees.md).
- Les captures de profil ne sont pas conservées dans la base : seules les stats lues le sont. Lors de la vérification d'un nouvel arrivant, la capture est republiée dans le salon de logs du staff, s'il est configuré.
- Une sortie `/rdv` garde son organisateur et ses inscrits tant qu'elle est ouverte ; la ligne est supprimée à la fermeture.
- `/reset-joueur` permet au staff d'effacer tout ou partie des données d'un joueur.
- Si la clé Gemini est configurée, les captures de profil sont envoyées à l'API Gemini pour lecture. Sans clé, rien n'est envoyé.

Toute contribution doit respecter ce principe.

## Branches et commits

- Créer une branche dédiée depuis `main` : `feat/…`, `fix/…`, `docs/…` ou `chore/…`.
- Ne jamais pousser directement sur `main`.
- Messages de commit en français, à l'impératif, courts : « Ajouter la commande /pendu », « Corriger le calcul du niveau ».
- Un commit = un changement logique.

## Checklist de PR

- [ ] La PR part d'une branche dédiée et décrit le changement et son intérêt.
- [ ] Le bot démarre et le changement a été testé (précisez comment).
- [ ] `npm run deploy` a été relancé si une commande slash a changé.
- [ ] Aucun secret ni `.env` dans les commits.
- [ ] Aucune donnée de position ni information personnelle ajoutée ou exposée.
- [ ] La documentation est à jour si le comportement change.
