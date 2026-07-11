import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../api.js';

const fmtInt = (n) => (n == null ? '—' : Number(n).toLocaleString('fr-FR'));

/**
 * Member moderation over the LIVE server roster. Edits write the bot's live
 * tables (pogo_profiles / levels), upserting a row if the member had none.
 */
export default function DashMembers() {
  const [members, setMembers] = useState(null);
  const [busy, setBusy] = useState(null);
  const [q, setQ] = useState('');

  const load = () =>
    apiGet('/api/admin/members')
      .then((d) => setMembers(d.members || []))
      .catch(() => setMembers([]));

  useEffect(() => {
    load();
  }, []);

  function patchLocal(id, patch) {
    setMembers((ms) => ms.map((m) => (m.discordId === id ? { ...m, ...patch } : m)));
  }

  async function saveIgn(m, value) {
    if (value === (m.ign ?? '')) return;
    setBusy(m.discordId);
    try {
      await apiPost(`/api/admin/members/${m.discordId}`, { ign: value });
      patchLocal(m.discordId, { ign: value });
    } finally {
      setBusy(null);
    }
  }

  async function toggleClassement(m) {
    setBusy(m.discordId);
    try {
      await apiPost(`/api/admin/members/${m.discordId}`, { classement: !m.classement });
      patchLocal(m.discordId, { classement: !m.classement });
    } finally {
      setBusy(null);
    }
  }

  async function applyXp(m, mode) {
    const raw = window.prompt(mode === 'add' ? 'XP à ajouter (négatif pour retirer) :' : 'Nouvelle valeur d’XP :');
    if (raw == null) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount)) return;
    setBusy(m.discordId);
    try {
      await apiPost(`/api/admin/members/${m.discordId}/xp`, { amount, mode });
      patchLocal(m.discordId, {
        chatXp: mode === 'add' ? Math.max((m.chatXp || 0) + amount, 0) : Math.max(amount, 0),
      });
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    if (!members) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter(
      (m) =>
        (m.username || '').toLowerCase().includes(needle) ||
        (m.ign || '').toLowerCase().includes(needle),
    );
  }, [members, q]);

  if (members === null) return <p className="empty">Chargement…</p>;

  return (
    <div>
      <div className="dash-members-bar">
        <input
          type="search"
          className="dash-input dash-search"
          placeholder="Rechercher un membre ou un IGN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="dash-count">
          {filtered.length} / {members.length} membre{members.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Membre</th>
              <th>IGN</th>
              <th>Équipe</th>
              <th>Niveau</th>
              <th>XP jeu</th>
              <th>XP chat</th>
              <th>Classement</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.discordId} className={busy === m.discordId ? 'is-busy' : ''}>
                <td>
                  <div className="dash-member">
                    {m.avatarUrl && <img src={m.avatarUrl} alt="" width="28" height="28" />}
                    <span className="dash-member-name">{m.username}</span>
                  </div>
                </td>
                <td>
                  <input
                    className="dash-input dash-input-sm"
                    defaultValue={m.ign ?? ''}
                    placeholder="—"
                    onBlur={(e) => saveIgn(m, e.target.value.trim())}
                  />
                </td>
                <td>{m.team || '—'}</td>
                <td>{m.level ?? '—'}</td>
                <td>{fmtInt(m.totalXp)}</td>
                <td>{fmtInt(m.chatXp)}</td>
                <td>
                  <button
                    type="button"
                    className={`dash-pill ${m.classement ? 'on' : 'off'}`}
                    disabled={busy === m.discordId}
                    onClick={() => toggleClassement(m)}
                  >
                    {m.classement ? 'Inscrit' : 'Hors'}
                  </button>
                </td>
                <td className="dash-row-actions">
                  <button type="button" className="btn-mini" disabled={busy === m.discordId} onClick={() => applyXp(m, 'set')}>
                    XP =
                  </button>
                  <button type="button" className="btn-mini" disabled={busy === m.discordId} onClick={() => applyXp(m, 'add')}>
                    XP +
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
