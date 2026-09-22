// web/src/components/dashboard/DashEmbed.jsx
import { useRef, useState } from 'react';
import { apiPost } from '../../api.js';
import { renderMarkdown } from './markdown.jsx';
import EmojiPicker from './EmojiPicker.jsx';

const intToHex = (n) => (n == null ? '#ffffff' : `#${Number(n).toString(16).padStart(6, '0')}`);
const PRE = { whiteSpace: 'pre-wrap' };

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

/** Grille de champs type Discord (les inline se regroupent). */
function FieldsPreview({ fields }) {
  return (
    <div className="discord-embed-fields">
      {fields.filter((f) => f.name && f.value).map((f, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={`discord-embed-field${f.inline ? ' inline' : ''}`}>
          <div className="discord-embed-field-name">{renderMarkdown(f.name)}</div>
          <div className="discord-embed-field-value"><RichText text={f.value} /></div>
        </div>
      ))}
    </div>
  );
}

export default function DashEmbed({ meta, row, bot, guildId, onSaved }) {
  const [m, setM] = useState(() => ({
    title: row?.title ?? '',
    description: row?.description ?? '',
    color: intToHex(row?.color),
    image_url: row?.image_url ?? '',
    thumbnail_url: row?.thumbnail_url ?? '',
    footer_text: row?.footer_text ?? '',
    fields: Array.isArray(row?.fields) ? row.fields.map((f) => ({ name: f.name ?? '', value: f.value ?? '', inline: !!f.inline })) : [],
    posted_message_id: row?.posted_message_id ?? null,
  }));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { live, reason } | { error }
  // Dernier champ éditable focalisé (titre / description / valeur de champ) :
  // { el, target } où target = 'title' | 'description' | { field: index }.
  const active = useRef(null);

  const set = (k, v) => { setM((p) => ({ ...p, [k]: v })); setResult(null); };
  const setField = (i, k, v) => set('fields', m.fields.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
  const addField = () => set('fields', [...m.fields, { name: '', value: '', inline: false }]);
  const delField = (i) => set('fields', m.fields.filter((_, idx) => idx !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= m.fields.length) return;
    const next = [...m.fields];
    [next[i], next[j]] = [next[j], next[i]];
    set('fields', next);
  };

  // Insère un emoji au curseur du dernier champ éditable focalisé.
  const insertEmoji = (code) => {
    const a = active.current;
    if (!a || !a.el) return;
    const el = a.el;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const val = el.value.slice(0, start) + code + el.value.slice(end);
    if (a.target === 'title' || a.target === 'description') set(a.target, val);
    else setM((p) => ({ ...p, fields: p.fields.map((f, idx) => (idx === a.target.field ? { ...f, value: val } : f)) }));
    setResult(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + code.length;
      el.setSelectionRange(pos, pos);
    });
  };

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const payload = {
        title: m.title, description: m.description, color: m.color,
        image_url: m.image_url, thumbnail_url: m.thumbnail_url, footer_text: m.footer_text,
        fields: m.fields.filter((f) => f.name && f.value),
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
    ? (result.live ? 'Enregistré ✓ — message Discord mis à jour'
      : result.reason === 'not_published' ? 'Enregistré ✓ — publie-le une fois avec /embed pour l’afficher'
      : result.reason === 'deleted' ? 'Enregistré ✓ — le message publié a été supprimé, republie avec /embed'
      : 'Enregistré ✓ — mise à jour Discord impossible (droits ?)')
    : null;

  return (
    <div>
      <header className="dash-module-head">
        <h2>{meta.label}</h2>
        {meta.desc && <p>{meta.desc}</p>}
        {meta.note && <p className="dash-embed-note">ℹ️ {meta.note}</p>}
        {guildId && row?.posted_channel_id && row?.posted_message_id && (
          <p className="dash-embed-note">
            <a
              className="discord-link"
              href={`https://discord.com/channels/${guildId}/${row.posted_channel_id}/${row.posted_message_id}`}
              target="_blank"
              rel="noreferrer"
            >
              Message suivi ↗
            </a>
          </p>
        )}
      </header>

      <div className="dash-msg dash-msg-scroll">
        {/* Éditeur */}
        <div className="dash-msg-editor">
          <div className="dash-field"><span>Titre</span>
            <div className="dash-textarea-wrap">
              <input
                className="dash-input dash-input-emoji"
                value={m.title}
                onChange={(e) => set('title', e.target.value)}
                onFocus={(e) => { active.current = { el: e.currentTarget, target: 'title' }; }}
              />
              <EmojiPicker onSelect={insertEmoji} />
            </div>
          </div>
          <div className="dash-field">
            <span>Description</span>
            <div className="dash-textarea-wrap">
              <textarea
                className="dash-input dash-input-emoji"
                rows={6}
                value={m.description}
                onChange={(e) => set('description', e.target.value)}
                onFocus={(e) => { active.current = { el: e.currentTarget, target: 'description' }; }}
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
                    <input className="dash-input" placeholder="Nom du champ" value={f.name} onChange={(e) => setField(i, 'name', e.target.value)} />
                    <button type="button" className="btn-mini" onClick={() => move(i, -1)} aria-label="Monter">↑</button>
                    <button type="button" className="btn-mini" onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
                    <button type="button" className="dash-pool-del" onClick={() => delField(i)} aria-label="Supprimer">✕</button>
                    <EmojiPicker onSelect={insertEmoji} />
                  </div>
                  <textarea
                    className="dash-input"
                    rows={2}
                    placeholder="Valeur"
                    value={f.value}
                    onChange={(e) => setField(i, 'value', e.target.value)}
                    onFocus={(e) => { active.current = { el: e.currentTarget, target: { field: i } }; }}
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
          <span className="dash-preview-label">Aperçu</span>
          <div className="discord-msg">
            {bot?.avatarUrl ? <img className="discord-avatar-img" src={bot.avatarUrl} alt="" /> : <div className="discord-avatar" />}
            <div className="discord-body">
              <div className="discord-author">{bot?.username || 'Motisma'} <span className="discord-bot">BOT</span></div>
              <div className="discord-embed" style={{ borderColor: m.color }}>
                <div className="discord-embed-main">
                  {m.title && <div className="discord-embed-title">{renderMarkdown(m.title)}</div>}
                  {m.description && <div className="discord-embed-desc"><RichText text={m.description} /></div>}
                  {m.fields.length > 0 && <FieldsPreview fields={m.fields} />}
                  {m.image_url && !m.image_url.startsWith('attachment://') && <img className="discord-embed-image" src={m.image_url} alt="" />}
                  {m.footer_text && <div className="discord-embed-footer">{m.footer_text}</div>}
                </div>
                {m.thumbnail_url && !m.thumbnail_url.startsWith('attachment://') && <img className="discord-embed-thumb" src={m.thumbnail_url} alt="" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
