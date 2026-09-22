// web/src/components/dashboard/DashNotes.jsx
// Bloc-notes libre pour Motisma : une grande zone de texte, sauvegarde
// automatique (débounce), partagée entre admins et persistée en base.
import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../../api.js';

export default function DashNotes() {
  const [content, setContent] = useState(null); // null = chargement
  const [status, setStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const timer = useRef(null);
  const latest = useRef('');
  const saved = useRef('');

  function flush() {
    if (latest.current === saved.current) return;
    const v = latest.current;
    saved.current = v;
    apiPost('/api/admin/notes', { content: v })
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    apiGet('/api/admin/notes')
      .then((d) => {
        const c = d.content ?? '';
        setContent(c);
        latest.current = c;
        saved.current = c;
      })
      .catch(() => setContent(''));
    // Sauvegarde ce qui reste en attente si on quitte la page.
    return () => {
      clearTimeout(timer.current);
      flush();
    };
  }, []);

  function onChange(v) {
    setContent(v);
    latest.current = v;
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }

  function onBlur() {
    clearTimeout(timer.current);
    flush();
  }

  if (content === null) return <p className="empty">Chargement…</p>;

  const statusText =
    status === 'saving'
      ? 'Enregistrement…'
      : status === 'saved'
        ? 'Enregistré ✓'
        : status === 'error'
          ? 'Échec de la sauvegarde'
          : '';

  return (
    <div>
      <header className="dash-module-head">
        <h2>Notes</h2>
        <p>Bloc-notes libre pour Motisma. Sauvegarde automatique, partagé entre admins.</p>
      </header>
      <div className="notes-wrap">
        <textarea
          className="dash-input notes-area"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Écris tes notes ici…"
        />
        <div className="notes-status">{statusText}</div>
      </div>
    </div>
  );
}
