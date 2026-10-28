---
name: security
description: Checklist d'audit sécurité GLU — règles Firestore, secrets et variables d'environnement, dépendances, authentification Firebase, Cloud Functions.
user-invocable: false
---

# Audit sécurité

Rapport classé par sévérité : **Critique / Haute / Moyenne / Basse / Info**, chaque point avec fichier:ligne,
scénario d'exploitation concret et correctif proposé (que `backend`/`frontend`/`devops` appliqueront).

## Règles Firestore (`firestore.rules`)

- Chaque `match` restreint à `request.auth.uid == userId` ; aucun `allow read, write: if true` ni règle trop large (`/{document=**}`).
- Validation des écritures : types et bornes des champs (`is int`, `>= 0`), clés autorisées
  (`request.resource.data.keys().hasOnly([...])`), champs immuables (`createdAt`, `email`).
- XP : impossible de l'augmenter arbitrairement ? (aujourd'hui seule la baisse est interdite — vérifier l'incrément maximal,
  le garde-fou `validateSessionXp` côté Functions et ses limites).
- `isAdmin()` : comparaison sur email vérifié (`request.auth.token.email_verified`) ? Préférer les custom claims.
- Sous-collections : sessions immuables, records cohérents avec les sessions.
- Tester mentalement : utilisateur A lisant/écrivant chez B, utilisateur non connecté, champ forgé.

## Secrets et environnement

- `git ls-files | grep -iE '\.env|key|secret|service-account'` ; `git log -p -S '<motif>'` pour l'historique.
- Seules les clés `EXPO_PUBLIC_FIREBASE_*` sont acceptables dans l'app (clé Firebase web = identifiant public,
  protégée par les règles et les restrictions de clé). Toute autre clé dans le bundle = Critique.
- `.env` gitignoré, `.env.example` sans valeur réelle.
- Scripts hors ligne : clé lue depuis l'environnement, jamais en dur.

## Dépendances

- `npm audit --omit=dev --json` à la racine et dans `functions/` ; trier par exploitabilité réelle
  (une vulnérabilité d'outil de build n'a pas le poids d'une vulnérabilité runtime).
- Ne JAMAIS lancer `npm audit fix` (modifie des fichiers et peut casser l'alignement SDK) : proposer le correctif.

## Authentification

- Création du profil `users/{uid}` conforme aux règles (xp = 0) ; gestion des erreurs Firebase sans fuite d'info.
- Persistance de session, déconnexion, gardes de navigation (aucun écran privé accessible sans `user`).
- Comptes admin : liste synchronisée entre `lib/admin.ts` et `firestore.rules`.

## Cloud Functions

- Entrées non fiables (données client) validées ; idempotence des triggers ; pas de boucle d'écriture
  (une fonction qui réécrit le document qui la déclenche).

## Anti-erreurs

- Ne modifier aucun fichier (Bash uniquement en lecture : audit, grep, git log).
- Ne jamais afficher un secret en clair dans le rapport : citer le fichier et masquer la valeur.
