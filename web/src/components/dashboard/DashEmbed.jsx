// web/src/components/dashboard/DashEmbed.jsx
import { useRef, useState } from 'react';
import { apiPost } from '../../api.js';
import { renderMarkdown } from './markdown.jsx';
import EmojiPicker from './EmojiPicker.jsx';
import EmojiField from './EmojiField.jsx';

const intToHex = (n) => (n == null ? '#ffffff' : `#${Number(n).toString(16).padStart(6, '0')}`);
const PRE = { whiteSpace: 'pre-wrap' };

// Insère `code` à la position du curseur de l'élément `el` (lu en direct sur le
// DOM), en ajoutant une espace avant/après si besoin pour ne pas coller au
// texte, applique la nouvelle valeur, puis replace le curseur après l'insertion.
function insertAtCursor(el, code, setValue) {
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  const spaceBefore = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
  const spaceAfter = after.length === 0 || !/^\s/.test(after) ? ' ' : '';
  const insert = spaceBefore + code + spaceAfter;
  setValue(before + insert + after);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + insert.length;
    el.setSelectionRange(pos, pos);
  });
}

/** Rend une ligne de description/valeur avec blockquotes `> ` + markdown. */
function RichText({ text }) {
  const lines = (text || '').split('\n');
  const out = [];
  let quote = [];
  const flushQuote = (key) => {
    if (!quote.length) return;
    out.push(<blockquote key={`q${key}`} className="discord-quote">{renderMarkdown(quote.join('\n'))}</blockquote>);
    quote = [];
  };
  lines.forEach((line, i) => {
    if (line.startsWith('> ')) quote.push(line.slice(2));
    else { flushQuote(i); out.push(<span key={i} style={PRE}>{renderMarkdown(line)}{'\n'}</span>); }
  });
  flushQuote('end');
  return <>{out}</>;
}

// Discord rogne les espaces/sauts de ligne en début et fin de chaque texte
// (titre, description, nom/valeur de champ, footer). L'aperçu fait pareil pour
// rester fidèle au rendu final.
const dc = (s) => (s || '').trim();

/** Grille de champs type Discord (les inline se regroupent). */
function FieldsPreview({ fields }) {
  return (
    <div className="discord-embed-fields">
      {fields.filter((f) => dc(f.name) && dc(f.value)).map((f, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={`discord-embed-field${f.inline ? ' inline' : ''}`}>
          <div className="discord-embed-field-name">{renderMarkdown(dc(f.name))}</div>
          <div className="discord-embed-field-value"><RichText text={f.value} /></div>
        </div>
      ))}
    </div>
  );
}

export default function DashEmbed({ meta, row, bot, guildId, onSaved }) {
  const [m, setM] = useState(() => ({
    mode: row?.mode ?? 'embed',
    content: row?.content ?? '',
    title: row?.title ?? '',
    description: row?.description ?? '',
    color: intToHex(row?.color),
    image_url: row?.image_url ?? '',
    thumbnail_url: row?.thumbnail_url ?? '',
    footer_text: row?.footer_text ?? '',
    fields: Array.isArray(row?.fields) ? row.fields.map((f) => ({ name: f.name ?? '', value: f.value ?? '', inline: !!f.inline })) : [],
    posted_message_id: row?.posted_message_id ?? null,
    buttons: meta.buttons
      ? Object.fromEntries(
          meta.buttons.map((b) => {
            const saved = row?.buttons?.[b.role];
            return [b.role, {
              label: saved?.label ?? b.label,
              style: saved?.style ?? b.style,
              emoji: saved?.emoji ?? b.emoji ?? '',
            }];
          }),
        )
      : {},
  }));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { live, reason } | { error }
  // Dernier champ texte focalisé : { el, apply }. Le bouton emoji ne vole pas le
  // focus (preventDefault), donc `el` reste focalisé et son curseur est à jour.
  const active = useRef(null);

  const set = (k, v) => { setM((p) => ({ ...p, [k]: v })); setResult(null); };
  const setField = (i, k, v) => set('fields', m.fields.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
  const addField = () => set('fields', [...m.fields, { name: '', value: '', inline: false }]);
  const delField = (i) => set('fields', m.fields.filter((_, idx) => idx !== i));
  const setButton = (role, k, v) => set('buttons', { ...m.buttons, [role]: { ...m.buttons[role], [k]: v } });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= m.fields.length) return;
    const next = [...m.fields];
    [next[i], next[j]] = [next[j], next[i]];
    set('fields', next);
  };

  // MAJ fonctionnelle d'un champ (sûre pour une insertion différée).
  const setFieldFn = (i, k, v) => {
    setM((p) => ({ ...p, fields: p.fields.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)) }));
    setResult(null);
  };
  // Insère un emoji au curseur du dernier champ texte focalisé.
  const insertEmoji = (code) => {
    const a = active.current;
    if (a?.el && a.apply) insertAtCursor(a.el, code, a.apply);
  };

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const payload = {
        mode: meta.message ? m.mode : 'embed',
        content: m.content,
        title: m.title, description: m.description, color: m.color,
        image_url: m.image_url, thumbnail_url: m.thumbnail_url, footer_text: m.footer_text,
        fields: m.fields.filter((f) => f.name && f.value),
        buttons: m.buttons,
      };
      const res = await apiPost(`/api/admin/embeds/${meta.key}`, payload);
      setResult(res);
      onSaved?.(meta.key, res.row);
    } catch (e) {
      setResult({ error: e.message === 'invalid_content' ? 'Contenu invalide (trop long ?).' : 'Échec de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  }

  const savedMsg = result && !result.error
    ? (meta.template
        ? 'Enregistré ✓ — modèle appliqué à la prochaine sortie.'
        : result.live ? 'Enregistré ✓ — message Discord mis à jour'
        : result.reason === 'not_published' ? 'Enregistré ✓ — publie-le une fois avec /embed pour l’afficher'
        : result.reason === 'deleted' ? 'Enregistré ✓ — le message publié a été supprimé, republie avec /embed'
        : 'Enregistré ✓ — mise à jour Discord impossible (droits ?)')
    : null;

  // Ce que l'aperçu montre selon le mode (fidèle à l'envoi du bot).
  const msgMode = meta.message ? m.mode : 'embed';
  const hasText = !!dc(m.content);
  const showText = msgMode !== 'embed' && hasText;
  // En « Message simple » sans texte, le bot renvoie l'embed → l'aperçu aussi.
  const showEmbed = !(msgMode === 'simple' && hasText);

  return (
    <div>
      <header className="dash-module-head">
        <h2>{meta.label}</h2>
        {meta.desc && <p>{meta.desc}</p>}
        {meta.note && <p className="dash-embed-note">ℹ️ {meta.note}</p>}
        {meta.vars && (
          <p className="dash-vars">
            Variables :
            {meta.vars.map((v) => (
              <code key={v}>{v}</code>
            ))}
          </p>
        )}
      </header>

      <div className="dash-msg dash-msg-scroll">
        {/* Éditeur */}
        <div className="dash-msg-editor">
          {meta.message && (
            <>
              <div className="dash-field">
                <span>Type de message</span>
                <div className="dash-mode-row">
                  {[['simple', 'Message simple'], ['embed', 'Embed'], ['both', 'Message + embed']].map(([val, label]) => (
                    <label key={val} className="dash-mode-opt">
                      <input
                        type="radio"
                        name={`mode-${meta.key}`}
                        checked={m.mode === val}
                        onChange={() => set('mode', val)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {m.mode !== 'embed' && (
                <div className="dash-field">
                  <span>Message (texte)</span>
                  <div className="dash-textarea-wrap">
                    <EmojiField
                      multiline
                      rows={3}
                      className="dash-input dash-input-emoji"
                      value={m.content}
                      onChange={(e) => set('content', e.target.value)}
                      onFocus={(e) => { active.current = { el: e.currentTarget, apply: (v) => set('content', v) }; }}
                      placeholder="Texte affiché au-dessus de l’embed (ou seul en mode « Message simple »)."
                    />
                    <EmojiPicker onSelect={insertEmoji} />
                  </div>
                </div>
              )}
              {m.mode !== 'simple' && <span className="dash-btn-name">Embed</span>}
            </>
          )}
          <div className="dash-field"><span>Titre</span>
            <div className="dash-textarea-wrap">
              <EmojiField
                className="dash-input dash-input-emoji"
                value={m.title}
                onChange={(e) => set('title', e.target.value)}
                onFocus={(e) => { active.current = { el: e.currentTarget, apply: (v) => set('title', v) }; }}
              />
              <EmojiPicker onSelect={insertEmoji} />
            </div>
          </div>
          <div className="dash-field">
            <span>Description</span>
            <div className="dash-textarea-wrap">
              <EmojiField
                multiline
                rows={6}
                className="dash-input dash-input-emoji"
                value={m.description}
                onChange={(e) => set('description', e.target.value)}
                onFocus={(e) => { active.current = { el: e.currentTarget, apply: (v) => set('description', v) }; }}
              />
              <EmojiPicker onSelect={insertEmoji} />
            </div>
          </div>
          <div className="dash-field-row">
            <label className="dash-field dash-field-color"><span>Couleur</span>
              <input type="color" value={m.color} onChange={(e) => set('color', e.target.value)} />
            </label>
            <label className="dash-field"><span>Pied de page</span>
              <input className="dash-input" value={m.footer_text} onChange={(e) => set('footer_text', e.target.value)} />
            </label>
          </div>
          {!meta.lockImage && (
            <label className="dash-field"><span>Image (URL)</span>
              <input className="dash-input" value={m.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
            </label>
          )}
          {!meta.lockThumbnail && (
            <label className="dash-field"><span>Miniature (URL)</span>
              <input className="dash-input" value={m.thumbnail_url} onChange={(e) => set('thumbnail_url', e.target.value)} placeholder="https://…" />
            </label>
          )}

          <div className="dash-field">
            <span>Champs</span>
            <div className="dash-fields-editor">
              {m.fields.map((f, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div className="dash-field-card" key={i}>
                  <div className="dash-field-card-head">
                    <EmojiField
                      className="dash-input"
                      placeholder="Nom du champ"
                      value={f.name}
                      onChange={(e) => setField(i, 'name', e.target.value)}
                      onFocus={(e) => { active.current = { el: e.currentTarget, apply: (v) => setFieldFn(i, 'name', v) }; }}
                    />
                    <button type="button" className="btn-mini" onClick={() => move(i, -1)} aria-label="Monter">↑</button>
                    <button type="button" className="btn-mini" onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
                    <button type="button" className="dash-pool-del" onClick={() => delField(i)} aria-label="Supprimer">✕</button>
                    <EmojiPicker onSelect={insertEmoji} />
                  </div>
                  <EmojiField
                    multiline
                    rows={2}
                    className="dash-input"
                    placeholder="Valeur"
                    value={f.value}
                    onChange={(e) => setField(i, 'value', e.target.value)}
                    onFocus={(e) => { active.current = { el: e.currentTarget, apply: (v) => setFieldFn(i, 'value', v) }; }}
                  />
                  <label className="dash-toggle">
                    <input type="checkbox" checked={f.inline} onChange={(e) => setField(i, 'inline', e.target.checked)} />
                    <span>Sur la même ligne (inline)</span>
                  </label>
                </div>
              ))}
              <button type="button" className="btn-mini" onClick={addField}>+ Ajouter un champ</button>
            </div>
          </div>

          {meta.buttons && (
            <div className="dash-field">
              <span>Boutons</span>
              <div className="dash-fields-editor">
                {meta.buttons.map((b) => (
                  <div className="dash-field-card" key={b.role}>
                    <span className="dash-btn-name">{b.name}</span>
                    <div className="dash-btn-row">
                      <div className="dash-btn-emoji">
                        <input
                          className="dash-input dash-input-sm"
                          value={m.buttons[b.role]?.emoji ?? ''}
                          onChange={(e) => setButton(b.role, 'emoji', e.target.value)}
                          placeholder="Emoji"
                          maxLength={64}
                          aria-label="Emoji du bouton"
                        />
                        <EmojiPicker onSelect={(code) => setButton(b.role, 'emoji', code)} />
                      </div>
                      <input
                        className="dash-input"
                        value={m.buttons[b.role]?.label ?? ''}
                        onChange={(e) => setButton(b.role, 'label', e.target.value)}
                        placeholder="Texte du bouton"
                        maxLength={80}
                      />
                      <select
                        className="dash-input dash-btn-color"
                        value={m.buttons[b.role]?.style ?? 'Secondary'}
                        onChange={(e) => setButton(b.role, 'style', e.target.value)}
                      >
                        <option value="Primary">Bleu</option>
                        <option value="Success">Vert</option>
                        <option value="Danger">Rouge</option>
                        <option value="Secondary">Gris</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dash-save-bar">
            {savedMsg && <span className="dash-saved">{savedMsg}</span>}
            {result?.error && <span className="dash-error">{result.error}</span>}
            <button type="button" className="btn-primary" disabled={saving} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Aperçu */}
        <div className="dash-msg-preview">
          <div className="dash-preview-head">
            <span className="dash-preview-label">Aperçu</span>
            {guildId && row?.posted_channel_id && row?.posted_message_id && (
              <a
                className="discord-link dash-preview-link"
                href={`https://discord.com/channels/${guildId}/${row.posted_channel_id}/${row.posted_message_id}`}
                target="_blank"
                rel="noreferrer"
              >
                Message suivi ↗
              </a>
            )}
          </div>
          <div className="discord-msg">
            {bot?.avatarUrl ? <img className="discord-avatar-img" src={bot.avatarUrl} alt="" /> : <div className="discord-avatar" />}
            <div className="discord-body">
              <div className="discord-author">{bot?.username || 'Motisma'} <span className="discord-bot">BOT</span></div>
              {showText && <div className="discord-content"><RichText text={m.content} /></div>}
              {msgMode === 'simple' && !hasText && (
                <div className="dash-embed-note">ℹ️ Message vide → l’embed ci-dessous sera affiché à la place.</div>
              )}
              {showEmbed && (
              <div className="discord-embed" style={{ borderColor: m.color }}>
                <div className="discord-embed-main">
                  {dc(m.title) && <div className="discord-embed-title">{renderMarkdown(dc(m.title))}</div>}
                  {dc(m.description) && <div className="discord-embed-desc"><RichText text={m.description} /></div>}
                  {m.fields.length > 0 && <FieldsPreview fields={m.fields} />}
                  {m.image_url && !m.image_url.startsWith('attachment://') && <img className="discord-embed-image" src={m.image_url} alt="" />}
                  {dc(m.footer_text) && <div className="discord-embed-footer">{dc(m.footer_text)}</div>}
                </div>
                {m.thumbnail_url && !m.thumbnail_url.startsWith('attachment://') && <img className="discord-embed-thumb" src={m.thumbnail_url} alt="" />}
              </div>
              )}
              {meta.buttons && (
                <div className="discord-buttons">
                  {meta.buttons.map((b) => {
                    const bc = m.buttons[b.role] || {};
                    return (
                      <span key={b.role} className={`discord-btn btn-${(bc.style || 'Secondary').toLowerCase()}`}>
                        {bc.emoji && <span className="discord-btn-emoji">{renderMarkdown(bc.emoji)}</span>}
                        {bc.label || b.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
