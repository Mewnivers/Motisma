// web/src/components/dashboard/EmojiPicker.jsx
// Bouton qui ouvre une grille des emojis custom (serveur + bot). Un clic appelle
// onSelect(code) où code est le format Discord `<:nom:id>` / `<a:nom:id>`.
import { useEffect, useRef, useState } from 'react';
import { apiGet } from '../../api.js';

// Chargement unique et partagé entre tous les sélecteurs de la page.
let cache = null;
function loadEmojis() {
  if (!cache) {
    cache = apiGet('/api/admin/emojis')
      .then((d) => [
        ...(d.guild || []).map((e) => ({ ...e, source: 'Serveur' })),
        ...(d.application || []).map((e) => ({ ...e, source: 'Bot' })),
      ])
      .catch(() => {
        cache = null; // permet de réessayer à la prochaine ouverture
        return [];
      });
  }
  return cache;
}

const codeFor = (e) => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;
const urlFor = (e) => `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}?size=48`;

/** Bouton + popover d'insertion d'emoji. */
export default function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [emojis, setEmojis] = useState(null);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (open && emojis === null) loadEmojis().then(setEmojis);
  }, [open, emojis]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = (emojis || []).filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  const groups = ['Serveur', 'Bot']
    .map((src) => ({ src, items: filtered.filter((e) => e.source === src) }))
    .filter((g) => g.items.length);

  return (
    <span className="emoji-picker" ref={ref}>
      <button
        type="button"
        className="emoji-picker-btn"
        title="Insérer un emoji"
        aria-label="Insérer un emoji"
        onClick={() => setOpen((o) => !o)}
      >
        😀
      </button>
      {open && (
        <div className="emoji-pop">
          <input
            className="dash-input dash-input-sm emoji-search"
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          {emojis === null ? (
            <p className="emoji-empty">Chargement…</p>
          ) : groups.length === 0 ? (
            <p className="emoji-empty">Aucun emoji.</p>
          ) : (
            groups.map((g) => (
              <div className="emoji-group" key={g.src}>
                <div className="emoji-group-label">{g.src}</div>
                <div className="emoji-grid">
                  {g.items.map((e) => (
                    <button
                      type="button"
                      key={`${e.source}-${e.id}`}
                      className="emoji-item"
                      title={`:${e.name}: · ${e.source}`}
                      onClick={() => {
                        onSelect(codeFor(e));
                        setOpen(false);
                      }}
                    >
                      <img src={urlFor(e)} alt={e.name} loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </span>
  );
}
