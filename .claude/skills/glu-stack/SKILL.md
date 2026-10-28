---
name: glu-stack
description: Source unique de vérité sur la stack de Gym Level UP (GLU) — technologies, versions, structure des dossiers, modèle de données, conventions, commandes et pièges connus. À consulter avant toute tâche technique sur le projet.
---

# GLU — stack et conventions (source unique de vérité)

> Ce fichier est le SEUL endroit où figurent versions, chemins et conventions propres au projet.
> Les agents et les autres skills s'y réfèrent sans rien recopier. Pour réutiliser l'équipe
> d'agents sur un autre projet, on ne réécrit que ce fichier.
> Toute modification passe par `glu-pending-updates` (jamais d'édition directe).

## Produit

Gym Level UP : app mobile de suivi de musculation gamifiée. L'utilisateur crée des séances,
les lance (timer de repos automatique, saisie des performances), gagne de l'XP et fait évoluer
un avatar sur 5 grades. Langue de l'interface et du code (commentaires, messages) : **français**.
Hors scope actuel : coach IA, interface coach, mini-jeu, shop, upload vidéo, monnaie in-app.

## Versions (référence : `package.json`, `functions/package.json`)

| Brique | Version |
|---|---|
| Expo SDK | ~54.0 (`expo` ~54.0.34) |
| React Native | 0.81.5 (New Architecture activée) |
| React | 19.1.0 |
| expo-router | ~6.0 (typed routes activées) |
| NativeWind | ^4.2 + tailwindcss ^3.4 (PAS Tailwind v4) |
| TypeScript | ~5.9, `strict: true` |
| Firebase JS SDK | ^12 (Auth + Firestore, modular API) |
| react-native-svg | ^15.12 (rendu de l'avatar) |
| expo-notifications | ~0.32 (notifications LOCALES uniquement) |
| Cloud Functions | `firebase-functions` ^6 (API v2), `firebase-admin` ^13, Node 20, TypeScript |
| Tests | aucun framework installé pour l'instant (cible : jest-expo + Testing Library RN + `@firebase/rules-unit-testing`) |
| Build/CI | pas encore d'`eas.json` ni de GitHub Actions |

**Règle d'or des versions Expo** : toute dépendance native s'installe dans la version alignée sur le SDK.
`npx expo install <pkg>` le fait ; s'il échoue (réseau restreint), lire la version attendue dans
`node_modules/expo/bundledNativeModules.json` et installer `npm install <pkg>@<version>`.
Ne JAMAIS faire un `npm install <pkg>` nu sur un paquet Expo (déjà arrivé : `babel-preset-expo@57`
et `expo-notifications@57` installés par erreur → crash Hermes « private properties are not supported »).

## Structure du dépôt

```
app/                      routes expo-router (fichier = écran)
  _layout.tsx             Stack racine, AuthProvider, gardes auth + onboarding avatar
  (auth)/                 sign-in, sign-up (accessibles sans compte)
  (tabs)/                 index (Dojo), workouts (Séances), history (Historique)
  workout/new.tsx         création/édition de séance (modal, param `id` = édition)
  session/[workoutId].tsx séance en direct (timer de repos, validation)
  history/[sessionId].tsx détail d'une séance terminée (param `celebrate=1`)
  exercise-picker.tsx     bibliothèque d'exercices (modal)
  avatar-editor.tsx       créateur d'avatar (param `onboarding=1`)
  admin.tsx               labo admin (sandbox de test)
components/               ui.tsx (Button, Field, Card, LoadingScreen), avatar.tsx, xp-bar.tsx, rest-timer.tsx
lib/                      logique métier sans UI
  firebase.ts             init app/auth/db (persistance AsyncStorage sur mobile)
  types.ts                types Firestore (UserProfile, Workout, Session, PersonalRecord, AvatarConfig…)
  xp.ts                   barème XP + 5 paliers (TIERS)
  sessions.ts             completeSession (batch atomique : session + records + XP), watchers
  workouts.ts             CRUD des séances
  avatar-options.ts       catalogue des traits d'avatar, palettes, randomAvatar, normalizeAvatar
  pixel-avatar.ts         moteur pixel art de l'avatar (grille 40×44, couches, contour, ombrage)
  exercise-db.ts          liste FR locale + base enrichie free-exercise-db (cache AsyncStorage)
  rest-notifications.ts   notification locale de fin de repos
  default-workouts.ts     séances d'exemple créées à l'inscription
  admin.ts                ADMIN_EMAILS (miroir de isAdmin() dans firestore.rules)
  format.ts               formatage dates, poids, durées (formatRest), slug d'exercice
providers/auth-provider.tsx  contexte auth + profil temps réel (normalise l'avatar)
functions/src/index.ts    Cloud Function validateSessionXp (garde-fou anti-triche XP)
firestore.rules, firestore.indexes.json, firebase.json
scripts/tripo-avatar-concepts.mjs  script HORS LIGNE (concepts 3D Tripo), jamais appelé par l'app
tailwind.config.js, global.css, babel.config.js, metro.config.js
.claude/agents/, .claude/skills/, .claude/agent-memory/   équipe d'agents
```

Alias d'import : `@/*` → racine du dépôt (`@/lib/xp`, `@/components/ui`). `functions/` est exclu du tsconfig racine.

## Modèle de données Firestore

```
users/{uid}                 displayName, email, xp, sessionsCompleted, recordsCount, createdAt, avatar?
users/{uid}/workouts/{id}   name, exercises[{id,name,weight,reps,sets,restSec}], createdAt, updatedAt
users/{uid}/sessions/{id}   workoutId, workoutName, startedAt, completedAt, exercises[{name,targetWeight,targetReps,restSec,sets[{weight,reps,done}]}],
                            xpEarned, xpBreakdown{completion,performance,records}, recordsBroken[], totals{exercises,reps,volume}
users/{uid}/records/{slug}  exerciseName, weight, reps, achievedAt, sessionId   (slug = exerciseSlug(nom))
```

Règles (`firestore.rules`) : chaque utilisateur n'accède qu'à `users/{uid}/**` ; l'XP ne peut pas baisser
côté client sauf `isAdmin()` (liste d'emails, à synchroniser avec `lib/admin.ts`) ; sessions immuables
(suppression réservée à l'admin pour purger son compte). Redéploiement : `npx firebase-tools deploy --only firestore:rules`.

## Gamification

- XP (`lib/xp.ts`) : +50 séance validée, +10 par exercice dont la perf progresse, +30 par record battu.
- Paliers : Novice 0-1000, Apprenti 1000-5000, Intermédiaire 5000-15000, Athlète 15000-30000, Hero 30000+.
- Avatar : traits indexés façon LaBrute (`AvatarConfig` : gender, build, skin, hair, hairColor, eyes, eyeColor, beard),
  rendu pixel art via `react-native-svg` (un `<Path>` par couleur). La morphologie interpole de la corpulence
  de départ (maigre/moyen/rond) vers le physique Hero ; tenue et ceinture suivent le grade.

## Design tokens (NativeWind, `tailwind.config.js`)

`sumi` (fonds encre #14141C, light, card, border) · `torii` (accent rouge #C9403A, dark, soft) ·
`paper` (textes #F3EAD8, dim, faint) · `gold` (XP/récompenses #D9A441, soft) · `matcha` (succès #7BA05B, dark).
Couleurs hors classes (headers de navigation, icônes, SVG) : reprendre les mêmes hex.
Classes utilitaires partout ; `style={}` seulement pour valeurs calculées (largeurs %, couleurs dynamiques).

## Conventions de code

- TypeScript strict, pas de `any` gratuit ; types Firestore dans `lib/types.ts`.
- Logique métier et accès Firestore dans `lib/`, jamais directement dans les écrans quand c'est réutilisable.
- Écoutes temps réel via `onSnapshot` dans un `useEffect` qui renvoie l'unsubscribe.
- Écritures multiples liées → `writeBatch` (atomicité) ; `serverTimestamp()` pour les dates serveur.
- Pas de commentaire qui paraphrase le code ; commentaires courts en français pour le « pourquoi ».
- Secrets : seules les variables `EXPO_PUBLIC_FIREBASE_*` vont dans l'app (`.env`, gitignoré, modèle `.env.example`).
  Toute autre clé (ex. `TRIPO_API_KEY`) n'est JAMAIS préfixée `EXPO_PUBLIC_` ni lue par l'app.

## Commandes

| Action | Commande |
|---|---|
| Typecheck app | `npx tsc --noEmit` |
| Typecheck functions | `cd functions && npx tsc --noEmit` |
| Vérifier le bundle | `npx expo export --platform web --output-dir <dossier temporaire>` |
| Lancer (téléphone) | `npx expo start --tunnel` (LAN souvent bloqué chez l'utilisateur) ; `-c` pour vider le cache |
| Lancer (web) | `npx expo start --web` |
| CLI Firebase | `npx firebase-tools <cmd>` (pas d'install globale chez l'utilisateur) |
| Script Node avec .env | `node --env-file=.env <script>` |
| Audit dépendances | `npm audit --omit=dev` et `cd functions && npm audit` |

## Pièges connus

- `metro.config.js` : `config.resolver.unstable_enablePackageExports = false` (build Firebase compatible Hermes) — ne pas retirer.
- `babel.config.js` : preset `babel-preset-expo` avec `jsxImportSource: 'nativewind'` + `nativewind/babel`.
- Expo Go (SDK ≥ 53) ne gère plus le push distant : avertissement masqué via `LogBox.ignoreLogs` ; les notifications locales fonctionnent.
- Variables `EXPO_PUBLIC_*` injectées au bundling : après modification du `.env`, relancer avec `-c`.
- Poste de l'utilisateur : Windows + PowerShell (pas de `rm -rf`, utiliser `Remove-Item -Recurse -Force`).
- L'environnement cloud des agents peut bloquer certains domaines (API Expo, wger…) : signaler, ne pas contourner.
