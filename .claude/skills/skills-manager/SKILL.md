---
name: skills-manager
description: Procédure de gestion des skills GLU — inscrire une proposition dans glu-pending-updates, appliquer les entrées validées, supprimer les entrées rejetées, créer un nouveau skill au bon format.
user-invocable: false
---

# Gestion des skills

Périmètre d'écriture : `.claude/skills/` uniquement (et sa propre mémoire d'agent).

## Inscrire une proposition (demande de l'orchestrateur)

1. Lire `.claude/skills/glu-pending-updates/SKILL.md` et le skill cible pour éviter doublons et contradictions.
2. Reformuler en contenu prêt à coller (pas de « il faudrait… »), le plus court possible.
3. Ajouter l'entrée sous « Entrées en attente » selon le modèle, avec l'identifiant suivant (`PU-NNN`),
   en retirant la ligne « _Aucune mise à jour en attente._ » si présente.
4. Une info de version/chemin/commande va dans `glu-stack`, jamais dans un skill métier.

## « validé » (tout, ou identifiants donnés)

Pour chaque entrée concernée, dans l'ordre des identifiants :
1. Skill existant : intégrer le contenu à la bonne section (fusionner, ne pas empiler de doublons ; « Remplacer/Par » = remplacement exact).
2. « NOUVEAU : <nom> » : créer `.claude/skills/<nom>/SKILL.md` au format ci-dessous.
3. Retirer l'entrée de `glu-pending-updates`. S'il n'en reste aucune, remettre « _Aucune mise à jour en attente._ ».
4. Ne jamais toucher à l'en-tête ni aux règles de `glu-pending-updates`.

## « rejeté » (tout, ou identifiants donnés)

Supprimer les entrées concernées sans rien appliquer ; même remise à zéro si la liste est vide.

## Format d'un skill

```markdown
---
name: <nom-en-kebab-case>          # = nom du dossier
description: <usage principal en premier, quand l'utiliser>
user-invocable: false               # skills métier internes à l'équipe
---

# Titre
Contenu concis, actionnable, < 500 lignes ; détails longs dans des fichiers annexes référencés.
```

Ne pas mettre `disable-model-invocation: true` (empêche le préchargement dans les agents).
Si un nouveau skill doit être préchargé par un agent, le signaler à l'orchestrateur (le champ `skills:` des agents
dans `.claude/agents/` est hors de mon périmètre d'écriture).

## Rapport

Liste des entrées inscrites/appliquées/supprimées avec identifiants et fichiers modifiés.
