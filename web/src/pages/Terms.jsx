export default function Terms() {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Conditions d'utilisation</h1>
        <p>
          POGO PAU est un service communautaire et bénévole destiné aux joueuses et joueurs
          de Pokémon GO de la région de Pau. En utilisant le bot Discord ou ce site, tu acceptes
          les conditions ci-dessous.
        </p>
      </div>

      <div className="legal">
        <h2>1. Le service</h2>
        <p>
          POGO PAU regroupe un bot Discord et ce site web. Il facilite la vie de la communauté :
          carte des secteurs, organisation de sorties, classement des dresseurs et entraide. Le
          service est fourni « tel quel », sans garantie de disponibilité, et peut évoluer ou
          s'interrompre à tout moment.
        </p>

        <h2>2. Qui peut l'utiliser</h2>
        <p>
          L'accès se fait via Discord et suppose le respect des Conditions d'utilisation de
          Discord. Pokémon GO étant accessible dès 7 ans (avec accord parental selon l'âge), les
          mineurs doivent disposer de l'autorisation de leur représentant légal pour partager
          des informations.
        </p>

        <h2>3. Usage attendu</h2>
        <p>
          Tu t'engages à utiliser POGO PAU de bonne foi : pas de triche, pas de harcèlement, pas
          de contenu illégal, choquant ou trompeur, et pas de partage d'informations permettant
          d'identifier ou de localiser précisément une autre personne sans son accord.
        </p>

        <h2>4. Données et captures d'écran</h2>
        <p>
          Pour figurer au classement, tu peux déclarer tes statistiques en jeu (niveau, XP) en
          envoyant une capture d'écran de ton profil. Tu garantis avoir le droit de partager ces
          images. Une équipe de modération les vérifie avant validation. Voir la{' '}
          <a href="/privacy">Politique de confidentialité</a> pour le détail des données traitées.
        </p>

        <h2>5. Modération</h2>
        <p>
          Les modérateurs peuvent refuser une déclaration, retirer un contenu ou restreindre
          l'accès d'un membre qui ne respecte pas ces conditions ou les règles du serveur Discord.
        </p>

        <h2>6. Responsabilité</h2>
        <p>
          POGO PAU n'est ni affilié, ni sponsorisé, ni approuvé par Niantic ni par The Pokémon
          Company. « Pokémon » et « Pokémon GO » sont des marques de leurs détenteurs respectifs.
          Le service est proposé bénévolement et son responsable ne saurait être tenu pour
          responsable des dommages liés à son utilisation.
        </p>

        <h2>7. Évolution des conditions</h2>
        <p>
          Ces conditions peuvent être mises à jour. La version publiée ici fait foi. Pour toute
          question, contacte un modérateur sur le serveur Discord.
        </p>

        <p className="fineprint">Dernière mise à jour : juin 2026.</p>
      </div>
    </div>
  );
}
