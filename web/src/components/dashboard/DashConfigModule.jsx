import { useState } from 'react';
import { apiPost } from '../../api.js';

const TEXT_TYPES = new Set([0, 5, 15]); // text, announce, forum

function Selector({ value, onChange, options, placeholder }) {
  return (
    <select className="dash-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">— {placeholder} —</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Editor for the level → role-name list, stored as a JSON string in `level_roles`.
function LevelRolesField({ label, value, onChange }) {
  let list = [];
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed)) list = parsed;
  } catch {
    list = [];
  }
  const update = (next) => onChange(JSON.stringify(next));
  const sorted = [...list].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));

  return (
    <div className="dash-field dash-field-full">
      <span>{label}</span>
      <div className="dash-pool-list">
        {list.map((row, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div className="dash-levelrole-row" key={i}>
            <span className="dash-levelrole-lbl">Niv.</span>
            <input
              type="number"
              min="1"
              className="dash-input dash-levelrole-num"
              value={row.level ?? ''}
              onChange={(e) => {
                const next = [...list];
                next[i] = { ...next[i], level: e.target.value === '' ? null : Number(e.target.value) };
                update(next);
              }}
            />
            <input
              className="dash-input"
              placeholder="Nom du rôle (créé s’il n’existe pas)"
              value={row.name ?? ''}
              onChange={(e) => {
                const next = [...list];
                next[i] = { ...next[i], name: e.target.value };
                update(next);
              }}
            />
            <button
              type="button"
              className="dash-pool-del"
              aria-label="Supprimer ce palier"
              onClick={() => update(list.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-mini" onClick={() => update([...list, { level: null, name: '' }])}>
        + Ajouter un palier
      </button>
      <p className="dash-pool-note">
        Le bot crée le rôle d’après son nom s’il n’existe pas, et l’attribue dès le palier atteint.
        {sorted.length > 0 && ` (${sorted.length} palier${sorted.length > 1 ? 's' : ''})`}
      </p>
    </div>
  );
}

// Editor for the auto-reaction rules, stored as a JSON string in `auto_reactions`.
// Each rule: { channelId, emojis: [...] } → the bot reacts with those emojis on
// images posted in that channel (or anywhere in that forum).
function ReactionsField({ label, value, onChange, channelOptions, hasBot }) {
  let list = [];
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed)) list = parsed;
  } catch {
    list = [];
  }
  const update = (next) => onChange(JSON.stringify(next));
  const setRow = (i, patch) => {
    const next = [...list];
    next[i] = { ...next[i], ...patch };
    update(next);
  };

  return (
    <div className="dash-field dash-field-full">
      <span>{label}</span>
      <div className="dash-pool-list">
        {list.map((row, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div className="dash-reaction-row" key={i}>
            {hasBot ? (
              <select
                className="dash-input dash-reaction-chan"
                value={row.channelId ?? ''}
                onChange={(e) => setRow(i, { channelId: e.target.value })}
              >
                <option value="">— salon / forum —</option>
                {channelOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="dash-input dash-reaction-chan"
                placeholder="ID du salon"
                value={row.channelId ?? ''}
                onChange={(e) => setRow(i, { channelId: e.target.value })}
              />
            )}
            <input
              className="dash-input"
              placeholder="❤️ 🔥 ⭐ (séparés par un espace)"
              value={(row.emojis || []).join(' ')}
              onChange={(e) => setRow(i, { emojis: e.target.value.split(/\s+/).filter(Boolean) })}
            />
            <button
              type="button"
              className="dash-pool-del"
              aria-label="Supprimer cette règle"
              onClick={() => update(list.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-mini"
        onClick={() => update([...list, { channelId: '', emojis: [] }])}
      >
        + Ajouter une règle
      </button>
      <p className="dash-pool-note">
        Plusieurs emojis = plusieurs réactions. Choisis un salon précis ou un forum entier. Emoji
        personnalisé : écris-le sous la forme <code>nom:id</code>.
      </p>
    </div>
  );
}

// Multi-role picker, stored as a JSON string array of role IDs (e.g.
// `validator_role_ids`). Click a role to toggle it on/off. Without the bot
// token, fall back to a comma-separated list of IDs (no selectors available).
function RolesField({ label, value, onChange, roleOptions, hasBot, note }) {
  let ids = [];
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed)) ids = parsed.map((x) => String(x));
  } catch {
    ids = [];
  }
  const selected = new Set(ids);
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(JSON.stringify([...next]));
  };

  return (
    <div className="dash-field dash-field-full">
      <span>{label}</span>
      {hasBot ? (
        <div className="dash-role-chips">
          {roleOptions.map((o) => (
            <button
              type="button"
              key={o.id}
              className={`dash-role-chip${selected.has(o.id) ? ' is-on' : ''}`}
              aria-pressed={selected.has(o.id)}
              onClick={() => toggle(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <input
          className="dash-input"
          placeholder="IDs de rôles séparés par une virgule"
          value={ids.join(', ')}
          onChange={(e) =>
            onChange(
              JSON.stringify(e.target.value.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)),
            )
          }
        />
      )}
      {note && <p className="dash-pool-note">{note}</p>}
    </div>
  );
}

/**
 * One configuration module (a single sidebar entry). Renders its fields and
 * saves only its own columns. `guild`/`setGuild` and the channel/role lists are
 * loaded once by the Dashboard and shared across modules.
 */
export default function DashConfigModule({ section, guild, setGuild, channels, roles, hasBot }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key, v) => {
    setGuild((g) => ({ ...g, [key]: v }));
    setSaved(false);
  };

  // A section is either a flat `fields` list or split into labelled `groups`.
  // `allFields` flattens both so save/category logic stays group-agnostic.
  const allFields = section.groups ? section.groups.flatMap((g) => g.fields) : section.fields;

  const roleOptions = (roles || [])
    .filter((r) => r.name !== '@everyone' && !r.managed)
    .map((r) => ({ id: r.id, label: `@ ${r.name}` }));

  // When the section filters by category, channel/voice selectors only show
  // channels inside the chosen category (pick the category first).
  const categoryField = allFields.find((f) => f[2] === 'category');
  const selectedCategory =
    section.filterByCategory && categoryField ? guild[categoryField[0]] || null : null;

  const chanOptions = (kinds, applyCatFilter) =>
    (channels || [])
      .filter(
        (c) => kinds.has(c.type) && (!applyCatFilter || !selectedCategory || c.parentId === selectedCategory),
      )
      .map((c) => ({ id: c.id, label: c.name }));

  function control([key, , kind]) {
    const value = guild[key] ?? '';
    if (kind === 'role' && hasBot) {
      return <Selector value={value} onChange={(v) => set(key, v)} options={roleOptions} placeholder="aucun rôle" />;
    }
    if (kind === 'channel' && hasBot) {
      return <Selector value={value} onChange={(v) => set(key, v)} options={chanOptions(TEXT_TYPES, true)} placeholder="aucun salon" />;
    }
    if (kind === 'voice' && hasBot) {
      return (
        <Selector
          value={value}
          onChange={(v) => set(key, v)}
          options={chanOptions(new Set([2]), true)}
          placeholder={section.filterByCategory && !selectedCategory ? 'choisis une catégorie' : 'aucun vocal'}
        />
      );
    }
    if (kind === 'category' && hasBot) {
      return <Selector value={value} onChange={(v) => set(key, v)} options={chanOptions(new Set([4]), false)} placeholder="aucune catégorie" />;
    }
    if (kind === 'int') {
      return <input type="number" className="dash-input" value={value} onChange={(e) => set(key, e.target.value)} />;
    }
    if (kind === 'color') {
      return (
        <input
          type="color"
          className="dash-color"
          value={value || '#5b86f7'}
          onChange={(e) => set(key, e.target.value)}
        />
      );
    }
    return (
      <input
        type="text"
        className="dash-input"
        value={value}
        placeholder={!hasBot && kind !== 'text' ? 'ID' : ''}
        onChange={(e) => set(key, e.target.value)}
      />
    );
  }

  // Render a single field (toggle / level-roles / labelled control).
  function renderField(f) {
    if (f[2] === 'boolean') {
      return (
        <label className="dash-toggle dash-field-full" key={f[0]}>
          <input type="checkbox" checked={Boolean(guild[f[0]])} onChange={(e) => set(f[0], e.target.checked)} />
          <span>{f[1]}</span>
        </label>
      );
    }
    if (f[2] === 'levelroles') {
      return <LevelRolesField key={f[0]} label={f[1]} value={guild[f[0]] ?? ''} onChange={(v) => set(f[0], v)} />;
    }
    if (f[2] === 'reactions') {
      return (
        <ReactionsField
          key={f[0]}
          label={f[1]}
          value={guild[f[0]] ?? ''}
          onChange={(v) => set(f[0], v)}
          channelOptions={chanOptions(TEXT_TYPES, false)}
          hasBot={hasBot}
        />
      );
    }
    if (f[2] === 'roles') {
      return (
        <RolesField
          key={f[0]}
          label={f[1]}
          value={guild[f[0]] ?? ''}
          onChange={(v) => set(f[0], v)}
          roleOptions={roleOptions}
          hasBot={hasBot}
          note="Les administrateurs (permission « Gérer les rôles ») peuvent toujours valider, en plus des rôles cochés ici."
        />
      );
    }
    return (
      <label className="dash-field" key={f[0]}>
        <span>{f[1]}</span>
        {control(f)}
      </label>
    );
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {};
      for (const f of allFields) payload[f[0]] = guild[f[0]] ?? '';
      const d = await apiPost('/api/admin/guild', payload);
      if (d.guild) setGuild(d.guild);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-module">
      <header className="dash-module-head">
        <h2>{section.label}</h2>
        {section.desc && <p>{section.desc}</p>}
      </header>

      {!hasBot && (
        <p className="dash-note warn">
          Jeton du bot indisponible : saisie des salons/rôles par ID (pas de sélecteurs).
        </p>
      )}

      {section.groups ? (
        section.groups.map((g) => (
          <div className="dash-group" key={g.title}>
            <div className="dash-group-head">
              <h3 className="dash-group-title">{g.title}</h3>
              {g.desc && <p className="dash-group-desc">{g.desc}</p>}
            </div>
            <div className="dash-fields">{g.fields.map(renderField)}</div>
          </div>
        ))
      ) : (
        <div className="dash-fields">{section.fields.map(renderField)}</div>
      )}

      <div className="dash-save-bar">
        {saved && <span className="dash-saved">Enregistré ✓</span>}
        <button type="button" className="btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <p className="dash-effect-note">
        Enregistré dans la base. Prend effet sur le bot après sa bascule.
      </p>
    </div>
  );
}
