<div align="center">

<img src="docs/assets/motisma.png" alt="Motisma profile picture" width="120" height="120">

# Motisma'Pau

**The Discord bot of the Pokémon GO community of Pau, France.**

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![discord.js](https://img.shields.io/badge/discord.js-14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

<img src="docs/assets/readme/apercu-rdv.webp" alt="A meetup announcement with the /rdv command, reconstructed preview" width="100%">

<sub>A meetup announcement with /rdv (reconstructed preview, sample data).</sub>

[Version française](README.md)

</div>

---

## What it does

Motisma'Pau has two goals: show every player they are not alone, and make meetups easier, without ever exposing personal information.

1. **Welcome.** A newcomer gets a "pending" role and posts their profile screenshots. A moderator approves with one click (✅ reaction). The profile is updated, then a welcome message is sent.
2. **Organize.** `/rdv` opens a temporary channel for a meetup (place, time, duration). Members sign up with a button. The channel is deleted automatically at midnight (Paris time) the day after the meetup starts.
3. **Rank.** Players send a profile screenshot to the bot in a direct message to update their stats. `/classement-pogo` shows the community leaderboard.
4. **Entertain.** Levels per message, temporary voice channels, games, polls, YouTube announcements.

Reading profile screenshots goes through the Gemini API and needs a key. Without a key, it stays off.

## Preview

Previews reconstituted from the bot's real messages, with fictional data; they are not Discord screenshots.

<table>
<tr><td width="50%" valign="top"><b>/rdv — announce an outing</b><br><img src="docs/assets/readme/apercu-rdv.webp" alt="Outing announcement with the Join button" width="100%"></td><td width="50%" valign="top"><b>/sondage — create a poll</b><br><img src="docs/assets/readme/apercu-sondage.webp" alt="Poll with three choices and numbered reactions" width="100%"></td></tr>
<tr><td width="50%" valign="top"><b>/niveau — level and XP</b><br><img src="docs/assets/readme/apercu-niveau.webp" alt="Level embed with a progress bar" width="100%"></td><td width="50%" valign="top"><b>/classement — top 10 by XP</b><br><img src="docs/assets/readme/apercu-classement.webp" alt="Top 10 members by XP" width="100%"></td></tr>
<tr><td width="50%" valign="top"><b>/classement-pogo voir — Pokémon GO leaderboard</b><br><img src="docs/assets/readme/apercu-pogo.webp" alt="Pokémon GO leaderboard with category buttons" width="100%"></td><td width="50%" valign="top"><b>/help — help and command menu</b><br><img src="docs/assets/readme/apercu-help.webp" alt="Bot help with the command picker menu" width="100%"></td></tr>
<tr><td width="50%" valign="top"><b>/pendu — hangman game</b><br><img src="docs/assets/readme/apercu-pendu.webp" alt="Hangman game in progress" width="100%"></td><td width="50%" valign="top"><b>Welcome message</b><br><img src="docs/assets/readme/apercu-bienvenue.webp" alt="Welcome message after a newcomer is validated" width="100%"></td></tr>
</table>

## Architecture

<div align="center">
<img src="docs/assets/architecture.svg" alt="Architecture diagram: Discord, bot, PostgreSQL, and the optional Gemini API" width="900">
</div>

The bot talks to Discord and reads or writes in PostgreSQL. Tables are created at startup if they do not exist.

| Folder | Role | Stack |
|---|---|---|
| `src/` | Discord bot: commands (`commands/`) and features (`features/`) | Node.js, discord.js 14 |
| `scripts/` | Development scripts: registering `/rdv` and `/rdv-modifier` alone on a test server | Node.js |
| `assets/` | Sample profile image | PNG |
| `Dockerfile`, `docker-compose.yml` | Bot image and service | Docker, Compose |

## Features

| Module | What it does |
|---|---|
| `verification` | "Pending" role, screenshot reading, approval by a moderator's ✅ reaction |
| `visionExtract` | Reads a profile screenshot with the Gemini API to detect the trainer name. Optional: without a key, the module stays inactive |
| `welcome` | Random welcome message on approval |
| `teamRole` | Detects the team (Mystic, Valor, Instinct) from the screenshot and assigns the role |
| `rdv*` | Meetups: temporary channel, sign-ups, editing, automatic deletion |
| `classement` | Monthly stats leaderboard, reminder by direct message, staff alert if a screenshot looks edited or stats regress |
| `leveling` | XP per message (15 to 25, at most once a minute per member), levels, reward roles |
| `tempVoice` | "Join to create" voice channel, deleted as soon as it is empty |
| `languageWatch` | Reply to swearing, with a short timeout of a few seconds |
| `youtube` | Announces a channel's new videos (public feed, no API key, checked every 10 minutes) |
| `forumHeart` | Reacts with ❤️ to images posted in a forum or a forum post |
| `forumKeepAlive` | Unarchives forum posts so their mentions stay readable |
| `helpControls`, `moveControls` | `/help` menu and destination picker of the "Déplacer" (move) menu |

## Commands

| Command | Description |
|---|---|
| `/help` | Shows help and the command list |
| `/rdv` | Creates a temporary channel for a meetup (place, time, description, 45 minutes long by default) |
| `/rdv-modifier` | Edits an open `/rdv` meetup (its organizer, or a member with the "Manage Channels" permission) |
| `/set-pogo` | Saves your in-game name and friend code (12 digits) |
| `/userinfo` | Shows a member's profile |
| `/niveau` | Shows your level and XP |
| `/classement` | Top 10 members by XP |
| `/classement-pogo voir` | Pokémon GO leaderboard, by level, total XP, Pokémon caught, distance, PokéStops or eggs hatched |
| `/classement-pogo rejoindre`, `/classement-pogo quitter` | Join or leave the leaderboard (monthly reminder) |
| `/avatar` | Shows a member's or a bot's avatar |
| `/sondage` | Creates a poll with reactions (up to 10 choices, Yes / No with no choices) |
| `/quiz`, `/pendu`, `/morpion`, `/devinette` | Games: "Who's that Pokémon?", hangman, tic-tac-toe, higher or lower |

Staff-only commands:

| Command | Permission | Description |
|---|---|---|
| `/clear` | Manage Messages | Deletes recent messages (1 to 100) |
| `/embed` | Manage Server | Publishes or updates an information embed |
| `/say` | Manage Server | Makes the bot speak in a channel |
| `/bingo create`, `/bingo update` | Manage Server | Publishes or updates a bingo image |
| `/reset-joueur` | Manage Server | Resets all or part of a player's data |
| `/test`, `/test-log` | Manage Server | Simulate a member joining and show a sample verification log |
| "Déplacer" context menu | Manage Messages | Moves a message to another channel or a forum post |

## Privacy

- No geolocation, no address, no position: the bot neither asks for nor stores any position.
- Per member, the PostgreSQL database holds the Discord ID, the trainer name and friend code (if set with `/set-pogo`), the stats read from screenshots (level, XP, Pokémon caught, distance, PokéStops, eggs hatched, team), leaderboard participation and the XP earned by chatting. Details in [docs/base-de-donnees.md](docs/base-de-donnees.md).
- Profile screenshots are not kept in the database: only the stats read from them are. When a newcomer is verified, the screenshot is reposted in the staff log channel, if one is configured.
- A `/rdv` meetup keeps its organizer and sign-ups while it is open; the row is deleted when it closes.
- `/reset-joueur` lets staff erase all or part of a player's data.
- If the Gemini key is configured, profile screenshots are sent to the Gemini API to be read. Without a key, nothing is sent.

## Installation

Requirements: Docker with Compose, Node.js 18 or later, and a bot created in the [Discord developer portal](https://discord.com/developers/applications) with the **Server Members** privileged intent enabled. If you set `GEMINI_API_KEY`, also enable **Message Content**: the bot only declares it in that case.

**The database.** `docker-compose.yml` only starts the `bot` service. It attaches it to an external Docker network named `mewnivers` and builds `DATABASE_URL` pointing to `db:5432` (user `rotom`, database `rotom`, password `POSTGRES_PASSWORD`). So a PostgreSQL database named `db` must exist on that network before you start the bot. To run the bot alone, you can start it yourself (unverified: these commands were not run):

```bash
docker network create mewnivers
docker run -d --name db --network mewnivers --restart unless-stopped \
  -e POSTGRES_USER=rotom -e POSTGRES_PASSWORD=<your-password> -e POSTGRES_DB=rotom \
  -v motisma-db:/var/lib/postgresql/data postgres:16
```

Use the same password for `POSTGRES_PASSWORD` in `.env`.

Then install and start the bot:

```bash
git clone <repository-url> Motisma
cd Motisma
cp .env.example .env       # then fill in at least DISCORD_TOKEN, CLIENT_ID, GUILD_ID, POSTGRES_PASSWORD
docker compose up -d --build
```

Slash commands are registered once, then again whenever a command changes:

```bash
npm install
npm run deploy
```

**Outside Docker.** Set `DATABASE_URL` in `.env` to your own PostgreSQL database, then run `npm start`. Without `DATABASE_URL`, the bot starts but Pokémon GO profiles are disabled.

## Configuration

All configuration goes through the `.env` file (template: `.env.example`). Never commit it.

**Discord and database**

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `CLIENT_ID` | Application ID, needed to register commands |
| `GUILD_ID` | Discord server ID |
| `POSTGRES_PASSWORD` | PostgreSQL database password, used by Compose to build `DATABASE_URL` |
| `DATABASE_URL` | Connection string. Injected by Compose; only set it outside Docker |

**Roles and channels**

| Variable | Purpose |
|---|---|
| `VERIFICATION_ROLE_ID` | "Pending" role given to newcomers |
| `MEMBER_ROLE_ID` | Member role given on approval |
| `VERIFICATION_CHANNEL_ID` | Restricts verification to a single channel |
| `TEMP_VOICE_HUB_ID` | "Join to create" voice channel |
| `TEMP_VOICE_CATEGORY_ID` | Category of temporary voice channels |
| `RDV_CATEGORY_ID` | Category of `/rdv` meetup channels |
| `RDV_ANNOUNCE_CHANNEL_ID` | Channel where `/rdv` announces meetups |
| `WELCOME_CHANNEL_ID` | Welcome message channel |
| `LOG_CHANNEL_ID` | Staff log channel (empty: no log) |
| `AMBASSADOR_ROLE_ID` | Role listed as ambassador in the presentation embed |
| `TEAM_ROLE_MYSTIC`, `TEAM_ROLE_VALOR`, `TEAM_ROLE_INSTINCT` | Roles of the three teams, assigned automatically |

**Optional features**

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini key to read profile screenshots. Empty: disabled |
| `VISION_MODEL` | Vision model (default `gemini-2.5-flash`) |
| `LEVELUP_CHANNEL_ID` | Level-up announcement channel (otherwise the message's channel) |
| `LEVEL_ROLES` | Reward roles per level, formatted as `10:roleId,20:roleId` |
| `FORUM_HEART_CHANNEL_ID` | Forum or forum post where the bot reacts with ❤️ |
| `FORUM_KEEPALIVE_IDS` | Forum posts to unarchive regularly |
| `CLASSEMENT_ROLE_ID` | Role synced with leaderboard participation |
| `CLASSEMENT_REMINDER_DAY`, `CLASSEMENT_REMINDER_HOUR` | Day (1 to 28, default 1) and hour (0 to 23, default 10) of the monthly reminder |
| `CLASSEMENT_ADMIN_CHANNEL_ID` | Staff channel alerted when a screenshot looks edited or stats regress |
| `LANGUAGE_TIMEOUT_MILD`, `LANGUAGE_TIMEOUT_STRONG` | Timeout length in seconds (default 10 and 30, 0 to disable) |
| `PRESENCE_TEXT`, `PRESENCE_EMOJI`, `PRESENCE_GAME`, `PRESENCE_GAME_TYPE`, `PRESENCE_STATUS` | Status and activity shown by the bot |

## Development

```bash
# Needs a PostgreSQL database and DATABASE_URL in .env
npm install
npm start
```

`package.json` defines neither tests nor lint.

## License

Released under the [MIT](LICENSE) license.

---

Community project, not affiliated with Niantic or The Pokémon Company. Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc.
