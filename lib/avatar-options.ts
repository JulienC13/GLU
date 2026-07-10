import type { AvatarConfig } from '@/lib/types';

/** Options de personnalisation de l'avatar (créateur d'avatar). */

export const SKIN_TONES = ['#F5D7B8', '#E8B98A', '#C98E5A', '#9C6B43', '#6B4A2F'];

export const HAIR_COLORS = [
  '#2A2028', // noir
  '#4A3320', // brun
  '#8B5A2B', // châtain
  '#D9A441', // blond
  '#C9403A', // roux
  '#B8B0A0', // gris
  '#F3EAD8', // blanc
];

export const EYE_COLORS = [
  '#3B2F2F', // marron
  '#7A5230', // noisette
  '#4E6E3D', // vert
  '#3E6B8F', // bleu
  '#5B5B6E', // gris
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

export const HAIR_STYLES: { key: AvatarConfig['hairStyle']; label: string }[] = [
  { key: 'rase', label: 'Rasé' },
  { key: 'court', label: 'Court' },
  { key: 'chignon', label: 'Chignon' },
  { key: 'long', label: 'Long' },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'homme',
  build: 'moyen',
  skinTone: '#E8B98A',
  hairStyle: 'chignon',
  hairColor: '#2A2028',
  eyeColor: '#3B2F2F',
};
