// Rendu + validation des embeds info côté serveur.
// contentToEmbed est une COPIE IDENTIQUE de src/embeds/renderInfoEmbed.js.

// Discord rogne les espaces/sauts en tout début et toute fin d'un texte. Pour
// qu'un espacement volontaire en bord (ligne vide) survive, on borne le texte
// d'un espace de largeur nulle (invisible) quand il commence/finit par un blanc.
function keepEdgeSpacing(s) {
  if (typeof s !== 'string' || !s) return s;
  let out = s;
  if (/^\s/.test(out)) out = `​${out}`;
  if (/\s$/.test(out)) out = `${out}​`;
  return out;
}

export function contentToEmbed(row = {}) {
  const e = {};
  if (row.title) e.title = row.title;
  if (row.description) e.description = keepEdgeSpacing(row.description);
  if (row.color != null) e.color = row.color;
  const fields = (row.fields || [])
    .filter((f) => f && f.name && f.value)
    .slice(0, 25)
    .map((f) => ({ name: f.name, value: keepEdgeSpacing(f.value), inline: Boolean(f.inline) }));
  if (fields.length) e.fields = fields;
  if (row.image_url) e.image = { url: row.image_url };
  if (row.thumbnail_url) e.thumbnail = { url: row.thumbnail_url };
  if (row.footer_text) e.footer = { text: row.footer_text };
  return e;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export function colorHexToInt(hex) {
  if (typeof hex !== 'string' || !HEX.test(hex.trim())) return null;
  return parseInt(hex.trim().slice(1), 16);
}

export function colorIntToHex(int) {
  if (int == null || Number.isNaN(Number(int))) return '#ffffff';
  return `#${Number(int).toString(16).padStart(6, '0')}`;
}

/** Valide un corps d'édition d'embed. Renvoie { ok, errors }. */
export function validateEmbedContent(body = {}) {
  const errors = [];
  const str = (v) => (typeof v === 'string' ? v : '');
  if (str(body.content).length > 2000) errors.push('Message trop long (max 2000).');
  if (str(body.title).length > 256) errors.push('Titre trop long (max 256).');
  if (str(body.description).length > 4096) errors.push('Description trop longue (max 4096).');
  if (str(body.footer_text).length > 2048) errors.push('Pied de page trop long (max 2048).');
  if (body.color != null && body.color !== '' && colorHexToInt(body.color) === null) {
    errors.push('Couleur invalide (format #rrggbb attendu).');
  }
  const fields = Array.isArray(body.fields) ? body.fields : [];
  if (fields.length > 25) errors.push('Trop de champs (max 25).');
  fields.forEach((f, i) => {
    if (str(f?.name).length > 256) errors.push(`Champ ${i + 1} : nom trop long (max 256).`);
    if (str(f?.value).length > 1024) errors.push(`Champ ${i + 1} : valeur trop longue (max 1024).`);
  });
  return { ok: errors.length === 0, errors };
}
