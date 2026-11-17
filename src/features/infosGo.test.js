import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRules, fileInfo, classify, THEMES } from './infosGo.js';

const RULE = { guildId: 'gTest', sourceId: 'g47ix', forumId: 'forum' };
const TAGS = THEMES.map((name, i) => ({ id: `tag${i}`, name }));

function fakeMessage(over = {}) {
  return {
    id: 'm1',
    guildId: 'gTest',
    channelId: 'g47ix',
    url: 'https://discord.com/channels/gTest/g47ix/m1',
    content: 'Raid de Méga-Rayquaza ce week-end',
    author: { id: 'source-webhook' },
    attachments: new Map([['a1', { url: 'https://cdn/a.png?ex=1', name: 'a.png', contentType: 'image/png', size: 10 }]]),
    embeds: [],
    delete: async () => assert.fail("l'original ne doit pas être supprimé"),
    ...over,
  };
}

// Forum fake: records created posts, holds existing threads by id.
function fakeWorld(existing = {}) {
  const log = [];
  const kv = new Map();
  const threads = new Map();
  const mkThread = (id, name) => ({
    id,
    name,
    send: async (p) => log.push(['send', id, p]),
    pin: async () => log.push(['pin', id]),
    unpin: async () => log.push(['unpin', id]),
    delete: async () => log.push(['delete', id]),
  });
  for (const [id, name] of Object.entries(existing)) threads.set(id, mkThread(id, name));
  let n = 0;
  const forum = {
    id: 'forum',
    availableTags: TAGS,
    threads: {
      create: async (opts) => {
        const t = mkThread(`new${++n}`, opts.name);
        threads.set(t.id, t);
        log.push(['create', t.id, opts]);
        return t;
      },
    },
  };
  return {
    log,
    kv,
    deps: (theme) => ({
      rules: [RULE],
      classify: async () => theme,
      store: { get: async (k) => kv.get(k) ?? null, set: async (k, v) => kv.set(k, v) },
      download: async () => Buffer.from('img'),
      fetchChannel: async (id) => {
        if (id === 'forum') return forum;
        const t = threads.get(id);
        if (!t) throw new Error('Unknown Channel');
        return t;
      },
    }),
  };
}

test('INFOS_GO « guilde:source:forum » lu en règles, vide = aucune', () => {
  assert.deepEqual(parseRules('1:2:3, 4:5:6'), [
    { guildId: '1', sourceId: '2', forumId: '3' },
    { guildId: '4', sourceId: '5', forumId: '6' },
  ]);
  assert.deepEqual(parseRules(''), []);
  assert.deepEqual(parseRules(undefined), []);
  assert.deepEqual(parseRules('1:2'), []);
});

test('message hors règle (autre serveur, autre salon) : rien ne bouge', async () => {
  const w = fakeWorld();
  await fileInfo(fakeMessage({ guildId: 'pogoPau' }), w.deps('Raids'));
  await fileInfo(fakeMessage({ channelId: 'autre' }), w.deps('Raids'));
  assert.deepEqual(w.log, []);
});

test('premier Raid : post « Raids » créé avec son tag, texte, image réenvoyée, lien Source', async () => {
  const w = fakeWorld();
  await fileInfo(fakeMessage(), w.deps('Raids'));
  assert.equal(w.log.length, 1);
  const [kind, id, opts] = w.log[0];
  assert.equal(kind, 'create');
  assert.equal(opts.name, 'Raids');
  assert.deepEqual(opts.appliedTags, ['tag0']);
  assert.match(opts.message.content, /Raid de Méga-Rayquaza ce week-end/);
  assert.match(opts.message.content, /\[Source\]\(https:\/\/discord\.com\/channels\/gTest\/g47ix\/m1\)/);
  assert.deepEqual(opts.message.files, [{ attachment: Buffer.from('img'), name: 'a.png' }]);
  assert.deepEqual(opts.message.allowedMentions, { parse: [] });
  assert.equal(w.kv.get('infos-go:gTest:Raids'), id);
});

test('post du thème déjà connu : nouveau message à la fin du post, pas de nouveau post', async () => {
  const w = fakeWorld({ t9: 'Événements' });
  w.kv.set('infos-go:gTest:Événements', 't9');
  await fileInfo(fakeMessage(), w.deps('Événements'));
  assert.equal(w.log.length, 1);
  assert.equal(w.log[0][0], 'send');
  assert.equal(w.log[0][1], 't9');
  assert.match(w.log[0][2].content, /\[Source\]/);
});

test('post connu mais supprimé : recréé', async () => {
  const w = fakeWorld();
  w.kv.set('infos-go:gTest:Recherches', 'disparu');
  await fileInfo(fakeMessage(), w.deps('Recherches'));
  assert.equal(w.log[0][0], 'create');
  assert.equal(w.log[0][2].name, 'Recherches');
  assert.deepEqual(w.log[0][2].appliedTags, ['tag4']);
});

test('classement en erreur ou hors liste : Divers', async () => {
  const w = fakeWorld();
  const deps = w.deps('Raids');
  deps.classify = async () => {
    throw new Error('HTTP 529');
  };
  await fileInfo(fakeMessage(), deps);
  assert.equal(w.log[0][2].name, 'Divers');
  assert.deepEqual(w.log[0][2].appliedTags, ['tag5']);

  const w2 = fakeWorld();
  await fileInfo(fakeMessage(), w2.deps('Pokémon du jour'));
  assert.equal(w2.log[0][2].name, 'Divers');
});

test('image non téléchargeable : réenvoyée par son URL, info pas perdue', async () => {
  const w = fakeWorld();
  const deps = w.deps('Raids');
  deps.download = async () => {
    throw new Error('404');
  };
  await fileInfo(fakeMessage(), deps);
  assert.deepEqual(w.log[0][2].message.files, [{ attachment: 'https://cdn/a.png?ex=1', name: 'a.png' }]);
});

test('programme de la semaine : nouveau post épinglé, le précédent supprimé', async () => {
  const w = fakeWorld({ old: 'Programme de la semaine' });
  w.kv.set('infos-go:gTest:programme', 'old');
  await fileInfo(fakeMessage(), w.deps('programme'));
  const kinds = w.log.map(([k, id]) => `${k}:${id}`);
  assert.deepEqual(kinds, ['create:new1', 'delete:old', 'pin:new1']);
  assert.equal(w.log[0][2].name, 'Programme de la semaine');
  assert.equal(w.kv.get('infos-go:gTest:programme'), 'new1');
});

test('premier programme (aucun précédent) : créé et épinglé', async () => {
  const w = fakeWorld();
  await fileInfo(fakeMessage(), w.deps('programme'));
  assert.deepEqual(w.log.map(([k]) => k), ['create', 'pin']);
});

test('texte long : message tronqué à 2000 caractères, lien Source gardé', async () => {
  const w = fakeWorld();
  await fileInfo(fakeMessage({ content: 'x'.repeat(2500) }), w.deps('Raids'));
  const content = w.log[0][2].message.content;
  assert.ok(content.length <= 2000);
  assert.match(content, /\[Source\]/);
});

test('classify() : Haiku, sortie contrainte aux thèmes + programme, images en base64', async () => {
  const saved = [process.env.ANTHROPIC_API_KEY, globalThis.fetch];
  process.env.ANTHROPIC_API_KEY = 'test';
  let sent;
  globalThis.fetch = async (_url, opts) => {
    sent = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: '{"theme":"Heures vedettes"}' }] }) };
  };
  try {
    const theme = await classify('Heure vedette Pikachu', [{ data: Buffer.from('img'), mediaType: 'image/png' }]);
    assert.equal(theme, 'Heures vedettes');
    assert.equal(sent.model, 'claude-haiku-5-5');
    assert.deepEqual(sent.output_config.format.schema.properties.theme.enum, [...THEMES, 'programme']);
    const image = sent.messages[0].content.find((b) => b.type === 'image');
    assert.deepEqual(image.source, { type: 'base64', media_type: 'image/png', data: Buffer.from('img').toString('base64') });
  } finally {
    [process.env.ANTHROPIC_API_KEY, globalThis.fetch] = saved;
    if (saved[0] === undefined) delete process.env.ANTHROPIC_API_KEY;
  }
});
