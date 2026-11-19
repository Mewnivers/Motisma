// Self-check for the server logs feature. Run: node src/features/serverLogs.test.js
import assert from 'node:assert/strict';

// config.js validates required env at import time; seed harmless values so the
// module loads without a real .env. They are never used to connect anywhere here.
process.env.DISCORD_TOKEN ||= 'test-token';
process.env.CLIENT_ID ||= 'test-client';
process.env.GUILD_ID ||= 'test-guild';
process.env.LOGS_GUILDS = 'beta-guild:beta-log, bad-entry';

const { config } = await import('../config.js');
const {
  sendLog,
  logChannelFor,
  logPostFor,
  buildMessageDeleteEmbed,
  classifyRemoval,
  findAuditEntry,
  pickDeleteEntry,
  isRealEdit,
  contentOrFallback,
  CONTENT_UNAVAILABLE,
} = await import('./serverLogs.js');

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

  // Unknown guild → no-op (and the throwing fetch is never reached).
  await sendLog({ id: 'other', channels: { fetch: async () => { throw new Error('boom'); } } }, 'joins', { embeds: [] });
  assert.equal(sent, 1, 'other guild → still only one send');
  console.log('ok - sendLog gating');
}

// (a2) LOGS_GUILDS: a listed guild (test server) logs every kind in its own
// channel, whatever the main guild's dashboard switches say.
{
  assert.deepEqual(config.logsGuilds, { 'beta-guild': 'beta-log' }, 'LOGS_GUILDS parsed, bad entry dropped');
  config.logsMessages = false;
  assert.equal(logChannelFor({ id: 'beta-guild' }, 'messages'), 'beta-log', 'listed guild → its channel');
  assert.equal(logChannelFor({ id: config.guildId }, 'messages'), null, 'main guild, switch off → null');
  assert.equal(logChannelFor({ id: 'other' }, 'messages'), null, 'unlisted guild → null');
  assert.equal(logChannelFor(null, 'messages'), null, 'no guild (DM) → null');

  let fetchedId = null;
  const guild = {
    id: 'beta-guild',
    channels: { fetch: async (id) => { fetchedId = id; return { isTextBased: () => true, send: async () => {} }; } },
  };
  await sendLog(guild, 'moderation', { embeds: [] });
  assert.equal(fetchedId, 'beta-log', 'listed guild → posted in its channel');
  console.log('ok - LOGS_GUILDS');
}

// (a3) forum log channel: one permanent post per category, found or created,
// each log appended at the end. A text channel is untouched (see (a)).
{
  assert.equal(logPostFor('joins'), 'Arrivées et départs');
  assert.equal(logPostFor('leaves'), 'Arrivées et départs');
  assert.equal(logPostFor('moderation'), 'Modération', 'bans, débans, kicks, timeouts');
  assert.equal(logPostFor('messages'), 'Messages');
  for (const k of ['roles', 'channels', 'voice', 'boosts']) assert.equal(logPostFor(k), 'Autres', k);

  const kv = new Map();
  const store = { get: async (k) => kv.get(k) ?? null, set: async (k, v) => { kv.set(k, v); } };
  const posts = new Map(); // id → { name, sent: [] }
  let n = 0;
  const forum = {
    id: 'beta-log',
    type: 15, // ChannelType.GuildForum
    isTextBased: () => false,
    threads: {
      create: async ({ name, message }) => {
        const post = { id: `p${++n}`, name, sent: [message], send: async (m) => { post.sent.push(m); } };
        posts.set(post.id, post);
        return post;
      },
    },
  };
  const guild = {
    id: 'beta-guild',
    channels: { fetch: async (id) => (id === 'beta-log' ? forum : posts.get(id) ?? null) },
  };

  await Promise.all([
    sendLog(guild, 'moderation', { embeds: ['kick'] }, store),
    sendLog(guild, 'moderation', { embeds: ['ban'] }, store),
  ]);
  await sendLog(guild, 'leaves', { embeds: ['leave'] }, store);
  await sendLog(guild, 'joins', { embeds: ['join'] }, store);
  const byName = (name) => [...posts.values()].filter((p) => p.name === name);
  assert.equal(posts.size, 2, 'one post per category, even for simultaneous first logs');
  assert.deepEqual(byName('Modération')[0].sent.map((m) => m.embeds[0]), ['kick', 'ban']);
  assert.deepEqual(byName('Arrivées et départs')[0].sent.map((m) => m.embeds[0]), ['leave', 'join']);

  // After a restart (memory cleared), the stored id is reused, no new post.
  await sendLog(guild, 'moderation', { embeds: ['timeout'] }, store, new Map());
  assert.equal(posts.size, 2, 'stored post reused');
  assert.equal(byName('Modération')[0].sent.length, 3);

  // Post deleted by hand → a new one is created and stored.
  const oldId = kv.get('logs-forum:beta-log:Modération');
  posts.delete(oldId);
  await sendLog(guild, 'moderation', { embeds: ['unban'] }, store, new Map());
  assert.notEqual(kv.get('logs-forum:beta-log:Modération'), oldId, 'deleted post replaced');
  assert.equal(byName('Modération').length, 1);
  console.log('ok - forum posts per category');
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
  const entry = await findAuditEntry(guild, 72, 'anyone', { delayMs: 0 });
  assert.equal(entry, null, 'audit failure → null, no throw');
  console.log('ok - findAuditEntry swallows errors');
}

// (e) who deleted a message: Discord merges repeated deletions by the same
// moderator (same author, same channel) into one entry whose count goes up
// while its timestamp stays. A fresh entry or a grown count = that moderator.
{
  const now = Date.now();
  const seen = new Map();
  const entry = (count, ageMs, over = {}) => ({
    id: 'E1',
    target: { id: 'author' },
    extra: { channel: { id: 'chan' }, count },
    createdTimestamp: now - ageMs,
    ...over,
  });
  const opts = { authorId: 'author', channelId: 'chan', seen, now };

  assert.equal(pickDeleteEntry([entry(1, 1000)], opts)?.id, 'E1', 'fresh entry → found');
  assert.equal(pickDeleteEntry([entry(1, 1000)], opts), null, 'same count again → self-delete');
  assert.equal(pickDeleteEntry([entry(2, 120000)], opts)?.id, 'E1', 'count grew on an old entry → found');
  assert.equal(pickDeleteEntry([entry(1, 1000, { id: 'E2', target: { id: 'x' } })], opts), null, 'other author → null');
  assert.equal(
    pickDeleteEntry([entry(1, 1000, { id: 'E3', extra: { channel: { id: 'other' }, count: 1 } })], opts),
    null,
    'other channel → null',
  );
  assert.equal(pickDeleteEntry([entry(3, 120000, { id: 'E4' })], opts), null, 'unknown old entry → null');
  console.log('ok - pickDeleteEntry');
}

// (f) an edit is real only when Discord stamped a new edit time (embed unfurls
// and pins fire MessageUpdate too, without an edited timestamp change).
{
  assert.equal(isRealEdit({ content: 'a', editedTimestamp: null }, { content: 'b', editedTimestamp: 5 }), true);
  assert.equal(
    isRealEdit({ content: null, editedTimestamp: null, partial: true }, { content: 'b', editedTimestamp: 5 }),
    true,
    'uncached old → still logged',
  );
  assert.equal(isRealEdit({ content: null, partial: true }, { content: 'b', editedTimestamp: null }), false, 'unfurl → ignored');
  assert.equal(isRealEdit({ content: 'a', editedTimestamp: 5 }, { content: 'a', editedTimestamp: 5 }), false, 'pin → ignored');
  console.log('ok - isRealEdit');
}

console.log('\nAll server-logs self-checks passed.');
