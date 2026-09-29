# Installer le site Pogo Pau sur une VPS

Ce guide installe **uniquement le site public** (front React + API + base de
données), sans le bot Discord. Le site tourne derrière nginx, en HTTPS, avec
ton propre nom de domaine.

```
navigateur ──► nginx ──┬─ /       ► /var/www/<site>   (build React)
                       └─ /api/   ► 127.0.0.1:3100    (API Fastify, Docker)
                                     └─ db (Docker)   ► PostgreSQL
```

Dans les commandes ci-dessous, remplace `mon-domaine.fr` par ton domaine et
`<site>` par un nom de dossier (ex. `pogo-pau`).

## 1. Prérequis (sur la VPS)

- Docker + le plugin `docker compose`
- nginx + certbot
- Un nom de domaine dont l'enregistrement **A** pointe vers l'IP de la VPS

## 2. Récupérer le code

```bash
git clone git@github.com:<compte>/Motisma.git
cd Motisma
```

## 3. Configurer `.env`

```bash
cp .env.example .env
```

Valeurs à remplir au minimum :

- `POSTGRES_PASSWORD` — mot de passe de la base
- Pour la connexion au tableau de bord (OAuth Discord) :
  - `CLIENT_ID`, `DISCORD_CLIENT_SECRET`
  - `SESSION_SECRET` — génère-le avec `openssl rand -hex 32`
  - `WEB_ORIGIN=https://mon-domaine.fr`
  - `OAUTH_REDIRECT_URI=https://mon-domaine.fr/api/auth/callback`
  - `ADMIN_DISCORD_IDS=<ton id Discord>`
  - `COOKIE_SECURE=true`

> Les pages publiques marchent sans OAuth : ces valeurs ne servent qu'à la
> connexion admin du tableau de bord.

Dans le portail développeur Discord (**OAuth2 → Redirects**), enregistre
`https://mon-domaine.fr/api/auth/callback`.

## 4. Démarrer l'API + la base (Docker)

```bash
docker compose up -d --build db api      # on ne lance PAS le service « bot »
curl -s localhost:3100/api/health        # -> {"ok":true,...}
```

## 5. Publier le front

```bash
sudo mkdir -p /var/www/<site>
sudo chown -R "$USER:$USER" /var/www/<site>

WEBROOT=/var/www/<site> bash deploy/publish-web.sh
```

## 6. nginx + HTTPS

```bash
sudo cp deploy/nginx/pogo-pau.conf /etc/nginx/sites-available/<site>

# Adapte le domaine et le dossier au tien
sudo sed -i 's/pogo-pau.mxrine-mz.dev/mon-domaine.fr/; s#/var/www/pogo-pau#/var/www/<site>#' \
     /etc/nginx/sites-available/<site>

sudo ln -sf /etc/nginx/sites-available/<site> /etc/nginx/sites-enabled/<site>
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d mon-domaine.fr
```

## 7. Mises à jour

```bash
git pull
WEBROOT=/var/www/<site> bash deploy/publish-web.sh   # front
docker compose up -d --build api                     # API après modifs de server/
```

## Notes

- La base tourne dans Docker (volume `pgdata`), sans port exposé publiquement ;
  l'API n'écoute que sur `127.0.0.1:3100` et nginx fait le proxy vers `/api/`.
- Le tableau de bord modifie une configuration lue par le bot via la base
  partagée. Sur une VPS « site seul », cette base est indépendante (aucun bot
  ne la lit) : les pages publiques et le classement restent pleinement
  fonctionnels.
