---
name: architect
description: Carte fonctionnelle de GLU — flux de données, navigation, calcul de l'XP, Cloud Functions, avatar — et méthode pour expliquer une partie du projet ou mesurer l'impact d'un changement.
user-invocable: false
---

# Architecture de GLU

Structure des dossiers et modèle de données : voir `glu-stack`. Ici, le fonctionnement.

## Navigation (`app/_layout.tsx`)

1. `AuthProvider` écoute `onAuthStateChanged` ; tant que `user === undefined` → écran de chargement.
2. Garde : pas de user hors `(auth)` → `/(auth)/sign-in` ; user dans `(auth)` → `/(tabs)`.
3. Onboarding : profil chargé sans `avatar` → `/avatar-editor?onboarding=1` (retour impossible) → `/(tabs)`.
4. Onglets : Dojo (avatar, XP, paliers, accès labo admin), Séances (liste, lancer, actions), Historique (records + sessions).

## Flux de données

- Profil : `onSnapshot(users/{uid})` dans le provider ; profil manquant recréé ; avatar normalisé (`normalizeAvatar`).
- Inscription : compte Auth → `setDoc(users/{uid})` (xp 0) → `seedDefaultWorkouts`.
- Séances : `watchWorkouts` (temps réel, tri `updatedAt`) ; éditeur `workout/new` (création/édition) ;
  sélection d'exercice via `exercise-picker` (callback module `setExercisePickerCallback`).
- Séance live : état local (séries, poids, reps) ; repos = timestamp de fin + tick 250 ms + notification locale
  programmée (annulée sur « passer », reprogrammée sur « +15 s », nettoyée à la sortie).
- Validation : `completeSession` lit les records, calcule XP et records, puis UN `writeBatch` :
  session + records + incréments du profil (`xp`, `sessionsCompleted`, `recordsCount`) → écran détail `celebrate=1`.

## Calcul de l'XP (`lib/sessions.ts`, `lib/xp.ts`)

Par exercice ayant au moins une série validée : meilleure série = poids max puis reps.
- +10 si premier enregistrement de l'exercice, record battu ou cible dépassée ;
- +30 si record existant battu (premier enregistrement = record créé sans bonus) ;
- +50 par séance. Palier = `tierForXp(xp)`.
Cloud Function `validateSessionXp` (trigger création de session) : plafond = 50 + 40 × exercices avec perf ;
au-delà, corrige la session et décrémente l'XP du profil.

## Avatar

`AvatarConfig` (indices) → `buildAvatarGrid(config, tierIdx)` (couches, interpolation de morphologie, contour,
ombrage) → `gridToPaths` → `<Path>` SVG par couleur. Décor dojo séparé (`buildDojoScene`).

## Méthode d'explication / d'impact

1. Partir du point d'entrée (route, fonction, règle), suivre les appels avec Grep, citer `fichier:ligne`.
2. Pour un changement : lister fichiers touchés, contrats impactés (types, règles, index, données existantes en base),
   migration nécessaire, tests à prévoir, agents concernés.
3. Signaler les écarts entre ce skill et le code (le code fait foi) comme proposition de skill.
