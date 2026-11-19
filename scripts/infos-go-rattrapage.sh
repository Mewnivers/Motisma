#!/usr/bin/env bash
# Rattrapage infos-go depuis le VPS, sans jamais lire le token : copie le script
# et le code du rangement dans le conteneur du bot, l'y lance (token, clé Claude
# et base déjà dans son environnement), puis efface la copie.
# Une seule exécution à la fois (verrou sur le VPS).
# Usage : scripts/infos-go-rattrapage.sh <salon source (id ou nom)> <guilde:source:forum>
#         [--limit 50] [--dry-run] [--depuis <messageId>]
# Conteneur : MOTISMA_BOT (défaut motisma-bot-1).
set -euo pipefail

bot="${MOTISMA_BOT:-motisma-bot-1}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
# Sous /app pour que node y trouve /app/node_modules.
dir="/app/scripts/rattrapage-$$"

exec 9>/tmp/infos-go-rattrapage.lock
flock -n 9 || { echo 'rattrapage : déjà en cours.' >&2; exit 1; }

docker exec "$bot" mkdir -p "$dir/scripts" "$dir/src/features"
trap 'docker exec "$bot" rm -rf "$dir"' EXIT

docker cp -q "$repo/scripts/infos-go-rattrapage.mjs" "$bot:$dir/scripts/"
docker cp -q "$repo/src/features/infosGo.js" "$bot:$dir/src/features/"
docker cp -q "$repo/src/db.js" "$bot:$dir/src/"
docker cp -q "$repo/src/config.js" "$bot:$dir/src/"

docker exec "$bot" node "$dir/scripts/infos-go-rattrapage.mjs" "$@"
