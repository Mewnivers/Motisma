#!/usr/bin/env bash
# Textes d'accueil des posts de logs mis à jour, depuis le VPS, sans jamais lire
# le token : copie le script et le code des logs dans le conteneur du bot,
# l'y lance (token déjà dans son environnement), puis efface la copie.
# Usage : scripts/logs-textes-accueil.sh <id du forum> [--dry-run]
# Conteneur : MOTISMA_BOT (défaut motisma-bot-1).
set -euo pipefail

bot="${MOTISMA_BOT:-motisma-bot-1}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
# Sous /app pour que node y trouve /app/node_modules.
dir="/app/scripts/logs-textes-accueil-$$"

docker exec "$bot" mkdir -p "$dir/scripts" "$dir/src/features"
trap 'docker exec "$bot" rm -r "$dir"' EXIT

docker cp -q "$repo/scripts/logs-textes-accueil.mjs" "$bot:$dir/scripts/"
docker cp -q "$repo/src/features/serverLogs.js" "$bot:$dir/src/features/"
docker cp -q "$repo/src/db.js" "$bot:$dir/src/"
docker cp -q "$repo/src/config.js" "$bot:$dir/src/"

docker exec "$bot" node "$dir/scripts/logs-textes-accueil.mjs" "$@"
