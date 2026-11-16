#!/usr/bin/env bash
# Envoie un MP à Marine par Motisma, depuis le VPS, sans jamais lire le token :
# copie le script et les fichiers dans le conteneur du bot, l'y lance (le token
# est déjà dans son environnement), puis efface la copie.
# Usage : scripts/mp-marine.sh "<message>" [fichier...]
# Conteneur : MOTISMA_BOT (défaut motisma-bot-1).
set -euo pipefail

bot="${MOTISMA_BOT:-motisma-bot-1}"
here="$(cd "$(dirname "$0")" && pwd)"
dir="/tmp/mp-$$"
[ $# -ge 1 ] || { echo 'usage : mp-marine.sh "<message>" [fichier...]' >&2; exit 1; }
text="$1"; shift

for f in "$@"; do
  [ -f "$f" ] || { echo "mp-marine : fichier absent : $f" >&2; exit 1; }
done

docker exec "$bot" mkdir -p "$dir"
trap 'docker exec "$bot" rm -rf "$dir"' EXIT

docker cp -q "$here/mp-marine.mjs" "$bot:$dir/mp-marine.mjs"
args=()
for f in "$@"; do
  docker cp -q "$f" "$bot:$dir/$(basename "$f")"
  args+=("$dir/$(basename "$f")")
done

docker exec "$bot" node "$dir/mp-marine.mjs" "$text" "${args[@]}"
