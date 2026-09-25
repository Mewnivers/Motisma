// One-off: register ONLY the /rdv command on the secondary test guild
// (RDV_TEST_GUILD_ID), without touching the main guild's commands.
// Run: docker compose exec bot node scripts/register-rdv-test.mjs
import { REST, Routes } from 'discord.js';
import { config } from '../src/config.js';
import * as rdv from '../src/commands/rdv.js';
import * as rdvModifier from '../src/commands/rdv-modifier.js';

const guild = config.rdvTestGuildId;
if (!guild) {
  console.error('RDV_TEST_GUILD_ID is not set — nothing to do.');
  process.exit(1);
}

const rdvData = typeof rdv.buildData === 'function' ? await rdv.buildData() : rdv.data;
const rest = new REST().setToken(config.token);
await rest.put(Routes.applicationGuildCommands(config.clientId, guild), {
  body: [rdvData.toJSON(), rdvModifier.data.toJSON()],
});
console.log(`/rdv + /rdv-modifier registered on test guild ${guild}.`);
