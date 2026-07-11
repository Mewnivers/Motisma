import { useEffect, useState } from 'react';
import { apiGet } from '../api.js';

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

function formatWhen(startTime, endTime) {
  if (!startTime) return '';
  const start = new Date(startTime);
  let out = dateFmt.format(start);
  if (endTime) {
    const end = new Date(endTime);
    out += start.toDateString() === end.toDateString()
      ? ` – ${timeFmt.format(end)}`
      : ` → ${dateFmt.format(end)}`;
  }
  return out;
}

function EventCard({ event, past }) {
  return (
    <a className={`event-card${past ? ' is-past' : ''}`} href={event.url} target="_blank" rel="noreferrer">
      <div className="event-cover">
        {event.coverUrl ? (
          <img src={event.coverUrl} alt="" loading="lazy" />
        ) : (
          <div className="event-cover-fallback" aria-hidden="true" />
        )}
      </div>
      <div className="event-body">
        <p className="event-when">{formatWhen(event.startTime, event.endTime)}</p>
        <h3 className="event-name">{event.name}</h3>
        {event.location && <p className="event-loc">{event.location}</p>}
        {event.userCount != null && (
          <p className="event-count">
            {event.userCount} intéressé{event.userCount > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </a>
  );
}

export default function Communaute() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet('/api/events')
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const active = data?.active ?? [];
  const upcoming = data?.upcoming ?? [];
  const past = data?.past ?? [];
  const current = [...active, ...upcoming];
  const nothing = data && current.length === 0 && past.length === 0;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Les événements de la communauté</h1>
        <p>
          Les sorties, raids et rendez-vous planifiés sur le Discord de POGO PAU. Clique sur un
          événement pour t'y intéresser et le retrouver dans Discord.
        </p>
      </div>

      {error && <p className="empty">Impossible de charger les événements pour le moment.</p>}
      {!error && !data && <p className="empty">Chargement des événements…</p>}
      {nothing && <p className="empty">Aucun événement pour le moment. Reviens bientôt !</p>}

      {current.length > 0 && (
        <section className="events-section">
          <h2 className="events-title">À venir</h2>
          <div className="events-grid">
            {current.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="events-section">
          <h2 className="events-title">Événements passés</h2>
          <div className="events-grid">
            {past.map((e) => (
              <EventCard key={e.id} event={e} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
