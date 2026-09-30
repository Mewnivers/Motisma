# Handoff — déploiement site sur nouvelle VPS + nettoyage historique

Session du 2026-09-30. Branche `feat/embeds-dashboard`.

## Ce qui a été fait

1. **Conseil hébergement OVH** (client Pogo Pau) : VPS obligatoire (pas
   d'hébergement mutualisé — la stack est Node + PostgreSQL + Docker).
   Reco : 2 vCPU / 4 Go / ~80 Go, plusieurs sites via un seul VPS + nginx.

2. **Historique git nettoyé** (via `git filter-branch`) :
   - 80 commits : co-auteur d'assistant IA → `Co-Authored-By: ZelPhy - ZelPhyris <zelphydoragon@gmail.com>`
   - Lignes de session d'assistant supprimées ; dossier `docs/superpowers/` retiré de tout l'historique.
   - Vérifié : plus aucune trace d'assistant IA sur `origin/main` (messages et contenu des fichiers).

3. **Script d'installation site-seul** (web + API + DB, sans le bot) :
   - `deploy/install.sh` — un seul exécutable : prérequis, `.env`, docker `db`+`api`,
     build/publish front, vhost nginx, HTTPS certbot. Idempotent.
   - `deploy/INSTALL.md` — guide (méthode rapide en tête).
   - `deploy/publish-web.sh` — accepte `WEBROOT` pour cibler un autre serveur.

## État git

`feat/embeds-dashboard` = `main` = `origin/main` = **d479834** (tout aligné, poussé).
`main` a été **fusionnée + force-push** (l'historique distant a été réécrit).

⚠️ **Toute copie clonée avant aujourd'hui** (dont la VPS de prod actuelle) a
l'ancien historique. Ne pas `git pull` là-bas → faire :
`git fetch origin && git reset --hard origin/main`.

## Travail EN COURS non commité (ne pas committer à l'aveugle)

Modifs présentes dans l'arbre de travail, **hors périmètre de cette session**,
laissées telles quelles :
`CONTRIBUTING.md`, `app/README.md`, `app/app.js`, `app/auth.js`, `app/index.html`,
`app/layout.js`, `deploy/README.md`, `package.json`, `package-lock.json`,
`src/embeds/reglement.js`, `src/services/mapRenderer.js`, `web/src/styles.css`.
Untracked : `.playwright-mcp/`, `cmd-2col.png` (jetables).

Voir aussi les autres chantiers ouverts : `HANDOFF-embed-ressources.md`,
`HANDOFF-unified-db.md`.

## Contraintes

- `.env` gitignored (secrets réels) — jamais committer. Historique vérifié : aucun `.env` réel n'y a jamais été.
- Sauvegarde de l'ancien historique : bundle dans le scratchpad de session (éphémère). Si besoin durable, à recopier ailleurs.
