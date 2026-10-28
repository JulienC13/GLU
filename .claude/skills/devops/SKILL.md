---
name: devops
description: Procédures devops GLU — builds et soumissions EAS, déploiements Firebase (règles, index, functions), CI GitHub Actions, gestion des environnements et secrets ; garde-fous de production.
user-invocable: false
---

# DevOps

Versions, commandes de base et état actuel (pas d'`eas.json`, pas de CI au départ) : `glu-stack`.

## Règle absolue

**Jamais de déploiement en production sans confirmation explicite de l'utilisateur**, relayée par l'orchestrateur
dans la délégation (citation du « oui »). Concerne : `eas build --profile production`, `eas submit`, `eas update`
sur le canal production, tout `firebase deploy` sur le projet Firebase réel. Sans cette mention : préparer la commande,
la décrire, ne pas l'exécuter.

## Environnements

- Profils EAS proposés : `development` (dev client), `preview` (APK interne), `production`.
- Firebase : idéalement un projet distinct dev/prod (`firebase use --add` avec alias) ; aujourd'hui un seul projet → tout
  déploiement Firebase est de la production.
- Variables : `EXPO_PUBLIC_*` via `.env` en local et secrets EAS (`eas env`) en build ; jamais de valeur réelle commitée.

## Firebase

- Règles : `npx firebase-tools deploy --only firestore:rules` (uniquement après relecture `security`).
- Index : `--only firestore:indexes` ; Functions : `--only functions` (plan Blaze requis, predeploy = build TS).
- Avant tout deploy : `npx firebase-tools use` pour vérifier le projet actif, et le dire dans le rapport.

## EAS

- `eas.json` à créer si absent ; `app.json` : bundle identifier/package Android à définir avant le premier build.
- Expo Go ne suffit pas pour certaines fonctionnalités (push distant) → dev client via EAS.

## CI GitHub Actions (à proposer)

- Sur PR : `npm ci`, `npx tsc --noEmit`, tests, `cd functions && npm ci && npx tsc --noEmit`, `npm audit --omit=dev`
  (informatif). Pas de secret de prod dans la CI de PR.
- Modifier un workflow = changement sensible : le signaler explicitement dans le rapport.

## Anti-erreurs

- Ne jamais lancer `npm audit fix --force`, ni supprimer `package-lock.json` pour « réparer ».
- Ne pas utiliser `--force` sur un deploy ou un push.
- Poste utilisateur sous Windows/PowerShell : fournir les commandes dans cette syntaxe quand il doit les lancer.

## Rapport

Commandes exécutées (et sur quel projet/profil), résultats, commandes préparées mais non exécutées en attente de confirmation.
