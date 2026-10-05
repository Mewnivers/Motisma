# Base de données

Motisma utilise PostgreSQL via `DATABASE_URL` (voir `.env.example`). Sans cette variable, les fonctions qui dépendent de la base sont désactivées et le bot l'indique.

Le schéma est créé automatiquement au démarrage par `initDb()` (`src/db.js`). Les instructions sont idempotentes (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) : elles peuvent être rejouées sans risque.

La base peut être partagée avec d'autres applications. Le bot ne crée et ne gère que les tables ci-dessous, et il ne supprime jamais celles des autres.

## Tables créées par le bot

### `pogo_profiles`

Profil Pokémon GO d'un membre. Une ligne par membre, clé `discord_id`.

| Colonne | Rôle |
|---|---|
| `discord_id` | Identifiant Discord (clé primaire) |
| `ign` | Nom de dresseur |
| `friend_code` | Code ami |
| `pogo_level`, `pogo_level_xp`, `pogo_level_xp_max` | Niveau et progression d'XP |
| `pogo_xp`, `pogo_pokedex`, `pogo_distance`, `pogo_pokestops`, `pogo_eggs` | Statistiques du classement |
| `pogo_team` | Équipe détectée |
| `classement` | Participation au classement mensuel (booléen) |
| `stats_updated_at`, `updated_at` | Dates de mise à jour |

### `levels`

Points d'expérience gagnés en discutant (`/niveau`, niveaux et rôles de récompense).

| Colonne | Rôle |
|---|---|
| `discord_id` | Identifiant Discord (clé primaire) |
| `xp` | Total de points |
| `updated_at` | Date de mise à jour |

### `bot_kv`

Petit stockage clé/valeur interne (par exemple le mois du dernier rappel de classement).

| Colonne | Rôle |
|---|---|
| `key` | Clé (primaire) |
| `value` | Valeur (texte) |

### `info_embeds`

Contenu des embeds d'information modifiables sans toucher au code, et référence du message publié. Voir [embeds.md](embeds.md).

| Colonne | Rôle |
|---|---|
| `guild_id`, `key` | Clé primaire : serveur et type d'embed |
| `title`, `description`, `color` | Titre, texte, couleur (entier) |
| `image_url`, `thumbnail_url`, `footer_text` | Image, miniature, pied de page |
| `fields` | Champs de l'embed (JSON) |
| `posted_channel_id`, `posted_message_id` | Dernier message publié par `/embed` |
| `updated_at` | Date de mise à jour |

### `rdv_outings`

Sorties `/rdv` en cours. Conservée pour pouvoir régénérer l'embed de fin de sortie, même après un redémarrage. La ligne est supprimée quand la sortie se ferme.

| Colonne | Rôle |
|---|---|
| `channel_id` | Salon de la sortie (clé primaire) |
| `guild_id` | Serveur |
| `announce_channel_id`, `announce_message_id` | Message d'annonce |
| `panel_message_id` | Message du panneau de contrôle |
| `organizer_id` | Organisateur |
| `participants` | Liste des participants (JSON) |
| `vars` | Variables du modèle de message (JSON) |
| `created_at` | Date de création |

## Table lue mais non créée

`guilds` : le bot lit la ligne du serveur (`getGuildConfig`) pour surcharger la configuration issue de `.env`. Si la table n'existe pas ou si la base est indisponible, il retombe sur `.env`. Le bot ne crée jamais cette table et n'y écrit pas.
