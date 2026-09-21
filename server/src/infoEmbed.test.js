import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentToEmbed, colorHexToInt, colorIntToHex, validateEmbedContent } from './infoEmbed.js';

test('contentToEmbed mappe et omet', () => {
  assert.deepEqual(contentToEmbed({}), {});
  assert.equal(contentToEmbed({ title: 'T' }).title, 'T');
});

test('couleur hexa <-> entier', () => {
  assert.equal(colorHexToInt('#ffffff'), 16777215);
  assert.equal(colorHexToInt('#000000'), 0);
  assert.equal(colorHexToInt('nope'), null);
  assert.equal(colorIntToHex(16777215), '#ffffff');
  assert.equal(colorIntToHex(null), '#ffffff');
});

test('validation OK sur contenu simple', () => {
  const r = validateEmbedContent({ title: 'T', description: 'D', color: '#ffffff', fields: [{ name: 'n', value: 'v', inline: true }] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
});

test('validation refuse titre trop long', () => {
  const r = validateEmbedContent({ title: 'x'.repeat(257) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.length >= 1);
});

test('validation refuse >25 champs et champ invalide', () => {
  const fields = Array.from({ length: 26 }, () => ({ name: 'n', value: 'v' }));
  assert.equal(validateEmbedContent({ fields }).ok, false);
  assert.equal(validateEmbedContent({ fields: [{ name: 'x'.repeat(257), value: 'v' }] }).ok, false);
  assert.equal(validateEmbedContent({ fields: [{ name: 'n', value: 'x'.repeat(1025) }] }).ok, false);
});

test('validation refuse couleur invalide', () => {
  assert.equal(validateEmbedContent({ color: 'blurple' }).ok, false);
  assert.equal(validateEmbedContent({ color: 42 }).ok, false);
  assert.equal(validateEmbedContent({ color: true }).ok, false);
});

test('validation accepte absence de couleur ou chaîne vide', () => {
  assert.equal(validateEmbedContent({}).ok, true);
  assert.equal(validateEmbedContent({ color: '' }).ok, true);
  assert.equal(validateEmbedContent({ color: null }).ok, true);
});
