---
name: frontend
description: Bonnes pratiques frontend GLU — écrans expo-router, composants React Native, NativeWind, TypeScript strict, état temps réel Firestore côté UI, checklist de livraison.
user-invocable: false
---

# Frontend

Versions et chemins : `glu-stack`. Tokens visuels : `glu-stack` (section design tokens) et skill `design`.

## Écrans (expo-router)

- Un fichier = une route ; déclarer titre/présentation dans `app/_layout.tsx` (`Stack.Screen`) ou via
  `<Stack.Screen options>` dans l'écran pour un titre dynamique.
- Params typés : `useLocalSearchParams<{ id?: string }>()` ; navigation par objet
  `router.push({ pathname: '/session/[workoutId]', params: { workoutId } })` (typed routes).
- Écran privé : supposer `user` défini mais gérer `null` sans crash (retour `LoadingScreen`).
- Modales (`presentation: 'modal'`) pour création/sélection ; `router.replace` après une action finale.

## Composants

- Réutiliser `components/ui.tsx` (Button variants primary/success/ghost/danger, Field, Card, LoadingScreen) avant d'en créer.
- `className` NativeWind ; `style` seulement pour valeurs calculées. Pas de couleur en dur hors palette.
- Listes : `FlatList` avec `keyExtractor` stable ; `ScrollView` seulement pour du contenu borné.
- Formulaires : `KeyboardAvoidingView` (padding sur iOS), `keyboardShouldPersistTaps="handled"`, claviers numériques
  adaptés (`number-pad`, `decimal-pad`), parsing tolérant à la virgule.
- Icônes : `@expo/vector-icons` (Ionicons). Pas de glyphe Unicode exotique (non rendu sur Android).
- Accessibilité : `accessibilityLabel` sur tout bouton icône, `hitSlop` sur les petites cibles.

## Données

- Lecture : fonctions `watch*` de `lib/` dans `useEffect` avec unsubscribe en retour.
- Écriture : passer par `lib/` ; afficher `loading` sur le bouton ; `Alert.alert` en français en cas d'erreur.
- Pas de logique XP/records dans l'UI : c'est `lib/sessions.ts` (domaine backend).

## Anti-erreurs

- Installer une dépendance native → règle d'or de `glu-stack` (version alignée SDK), jamais `npm install` nu.
- Ne pas casser les gardes de `app/_layout.tsx` (auth, onboarding avatar).
- `setInterval`/timers : toujours nettoyés ; temps basé sur timestamps, pas sur des compteurs.
- Expo Go : pas de push distant ; notifications locales OK.

## Checklist de livraison

1. `npx tsc --noEmit` sans erreur.
2. Bundle OK (`npx expo export --platform web` dans un dossier temporaire).
3. Parcours vérifié (navigateur via `expo start --web` + Playwright si possible) ; sinon le dire explicitement.
4. Rapport : fichiers modifiés, comportement, ce qui n'a pas pu être testé sur téléphone.
