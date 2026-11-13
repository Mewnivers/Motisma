import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetLanguage, translate } from './translate.js';
import { data, execute } from '../commands/translate.js';
import { onButton } from '../features/translateControls.js';

test('langue cible selon interaction.locale', () => {
  assert.equal(targetLanguage('fr'), 'fr');
  assert.equal(targetLanguage('en-US'), 'en');
  assert.equal(targetLanguage('en-GB'), 'en');
  assert.equal(targetLanguage('es-ES'), 'es');
  assert.equal(targetLanguage('de'), 'fr');
  assert.equal(targetLanguage(undefined), 'fr');
});

test('commande de message « Traduire » ouverte à tous', () => {
  const json = data.toJSON();
  assert.equal(json.name, 'Traduire');
  assert.equal(json.type, 3); // ApplicationCommandType.Message
  assert.equal(json.default_member_permissions, undefined);
});

function fakeInteraction(content, locale = 'en-US') {
  const calls = [];
  return {
    calls,
    locale,
    targetMessage: { content, id: 'm1', channelId: 'c1' },
    deferred: false,
    reply: async (o) => calls.push(['reply', o]),
    deferReply: async (o) => { calls.push(['deferReply', o]); },
    editReply: async (o) => calls.push(['editReply', o]),
  };
}

test('réponse éphémère avec la traduction', async () => {
  const i = fakeInteraction('Bonjour à tous', 'en-US');
  let asked;
  await execute(i, { translate: async (text, lang) => { asked = [text, lang]; return 'Hello everyone'; } });
  assert.deepEqual(asked, ['Bonjour à tous', 'en']);
  assert.deepEqual(i.calls[0], ['deferReply', { ephemeral: true }]);
  assert.deepEqual(i.calls[1], ['editReply', { content: 'Hello everyone' }]);
});

test('message sans texte : avis éphémère, pas d’appel au traducteur', async () => {
  const i = fakeInteraction('   ');
  await execute(i, { translate: async () => assert.fail('ne doit pas être appelé') });
  assert.equal(i.calls.length, 1);
  assert.equal(i.calls[0][0], 'reply');
  assert.equal(i.calls[0][1].ephemeral, true);
});

test('erreur du traducteur (clé absente…) : message éphémère, pas de crash', async () => {
  const i = fakeInteraction('Hello', 'fr');
  await execute(i, { translate: async () => { throw new Error('ANTHROPIC_API_KEY manquante'); } });
  assert.equal(i.calls[0][1].ephemeral, true);
  assert.match(i.calls[1][1].content, /indisponible/i);
});

test('réponse tronquée à 2000 caractères', async () => {
  const i = fakeInteraction('x', 'fr');
  await execute(i, { translate: async () => 'a'.repeat(2500) });
  assert.equal(i.calls[1][1].content.length, 2000);
});

test('message déjà dans la langue de l’utilisateur : boutons vers les autres langues', async () => {
  const i = fakeInteraction('Bonjour à tous', 'fr');
  await execute(i, { translate: async () => null });
  assert.deepEqual(i.calls[0], ['deferReply', { ephemeral: true }]);
  const [kind, reply] = i.calls[1];
  assert.equal(kind, 'editReply');
  assert.doesNotMatch(reply.content ?? '', /déjà en français/);
  const buttons = reply.components[0].toJSON().components;
  assert.deepEqual(buttons.map((b) => b.label), ['Anglais', 'Espagnol']);
  assert.deepEqual(buttons.map((b) => b.custom_id), ['traduire:en:c1:m1', 'traduire:es:c1:m1']);
});

test('clic sur Espagnol : la réponse éphémère est remplacée par la traduction ES', async () => {
  const calls = [];
  const i = {
    customId: 'traduire:es:c1:m1',
    isButton: () => true,
    client: { channels: { fetch: async (id) => (id === 'c1' ? { messages: { fetch: async (m) => (m === 'm1' ? { content: 'Bonjour à tous' } : null) } } : null) } },
    deferUpdate: async () => calls.push(['deferUpdate']),
    editReply: async (o) => calls.push(['editReply', o]),
    reply: async (o) => calls.push(['reply', o]),
  };
  let asked;
  await onButton(i, { translate: async (text, lang) => { asked = [text, lang]; return 'Hola a todos'; } });
  assert.deepEqual(asked, ['Bonjour à tous', 'es']);
  assert.deepEqual(calls, [['deferUpdate'], ['editReply', { content: 'Hola a todos', components: [] }]]);
});

test('bouton d’une autre fonctionnalité : ignoré', async () => {
  const i = { customId: 'rdv:join:1', isButton: () => true, deferUpdate: async () => assert.fail('ignoré') };
  await onButton(i, { translate: async () => assert.fail('ignoré') });
});

test('translate() rend null quand Claude signale que le message est déjà dans la langue', async () => {
  const saved = [process.env.ANTHROPIC_API_KEY, globalThis.fetch];
  process.env.ANTHROPIC_API_KEY = 'test';
  let sent;
  globalThis.fetch = async (_url, opts) => {
    sent = JSON.parse(opts.body);
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: ' ===DEJA=== ' }] }) };
  };
  try {
    assert.equal(await translate('Bonjour', 'fr'), null);
    assert.equal(sent.model, 'claude-haiku-5-5');
    assert.match(sent.system, /===DEJA===/);
  } finally {
    [process.env.ANTHROPIC_API_KEY, globalThis.fetch] = saved;
    if (saved[0] === undefined) delete process.env.ANTHROPIC_API_KEY;
  }
});

test('message anglais + locale fr : traduction directe, sans bouton', async () => {
  const i = fakeInteraction('Hello everyone', 'fr');
  let asked;
  await execute(i, { translate: async (text, lang) => { asked = [text, lang]; return 'Bonjour à tous'; } });
  assert.deepEqual(asked, ['Hello everyone', 'fr']);
  assert.deepEqual(i.calls[1], ['editReply', { content: 'Bonjour à tous' }]);
});
