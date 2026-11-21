#!/usr/bin/env bash
# Lien Source retiré des messages infos-go déjà postés, depuis le VPS, sans jamais lire
# le token : copie le script et le code d'infos-go dans le conteneur du bot,
# l'y lance (token déjà dans son environnement), puis efface la copie.
# Usage : scripts/infos-go-sans-source.sh <id du forum> [--dry-run]
# Conteneur : MOTISMA_BOT (défaut motisma-bot-1).
set -euo pipefail

bot="${MOTISMA_BOT:-motisma-bot-1}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
# Sous /app pour que node y trouve /app/node_modules.
dir="/app/scripts/infos-go-sans-source-$$"

docker exec "$bot" mkdir -p "$dir/scripts" "$dir/src/features"
trap 'docker exec "$bot" rm -r "$dir"' EXIT

docker cp -q "$repo/scripts/infos-go-sans-source.mjs" "$bot:$dir/scripts/"
docker cp -q "$repo/src/features/infosGo.js" "$bot:$dir/src/features/"

docker exec "$bot" node "$dir/scripts/infos-go-sans-source.mjs" "$@"
