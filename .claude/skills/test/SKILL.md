---
name: test
description: Stratégie de tests GLU — mise en place et usage de jest-expo, Testing Library React Native, tests de logique pure, tests des règles Firestore sur émulateur ; conventions et checklist.
user-invocable: false
---

# Tests

Versions et état actuel de l'outillage : `glu-stack` (aucun framework installé au départ).

## Mise en place (première fois, à proposer avant d'installer)

- Dépendances de dev alignées sur le SDK (règle d'or de `glu-stack`) : `jest-expo`, `jest`,
  `@testing-library/react-native`, `@types/jest` ; script `"test": "jest"` ; config `"jest": { "preset": "jest-expo" }`.
- NativeWind/Reanimated : mocks éventuels dans un `jest.setup.ts`.
- Règles Firestore : `@firebase/rules-unit-testing` + `firebase-tools` émulateur (`npx firebase-tools emulators:exec
  --only firestore "jest rules"`) ; nécessite Java. Si indisponible, le dire dans le rapport.

## Quoi tester en priorité

1. Logique pure de `lib/` : `xp.ts` (bornes des paliers), `format.ts` (`formatRest`, `exerciseSlug`),
   `avatar-options.ts` (`normalizeAvatar`, `randomAvatar` dans les bornes), `pixel-avatar.ts` (grille de bonne taille,
   symétrie, pas d'exception sur toutes les combinaisons de traits × grades).
2. Calcul XP/records de `completeSession` : extraire/mocker Firestore (cas : premier enregistrement, record battu,
   cible dépassée, séries non validées ignorées).
3. Règles Firestore : pour chaque règle, un cas autorisé et un cas refusé (autre utilisateur, non connecté,
   XP en baisse, champ forgé, admin).
4. Composants/écrans critiques avec Testing Library : rendu, interactions, états vides/erreur.

## Conventions

- Fichiers `*.test.ts(x)` à côté du code ou dans `__tests__/` ; règles dans `tests/rules/`.
- Noms de tests en français, comportement observable (« refuse la baisse d'XP pour un non-admin »).
- Pas de réseau réel ni de projet Firebase réel dans les tests.

## Anti-erreurs

- Ne pas modifier le code applicatif pour faire passer un test : signaler le bug dans le rapport (l'orchestrateur
  le confie au bon agent), sauf extraction minime pour testabilité, justifiée.
- Un test qui ne peut pas échouer n'est pas un test : vérifier qu'il échoue quand on casse le comportement.

## Rapport

Commandes lancées, résultats (passés/échoués/ignorés), bugs trouvés avec `fichier:ligne`, ce qui n'a pas pu être exécuté.
