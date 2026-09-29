#!/usr/bin/env bash
# =============================================================================
# Installe le site Pogo Pau (front React + API Fastify + PostgreSQL) sur une
# nouvelle VPS, en une seule commande.
#
#   git clone git@github.com:<compte>/Motisma.git
#   cd Motisma
#   sudo bash deploy/install.sh
#
# Le script est IDEMPOTENT : on peut le relancer sans casse (il ne réécrase pas
# les secrets déjà présents dans .env, et « docker compose up » se contente de
# mettre à jour ce qui a changé).
#
# Options :
#   --domain <d>       nom de domaine du site (sinon demandé)
#   --webroot <path>   dossier du build front (défaut : /var/www/<domaine>)
#   --email <mail>     email Let's Encrypt (rend certbot non-interactif)
#   --no-https         n'installe pas le certificat HTTPS (certbot)
#   --install-deps     installe docker/nginx/certbot/node manquants (Debian/Ubuntu)
#   -y, --yes          mode non-interactif (ne pose aucune question)
#   -h, --help         affiche cette aide
# =============================================================================
set -euo pipefail

# --- Sortie lisible ----------------------------------------------------------
c_reset=$'\033[0m'; c_blue=$'\033[1;34m'; c_green=$'\033[1;32m'
c_yellow=$'\033[1;33m'; c_red=$'\033[1;31m'
log()  { printf '%s==>%s %s\n' "$c_blue"  "$c_reset" "$*"; }
ok()   { printf '%s ✓ %s%s\n'  "$c_green" "$*" "$c_reset"; }
warn() { printf '%s ! %s%s\n'  "$c_yellow" "$*" "$c_reset" >&2; }
die()  { printf '%s ✗ %s%s\n'  "$c_red" "$*" "$c_reset" >&2; exit 1; }

# --- Emplacement du dépôt ----------------------------------------------------
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO/.env"
cd "$REPO"

# --- Options -----------------------------------------------------------------
DOMAIN=""; WEBROOT=""; EMAIL=""; NO_HTTPS=0; INSTALL_DEPS=0; ASSUME_YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --domain)  DOMAIN="${2:-}"; shift 2;;
    --webroot) WEBROOT="${2:-}"; shift 2;;
    --email)   EMAIL="${2:-}"; shift 2;;
    --no-https)     NO_HTTPS=1; shift;;
    --install-deps) INSTALL_DEPS=1; shift;;
    -y|--yes)       ASSUME_YES=1; shift;;
    -h|--help) awk 'NR==1{next} /^#/{sub(/^# ?/,"");print;next} {exit}' "${BASH_SOURCE[0]}"; exit 0;;
    *) die "Option inconnue : $1 (voir --help)";;
  esac
done

# --- sudo si on n'est pas root ----------------------------------------------
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else
  command -v sudo >/dev/null 2>&1 || die "Lance en root ou installe sudo."
  SUDO="sudo"
fi

# Utilisateur qui possédera le webroot (pas root, si lancé via sudo)
OWNER="${SUDO_USER:-$(id -un)}"

have() { command -v "$1" >/dev/null 2>&1; }

# Question interactive (lit /dev/tty pour marcher même via un pipe)
ask() { # ask VAR "question" "défaut"
  local __var="$1" __q="$2" __def="${3:-}" __ans=""
  if [ "$ASSUME_YES" -eq 1 ] || [ ! -e /dev/tty ]; then
    printf -v "$__var" '%s' "$__def"; return
  fi
  if [ -n "$__def" ]; then read -r -p "$__q [$__def] : " __ans < /dev/tty || true
  else                       read -r -p "$__q : " __ans < /dev/tty || true; fi
  printf -v "$__var" '%s' "${__ans:-$__def}"
}

# Génère un secret hexadécimal
gen_secret() { openssl rand -hex "${1:-32}" 2>/dev/null || head -c "${1:-32}" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

# Écrit/actualise une clé dans .env (remplace la ligne ou l'ajoute)
set_env() { # set_env KEY VALUE
  local key="$1" val="$2"
  awk -v k="$key" -v v="$val" 'BEGIN{FS="="} $1==k{print k"="v; done=1; next} {print} END{if(!done) print k"="v}' \
    "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
}
# Valeur actuelle d'une clé dans .env (vide si absente)
get_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true; }

# =============================================================================
# 1. Prérequis
# =============================================================================
log "Vérification des prérequis"

DC=""
if docker compose version >/dev/null 2>&1; then DC="docker compose"
elif have docker-compose; then DC="docker-compose"; fi

missing=()
have docker  || missing+=("docker")
[ -n "$DC" ] || missing+=("docker-compose-plugin")
have nginx   || missing+=("nginx")
have openssl || missing+=("openssl")
have node    || missing+=("nodejs")
have npm     || missing+=("npm")
[ "$NO_HTTPS" -eq 1 ] || have certbot || missing+=("certbot")

if [ "${#missing[@]}" -gt 0 ]; then
  warn "Manquant : ${missing[*]}"
  if [ "$INSTALL_DEPS" -eq 0 ] && [ "$ASSUME_YES" -eq 0 ] && [ -e /dev/tty ]; then
    ask _do "Installer les paquets manquants automatiquement (Debian/Ubuntu) ? (o/N)" "N"
    [[ "$_do" =~ ^[oOyY] ]] && INSTALL_DEPS=1
  fi
  if [ "$INSTALL_DEPS" -eq 1 ] && have apt-get; then
    log "Installation des dépendances (apt)"
    export DEBIAN_FRONTEND=noninteractive
    $SUDO apt-get update -y
    for pkg in "${missing[@]}"; do
      case "$pkg" in
        docker|docker-compose-plugin)
          if ! have docker; then curl -fsSL https://get.docker.com | $SUDO sh; fi ;;
        nodejs|npm)
          if ! have node; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
            $SUDO apt-get install -y nodejs
          fi ;;
        certbot) $SUDO apt-get install -y certbot python3-certbot-nginx ;;
        nginx)   $SUDO apt-get install -y nginx ;;
        openssl) $SUDO apt-get install -y openssl ;;
      esac
    done
    docker compose version >/dev/null 2>&1 && DC="docker compose"
  else
    die "Installe d'abord : ${missing[*]} — ou relance avec --install-deps (Debian/Ubuntu)."
  fi
fi
ok "Prérequis présents"

# =============================================================================
# 2. Configuration (.env)
# =============================================================================
log "Configuration de .env"
[ -f "$ENV_FILE" ] || cp "$REPO/.env.example" "$ENV_FILE"

[ -n "$DOMAIN" ] || ask DOMAIN "Nom de domaine du site (ex. pogo-pau.exemple.fr)" ""
[ -n "$DOMAIN" ] || die "Un nom de domaine est requis."
[ -n "$WEBROOT" ] || WEBROOT="/var/www/$DOMAIN"

# Secrets : générés une seule fois, jamais réécrasés
[ -n "$(get_env POSTGRES_PASSWORD)" ] || set_env POSTGRES_PASSWORD "$(gen_secret 24)"
[ -n "$(get_env SESSION_SECRET)" ]    || set_env SESSION_SECRET "$(gen_secret 32)"

# Valeurs liées au domaine
set_env WEB_ORIGIN        "https://$DOMAIN"
set_env OAUTH_REDIRECT_URI "https://$DOMAIN/api/auth/callback"
set_env COOKIE_SECURE     "true"

# OAuth Discord (facultatif : uniquement pour la connexion admin du dashboard)
if [ "$ASSUME_YES" -eq 0 ]; then
  echo "  (Laisse vide si tu ne veux que les pages publiques, sans connexion admin.)"
  cur=$(get_env CLIENT_ID);              ask v "  CLIENT_ID (app Discord)"        "$cur"; [ -n "$v" ] && set_env CLIENT_ID "$v"
  cur=$(get_env DISCORD_CLIENT_SECRET);  ask v "  DISCORD_CLIENT_SECRET"          "$cur"; [ -n "$v" ] && set_env DISCORD_CLIENT_SECRET "$v"
  cur=$(get_env GUILD_ID);               ask v "  GUILD_ID (serveur Discord)"     "$cur"; [ -n "$v" ] && set_env GUILD_ID "$v"
  cur=$(get_env ADMIN_DISCORD_IDS);      ask v "  ADMIN_DISCORD_IDS (id admin)"   "$cur"; [ -n "$v" ] && set_env ADMIN_DISCORD_IDS "$v"
fi
ok "Fichier .env prêt ($DOMAIN)"

# =============================================================================
# 3. Base de données + API (Docker)
# =============================================================================
log "Démarrage de la base et de l'API (Docker)"
$SUDO $DC up -d --build db api

log "Attente de l'API (/api/health)"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3100/api/health >/dev/null 2>&1; then ok "API en ligne"; break; fi
  [ "$i" -eq 30 ] && warn "L'API ne répond pas encore — vérifie « $DC logs api »."
  sleep 2
done

# =============================================================================
# 4. Build + publication du front
# =============================================================================
log "Publication du front dans $WEBROOT"
$SUDO mkdir -p "$WEBROOT"
$SUDO chown -R "$OWNER:$OWNER" "$WEBROOT"
WEBROOT="$WEBROOT" bash "$REPO/deploy/publish-web.sh"
ok "Front publié"

# =============================================================================
# 5. nginx
# =============================================================================
log "Configuration nginx pour $DOMAIN"
VHOST="/etc/nginx/sites-available/$DOMAIN"
sed -e "s/pogo-pau\.mxrine-mz\.dev/$DOMAIN/g" \
    -e "s#/var/www/pogo-pau#$WEBROOT#g" \
    "$REPO/deploy/nginx/pogo-pau.conf" | $SUDO tee "$VHOST" >/dev/null
$SUDO ln -sf "$VHOST" "/etc/nginx/sites-enabled/$DOMAIN"
$SUDO nginx -t
$SUDO systemctl reload nginx
ok "nginx configuré (HTTP)"

# =============================================================================
# 6. HTTPS (Let's Encrypt)
# =============================================================================
if [ "$NO_HTTPS" -eq 1 ]; then
  warn "HTTPS ignoré (--no-https). Lance plus tard : sudo certbot --nginx -d $DOMAIN"
else
  log "Certificat HTTPS (certbot)"
  if [ -n "$EMAIL" ]; then
    $SUDO certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect \
      || warn "certbot a échoué (le domaine pointe-t-il déjà vers ce serveur ?). Relance : sudo certbot --nginx -d $DOMAIN"
  else
    $SUDO certbot --nginx -d "$DOMAIN" \
      || warn "certbot a échoué. Relance : sudo certbot --nginx -d $DOMAIN"
  fi
fi

# =============================================================================
# Fin
# =============================================================================
echo
ok "Installation terminée."
echo "   Site   : https://$DOMAIN"
echo "   API    : docker compose logs -f api"
echo "   MàJ    : git pull && WEBROOT=$WEBROOT bash deploy/publish-web.sh && $DC up -d --build api"
if [ -n "$(get_env CLIENT_ID)" ]; then
  echo
  echo "   Pense à enregistrer dans le portail Discord (OAuth2 → Redirects) :"
  echo "     https://$DOMAIN/api/auth/callback"
fi
