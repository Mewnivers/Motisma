// Self-check for the server logs feature. Run: node src/features/serverLogs.test.js
import assert from 'node:assert/strict';

// config.js validates required env at import time; seed harmless values so the
// module loads without a real .env. They are never used to connect anywhere here.
process.env.DISCORD_TOKEN ||= 'test-token';
process.env.CLIENT_ID ||= 'test-client';
process.env.GUILD_ID ||= 'test-guild';

const { config } = await import('../config.js');
const { sendLog, buildMessageDeleteEmbed, classifyRemoval, findAuditEntry, contentOrFallback, CONTENT_UNAVAILABLE } =
  await import('./serverLogs.js');

const field = (embed, name) => embed.data.fields.find((f) => f.name === name)?.value;

// (a) sendLog: no-op when the switch is off and when logChannelId is empty.
{
  let fetched = false;
  let sent = 0;
  const channel = { isTextBased: () => true, send: async () => { sent++; } };
  const guild = { id: config.guildId, channels: { fetch: async () => { fetched = true; return channel; } } };

  config.logChannelId = 'log-chan';
  config.logsJoins = false;
  await sendLog(guild, 'joins', { embeds: [] });
  assert.equal(fetched, false, 'switch off → no channel fetch');
  assert.equal(sent, 0, 'switch off → nothing sent');

  config.logsJoins = true;
  config.logChannelId = '';
  await sendLog(guild, 'joins', { embeds: [] });
  assert.equal(sent, 0, 'empty logChannelId → nothing sent');

  config.logChannelId = 'log-chan';
  await sendLog(guild, 'joins', { embeds: [] });
  assert.equal(sent, 1, 'switch on + channel set → sent once');

  // Wrong guild → no-op (and the throwing fetch is never reached).
  await sendLog({ id: 'other', channels: { fetch: async () => { throw new Error('boom'); } } }, 'joins', { embeds: [] });
  assert.equal(sent, 1, 'other guild → still only one send');
  console.log('ok - sendLog gating');
}

// (b) deleted-message embed: content fallback when empty, raw content otherwise.
{
  const empty = buildMessageDeleteEmbed({ author: null, content: '', channel: null, sentAtUnix: null, deletedBy: '—' });
  assert.equal(field(empty, 'Contenu'), CONTENT_UNAVAILABLE, 'empty content → fallback');

  const filled = buildMessageDeleteEmbed({ author: null, content: 'coucou', channel: null, sentAtUnix: null, deletedBy: '—' });
  assert.equal(field(filled, 'Contenu'), 'coucou', 'content kept');
  assert.equal(contentOrFallback('   '), CONTENT_UNAVAILABLE, 'whitespace → fallback');
  console.log('ok - message delete fallback');
}

// (c) classifyRemoval: leave vs ban vs kick.
{
  const now = Date.now();
  assert.equal(classifyRemoval(null, { memberId: '1', now }), 'leave', 'no entry → leave');
  assert.equal(classifyRemoval({ type: 'ban', targetId: '1', createdTimestamp: now }, { memberId: '1', now }), 'ban');
  assert.equal(classifyRemoval({ type: 'kick', targetId: '1', createdTimestamp: now }, { memberId: '1', now }), 'kick');
  assert.equal(
    classifyRemoval({ type: 'kick', targetId: '1', createdTimestamp: now - 60000 }, { memberId: '1', now }),
    'leave',
    'stale entry → leave',
  );
  assert.equal(
    classifyRemoval({ type: 'ban', targetId: '2', createdTimestamp: now }, { memberId: '1', now }),
    'leave',
    'other target → leave',
  );
  console.log('ok - classifyRemoval');
}

// (d) a failing audit-log lookup degrades to null, never throws.
{
  const guild = { fetchAuditLogs: async () => { throw new Error('Missing Permissions'); } };
  const entry = await findAuditEntry(guild, 72, 'anyone');
  assert.equal(entry, null, 'audit failure → null, no throw');
  console.log('ok - findAuditEntry swallows errors');
}

console.log('\nAll server-logs self-checks passed.');
