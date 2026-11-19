#!/usr/bin/env bash
# Archives des programmes infos-go, depuis le VPS, sans jamais lire
# le token : copie le script et le code d'infos-go dans le conteneur du bot,
# l'y lance (token déjà dans son environnement), puis efface la copie.
# Usage : scripts/infos-go-archives.sh <id du forum> [--dry-run] [--supprimer-test]
# Conteneur : MOTISMA_BOT (défaut motisma-bot-1).
set -euo pipefail

bot="${MOTISMA_BOT:-motisma-bot-1}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
# Sous /app pour que node y trouve /app/node_modules.
dir="/app/scripts/infos-go-archives-$$"

docker exec "$bot" mkdir -p "$dir/scripts" "$dir/src/features"
trap 'docker exec "$bot" rm -r "$dir"' EXIT

docker cp -q "$repo/scripts/infos-go-archives.mjs" "$bot:$dir/scripts/"
docker cp -q "$repo/src/features/infosGo.js" "$bot:$dir/src/features/"
# Accès à bot_kv (id du post d'archives), DATABASE_URL déjà dans l'environnement.
docker cp -q "$repo/src/db.js" "$bot:$dir/src/"
docker cp -q "$repo/src/config.js" "$bot:$dir/src/"

docker exec "$bot" node "$dir/scripts/infos-go-archives.mjs" "$@"
