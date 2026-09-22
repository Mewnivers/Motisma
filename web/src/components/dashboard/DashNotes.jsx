// web/src/components/dashboard/DashNotes.jsx
// Carnet de notes façon OneNote : sections + pages (volet gauche) et un éditeur
// riche par page (volet droit). Sauvegarde auto, partagé entre admins.
import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPost } from '../../api.js';

const run = (c, v) => document.execCommand(c, false, v);

function Tool({ label, title, onClick }) {
  return (
    <button
      type="button"
      className="notes-tool"
      title={title}
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
  const [tree, setTree] = useState(null); // sections[] | 'error'
  const [pageId, setPageId] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');

  const ref = useRef(null); // editor div (always mounted, hidden when no page)
  const cTimer = useRef(null);
  const savedContent = useRef('');
  const curPage = useRef(null);

  function loadTree() {
    return apiGet('/api/admin/notes')
      .then((d) => {
        const sections = d.sections || [];
        setTree(sections);
        return sections;
      })
      .catch(() => {
        setTree('error');
        return [];
      });
  }

  function flushContent() {
    const id = curPage.current;
    if (!id || !ref.current) return;
    const html = ref.current.innerHTML;
    if (html === savedContent.current) return;
    savedContent.current = html;
    apiPost(`/api/admin/notes/pages/${id}`, { content: html })
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'));
  }

  function openPage(id) {
    if (String(id) === String(curPage.current)) return;
    flushContent();
    clearTimeout(cTimer.current);
    apiGet(`/api/admin/notes/pages/${id}`)
      .then((d) => {
        const p = d.page;
        curPage.current = p.id;
        setPageId(p.id);
        setTitle(p.title);
        if (ref.current) ref.current.innerHTML = p.content || '';
        savedContent.current = ref.current ? ref.current.innerHTML : p.content || '';
        setStatus('');
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadTree().then((secs) => {
      const first = secs.flatMap((s) => s.pages)[0];
      if (first) openPage(first.id);
    });
    return () => {
      clearTimeout(cTimer.current);
      flushContent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- éditeur ---
  function onInput() {
    setStatus('saving');
    clearTimeout(cTimer.current);
    cTimer.current = setTimeout(flushContent, 700);
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

  // --- titre de la page ---
  function setTreeTitle(id, t) {
    setTree((prev) =>
      Array.isArray(prev)
        ? prev.map((s) => ({ ...s, pages: s.pages.map((p) => (String(p.id) === String(id) ? { ...p, title: t } : p)) }))
        : prev,
    );
  }
  function onTitleChange(v) {
    setTitle(v);
    setTreeTitle(pageId, v);
  }
  function saveTitle() {
    if (pageId) apiPost(`/api/admin/notes/pages/${pageId}`, { title }).catch(() => {});
  }

  // --- structure ---
  async function addSection() {
    const t = window.prompt('Nom de la section :', 'Nouvelle section');
    if (t === null) return;
    await apiPost('/api/admin/notes/sections', { title: t.trim() || 'Section' }).catch(() => {});
    loadTree();
  }
  async function renameSection(s) {
    const t = window.prompt('Renommer la section :', s.title);
    if (t === null) return;
    await apiPost(`/api/admin/notes/sections/${s.id}`, { title: t.trim() }).catch(() => {});
    loadTree();
  }
  async function deleteSection(s) {
    if (!window.confirm(`Supprimer la section « ${s.title} » et toutes ses pages ?`)) return;
    await apiPost(`/api/admin/notes/sections/${s.id}/delete`).catch(() => {});
    if (s.pages.some((p) => String(p.id) === String(pageId))) {
      curPage.current = null;
      setPageId(null);
    }
    loadTree();
  }
  async function addPage(s) {
    const { page } = await apiPost('/api/admin/notes/pages', { section_id: s.id, title: 'Sans titre' });
    await loadTree();
    openPage(page.id);
  }
  async function deletePage(p) {
    if (!window.confirm(`Supprimer la page « ${p.title || 'Sans titre'} » ?`)) return;
    await apiPost(`/api/admin/notes/pages/${p.id}/delete`).catch(() => {});
    if (String(p.id) === String(pageId)) {
      curPage.current = null;
      setPageId(null);
    }
    loadTree();
  }

  if (tree === null) return <p className="empty">Chargement…</p>;
  if (tree === 'error') return <p className="dash-error">Impossible de charger les notes.</p>;

  const statusText =
    status === 'saving' ? 'Enregistrement…' : status === 'saved' ? 'Enregistré ✓' : status === 'error' ? 'Échec de la sauvegarde' : '';

  return (
    <div>
      <header className="dash-module-head">
        <h2>Notes</h2>
        <p>Carnet pour Motisma — sections et pages, éditeur riche. Partagé entre admins.</p>
      </header>

      <div className="notebook">
        <aside className="nb-tree">
          {tree.map((s) => (
            <div className="nb-section" key={s.id}>
              <div className="nb-section-head">
                <span className="nb-section-title" title={s.title}>{s.title}</span>
                <span className="nb-section-actions">
                  <button type="button" className="nb-mini" title="Ajouter une page" onClick={() => addPage(s)}>＋</button>
                  <button type="button" className="nb-mini" title="Renommer la section" onClick={() => renameSection(s)}>✎</button>
                  <button type="button" className="nb-mini" title="Supprimer la section" onClick={() => deleteSection(s)}>✕</button>
                </span>
              </div>
              <ul className="nb-pages">
                {s.pages.length === 0 && <li className="nb-empty">Aucune page</li>}
                {s.pages.map((p) => (
                  <li key={p.id} className={`nb-page${String(p.id) === String(pageId) ? ' active' : ''}`}>
                    <button type="button" className="nb-page-btn" onClick={() => openPage(p.id)}>
                      {p.title || 'Sans titre'}
                    </button>
                    <button type="button" className="nb-mini nb-page-del" title="Supprimer la page" onClick={() => deletePage(p)}>✕</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button type="button" className="nb-add-section" onClick={addSection}>+ Nouvelle section</button>
        </aside>

        <section className="nb-editor">
          {pageId === null && <p className="empty nb-none">Sélectionne ou crée une page.</p>}
          <div hidden={pageId === null}>
            <input
              className="nb-title-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={saveTitle}
              placeholder="Titre de la page"
            />
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
                  clearTimeout(cTimer.current);
                  flushContent();
                }}
                data-placeholder="Écris ici…"
              />
            </div>
            <div className="notes-status">{statusText}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
