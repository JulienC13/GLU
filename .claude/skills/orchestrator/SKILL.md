---
name: orchestrator
description: Méthode de l'orchestrateur GLU — découpage des demandes, choix du spécialiste, enchaînements automatiques, circuit validé/rejeté des skills, synthèse pour l'utilisateur.
user-invocable: false
---

# Orchestration de l'équipe GLU

## Annuaire des spécialistes

| Agent | À solliciter pour | Écrit ? |
|---|---|---|
| `architect` | comprendre/expliquer une partie du projet, cartographier l'impact d'un changement avant de coder | non |
| `frontend` | écrans, composants, navigation, état UI | oui (app/, components/, lib/ côté client) |
| `design` | UI/UX, tokens, thème dojo, avatar et ses paliers | oui (tokens, composants visuels, avatar) |
| `backend` | modèle Firestore, Cloud Functions, index, `firestore.rules`, logique de données dans `lib/` | oui |
| `security` | audit règles, secrets, env, dépendances, auth | non (rapport) |
| `test` | écrire et lancer les tests, vérifier une correction | oui (tests + config de test) |
| `devops` | EAS, `firebase deploy`, CI, environnements | oui (config) |
| `skills-manager` | écrire dans `glu-pending-updates`, appliquer « validé »/« rejeté » | `.claude/skills/` uniquement |

## Découpage d'une demande

1. Reformuler l'objectif en une phrase et lister les livrables.
2. Si le périmètre touche plusieurs zones ou est flou : demander d'abord à `architect` la carte d'impact.
3. Découper en tâches indépendantes et ordonnées (données → logique → UI → tests → sécurité → déploiement).
4. Lancer en parallèle ce qui est indépendant ; en séquence ce qui dépend d'un résultat.
5. Chaque délégation est autonome (le subagent ne voit pas la conversation) : objectif, fichiers concernés,
   contraintes, critères de fin, ce qu'il doit renvoyer.

## Enchaînements automatiques (exceptions au modèle en étoile)

- Changement visuel : `design` peut appeler `frontend` directement (et inversement). Si un agent n'a pas pu le faire
  (profondeur max atteinte, échec), l'orchestrateur enchaîne lui-même l'autre agent avec le rapport du premier.
- Toute modification de `firestore.rules` par `backend` → relecture par `security` (appelée par backend ;
  sinon l'orchestrateur l'enchaîne). Pas de déploiement des règles sans cette relecture.
- Toute modification de code → `test` lance au minimum le typecheck et les tests existants avant la synthèse.

## Questions à l'utilisateur

Les subagents ne peuvent pas poser de questions : ils signalent les informations manquantes dans leur rapport.
L'orchestrateur regroupe ces questions, les pose en une fois, puis relance l'agent avec la réponse (`SendMessage`
pour reprendre l'agent avec son contexte, sinon nouvelle délégation complète).

## Circuit des skills

- Chaque rapport d'agent peut contenir « Propositions de skills ». L'orchestrateur les transmet au `skills-manager`
  qui les inscrit dans `glu-pending-updates`, puis les résume à l'utilisateur avec leurs identifiants `PU-NNN`.
- « validé » (éventuellement suivi d'identifiants) → `skills-manager` applique puis retire les entrées.
- « rejeté » (éventuellement suivi d'identifiants) → `skills-manager` supprime les entrées sans les appliquer.
- Sans précision d'identifiants, « validé »/« rejeté » portent sur toutes les entrées en attente.

## Garde-fous

- Ne jamais coder soi-même, ne jamais modifier un fichier hors de sa mémoire d'agent.
- Déploiement en production (EAS submit/build production, `firebase deploy` sur le projet réel) : uniquement après
  un « oui » explicite de l'utilisateur dans la conversation, que l'orchestrateur cite dans sa délégation à `devops`.
- Commit/push : seulement si l'utilisateur l'a demandé.

## Synthèse pour l'utilisateur

Courte, en français : ce qui a été fait (par qui), résultats des vérifications, points ouverts, questions,
propositions de skills en attente (identifiants). Ne pas recopier les rapports bruts.
