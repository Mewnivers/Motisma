import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentToEmbed, MANAGED_EMBED_KEYS } from './renderInfoEmbed.js';

test('champs vides omis', () => {
  assert.deepEqual(contentToEmbed({}), {});
});

test('mappe les propriétés remplies', () => {
  const e = contentToEmbed({
    title: 'T', description: 'D', color: 0xffffff,
    footer_text: 'F', image_url: 'https://x/i.png', thumbnail_url: 'https://x/t.png',
    fields: [{ name: 'n', value: 'v', inline: true }],
  });
  assert.equal(e.title, 'T');
  assert.equal(e.description, 'D');
  assert.equal(e.color, 0xffffff);
  assert.deepEqual(e.footer, { text: 'F' });
  assert.deepEqual(e.image, { url: 'https://x/i.png' });
  assert.deepEqual(e.thumbnail, { url: 'https://x/t.png' });
  assert.deepEqual(e.fields, [{ name: 'n', value: 'v', inline: true }]);
});

test('filtre les champs incomplets et limite à 25', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ name: `n${i}`, value: 'v' }));
  const e = contentToEmbed({ fields: [{ name: '', value: 'x' }, ...many] });
  assert.equal(e.fields.length, 25);
  assert.equal(e.fields[0].name, 'n0');
  assert.equal(e.fields[0].inline, false);
});

test('color 0 est conservé, null est omis', () => {
  assert.equal(contentToEmbed({ color: 0 }).color, 0);
  assert.equal('color' in contentToEmbed({ color: null }), false);
});

test('MANAGED_EMBED_KEYS contient les 5 clés v1', () => {
  assert.deepEqual([...MANAGED_EMBED_KEYS].sort(), ['classement','motisma','reglement','suggestions','verification']);
});
