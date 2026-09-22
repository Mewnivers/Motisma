// web/src/components/dashboard/DashEmbedList.jsx
// Section "Embeds d'info" de la Configuration : grille de cartes (une par
// embed éditable) puis éditeur DashEmbed pour l'embed sélectionné.
import { useEffect, useState } from 'react';
import { apiGet } from '../../api.js';
import { EMBED_TYPES, EMBED_BY_KEY } from './embedTypes.js';
import DashEmbed from './DashEmbed.jsx';
import Icon from '../Icons.jsx';

export default function DashEmbedList({ onExit }) {
  const [data, setData] = useState(null); // { rowsByKey, bot, guildId } | 'error'
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    apiGet('/api/admin/embeds')
      .then((d) => {
        const rowsByKey = {};
        for (const row of d.embeds || []) rowsByKey[row.key] = row;
        setData({ rowsByKey, bot: d.bot, guildId: d.guildId });
      })
      .catch(() => setData('error'));
  }, []);

  if (data === null) return <p className="empty">Chargement…</p>;
  if (data === 'error') return <p className="dash-error">Impossible de charger les embeds.</p>;

  if (selected) {
    const meta = EMBED_BY_KEY[selected];
    const onSaved = (key, row) =>
      setData((prev) => ({ ...prev, rowsByKey: { ...prev.rowsByKey, [key]: row } }));
    const editor = (m) => (
      <DashEmbed meta={m} row={data.rowsByKey[m.key]} bot={data.bot} guildId={data.guildId} onSaved={onSaved} />
    );
    return (
      <div>
        <button type="button" className="dash-back" onClick={() => setSelected(null)}>
          ← Embeds d’info
        </button>
        {meta.group ? (
          <>
            <header className="dash-module-head">
              <h2>{meta.label}</h2>
              {meta.desc && <p>{meta.desc}</p>}
            </header>
            {meta.group.map((sub, i) => (
              <div key={sub.key}>
                {i > 0 && <hr className="dash-embed-sep" />}
                {editor(sub)}
              </div>
            ))}
          </>
        ) : (
          editor(meta)
        )}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="dash-back" onClick={onExit}>
        ← Configuration
      </button>
      <header className="dash-module-head">
        <h2>Embeds d’information</h2>
        <p>Modifie les embeds publiés par /embed. L’enregistrement met à jour le message Discord.</p>
      </header>
      <div className="dash-cat-grid">
        {EMBED_TYPES.map((t) => (
          <button type="button" key={t.key} className="dash-cat-card" onClick={() => setSelected(t.key)}>
            <Icon name={t.icon} size={20} />
            <span className="dash-cat-card-label">{t.label}</span>
            {t.desc && <span className="dash-cat-card-desc">{t.desc}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
