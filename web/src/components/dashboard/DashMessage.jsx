import { useState } from 'react';
import { apiPost } from '../../api.js';

const SAMPLE = { '{user}': '@Dresseur', '{level}': '7' };
const fillVars = (s) =>
  (s || '').replace(/\{user\}|\{level\}/g, (m) => SAMPLE[m] ?? m);

// Render the Discord markdown subset (bold, underline, strike, italic, code) as
// React nodes, so the preview shows formatting instead of raw ** _ ~ ` markers.
function renderMarkdown(text) {
  const rules = [
    [/\*\*([\s\S]+?)\*\*/, 'strong'],
    [/__([\s\S]+?)__/, 'u'],
    [/~~([\s\S]+?)~~/, 's'],
    [/\*([\s\S]+?)\*/, 'em'],
    [/_([\s\S]+?)_/, 'em'],
    [/`([\s\S]+?)`/, 'code'],
  ];
  let counter = 0;
  function walk(str) {
    if (!str) return [];
    let best = null;
    for (const [re, tag] of rules) {
      const m = re.exec(str);
      if (m && (!best || m.index < best.m.index)) best = { m, tag };
    }
    if (!best) return [str];
    const { m, tag: Tag } = best;
    const out = [];
    if (m.index > 0) out.push(str.slice(0, m.index));
    out.push(
      <Tag key={counter++}>{walk(m[1])}</Tag>,
    );
    out.push(...walk(str.slice(m.index + m[0].length)));
    return out;
  }
  return walk(text || '');
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="dash-toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Rich editor + live preview for one customisable bot message. */
export default function DashMessage({ meta, message, bot, onSaved }) {
  const [m, setM] = useState(() => ({
    enabled: true,
    content: '',
    embed_enabled: false,
    embed_title: '',
    embed_description: '',
    embed_color: '#5b86f7',
    embed_image: '',
    embed_thumbnail: '',
    embed_footer: '',
    ephemeral: false,
    ...(message || {}),
  }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => {
    setM((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  // Pool editor: lines list backed by the newline-joined content.
  const lines = meta.pool ? (m.content ? m.content.split('\n') : []) : null;
  const setLines = (next) => set('content', next.join('\n'));

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      // For pools, drop empty lines before saving.
      const content = meta.pool
        ? (m.content || '')
            .split('\n')
            .map((l) => l.trimEnd())
            .filter((l) => l.trim() !== '')
            .join('\n')
        : m.content ?? '';
      const payload = {
        enabled: m.enabled,
        content,
        embed_enabled: m.embed_enabled,
        embed_title: m.embed_title ?? '',
        embed_description: m.embed_description ?? '',
        embed_color: m.embed_color ?? '',
        embed_image: m.embed_image ?? '',
        embed_thumbnail: m.embed_thumbnail ?? '',
        embed_footer: m.embed_footer ?? '',
        ephemeral: m.ephemeral,
      };
      await apiPost(`/api/admin/messages/${meta.key}`, payload);
      onSaved?.(meta.key, { key: meta.key, ...payload });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const color = m.embed_color || '#5b86f7';
  // For pools, preview a single (first) line — that's what a member sees.
  const previewContent = meta.pool
    ? (m.content || '').split('\n').find((l) => l.trim()) || ''
    : m.content || '';

  return (
    <div>
      <header className="dash-module-head">
        <h2>{meta.label}</h2>
        {meta.desc && <p>{meta.desc}</p>}
      </header>

      <div className="dash-msg">
        {/* Editor */}
        <div className="dash-msg-editor">
          <Toggle checked={m.enabled} onChange={(v) => set('enabled', v)} label="Message activé" />

          {meta.pool ? (
            <div className="dash-field">
              <span>Messages (le bot en tire un au hasard)</span>
              <div className="dash-pool-list">
                {lines.map((line, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div className="dash-pool-row" key={i}>
                    <span className="dash-pool-idx">{i + 1}</span>
                    <input
                      className="dash-input"
                      value={line}
                      onChange={(e) => {
                        const next = [...lines];
                        next[i] = e.target.value;
                        setLines(next);
                      }}
                    />
                    <button
                      type="button"
                      className="dash-pool-del"
                      aria-label="Supprimer ce message"
                      onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-mini" onClick={() => setLines([...lines, ''])}>
                + Ajouter un message
              </button>
            </div>
          ) : (
            <label className="dash-field">
              <span>Texte du message</span>
              <textarea
                className="dash-input"
                rows={3}
                value={m.content ?? ''}
                onChange={(e) => set('content', e.target.value)}
              />
            </label>
          )}

          {meta.vars.length > 0 && (
            <div className="dash-vars">
              Variables :
              {meta.vars.map((v) => (
                <code key={v}>{v}</code>
              ))}
            </div>
          )}

          {!meta.channel && (
            <Toggle
              checked={m.ephemeral}
              onChange={(v) => set('ephemeral', v)}
              label="Message éphémère (visible seulement par le membre)"
            />
          )}

          <hr className="dash-sep" />

          <Toggle
            checked={m.embed_enabled}
            onChange={(v) => set('embed_enabled', v)}
            label="Ajouter un embed"
          />

          {m.embed_enabled && (
            <div className="dash-embed-fields">
              <label className="dash-field">
                <span>Titre</span>
                <input className="dash-input" value={m.embed_title ?? ''} onChange={(e) => set('embed_title', e.target.value)} />
              </label>
              <label className="dash-field">
                <span>Description</span>
                <textarea className="dash-input" rows={3} value={m.embed_description ?? ''} onChange={(e) => set('embed_description', e.target.value)} />
              </label>
              <div className="dash-field-row">
                <label className="dash-field dash-field-color">
                  <span>Couleur</span>
                  <input type="color" value={color} onChange={(e) => set('embed_color', e.target.value)} />
                </label>
                <label className="dash-field">
                  <span>Pied de page</span>
                  <input className="dash-input" value={m.embed_footer ?? ''} onChange={(e) => set('embed_footer', e.target.value)} />
                </label>
              </div>
              <label className="dash-field">
                <span>Image (URL)</span>
                <input className="dash-input" value={m.embed_image ?? ''} onChange={(e) => set('embed_image', e.target.value)} placeholder="https://…" />
              </label>
              <label className="dash-field">
                <span>Miniature (URL)</span>
                <input className="dash-input" value={m.embed_thumbnail ?? ''} onChange={(e) => set('embed_thumbnail', e.target.value)} placeholder="https://…" />
              </label>
            </div>
          )}

          <div className="dash-save-bar">
            {saved && <span className="dash-saved">Enregistré ✓</span>}
            <button type="button" className="btn-primary" disabled={saving} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
          <p className="dash-effect-note">Enregistré dans la base. Prend effet sur le bot après sa bascule.</p>
        </div>

        {/* Live preview */}
        <div className="dash-msg-preview">
          <span className="dash-preview-label">Aperçu</span>
          <div className="discord-msg">
            {bot?.avatarUrl ? (
              <img className="discord-avatar-img" src={bot.avatarUrl} alt="" />
            ) : (
              <div className="discord-avatar" />
            )}
            <div className="discord-body">
              <div className="discord-author">
                {bot?.username || 'Motisma'} <span className="discord-bot">BOT</span>
              </div>
              {previewContent && <div className="discord-text">{renderMarkdown(fillVars(previewContent))}</div>}
              {m.embed_enabled && (
                <div className="discord-embed" style={{ borderColor: color }}>
                  <div className="discord-embed-main">
                    {m.embed_title && <div className="discord-embed-title">{fillVars(m.embed_title)}</div>}
                    {m.embed_description && <div className="discord-embed-desc">{renderMarkdown(fillVars(m.embed_description))}</div>}
                    {m.embed_image && <img className="discord-embed-image" src={m.embed_image} alt="" />}
                    {m.embed_footer && <div className="discord-embed-footer">{fillVars(m.embed_footer)}</div>}
                  </div>
                  {m.embed_thumbnail && <img className="discord-embed-thumb" src={m.embed_thumbnail} alt="" />}
                </div>
              )}
              {!previewContent && !m.embed_enabled && <div className="discord-text muted">(message vide)</div>}
            </div>
          </div>
          {!meta.channel && m.ephemeral && (
            <p className="dash-ephemeral-note">Visible uniquement par le membre concerné.</p>
          )}
        </div>
      </div>
    </div>
  );
}
