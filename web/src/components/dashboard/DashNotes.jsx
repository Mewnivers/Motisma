// web/src/components/dashboard/DashNotes.jsx
// Bloc-notes riche pour Motisma : éditeur contentEditable + barre d'outils
// (gras, italique, titres, listes, liens…). Sauvegarde automatique du HTML,
// partagé entre admins et persisté en base.
import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../../api.js';

// execCommand est déprécié mais reste universellement supporté ; suffisant et
// sans dépendance pour un éditeur d'outil interne.
const run = (c, v) => document.execCommand(c, false, v);

function Tool({ label, title, onClick }) {
  return (
    <button
      type="button"
      className="notes-tool"
      title={title}
      // Ne pas voler la sélection de l'éditeur.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {label}
    </button>
  );
}

export default function DashNotes() {
  const [status, setStatus] = useState('');
  const ref = useRef(null);
  const timer = useRef(null);
  const saved = useRef('');

  function flush() {
    const v = ref.current ? ref.current.innerHTML : '';
    if (v === saved.current) return;
    saved.current = v;
    apiPost('/api/admin/notes', { content: v })
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    apiGet('/api/admin/notes')
      .then((d) => {
        const c = d.content ?? '';
        if (ref.current) ref.current.innerHTML = c;
        saved.current = c;
      })
      .catch(() => {});
    return () => {
      clearTimeout(timer.current);
      flush();
    };
  }, []);

  function onInput() {
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  }

  function exec(c, v) {
    ref.current?.focus();
    run(c, v);
    onInput();
  }

  function link() {
    const url = window.prompt('Lien (URL) :');
    if (url) exec('createLink', url);
  }

  return (
    <div>
      <header className="dash-module-head">
        <h2>Notes</h2>
        <p>Bloc-notes pour Motisma. Éditeur riche, sauvegarde auto, partagé entre admins.</p>
      </header>

      <div className="notes-editor">
        <div className="notes-toolbar">
          <Tool label={<b>G</b>} title="Gras (Ctrl+B)" onClick={() => exec('bold')} />
          <Tool label={<i>I</i>} title="Italique (Ctrl+I)" onClick={() => exec('italic')} />
          <Tool label={<u>S</u>} title="Souligné (Ctrl+U)" onClick={() => exec('underline')} />
          <Tool label={<s>B</s>} title="Barré" onClick={() => exec('strikeThrough')} />
          <span className="notes-sep" />
          <Tool label="Titre" title="Titre" onClick={() => exec('formatBlock', 'H2')} />
          <Tool label="Sous-titre" title="Sous-titre" onClick={() => exec('formatBlock', 'H3')} />
          <Tool label="¶" title="Paragraphe normal" onClick={() => exec('formatBlock', 'P')} />
          <span className="notes-sep" />
          <Tool label="• Liste" title="Liste à puces" onClick={() => exec('insertUnorderedList')} />
          <Tool label="1. Liste" title="Liste numérotée" onClick={() => exec('insertOrderedList')} />
          <span className="notes-sep" />
          <Tool label="🔗" title="Insérer un lien" onClick={link} />
          <Tool label="⌫ format" title="Effacer la mise en forme" onClick={() => exec('removeFormat')} />
        </div>
        <div
          ref={ref}
          className="notes-content"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={onInput}
          onBlur={() => {
            clearTimeout(timer.current);
            flush();
          }}
          data-placeholder="Écris tes notes ici…"
        />
      </div>

      <div className="notes-status">
        {status === 'saving'
          ? 'Enregistrement…'
          : status === 'saved'
            ? 'Enregistré ✓'
            : status === 'error'
              ? 'Échec de la sauvegarde'
              : ''}
      </div>
    </div>
  );
}
