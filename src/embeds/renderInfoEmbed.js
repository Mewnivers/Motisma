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

// --- Modèles /rdv : substitution de variables + construction du message ---

/** Remplace {var} par sa valeur dans une chaîne (laisse littéral si inconnue). */
export function applyVars(s, vars) {
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

/** Applique les variables à toutes les chaînes d'une ligne info_embeds. */
export function substituteRow(row, vars) {
  return {
    ...row,
    content: applyVars(row.content, vars),
    title: applyVars(row.title, vars),
    description: applyVars(row.description, vars),
    footer_text: applyVars(row.footer_text, vars),
    fields: (row.fields || []).map((f) => ({
      name: applyVars(f.name, vars),
      value: applyVars(f.value, vars),
      inline: Boolean(f.inline),
    })),
  };
}

/** Vrai si la ligne a un contenu d'embed exploitable (titre / description / champs). */
export function rowHasContent(row) {
  return Boolean(row && (row.title || row.description || (row.fields && row.fields.length)));
}

/**
 * Construit le payload d'un message-modèle selon `row.mode`
 * ('simple' = texte seul, 'embed' = embed seul, 'both' = les deux).
 * Renvoie toujours { content, embeds, components } explicites pour qu'une
 * édition remplace bien l'ancien message. `fallbackEmbed` sert d'embed de repli
 * si le modèle est vide.
 */
export function buildTemplateMessage(row, vars, { components = [], fallbackEmbed } = {}) {
  const sub = substituteRow(row || {}, vars);
  const mode = sub.mode || 'embed';
  const msgText = (sub.content || '').trim();
  const chosenEmbed = rowHasContent(sub) ? contentToEmbed(sub) : fallbackEmbed;
  let content = '';
  let embeds = [];
  if (mode === 'simple') {
    if (msgText) content = msgText;
    else if (chosenEmbed) embeds = [chosenEmbed]; // texte vide → repli sur l'embed
  } else if (mode === 'both') {
    if (msgText) content = msgText;
    if (chosenEmbed) embeds = [chosenEmbed];
  } else if (chosenEmbed) {
    embeds = [chosenEmbed];
  }
  return { content, embeds, components };
}
