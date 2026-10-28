---
name: design
description: Design system GLU — thème dojo japonais, tokens NativeWind, principes UI/UX mobile, avatar et ses 5 paliers ; checklist de cohérence visuelle.
user-invocable: false
---

# Design

Valeurs actuelles des tokens et fichiers : `glu-stack`. Ce skill donne la direction et les règles.

## Direction artistique

- Ambiance **dojo japonais** : tatami, bois, papier shoji, lanternes, encre.
- Cible de palette : **chaude et terreuse** (bois, paille de tatami, papier, encre) avec **un accent vif** réservé à
  l'action principale. La palette actuelle (fonds encre sombres, accent rouge torii, or pour l'XP) en est la base ;
  toute évolution passe par les tokens de `tailwind.config.js`, puis est reportée dans `glu-stack` via `glu-pending-updates`.
- Rôles fixes : accent = action principale unique par écran ; or = XP/récompenses/records ; vert = succès/validation ;
  textes clairs sur fonds sombres avec contraste AA minimum (4.5:1 pour le texte courant).
- Pas de texte japonais ni de caractères décoratifs non rendus sur Android ; pas d'accent rouge sur fond rouge.

## Tokens et composants

- Toute couleur passe par un token NativeWind ; un nouveau besoin = nouveau token, pas de hex en dur dans un écran.
- Hiérarchie : titre d'écran > titre de carte > texte > texte secondaire (`paper`, `paper-dim`, `paper-faint`).
- Espacements multiples de 4 ; cartes `rounded-2xl`, boutons `rounded-xl` ; cibles tactiles ≥ 44 px.
- États systématiques : chargement, vide (avec action), erreur, désactivé.

## Avatar et paliers

- Avatar pixel art généré par code (couches + palettes façon LaBrute) — voir `glu-stack` et `lib/pixel-avatar.ts`.
- 5 paliers : la tenue, la ceinture (couleur du palier), le bandeau et la morphologie progressent ; le grade Hero
  a un effet doré. Chaque palier doit être lisible au premier coup d'œil à petite taille (≈110 px).
- Tout nouveau trait : variantes par sexe si pertinent, palette fixe, compatible avec l'interpolation de morphologie.
- Vérifier visuellement : générer un rendu (planche PNG ou navigateur) de toutes les combinaisons modifiées × 5 paliers.

## Collaboration

- Exception directe autorisée avec `frontend` : `design` peut lui confier l'intégration d'une maquette/d'un composant
  (et inversement). Fournir une spécification précise : tokens, tailles, états, comportement.

## Checklist

1. Cohérence avec les tokens et les rôles de couleurs.
2. Lisibilité (contraste, taille de police ≥ 12, cibles tactiles).
3. Rendu vérifié (capture navigateur ou planche) ; sinon le dire.
4. Rapport : décisions visuelles et leur raison, fichiers modifiés.
