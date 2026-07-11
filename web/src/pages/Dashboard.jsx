import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { apiGet } from '../api.js';
import Icon from '../components/Icons.jsx';
import { CONFIG_SECTIONS } from '../components/dashboard/configSections.js';
import { MESSAGE_GROUPS, MESSAGE_TYPES, MESSAGE_BY_KEY } from '../components/dashboard/messageTypes.js';
import DashConfigModule from '../components/dashboard/DashConfigModule.jsx';
import DashMessage from '../components/dashboard/DashMessage.jsx';
import DashOverview from '../components/dashboard/DashOverview.jsx';
import DashMembers from '../components/dashboard/DashMembers.jsx';
import DashStats from '../components/dashboard/DashStats.jsx';

// Message section keys are prefixed to avoid clashing with config keys.
const MSG_PREFIX = 'msg:';

// Top-level categories (short sidebar). `direct` pages render immediately;
// `messages`/`config` show a grid of cards (one per editable section).
const CATEGORIES = [
  { key: 'overview', label: 'Vue d’ensemble', icon: 'grid' },
  { key: 'members', label: 'Membres', icon: 'users' },
  { key: 'stats', label: 'Validation stats', icon: 'check' },
  { key: 'config', label: 'Configuration', icon: 'gear' },
  { key: 'messages', label: 'Messages', icon: 'megaphone' },
];

// Persist the open view across reloads (the auto-reloader otherwise drops you
// back on the overview). Stored per-session in the browser.
const VIEW_KEY = 'pogo_dash_view';

export default function Dashboard() {
  const { user, loading } = useAuth();
  // view: 'overview' | 'members' | 'stats' | 'messages' | 'config'
  //       | 'msg:<key>' (a message editor) | '<configKey>' (a config module)
  const [view, setViewState] = useState(() => {
    try {
      return sessionStorage.getItem(VIEW_KEY) || 'overview';
    } catch {
      return 'overview';
    }
  });
  const setView = (v) => {
    setViewState(v);
    try {
      sessionStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  // Shared state, loaded once.
  const [guild, setGuild] = useState(null);
  const [channels, setChannels] = useState(null);
  const [roles, setRoles] = useState(null);
  const [hasBot, setHasBot] = useState(true);
  const [messages, setMessages] = useState(null);
  const [bot, setBot] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    apiGet('/api/admin/guild')
      .then((d) => setGuild(d.guild || {}))
      .catch(() => setGuild({}));
    apiGet('/api/admin/discord')
      .then((d) => {
        setChannels(d.channels || []);
        setRoles(d.roles || []);
        setHasBot(d.hasBotToken !== false && d.channels != null);
      })
      .catch(() => {
        setChannels([]);
        setRoles([]);
        setHasBot(false);
      });
    apiGet('/api/admin/messages')
      .then((d) => {
        const byKey = {};
        for (const row of d.messages || []) byKey[row.key] = row;
        setMessages(byKey);
        setBot(d.bot || null);
      })
      .catch(() => setMessages({}));
  }, [user]);

  if (loading) {
    return <div className="page"><p className="empty">Chargement…</p></div>;
  }
  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const msgMeta = view.startsWith(MSG_PREFIX)
    ? MESSAGE_TYPES.find((m) => MSG_PREFIX + m.key === view)
    : null;
  const section = CONFIG_SECTIONS.find((s) => s.key === view);

  // Which top category is highlighted for the current view.
  const activeTop = msgMeta ? 'messages' : section ? 'config' : view;

  function CatCard({ icon, label, desc, onClick }) {
    return (
      <button type="button" className="dash-cat-card" onClick={onClick}>
        <Icon name={icon} size={20} />
        <span className="dash-cat-card-label">{label}</span>
        {desc && <span className="dash-cat-card-desc">{desc}</span>}
      </button>
    );
  }

  function Back({ to, label }) {
    return (
      <button type="button" className="dash-back" onClick={() => setView(to)}>
        ← {label}
      </button>
    );
  }

  return (
    <div className="page dash-page">
      <div className="page-head">
        <h1>
          <Icon name="sliders" size={22} /> Dashboard
        </h1>
        <p>Administration de POGO PAU — réservé aux admins du serveur.</p>
      </div>

      <div className="dash-layout">
        <nav className="dash-side">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`dash-side-item${activeTop === c.key ? ' active' : ''}`}
              onClick={() => setView(c.key)}
            >
              <Icon name={c.icon} size={17} />
              <span>{c.label}</span>
            </button>
          ))}
        </nav>

        <section className="dash-content">
          {view === 'overview' && <DashOverview onGoto={setView} />}
          {view === 'members' && <DashMembers />}
          {view === 'stats' && <DashStats />}

          {/* Messages category → grid of cards grouped by sub-category */}
          {view === 'messages' && (
            <div>
              <header className="dash-module-head">
                <h2>Messages</h2>
                <p>Personnalise les textes et embeds envoyés par le bot.</p>
              </header>
              {MESSAGE_GROUPS.map((g) => (
                <div className="dash-cat-block" key={g.group}>
                  <h3 className="dash-cat-block-title">{g.group}</h3>
                  <div className="dash-cat-grid">
                    {g.items.map((m) => (
                      <CatCard
                        key={m.key}
                        icon={m.icon}
                        label={m.label}
                        desc={m.desc}
                        onClick={() => setView(MSG_PREFIX + m.key)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Config category → grid of module cards */}
          {view === 'config' && (
            <div>
              <header className="dash-module-head">
                <h2>Configuration</h2>
                <p>Salons, rôles et réglages du bot.</p>
              </header>
              <div className="dash-cat-grid">
                {CONFIG_SECTIONS.map((s) => (
                  <CatCard
                    key={s.key}
                    icon={s.icon}
                    label={s.label}
                    desc={s.desc}
                    onClick={() => setView(s.key)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Message editor */}
          {msgMeta &&
            (messages === null ? (
              <p className="empty">Chargement…</p>
            ) : (
              <div>
                <Back to="messages" label="Messages" />
                <DashMessage
                  key={msgMeta.key}
                  meta={msgMeta}
                  message={messages[msgMeta.key]}
                  bot={bot}
                  onSaved={(k, row) => setMessages((prev) => ({ ...prev, [k]: { ...prev[k], ...row } }))}
                />
              </div>
            ))}

          {/* Config module editor */}
          {section &&
            (guild === null ? (
              <p className="empty">Chargement…</p>
            ) : (
              <div>
                <Back to="config" label="Configuration" />
                <DashConfigModule
                  section={section}
                  guild={guild}
                  setGuild={setGuild}
                  channels={channels}
                  roles={roles}
                  hasBot={hasBot}
                />

                {section.messageKeys?.length > 0 && (
                  <div className="dash-feature-messages">
                    <h3 className="dash-feature-msg-title">Messages</h3>
                    {messages === null ? (
                      <p className="empty">Chargement…</p>
                    ) : (
                      section.messageKeys.map((k) => (
                        <div className="dash-feature-msg" key={k}>
                          <DashMessage
                            meta={MESSAGE_BY_KEY[k]}
                            message={messages[k]}
                            bot={bot}
                            onSaved={(mk, row) =>
                              setMessages((prev) => ({ ...prev, [mk]: { ...prev[mk], ...row } }))
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
