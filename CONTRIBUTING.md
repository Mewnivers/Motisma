# Contribuer à Rotom'Pau

Merci de l'intérêt porté au projet. Ce dépôt accompagne la communauté Pokémon GO de
Pau ; les contributions sont les bienvenues, qu'il s'agisse de code, de documentation
ou de retours d'usage.

## Avant de commencer

Le projet est en phase de conception. La pile technique (langage, librairie de
génération de carte) n'est pas encore figée : les propositions sur ces choix sont
utiles et attendues.

## Signaler un problème ou proposer une idée

- Ouvrez une *issue* en décrivant clairement le besoin, le contexte et, si possible,
  un exemple.
- Pour une fonctionnalité, expliquez l'usage côté joueur avant l'aspect technique.

## Proposer une modification

1. Créez une branche dédiée à partir de `main`.
2. Faites des commits clairs et atomiques, avec des messages explicites.
3. Vérifiez qu'aucun secret n'est inclus (token Discord, identifiants). Les secrets
   vont dans un fichier `.env` local, jamais dans le dépôt.
4. Ouvrez une *pull request* en décrivant le changement et son intérêt.

## Sécurité

Le token du bot et toute information sensible ne doivent jamais être committés. Le
fichier `.env` est ignoré par git ; partez toujours de `.env.example`. En cas
d'exposition accidentelle d'un secret, régénérez-le immédiatement depuis le portail
développeur Discord.

## Esprit du projet

Rotom'Pau vise à renforcer le lien local sans jamais exposer d'information
personnelle. Toute contribution doit respecter ce principe : pas de géolocalisation,
pas d'adresse, uniquement des données déclaratives et agrégées.
