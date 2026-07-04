/**
 * Système XP de Gym Level UP.
 *
 * Gains :
 *  - +50 XP  : séance terminée et validée
 *  - +10 XP  : par exercice où une perf est ajoutée (poids ou répétitions en hausse)
 *  - +30 XP  : par record personnel battu
 */
export const XP_SESSION_COMPLETED = 50;
export const XP_PERF_IMPROVED = 10;
export const XP_RECORD_BROKEN = 30;

export type Tier = {
  key: 'novice' | 'apprenti' | 'intermediaire' | 'athlete' | 'hero';
  name: string;
  minXp: number;
  /** Exclus — Infinity pour le dernier palier */
  maxXp: number;
  beltColor: string;
  description: string;
};

/** Les 5 paliers d'évolution de l'avatar (ceintures façon dojo). */
export const TIERS: Tier[] = [
  {
    key: 'novice',
    name: 'Novice',
    minXp: 0,
    maxXp: 1000,
    beltColor: '#F3EAD8',
    description: 'Silhouette initiale, posture neutre',
  },
  {
    key: 'apprenti',
    name: 'Apprenti',
    minXp: 1000,
    maxXp: 5000,
    beltColor: '#D9A441',
    description: 'Corps plus tonique, posture droite',
  },
  {
    key: 'intermediaire',
    name: 'Intermédiaire',
    minXp: 5000,
    maxXp: 15000,
    beltColor: '#5B84B1',
    description: 'Corps athlétique, posture engagée',
  },
  {
    key: 'athlete',
    name: 'Athlète',
    minXp: 15000,
    maxXp: 30000,
    beltColor: '#C9403A',
    description: 'Musculature visible, pose puissante',
  },
  {
    key: 'hero',
    name: 'Hero',
    minXp: 30000,
    maxXp: Infinity,
    beltColor: '#1C1C24',
    description: 'Corps sculpté, posture héroïque',
  },
];

export function tierForXp(xp: number): Tier {
  return TIERS.find((t) => xp >= t.minXp && xp < t.maxXp) ?? TIERS[TIERS.length - 1];
}

export function tierIndex(xp: number): number {
  return TIERS.indexOf(tierForXp(xp));
}

/** Progression (0..1) dans le palier courant. Vaut 1 pour le palier Hero. */
export function tierProgress(xp: number): number {
  const tier = tierForXp(xp);
  if (!isFinite(tier.maxXp)) return 1;
  return Math.min(1, Math.max(0, (xp - tier.minXp) / (tier.maxXp - tier.minXp)));
}

/** XP restant avant le prochain palier, ou null si palier max atteint. */
export function xpToNextTier(xp: number): number | null {
  const tier = tierForXp(xp);
  return isFinite(tier.maxXp) ? tier.maxXp - xp : null;
}
