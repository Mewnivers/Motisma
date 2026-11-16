// Envoie un message privé à Marine, avec des fichiers joints, par l'API REST
// de Discord (sans gateway : le bot en ligne n'est pas dérangé).
// Le token vient de DISCORD_TOKEN, dans l'environnement du conteneur du bot.
// Autonome (fetch de Node, aucune dépendance) : peut tourner depuis /tmp.
// Usage : node scripts/mp-marine.mjs "<message>" [fichier...]
// Depuis le VPS, passer par scripts/mp-marine.sh, qui copie les fichiers.
import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';

const MARINE_ID = '832654520839962624';
const MAX_FILE = 10 * 1024 * 1024; // limite Discord par fichier (10 Mio)
const API = 'https://discord.com/api/v10';

function fail(msg) {
  console.error(`mp-marine : ${msg}`);
  process.exit(1);
}

const [text, ...paths] = process.argv.slice(2);
if (!text && !paths.length) fail('usage : mp-marine.mjs "<message>" [fichier...]');
if (text && text.length > 2000) fail(`message trop long (${text.length} > 2000 caractères).`);

// Tout est vérifié avant le premier appel réseau.
for (const p of paths) {
  const s = await stat(p).catch(() => null);
  if (!s?.isFile()) fail(`fichier absent : ${p}`);
  if (s.size > MAX_FILE) fail(`fichier trop gros : ${p} (${(s.size / 1048576).toFixed(1)} Mio > 10 Mio).`);
}

const token = process.env.DISCORD_TOKEN;
if (!token) fail('DISCORD_TOKEN absent de l\'environnement.');

async function call(path, init) {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bot ${token}`, ...init.headers },
  });
  if (!res.ok) fail(`Discord a répondu ${res.status} sur ${path} : ${await res.text()}`);
  return res.json();
}

const dm = await call('/users/@me/channels', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipient_id: MARINE_ID }),
});

// Un message par fichier (le texte part avec le premier), pour que la limite
// s'applique fichier par fichier et non à la somme.
const sends = paths.length ? paths : [null];
for (const [i, p] of sends.entries()) {
  const form = new FormData();
  const payload = { content: i === 0 ? text || '' : '' };
  if (p) {
    payload.attachments = [{ id: 0, filename: basename(p) }];
    form.append('files[0]', new Blob([await readFile(p)]), basename(p));
  }
  form.append('payload_json', JSON.stringify(payload));
  await call(`/channels/${dm.id}/messages`, { method: 'POST', body: form });
  console.log(`envoyé${p ? ` : ${basename(p)}` : ' : message'}`);
}
