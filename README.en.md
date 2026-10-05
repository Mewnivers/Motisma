<img src="docs/assets/banner.webp" alt="Motisma, the Discord bot for Pokémon GO communities: meetups, leaderboard, levels, mini-games" width="100%">

<div align="center">

**[Preview](#preview)** · **[Commands](#commands)** · **[Installation](#installation)** · **[Configuration](#configuration)**

[![MIT License](https://img.shields.io/badge/license-MIT-38BDF8?style=flat-square)](LICENSE)
[![Node.js ≥ 18](https://img.shields.io/badge/Node.js-%E2%89%A5%2018-38BDF8?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![discord.js 14](https://img.shields.io/badge/discord.js-14-38BDF8?style=flat-square)](https://discord.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-38BDF8?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-38BDF8?style=flat-square&logo=docker&logoColor=white)](docker-compose.yml)

[🇫🇷 Français](README.md) · 🇬🇧 English

</div>

<br>

<p align="center">
Motisma'Pau is the Discord bot of the Pokémon GO community of Pau, France.<br>
It helps organize meetups and shows every player they are not alone, without ever exposing personal information.
</p>

<p align="center">
<img src="docs/assets/readme/demo-rdv.gif" alt="Demo: Dresseur_01 runs /rdv, the bot posts the announcement, Dresseur_02 clicks Je participe and joins the meetup channel" width="760">
<br>
<sub>The <code>/rdv</code> flow end to end (reconstructed preview, sample data; the bot speaks French).</sub>
</p>

## ✨ What it does

<table>
<tr>
<td width="50%" valign="top">

### 📅 Meetups
`/rdv` opens a temporary channel for a meetup. Members sign up with a button, and the channel is deleted automatically at midnight (Paris time) the day after it starts.

</td>
<td width="50%" valign="top">

### 🏆 Leaderboard
Players send a profile screenshot to the bot in a direct message to update their stats. `/classement-pogo` shows the community leaderboard.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📈 Levels
Each message earns 15 to 25 XP, at most once a minute per member. Reward roles unlock as levels go up.

</td>
<td width="50%" valign="top">

### 🎮 Mini-games and welcome
Quiz, hangman, tic-tac-toe, higher or lower, and polls. A moderator approves each newcomer with one click, then the bot posts a welcome message.

</td>
</tr>
</table>

Reading profile screenshots goes through the Gemini API and needs a key. Without a key, it stays off.

<a id="preview"></a>

## 📸 Preview

Previews reconstructed from the bot's real messages, with sample data; they are not Discord screenshots.

<table>
<tr>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-rdv.webp" alt="/rdv: meetup announcement with the Je participe button" width="100%"></td>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-classement.webp" alt="/classement: top 10 members by XP" width="100%"></td>
</tr>
<tr>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-pogo.webp" alt="/classement-pogo voir: Pokémon GO leaderboard with category buttons" width="100%"></td>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-help.webp" alt="/help: bot help with the command picker menu" width="100%"></td>
</tr>
<tr>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-sondage.webp" alt="/sondage: poll with three choices and numbered reactions" width="100%"></td>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-niveau.webp" alt="/niveau: level and XP with a progress bar" width="100%"></td>
</tr>
<tr>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-pendu.webp" alt="/pendu: hangman game in progress" width="100%"></td>
<td width="50%" valign="top"><img src="docs/assets/readme/apercu-bienvenue.webp" alt="Welcome message after a newcomer is approved" width="100%"></td>
</tr>
</table>

<a id="commands"></a>

## 🧭 Commands

Click a category to expand it.

<details>
<summary><b>📅 Meetups</b> · <code>/rdv</code>, <code>/rdv-modifier</code></summary>

| Command | Description |
|---|---|
| `/rdv` | Creates a temporary channel for a meetup (place, time, description, 45 minutes long by default) |
| `/rdv-modifier` | Edits an open `/rdv` meetup (its organizer, or a member with the "Manage Channels" permission) |

</details>

<details>
<summary><b>🏆 Pokémon GO</b> · <code>/set-pogo</code>, <code>/classement-pogo</code></summary>

| Command | Description |
|---|---|
| `/set-pogo` | Saves your in-game name and friend code (12 digits) |
| `/classement-pogo voir` | Pokémon GO leaderboard, by level, total XP, Pokémon caught, distance, PokéStops or eggs hatched |
| `/classement-pogo rejoindre`, `/classement-pogo quitter` | Join or leave the leaderboard (monthly reminder) |

</details>

<details>
<summary><b>📈 Levels</b> · <code>/niveau</code>, <code>/classement</code></summary>

| Command | Description |
|---|---|
| `/niveau` | Shows your level and XP |
| `/classement` | Top 10 members by XP |

</details>

<details>
<summary><b>🎮 Games and polls</b> · <code>/quiz</code>, <code>/pendu</code>, <code>/morpion</code>, <code>/devinette</code>, <code>/sondage</code></summary>

| Command | Description |
|---|---|
| `/quiz`, `/pendu`, `/morpion`, `/devinette` | Games: "Who's that Pokémon?", hangman, tic-tac-toe, higher or lower |
| `/sondage` | Creates a poll with reactions (up to 10 choices, Yes / No with no choices) |

</details>

<details>
<summary><b>ℹ️ Information</b> · <code>/help</code>, <code>/userinfo</code>, <code>/avatar</code></summary>

| Command | Description |
|---|---|
| `/help` | Shows help and the command list |
| `/userinfo` | Shows a member's profile |
| `/avatar` | Shows a member's or a bot's avatar |

</details>

<details>
<summary><b>🔒 Staff</b> · moderation and administration</summary>

| Command | Permission | Description |
|---|---|---|
| `/clear` | Manage Messages | Deletes recent messages (1 to 100) |
| `/embed` | Manage Server | Publishes or updates an information embed |
| `/say` | Manage Server | Makes the bot speak in a channel |
| `/bingo create`, `/bingo update` | Manage Server | Publishes or updates a bingo image |
| `/reset-joueur` | Manage Server | Resets all or part of a player's data |
| `/test`, `/test-log` | Manage Server | Simulate a member joining and show a sample verification log |
| "Déplacer" context menu | Manage Messages | Moves a message to another channel or a forum post |

</details>

## 🧩 Architecture

<p align="center">
<img src="docs/assets/architecture.svg" alt="Architecture diagram: Discord, bot, PostgreSQL, and the optional Gemini API" width="900">
</p>

The bot talks to Discord and reads or writes in PostgreSQL. Tables are created at startup if they do not exist.

| Folder | Role | Stack |
|---|---|---|
| `src/` | Discord bot: commands (`commands/`) and features (`features/`) | Node.js, discord.js 14 |
| `scripts/` | Development scripts: registering `/rdv` and `/rdv-modifier` alone on a test server | Node.js |
| `assets/` | Sample profile image | PNG |
| `Dockerfile`, `docker-compose.yml` | Bot image and service | Docker, Compose |

<details>
<summary><b>The modules in <code>src/features/</code></b></summary>

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

</details>

## 🔐 Privacy

- **No position.** The bot neither asks for nor stores any geolocation, address or position.
- **Little data.** Per member: Discord ID, trainer name and friend code (if set with `/set-pogo`), stats read from screenshots (level, XP, Pokémon caught, distance, PokéStops, eggs hatched, team), leaderboard participation and the XP earned by chatting. Details in [docs/base-de-donnees.md](docs/base-de-donnees.md).
- **No screenshots in the database.** Only the stats read from them are kept. When a newcomer is verified, the screenshot is reposted in the staff log channel, if one is configured.
- **Short-lived meetups.** A `/rdv` meetup keeps its organizer and sign-ups while it is open; the row is deleted when it closes.
- **Erasure.** `/reset-joueur` lets staff erase all or part of a player's data.
- **Gemini is optional.** If the key is configured, profile screenshots are sent to the Gemini API to be read. Without a key, nothing is sent.

<a id="installation"></a>

## 🚀 Installation

**Requirements**: Docker with Compose, Node.js 18 or later, and a bot created in the [Discord developer portal](https://discord.com/developers/applications) with the **Server Members** privileged intent enabled. If you set `GEMINI_API_KEY`, also enable **Message Content**: the bot only declares it in that case.

**1. Prepare the database.** `docker-compose.yml` only starts the `bot` service. It attaches it to an external Docker network named `mewnivers` and builds `DATABASE_URL` pointing to `db:5432` (user `rotom`, database `rotom`, password `POSTGRES_PASSWORD`). So a PostgreSQL database named `db` must exist on that network. To run the bot alone, you can start it yourself (unverified: these commands were not run):

```bash
docker network create mewnivers
docker run -d --name db --network mewnivers --restart unless-stopped \
  -e POSTGRES_USER=rotom -e POSTGRES_PASSWORD=<your-password> -e POSTGRES_DB=rotom \
  -v motisma-db:/var/lib/postgresql/data postgres:16
```

Use the same password for `POSTGRES_PASSWORD` in `.env`.

**2. Install and start the bot.**

```bash
git clone <repository-url> Motisma
cd Motisma
cp .env.example .env       # then fill in at least DISCORD_TOKEN, CLIENT_ID, GUILD_ID, POSTGRES_PASSWORD
docker compose up -d --build
```

**3. Register the slash commands**, once, then again whenever a command changes:

```bash
npm install
npm run deploy
```

> [!TIP]
> **Outside Docker**: set `DATABASE_URL` in `.env` to your own PostgreSQL database, then run `npm start`. Without `DATABASE_URL`, the bot starts but Pokémon GO profiles are disabled.

<a id="configuration"></a>

## ⚙️ Configuration

All configuration goes through the `.env` file (template: `.env.example`). Never commit it.

<details>
<summary><b>Discord and database</b> · 5 variables</summary>

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `CLIENT_ID` | Application ID, needed to register commands |
| `GUILD_ID` | Discord server ID |
| `POSTGRES_PASSWORD` | PostgreSQL database password, used by Compose to build `DATABASE_URL` |
| `DATABASE_URL` | Connection string. Injected by Compose; only set it outside Docker |

</details>

<details>
<summary><b>Roles and channels</b></summary>

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

</details>

<details>
<summary><b>Optional features</b></summary>

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

</details>

## 🛠️ Development

```bash
# Needs a PostgreSQL database and DATABASE_URL in .env
npm install
npm start
```

`package.json` defines neither tests nor lint.

## 📄 License

Released under the [MIT](LICENSE) license.

<br>

<p align="center"><sub>Community project, not affiliated with Niantic or The Pokémon Company.<br>Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc.</sub></p>
