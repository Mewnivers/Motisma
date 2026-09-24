import { useAuth } from '../auth.jsx';
import { DISCORD_INVITE } from '../config.js';
import { COMMAND_GROUPS } from '../data/commands.js';
import DiscordLogo from '../components/DiscordLogo.jsx';
import Icon from '../components/Icons.jsx';

// Étapes de prise en main (guide court pour un nouveau membre). Le corps peut
// contenir du JSX pour mettre les commandes en <code>.
const STEPS = [
  {
    title: 'Rejoins le Discord',
    body: (
      <>
        Choisis ton secteur dans « Salons et rôles » : ça te connecte aux dresseurs proches de
        chez toi et fait vivre la communauté.
      </>
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
  },
  {
    title: 'Discute et gagne de l’XP',
    body: (
      <>
        Tu montes en niveau simplement en participant sur le serveur. Suis ta progression avec{' '}
        <code>/niveau</code> et <code>/classement</code>.
      </>
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
  },
  {
    title: 'Organise ou rejoins une sortie',
    body: (
      <>
        Avec <code>/rdv</code>, un salon dédié est créé avec inscriptions par bouton. Tous les
        niveaux sont les bienvenus.
      </>
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
      </header>

      <section className="motisma-block">
        <span className="eyebrow">Prise en main</span>
        <h2 className="motisma-h2">Cinq étapes pour bien démarrer</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li className="step" key={s.title}>
              <span className="step-num">{i + 1}</span>
              <div className="step-body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
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
            <div className="cmd-grid">
              {g.commands.map((c) => (
                <article className="cmd-card" key={c.name}>
                  <code className="cmd-name">{c.name}</code>
                  <p className="cmd-short">{c.short}</p>
                  <code className="cmd-ex">
                    <span className="cmd-ex-prompt">›</span>
                    {c.example}
                  </code>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
