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
| `src/services/` | Cartes des secteurs et rendu d'image |
| `src/config/` | Données de configuration statiques (secteurs) |
| `assets/` | Géométrie des secteurs et images utilisées par le bot |
| `scripts/` | Scripts utilitaires de développement |
| `docs/` | Documentation ([base de données](docs/base-de-donnees.md), [embeds](docs/embeds.md)) |

## Confidentialité

Le projet renforce les liens locaux sans jamais exposer d'informations personnelles :

- aucune donnée de position, aucune adresse : uniquement des données déclaratives et agrégées ;
- le compteur d'un secteur n'est affiché qu'à partir de 3 joueurs (`MIN_VISIBLE_PLAYERS` dans `src/config/sectors.js`).

Toute contribution doit respecter ce principe.

## Branches et commits

- Créer une branche dédiée depuis `main` : `feat/…`, `fix/…`, `docs/…` ou `chore/…`.
- Ne jamais pousser directement sur `main`.
- Messages de commit en français, à l'impératif, courts : « Ajouter la commande /pendu », « Corriger le décompte des secteurs ».
- Un commit = un changement logique.

## Checklist de PR

- [ ] La PR part d'une branche dédiée et décrit le changement et son intérêt.
- [ ] Le bot démarre et le changement a été testé (précisez comment).
- [ ] `npm run deploy` a été relancé si une commande slash a changé.
- [ ] Aucun secret ni `.env` dans les commits.
- [ ] Aucune donnée de position ni information personnelle ajoutée ou exposée.
- [ ] La documentation est à jour si le comportement change.
