import { useAuth } from '../auth.jsx';
import { DISCORD_INVITE } from '../config.js';
import { COMMAND_GROUPS } from '../data/commands.js';
import DiscordLogo from '../components/DiscordLogo.jsx';

// Étapes de prise en main (guide court pour un nouveau membre).
const STEPS = [
  {
    title: 'Rejoins le Discord',
    body: 'Choisis ton secteur dans « Salons et rôles » : ça te connecte aux dresseurs proches de chez toi et fait vivre la communauté.',
  },
  {
    title: 'Enregistre ton profil',
    body: 'Avec /set-pogo, renseigne ton nom de dresseur et ton code ami. Ils s’affichent ensuite dans /userinfo.',
  },
  {
    title: 'Discute et gagne de l’XP',
    body: 'Tu montes en niveau simplement en participant sur le serveur. Suis ta progression avec /niveau et /classement.',
  },
  {
    title: 'Rejoins le classement Pokémon GO',
    body: 'Fais /classement-pogo rejoindre, puis envoie une capture de ton profil en MP au bot : il lit tes stats tout seul.',
  },
  {
    title: 'Organise ou rejoins une sortie',
    body: 'Avec /rdv, un salon dédié est créé avec inscriptions par bouton. Tous les niveaux sont les bienvenus.',
  },
];

export default function Motisma() {
  const { user } = useAuth();
  // Le groupe « Administration » n'apparaît qu'aux admins connectés.
  const groups = COMMAND_GROUPS.filter((g) => !g.admin || user?.isAdmin);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Motisma’Pau</h1>
        <p>
          Le bot de la communauté — votre Rotom-Dex de poche sur le Discord. Profil Pokémon GO,
          progression, organisation de sorties et petits jeux, le tout en quelques commandes.
        </p>
      </div>

      <div className="motisma-cta">
        <a className="btn-discord" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
          <DiscordLogo />
          Rejoindre le Discord
        </a>
      </div>

      <h2 className="motisma-section-title">Prise en main</h2>
      <ol className="motisma-steps">
        {STEPS.map((s, i) => (
          <li className="motisma-step" key={s.title}>
            <span className="motisma-step-num">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="motisma-section-title">Commandes</h2>
      {groups.map((g) => (
        <section className="cmd-group" key={g.title}>
          <h3 className="cmd-group-title">
            {g.title}
            {g.admin && <span className="cmd-admin-badge">admin</span>}
          </h3>
          <div className="cmd-grid">
            {g.commands.map((c) => (
              <article className="cmd-card" key={c.name}>
                <div className="cmd-card-head">
                  <span className="cmd-emoji">{c.emoji}</span>
                  <code className="cmd-name">{c.name}</code>
                </div>
                <p className="cmd-short">{c.short}</p>
                <code className="cmd-example">{c.example}</code>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
