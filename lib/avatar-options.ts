import type { AvatarConfig } from '@/lib/types';

/**
 * Catalogue des traits de l'avatar, sur le modèle de LaBrute : des listes de
 * variantes par sexe et des palettes de couleurs fixes, tirées au hasard à la
 * création puis ajustables trait par trait.
 */

export const SKIN_PALETTE = ['#FBE6C8', '#F2C9A0', '#E0A878', '#C68650', '#99663D', '#6B4428'];

export const HAIR_PALETTE = [
  '#2A2024', // noir
  '#5A3820', // brun
  '#8B5A2B', // châtain
  '#C4512A', // roux
  '#E8C25A', // blond
  '#FFF3B0', // platine
  '#9A9AA6', // gris
  '#F2F0EA', // blanc
  '#4F677D', // bleu nuit
  '#E58FB8', // rose
];

export const EYE_PALETTE = ['#4A2E1E', '#8A5A2B', '#3F7A3A', '#3A6EA5', '#6E7480', '#7A4E9E'];

export type HairStyle =
  | 'rase'
  | 'court'
  | 'pics'
  | 'crete'
  | 'meche'
  | 'chignon'
  | 'afro'
  | 'long'
  | 'queue'
  | 'couettes'
  | 'carre';

export const HAIR_STYLES: Record<AvatarConfig['gender'], { key: HairStyle; label: string }[]> = {
  homme: [
    { key: 'court', label: 'Court' },
    { key: 'pics', label: 'En pics' },
    { key: 'rase', label: 'Rasé' },
    { key: 'crete', label: 'Crête' },
    { key: 'meche', label: 'Mèche' },
    { key: 'chignon', label: 'Chignon' },
    { key: 'afro', label: 'Afro' },
    { key: 'long', label: 'Long' },
  ],
  femme: [
    { key: 'queue', label: 'Queue de cheval' },
    { key: 'couettes', label: 'Couettes' },
    { key: 'carre', label: 'Carré' },
    { key: 'long', label: 'Long' },
    { key: 'chignon', label: 'Chignon' },
    { key: 'court', label: 'Court' },
    { key: 'afro', label: 'Afro' },
  ],
};

export type EyeStyle = 'normaux' | 'determines' | 'rieurs' | 'grands';

export const EYE_STYLES: { key: EyeStyle; label: string }[] = [
  { key: 'normaux', label: 'Normaux' },
  { key: 'determines', label: 'Déterminés' },
  { key: 'rieurs', label: 'Rieurs' },
  { key: 'grands', label: 'Grands' },
];

export type BeardStyle = 'aucune' | 'moustache' | 'courte' | 'longue' | 'bouc';

export const BEARD_STYLES: { key: BeardStyle; label: string }[] = [
  { key: 'aucune', label: 'Aucune' },
  { key: 'moustache', label: 'Moustache' },
  { key: 'courte', label: 'Barbe courte' },
  { key: 'longue', label: 'Barbe longue' },
  { key: 'bouc', label: 'Bouc' },
];

export const GENDERS: { key: AvatarConfig['gender']; label: string }[] = [
  { key: 'homme', label: 'Homme' },
  { key: 'femme', label: 'Femme' },
];

export const BUILDS: { key: AvatarConfig['build']; label: string; hint: string }[] = [
  { key: 'maigre', label: 'Maigre', hint: 'Prendra du muscle en montant de grade' },
  { key: 'moyen', label: 'Moyen', hint: 'Progression équilibrée' },
  { key: 'rond', label: 'Rond', hint: 'Perdra du gras et se musclera en montant de grade' },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'homme',
  build: 'moyen',
  skin: 1,
  hair: 0,
  hairColor: 0,
  eyes: 0,
  eyeColor: 0,
  beard: 0,
};

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

/** Tirage aléatoire complet, comme le bouton "dé" de LaBrute. */
export function randomAvatar(gender: AvatarConfig['gender'] = Math.random() < 0.5 ? 'homme' : 'femme'): AvatarConfig {
  return {
    gender,
    build: BUILDS[randomIndex(BUILDS.length)].key,
    skin: randomIndex(SKIN_PALETTE.length),
    hair: randomIndex(HAIR_STYLES[gender].length),
    hairColor: randomIndex(HAIR_PALETTE.length),
    eyes: randomIndex(EYE_STYLES.length),
    eyeColor: randomIndex(EYE_PALETTE.length),
    // Une chance sur deux d'être imberbe, sinon un style au hasard.
    beard: gender === 'homme' && Math.random() < 0.5 ? 1 + randomIndex(BEARD_STYLES.length - 1) : 0,
  };
}

function clampIndex(value: unknown, length: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length ? value : fallback;
}

/**
 * Valide un avatar lu depuis Firestore : tout trait hors limites (ou issu de
 * l'ancien format à couleurs hexadécimales) retombe sur la valeur par défaut.
 */
export function normalizeAvatar(raw: unknown): AvatarConfig {
  const r = (raw ?? {}) as Record<string, unknown>;
  const gender: AvatarConfig['gender'] = r.gender === 'femme' ? 'femme' : 'homme';
  const build = BUILDS.some((b) => b.key === r.build) ? (r.build as AvatarConfig['build']) : 'moyen';
  return {
    gender,
    build,
    skin: clampIndex(r.skin, SKIN_PALETTE.length, DEFAULT_AVATAR.skin),
    hair: clampIndex(r.hair, HAIR_STYLES[gender].length, 0),
    hairColor: clampIndex(r.hairColor, HAIR_PALETTE.length, 0),
    eyes: clampIndex(r.eyes, EYE_STYLES.length, 0),
    eyeColor: clampIndex(r.eyeColor, EYE_PALETTE.length, 0),
    beard: gender === 'homme' ? clampIndex(r.beard, BEARD_STYLES.length, 0) : 0,
  };
}
