# ⛩️ Gym Level UP (GLU) — Beta

Application mobile de suivi de musculation **gamifiée** : chaque séance terminée fait
gagner de l'XP et fait évoluer un avatar 2D flat design, dans une ambiance dojo japonais.

## Stack

- **Frontend** : React Native (Expo SDK 54) + [expo-router](https://docs.expo.dev/router/introduction/) + [NativeWind](https://www.nativewind.dev/) (Tailwind pour RN)
- **Backend** : Firebase — Authentication (email/mot de passe) + Cloud Firestore + Cloud Functions (garde-fou XP, optionnel)
- Aucune donnée mockée : tout est lu/écrit en temps réel dans Firestore.

## Fonctionnalités de la beta

1. **Auth** — inscription / connexion email + mot de passe (Firebase Auth), session persistée.
2. **Création de séance** — liste d'exercices avec nom, poids, répétitions, séries, temps de repos. Modification, duplication, suppression.
3. **Séance en direct** — timer de repos automatique entre les séries (+15s / passer, vibration en fin de repos), saisie des perfs en temps réel, bouton **« Valider la séance »**.
4. **Système XP** — `+50 XP` séance terminée, `+10 XP` par exercice où la perf progresse, `+30 XP` par record personnel battu. Détail du gain affiché après chaque séance.
5. **Avatar évolutif** — 5 paliers : Novice (0–1000), Apprenti (1000–5000), Intermédiaire (5000–15000), Athlète (15000–30000), Hero (30000+). Silhouette, kimono, ceinture et aura évoluent.
6. **Historique** — liste chronologique des séances, détail par séance (séries réalisées, XP, améliorations) et records personnels mis en avant.

En plus :
- **Séances par défaut** — 3 séances d'exemple (Full Body, Haut du corps, Bas du corps) créées à l'inscription.
- **Bibliothèque d'exercices** — recherche d'exercices via l'API publique [wger](https://wger.de) (noms français, sans clé API), avec liste locale intégrée en secours hors ligne.
- **Labo admin** — sandbox réservé aux emails listés dans `lib/admin.ts` : réglage libre de l'XP, saut de palier, aperçu des 5 grades, réinjection des séances par défaut, réinitialisation du compte. Accessible via l'icône fiole 🧪 sur l'écran Dojo.

Hors scope (volontairement) : coach IA, interface coach, mini-jeu, shop, vidéos, monnaie in-app.

## Mise en route

### 1. Créer le projet Firebase

1. [Console Firebase](https://console.firebase.google.com) → **Ajouter un projet**.
2. **Authentication → Sign-in method** : activer **E-mail/Mot de passe**.
3. **Firestore Database** : créer la base (mode production).
4. **Paramètres du projet → Vos applications → Web (`</>`)** : enregistrer une app et récupérer la config.

### 2. Configurer l'app

```bash
cp .env.example .env
# puis renseigner les clés EXPO_PUBLIC_FIREBASE_* avec la config de l'étape 1
```

### 3. Déployer les règles Firestore

```bash
npx firebase-tools login
npx firebase-tools use --add     # choisir votre projet
npx firebase-tools deploy --only firestore:rules
```

> ⚠️ À refaire après chaque modification de `firestore.rules` (par exemple pour
> ajouter un email admin dans `isAdmin()` — à garder synchronisé avec `lib/admin.ts`).

### 4. Lancer l'app

```bash
npm install
npx expo start
```

Scanner le QR code avec **Expo Go** (Android/iOS), ou `npx expo start --web` pour un aperçu navigateur.

### 5. (Optionnel) Cloud Functions — garde-fou XP

L'XP est calculé côté client dans un batch Firestore atomique ; les règles empêchent
déjà toute baisse d'XP. La fonction `validateSessionXp` (dossier `functions/`) revalide
en plus chaque séance côté serveur et corrige tout XP excessif. Nécessite le plan Blaze :

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

## Modèle de données Firestore

```
users/{uid}                    → profil : displayName, xp, sessionsCompleted, recordsCount
users/{uid}/workouts/{id}      → séance modèle : name, exercises[{name, weight, reps, sets, restSec}]
users/{uid}/sessions/{id}      → séance terminée : perfs réalisées, xpEarned, xpBreakdown, recordsBroken, totals
users/{uid}/records/{slug}     → record personnel par exercice : weight, reps, achievedAt, sessionId
```

## Identité visuelle

Ambiance **dojo japonais** : fond encre (`#14141C`), papier washi (`#F3EAD8`),
rouge torii (`#C9403A`) pour les actions, or (`#D9A441`) pour l'XP et les récompenses.
L'avatar est un guerrier 2D flat design dont la ceinture suit les paliers,
à la manière des grades d'arts martiaux.
