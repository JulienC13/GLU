---
name: glu-pending-updates
description: Zone de transit des créations et modifications de skills de l'équipe GLU, en attente de validation par l'utilisateur. Préchargé par tous les agents — les entrées ci-dessous s'appliquent déjà pendant la phase de test et priment sur le skill cible en cas de conflit.
---

# Mises à jour de skills en attente

## Règles (ne pas supprimer cette section)

1. **Toute** création ou modification de skill est d'abord écrite ici, jamais directement dans le skill cible.
   Seul l'agent `skills-manager` écrit dans ce fichier, sur demande de l'orchestrateur.
2. Chaque entrée a un identifiant `PU-NNN` (incrémental, jamais réutilisé dans le fichier) et contient :
   date, skill cible (ou « NOUVEAU : <nom> »), contenu ajouté/modifié, raison, agent à l'origine.
3. Pendant la phase de test, tous les agents appliquent ces entrées comme si elles étaient déjà dans le skill cible.
   En cas de contradiction, l'entrée la plus récente l'emporte.
4. L'utilisateur dit « validé » (toutes les entrées, ou une liste d'identifiants) → le `skills-manager` applique les
   entrées aux skills cibles (ou crée les nouveaux skills), puis retire les entrées appliquées.
5. L'utilisateur dit « rejeté » (tout, ou une liste d'identifiants) → les entrées concernées sont supprimées sans être appliquées.
6. Quand il n'y a plus d'entrée, la section ci-dessous contient uniquement « _Aucune mise à jour en attente._ ».
   L'en-tête et ces règles restent toujours en place.

### Modèle d'entrée

```markdown
### PU-001 — <titre court>
- **Date** : AAAA-MM-JJ
- **Skill cible** : <nom-du-skill> | NOUVEAU : <nom-du-skill>
- **Agent à l'origine** : <agent>
- **Raison** : <pourquoi cette connaissance mérite d'être pérennisée>
- **Contenu** :
  <texte exact à ajouter, ou « Remplacer : … / Par : … »>
```

## Entrées en attente

_Aucune mise à jour en attente._
