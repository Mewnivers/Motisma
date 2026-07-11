import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../api.js';

const fmtInt = (n) => (n == null ? '—' : Number(n).toLocaleString('fr-FR'));
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR');
};

/** Validation queue for member-submitted stats (pogo_stats, web-owned). */
export default function DashStats() {
  const [pending, setPending] = useState(null); // null = loading
  const [busy, setBusy] = useState(null);

  const load = () =>
    apiGet('/api/admin/pending')
      .then((d) => setPending(d.pending || []))
      .catch(() => setPending([]));

  useEffect(() => {
    load();
  }, []);

  async function review(id, status) {
    setBusy(id);
    try {
      await apiPost(`/api/admin/review/${id}`, { status });
      setPending((p) => (p ? p.filter((s) => s.id !== id) : p));
    } catch {
      load();
    } finally {
      setBusy(null);
    }
  }

  if (pending === null) return <p className="empty">Chargement…</p>;
  if (pending.length === 0) return <p className="empty">Aucune soumission en attente.</p>;

  return (
    <div className="dash-list">
      {pending.map((s) => (
        <div className="dash-row" key={s.id}>
          <div className="dash-row-main">
            <strong>{s.ign || s.discordId}</strong>
            <span className="dash-row-sub">
              Niveau {s.level ?? '—'} · {fmtInt(s.totalXp)} XP · {s.team || '—'} · {fmtDate(s.submittedAt)}
            </span>
          </div>
          {s.screenshotUrl && (
            <a className="dash-link-sm" href={s.screenshotUrl} target="_blank" rel="noreferrer">
              Capture
            </a>
          )}
          <div className="dash-row-actions">
            <button
              type="button"
              className="btn-ok"
              disabled={busy === s.id}
              onClick={() => review(s.id, 'approved')}
            >
              Approuver
            </button>
            <button
              type="button"
              className="btn-ko"
              disabled={busy === s.id}
              onClick={() => review(s.id, 'rejected')}
            >
              Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
