# Contribuer à Motisma

Merci de votre intérêt. Les contributions sont bienvenues : code, documentation ou retours d'usage.

En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md).

## Environnement de développement

Prérequis : Node.js 22 (version dans `.nvmrc`), npm, et un bot Discord de test. La base PostgreSQL et la configuration sont décrites dans le [README](README.md#installation).

```bash
git clone https://github.com/Mewnivers/Motisma.git
cd Motisma
npm ci
```

Copier `.env.example` vers `.env`, puis renseigner au minimum `DISCORD_TOKEN`, `CLIENT_ID` et `GUILD_ID`. Chaque variable est décrite dans `.env.example`. Ne jamais commiter `.env` ; un secret exposé par erreur doit être régénéré aussitôt.

## Commandes

| Commande | Effet |
|---|---|
| `npm start` | Lance le bot |
| `npm run deploy` | Enregistre les commandes slash sur le serveur |
| `npm run check` | Vérifie la syntaxe de `src/` et `scripts/` |
| `npm test` | Lance les tests (`src/**/*.test.js`) |

Relancer `npm run deploy` quand le nom, la description ou les options d'une commande changent. `npm run check` et `npm test` tournent aussi dans l'intégration continue à chaque PR.

L'organisation du code est décrite dans la section [Architecture du README](README.md#-architecture), et la documentation technique dans [docs/](docs/README.md).

## Confidentialité

Le projet n'expose jamais d'information personnelle. Les règles et les données conservées sont listées dans la section [Confidentialité du README](README.md#-confidentialité) et dans [docs/base-de-donnees.md](docs/base-de-donnees.md). Toute contribution doit les respecter.

## Branches et commits

- Créer une branche dédiée depuis `main` : `feat/…`, `fix/…`, `docs/…` ou `chore/…`.
- Ne jamais pousser directement sur `main`.
- Messages de commit en français, à l'impératif, courts : « Ajouter la commande /pendu », « Corriger le calcul du niveau ».
- Un commit = un changement logique.

## Pull requests

La checklist à remplir est dans le [modèle de PR](.github/PULL_REQUEST_TEMPLATE.md), proposé automatiquement à l'ouverture d'une PR.
