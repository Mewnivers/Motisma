# Rotom'Pau

Bot Discord pour la communauté Pokémon GO de Pau.

L'objectif est double : permettre à chaque joueur de constater qu'il n'est pas isolé
dans son secteur, et faciliter l'organisation des sorties, sans jamais révéler
d'information personnelle.

## Fonctionnalités prévues

### Carte des secteurs
- Affiche les secteurs de jeu de Pau (Beaumont, Pesquidoux, Lons, etc.) avec un
  compteur de joueurs par secteur.
- Une commande `/carte` renvoie une image (PNG) directement dans Discord, sans
  dépendre d'un site externe.
- Les données proviennent des rôles Discord que les joueurs choisissent eux-mêmes
  via « Salons et rôles ». Aucune saisie supplémentaire, aucun doublon.
- Aucune position ni adresse n'est exposée : seul le secteur volontairement
  sélectionné par le joueur est pris en compte.
- Un secteur n'affiche son compteur qu'à partir de trois joueurs, afin de préserver
  l'anonymat.

### Rendez-vous
- Une commande crée un fil (thread) temporaire pour une sortie : lieu, heure et
  inscriptions par réaction.
- Le fil est archivé ou supprimé automatiquement après l'événement.
- Un rappel automatique est envoyé avant le rendez-vous.

## Principe de conception

Le bot s'appuie sur une source de vérité unique : les rôles « secteur » des joueurs.

```
Joueur sur Discord
   |  (choisit son secteur via « Salons et rôles »)
   v
Rotom'Pau  --- lit les rôles --->  Rôles « secteur » (permanents)
   |
   |-- /carte  -> génère un PNG des secteurs avec compteurs
   '-- /rdv    -> crée un fil temporaire pour une sortie
```

| Élément              | Rôle                            | Forme                  | Durée de vie |
|----------------------|---------------------------------|------------------------|--------------|
| Rôles « secteur »    | Alimenter la carte              | Rôles « Salons et rôles » | Permanent    |
| Fils de rendez-vous  | Organiser une sortie            | Threads créés par le bot  | Éphémère     |

## Confidentialité

- Aucune géolocalisation, aucune adresse, aucune position individuelle.
- Le secteur est déclaratif et volontaire : le joueur sélectionne lui-même son rôle.
- La carte n'affiche que des compteurs agrégés par secteur, jamais un joueur isolé
  (seuil minimum de trois joueurs).

## État du projet

Projet en phase d'étude et de conception. L'implémentation interviendra dans un
second temps. La pile technique (langage, librairie de génération de carte) reste à
définir.

## Feuille de route

- [ ] Définir la liste des secteurs de Pau et créer les rôles correspondants
- [ ] Préparer le fond de carte (image de base avec les secteurs)
- [ ] Prototype : commande `/carte` générant un PNG avec compteurs
- [ ] Commande `/rdv` : création de fil temporaire et inscriptions
- [ ] Rappels automatiques avant les sorties
- [ ] Application web interactive en complément du PNG (optionnel)

## Licence

Distribué sous licence MIT. Voir le fichier `LICENSE`.

---

Projet communautaire, non affilié à Niantic ni à The Pokémon Company.
Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK inc.
