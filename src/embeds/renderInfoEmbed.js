// Rend une ligne `info_embeds` en objet embed Discord (APIEmbed JSON).
// COPIE IDENTIQUE de server/src/infoEmbed.js:contentToEmbed — garder les deux
// synchronisées (paquets bot/serveur séparés, pas d'import cross-paquet).

/** Clés d'embeds pilotées par la base (v1). */
export const MANAGED_EMBED_KEYS = ['reglement', 'suggestions', 'verification', 'motisma', 'classement'];

/**
 * @param {object} row - ligne info_embeds (title, description, color, fields, …)
 * @returns {object} embed Discord JSON (champs vides omis)
 */
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
