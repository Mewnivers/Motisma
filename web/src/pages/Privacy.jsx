export default function Privacy() {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Politique de confidentialité</h1>
        <p>
          POGO PAU traite le minimum de données nécessaire au fonctionnement de la communauté.
          Aucune donnée n'est vendue ni utilisée à des fins publicitaires. Cette page explique
          ce qui est collecté, pourquoi, et tes droits.
        </p>
      </div>

      <div className="legal">
        <h2>Responsable du traitement</h2>
        <p>
          POGO PAU est un projet communautaire bénévole pour les joueurs de Pokémon GO de Pau.
          Pour toute demande relative à tes données, contacte un modérateur sur le serveur Discord.
        </p>

        <h2>Données collectées</h2>
        <p>Selon la façon dont tu utilises le service :</p>
        <ul>
          <li>
            <strong>Identifiants Discord</strong> : ton identifiant, ton pseudo et ton avatar,
            transmis par Discord lors de la connexion.
          </li>
          <li>
            <strong>Profil de dresseur</strong> : pseudo en jeu, équipe et code ami, si tu choisis
            de les renseigner.
          </li>
          <li>
            <strong>Statistiques déclarées</strong> : niveau, XP total et la capture d'écran que tu
            envoies pour les justifier, en attente de validation par la modération.
          </li>
          <li>
            <strong>Activité du serveur</strong> : données techniques liées au fonctionnement du
            bot (par exemple les compteurs agrégés par secteur).
          </li>
        </ul>

        <h2>Pourquoi ces données</h2>
        <p>
          Elles servent uniquement à faire fonctionner le service : t'authentifier, afficher le
          classement, organiser les sorties et présenter les chiffres de la communauté. La carte
          n'affiche que des totaux agrégés : aucune adresse n'est publiée et un secteur ne révèle
          son nombre de joueurs qu'au-delà d'un certain seuil.
        </p>

        <h2>Partage</h2>
        <p>
          Aucune donnée n'est transmise à des tiers à des fins commerciales. Les informations
          transitent par Discord (connexion) et sont hébergées sur le serveur du projet. Ton pseudo
          en jeu et tes statistiques validées peuvent être visibles publiquement dans le classement.
        </p>

        <h2>Conservation</h2>
        <p>
          Les données sont conservées tant que tu utilises le service. Les captures d'écran
          envoyées pour validation peuvent être supprimées une fois la vérification effectuée.
        </p>

        <h2>Tes droits</h2>
        <p>
          Tu peux demander l'accès, la rectification ou la suppression de tes données, ou retirer
          ton profil du classement. Il suffit d'en faire la demande à un modérateur sur le Discord.
        </p>

        <p className="fineprint">Dernière mise à jour : juin 2026.</p>
      </div>
    </div>
  );
}
