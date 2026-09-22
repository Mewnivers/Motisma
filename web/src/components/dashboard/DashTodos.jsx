// web/src/components/dashboard/DashTodos.jsx
// Bloc-notes de tâches à faire sur Motisma, partagé entre admins et persisté en
// base. Ajouter, cocher (fait), supprimer.
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../api.js';

// Non faites d'abord, puis les plus récentes.
const reorder = (list) => [...list].sort((a, b) => Number(a.done) - Number(b.done) || Number(b.id) - Number(a.id));

export default function DashTodos() {
  const [todos, setTodos] = useState(null); // array | 'error'
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet('/api/admin/todos')
      .then((d) => setTodos(d.todos || []))
      .catch(() => setTodos('error'));
  }, []);

  async function add(e) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const { todo } = await apiPost('/api/admin/todos', { text: t });
      setTodos((prev) => [todo, ...(Array.isArray(prev) ? prev : [])]);
      setText('');
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  function toggle(item) {
    const done = !item.done;
    setTodos((prev) => reorder(prev.map((x) => (x.id === item.id ? { ...x, done } : x))));
    apiPost(`/api/admin/todos/${item.id}`, { done }).catch(() => {});
  }

  function remove(item) {
    setTodos((prev) => prev.filter((x) => x.id !== item.id));
    apiPost(`/api/admin/todos/${item.id}/delete`).catch(() => {});
  }

  if (todos === null) return <p className="empty">Chargement…</p>;
  if (todos === 'error') return <p className="dash-error">Impossible de charger la liste.</p>;

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div>
      <header className="dash-module-head">
        <h2>Notes</h2>
        <p>Bloc-notes des tâches à faire sur Motisma. Partagé entre admins.</p>
      </header>

      <form className="todo-add" onSubmit={add}>
        <input
          className="dash-input"
          placeholder="Nouvelle tâche…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" className="btn-primary" disabled={busy || !text.trim()}>
          Ajouter
        </button>
      </form>

      {todos.length === 0 ? (
        <p className="empty todo-empty">Rien à faire pour l’instant. 🎉</p>
      ) : (
        <ul className="todo-list">
          {todos.map((item) => (
            <li key={item.id} className={`todo-item${item.done ? ' done' : ''}`}>
              <label className="todo-check">
                <input type="checkbox" checked={item.done} onChange={() => toggle(item)} />
                <span className="todo-text">{item.text}</span>
              </label>
              <button type="button" className="todo-del" onClick={() => remove(item)} aria-label="Supprimer">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="todo-count">
        {remaining} tâche{remaining > 1 ? 's' : ''} à faire
      </p>
    </div>
  );
}
