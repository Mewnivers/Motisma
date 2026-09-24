import { useAuth } from '../auth.jsx';
import { DISCORD_INVITE } from '../config.js';
import { COMMAND_GROUPS } from '../data/commands.js';
import DiscordLogo from '../components/DiscordLogo.jsx';
import Icon from '../components/Icons.jsx';

// Chaque étape : un texte + un visuel (maquette CSS ou vraies images du site).
const STEPS = [
  {
    title: 'Rejoins le Discord',
    body: (
      <>
        Choisis ton secteur dans « Salons et rôles » : ça te connecte aux dresseurs proches de
        chez toi et fait vivre la communauté.
      </>
    ),
    visual: (
      <div className="mock mock-roles">
        <div className="mock-roles-head">
          <Icon name="grid" size={14} /> Salons et rôles
        </div>
        <div className="mock-roles-chips">
          {['Centre', 'Jurançon', 'Lons', 'Billère', 'Gan', 'Gelos'].map((s, i) => (
            <span key={s} className={`mock-chip${i === 0 ? ' is-on' : ''}`}>
              {s}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Enregistre ton profil',
    body: (
      <>
        Avec <code>/set-pogo</code>, renseigne ton nom de dresseur et ton code ami. Ils
        apparaissent ensuite dans <code>/userinfo</code>.
      </>
    ),
    visual: (
      <div className="mock mock-profile">
        <img className="mock-avatar" src="/pokeball.png" alt="" width="42" height="42" />
        <div className="mock-profile-info">
          <span className="mock-profile-name">RedAsh</span>
          <span className="mock-profile-code">Code ami · 1234 5678 9012</span>
        </div>
        <div className="mock-teams">
          <img src="/teams/mystic.webp" alt="Sagesse" />
          <img src="/teams/valor.webp" alt="Bravoure" />
          <img src="/teams/instinct.webp" alt="Intuition" />
        </div>
      </div>
    ),
  },
  {
    title: 'Discute et gagne de l’XP',
    body: (
      <>
        Tu montes en niveau simplement en participant sur le serveur. Suis ta progression avec{' '}
        <code>/niveau</code> et <code>/classement</code>.
      </>
    ),
    visual: (
      <div className="mock mock-level">
        <div className="mock-level-top">
          <span className="mock-level-lvl">Niveau 12</span>
          <span className="mock-level-xp">8 420 / 12 000 XP</span>
        </div>
        <div className="mock-bar">
          <span style={{ width: '70%' }} />
        </div>
      </div>
    ),
  },
  {
    title: 'Rejoins le classement Pokémon GO',
    body: (
      <>
        Fais <code>/classement-pogo rejoindre</code>, puis envoie une capture de ton profil en MP
        au bot : il lit tes stats tout seul.
      </>
    ),
    visual: (
      <div className="mock mock-medals">
        <figure>
          <img src="/medals/experience-gold.png" alt="Badge or" />
          <figcaption>1re</figcaption>
        </figure>
        <figure>
          <img src="/medals/experience-silver.png" alt="Badge argent" />
          <figcaption>2e</figcaption>
        </figure>
        <figure>
          <img src="/medals/experience-bronze.png" alt="Badge bronze" />
          <figcaption>3e</figcaption>
        </figure>
      </div>
    ),
  },
  {
    title: 'Organise ou rejoins une sortie',
    body: (
      <>
        Avec <code>/rdv</code>, un salon dédié est créé avec inscriptions par bouton. Tous les
        niveaux sont les bienvenus.
      </>
    ),
    visual: (
      <div className="mock mock-rdv">
        <div className="mock-rdv-embed">
          <span className="mock-rdv-eyebrow">Nouvelle sortie</span>
          <span className="mock-rdv-title">Parc Beaumont</span>
          <span className="mock-rdv-meta">15h → 15h45 · 6 inscrits</span>
        </div>
        <span className="mock-rdv-btn">Je participe</span>
      </div>
    ),
  },
];

export default function Motisma() {
  const { user } = useAuth();
  // Le groupe « Administration » n'apparaît qu'aux admins connectés.
  const groups = COMMAND_GROUPS.filter((g) => !g.admin || user?.isAdmin);

  return (
    <div className="page motisma">
      <header className="motisma-hero">
        <div className="motisma-hero-text">
          <span className="eyebrow">Le bot de la communauté</span>
          <h1>Motisma’Pau</h1>
          <p className="motisma-lead">
            Votre Rotom-Dex de poche sur le Discord : profil Pokémon GO, progression, organisation
            de sorties et petits jeux, le tout en quelques commandes.
          </p>
          <div className="motisma-actions">
            <a className="btn-accent" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
              <DiscordLogo />
              Rejoindre le Discord
            </a>
            <a className="btn-ghost" href="#commandes">
              Voir les commandes
            </a>
          </div>
        </div>
        <div className="motisma-hero-visual">
          <img
            className="motisma-portrait"
            src="/motisma.png"
            alt="Motisma, la mascotte du serveur"
            width="300"
            height="300"
          />
        </div>
      </header>

      <section className="motisma-block">
        <span className="eyebrow">Prise en main</span>
        <h2 className="motisma-h2">Cinq étapes pour bien démarrer</h2>
        <div className="features">
          {STEPS.map((s, i) => (
            <article className={`feature${i % 2 ? ' feature-reverse' : ''}`} key={s.title}>
              <div className="feature-text">
                <span className="feature-step">Étape {i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
              <div className="feature-visual">{s.visual}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="motisma-block" id="commandes">
        <span className="eyebrow">Référence</span>
        <h2 className="motisma-h2">Toutes les commandes</h2>
        {groups.map((g) => (
          <div className="cmd-group" key={g.title}>
            <h3 className="cmd-group-title">
              <span className="cmd-group-icon">
                <Icon name={g.icon} size={16} />
              </span>
              {g.title}
              {g.admin && <span className="cmd-admin-badge">admin</span>}
            </h3>
            <div className="cmd-list">
              {g.commands.map((c) => (
                <div className="cmd-row" key={c.name}>
                  <code className="cmd-name">{c.name}</code>
                  <div className="cmd-row-body">
                    <p className="cmd-short">{c.short}</p>
                    <code className="cmd-ex">
                      <span className="cmd-ex-prompt">›</span> {c.example}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
