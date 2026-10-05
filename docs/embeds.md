# Embeds d'information

La commande `/embed` publie, ou met à jour sur place, un embed d'information du serveur. Elle demande la permission **Gérer le serveur** (`src/commands/embed.js`).

## Utilisation

```
/embed type:<embed>
/embed type:<embed> lien:<lien du message à mettre à jour>
```

- Sans `lien`, l'embed est publié dans le salon courant.
- Avec `lien`, le bot modifie son propre message à cet endroit, sans le republier.
- La réponse de confirmation est éphémère : seul l'embed reste dans le salon.

## Embeds disponibles

Le registre `EMBEDS` de `src/commands/embed.js` liste les types publiables. Chaque type a son constructeur dans `src/embeds/`.

| Type | Constructeur |
|---|---|
| Règlement | `reglement.js` |
| Vérification | `verification.js` |
| Suggestions | `suggestions.js` |
| Présentation | `presentation.js` |
| Motisma (le bot) | `botPresentation.js` |
| Salons à connaître | `ressources.js` |
| Classement PoGo | `classement.js` |

Pour en ajouter un : créer son constructeur dans `src/embeds/`, l'ajouter au registre `EMBEDS`, puis relancer `npm run deploy`. Le nouveau choix modifie la définition de la commande côté Discord.

## Contenu modifiable depuis la base

Cinq embeds peuvent être pilotés par la table `info_embeds` (voir [base-de-donnees.md](base-de-donnees.md)) : `reglement`, `suggestions`, `verification`, `motisma` et `classement` (`MANAGED_EMBED_KEYS` dans `src/embeds/renderInfoEmbed.js`).

À la publication, le bot lit la ligne du serveur :

- si elle contient du contenu (titre, description ou champs), l'embed est construit à partir d'elle (`contentToEmbed`) ;
- sinon, le constructeur codé en dur sert de repli.

Le bot enregistre aussi le salon et le message publiés (`posted_channel_id`, `posted_message_id`).

Les modèles `/rdv` (clés `rdv_annonce` et `rdv_salon`) utilisent la même table. Leurs textes acceptent des variables au format `{nom}`, laissées telles quelles si elles sont inconnues.

## Embed « Salons à connaître »

Défini dans `src/embeds/ressources.js`. Les salons sont listés dans la constante `GROUPS`, par thème et dans l'ordre d'affichage.

- Chaque salon est référencé par son identifiant, sous forme de mention `<#id>`. Discord affiche le nom actuel du salon : renommer un salon ne casse pas l'embed.
- Un élément sans `desc` s'affiche comme une simple mention. Si tous les éléments d'un groupe sont dans ce cas, le groupe devient une liste compacte sous sa propre `desc`.
- `SEPARATOR` insère un trait de séparation entre deux éléments.
- Un groupe vide est omis.
- Pour retirer un salon, supprimer son entrée dans `GROUPS`.

Certaines entrées sont des posts de forum. Une mention de post archivé s'afficherait « #Inconnu » : la fonction `forumKeepAlive` (`src/features/forumKeepAlive.js`) les désarchive régulièrement. Leurs identifiants se règlent avec `FORUM_KEEPALIVE_IDS`.

## Après une modification

- Texte ou identifiant dans un constructeur : redémarrer le bot, puis republier avec `/embed` (ou mettre à jour avec `lien`).
- Nom, description ou choix de la commande `/embed` : relancer aussi `npm run deploy`.
