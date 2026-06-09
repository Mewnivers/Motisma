import 'dotenv/config';

/**
 * Centralized, validated environment configuration.
 * Throws early with a clear message if a required variable is missing.
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`);
  }
  return value;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: required('GUILD_ID'),
  // Optional: voice channel whose name mirrors the member count ("Membres : {nb}").
  memberCountChannelId: process.env.MEMBER_COUNT_CHANNEL_ID || '1513800614348455988',
};
