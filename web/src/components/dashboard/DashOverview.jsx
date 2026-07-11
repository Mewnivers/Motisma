import { useEffect, useState } from 'react';
import { apiGet } from '../../api.js';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('fr-FR'));

const TEAMS = [
  { key: 'mystic', label: 'Sagesse', color: '#3b82f6' },
  { key: 'valor', label: 'Bravoure', color: '#ef4444' },
  { key: 'instinct', label: 'Intuition', color: '#eab308' },
];

function Stat({ value, label, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-num">{value}</span>
      <span className="stat-lab">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

/** Dashboard home: server stats at a glance. */
export default function DashOverview({ onGoto }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiGet('/api/admin/overview')
      .then(setData)
      .catch(() => setData({ stats: null, server: null }));
  }, []);

  if (data === null) return <p className="empty">Chargement…</p>;

  const s = data.stats || {};
  const srv = data.server;
  const teams = s.teams || {};
  const teamTotal = TEAMS.reduce((a, t) => a + (teams[t.key] || 0), 0) || 1;

  return (
    <div>
      <header className="dash-module-head">
        <h2>Vue d’ensemble</h2>
        <p>L’état du serveur POGO PAU en un coup d’œil.</p>
      </header>

      <div className="dash-stats">
        <Stat
          value={fmt(srv?.memberCount)}
          label="Membres du serveur"
          hint={srv?.onlineCount != null ? `${fmt(srv.onlineCount)} en ligne` : 'Discord indisponible'}
        />
        <Stat value={fmt(s.withProfile)} label="Profils Pokémon GO" hint={`${fmt(s.members)} suivis en base`} />
        <Stat value={fmt(s.classement)} label="Inscrits au classement" />
        <button type="button" className="stat-card stat-action" onClick={() => onGoto?.('stats')}>
          <span className="stat-num">{fmt(s.pending)}</span>
          <span className="stat-lab">Stats à valider</span>
          {s.pending > 0 && <span className="stat-hint accent">À traiter →</span>}
        </button>
      </div>

      <div className="dash-card teams-card">
        <h3>Répartition par équipe</h3>
        <div className="team-bars">
          {TEAMS.map((t) => {
            const n = teams[t.key] || 0;
            return (
              <div className="team-row" key={t.key}>
                <span className="team-name">{t.label}</span>
                <div className="team-track">
                  <div
                    className="team-fill"
                    style={{ width: `${(n / teamTotal) * 100}%`, background: t.color }}
                  />
                </div>
                <span className="team-count">{fmt(n)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
