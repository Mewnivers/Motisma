import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetLanguage } from './translate.js';
import { data, execute } from '../commands/translate.js';

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
    targetMessage: { content },
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
