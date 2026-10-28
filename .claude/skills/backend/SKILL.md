---
name: backend
description: Bonnes pratiques backend GLU — modèle de données Firestore, firestore.rules (propriété du backend), index, Cloud Functions v2 en TypeScript, migrations de données, émulateurs.
user-invocable: false
---

# Backend et base de données

Versions, modèle de données et commandes : `glu-stack`. Le backend est propriétaire de `firestore.rules`,
`firestore.indexes.json`, `functions/` et de la logique de données de `lib/` (`sessions.ts`, `workouts.ts`, `types.ts`…).

## Modèle de données

- Tout sous `users/{uid}/...` (isolation par utilisateur, règles simples).
- Ajout de champ : le rendre optionnel dans `lib/types.ts`, prévoir la valeur par défaut à la lecture
  (données existantes), puis seulement le rendre obligatoire après migration.
- Écritures liées → `writeBatch`/`runTransaction` ; compteurs → `increment()` ; dates → `serverTimestamp()`.
- Requêtes : chaque `where` + `orderBy` sur champs différents demande un index composite → `firestore.indexes.json`.

## Règles Firestore (`firestore.rules`)

- Refuser par défaut ; autoriser le minimum par collection.
- Valider les écritures (types, bornes, `keys().hasOnly`), protéger les champs immuables.
- Toute règle qui touche l'XP doit rester cohérente avec `completeSession` (incréments en batch) et `isAdmin()`.
- `isAdmin()` ⇔ `lib/admin.ts` : toujours modifier les deux.
- **Après toute modification des règles : appeler l'agent `security` pour relecture** (exception directe autorisée),
  joindre le diff et le résultat de relecture au rapport. Si l'appel est impossible, le signaler pour que
  l'orchestrateur l'enchaîne.
- Déploiement des règles : jamais par le backend — demander à l'orchestrateur (devops, avec confirmation).

## Cloud Functions (`functions/`)

- API v2 (`firebase-functions/v2/...`), `firebase-admin` initialisé une fois.
- Triggers idempotents ; ne pas réécrire le document déclencheur sans condition d'arrêt (boucle).
- Valider toute donnée client ; logs via `logger` sans données personnelles.
- `cd functions && npx tsc --noEmit` avant de rendre la main ; Cloud Functions = plan Blaze (signaler le coût).

## Tests

Règles et fonctions testables avec la Firebase Emulator Suite (`@firebase/rules-unit-testing`) — fournir à l'agent
`test` les cas attendus (autorisé/refusé) pour chaque règle modifiée.

## Anti-erreurs

- Ne pas faire confiance au client pour l'XP : tout nouveau gain d'XP doit être reflété dans `validateSessionXp`.
- Ne pas supprimer de données utilisateur sans demande explicite relayée par l'orchestrateur.
- Pas de clé admin/service account dans le dépôt.
