import { View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import { DEFAULT_AVATAR } from '@/lib/avatar-options';
import type { AvatarConfig } from '@/lib/types';
import { TIERS, tierForXp, tierIndex } from '@/lib/xp';

/**
 * Avatar 2D flat design paramétrique, ambiance dojo.
 *
 * Deux axes indépendants :
 *  - la personnalisation (sexe, corpulence de départ, peau, cheveux, yeux),
 *    choisie par l'utilisateur à la création du compte ;
 *  - la progression (les 5 grades), qui fait évoluer la morphologie :
 *    le profil "rond" perd du ventre et se muscle, le "maigre" prend du
 *    muscle, jusqu'à converger vers le physique du grade Hero.
 */

const DARK = '#1C1C24';

/** Morphologie de départ (grade Novice) par corpulence. */
const BUILD_START = {
  maigre: { shoulder: 21, waist: 17, arm: 5.5, leg: 9, belly: 0 },
  moyen: { shoulder: 26, waist: 22, arm: 8, leg: 11, belly: 0 },
  rond: { shoulder: 29, waist: 30, arm: 10, leg: 13, belly: 12 },
} as const;

/** Tenue par grade : kimono, finitions, ceinture, bandeau, aura. */
const TIER_OUTFIT = [
  { gi: '#EDE6D6', giTrim: '#D6CDB8', headband: null as string | null, aura: false },
  { gi: '#EDE6D6', giTrim: '#D6CDB8', headband: null, aura: false },
  { gi: '#E3DCCB', giTrim: '#C9BFA6', headband: '#F3EAD8', aura: false },
  { gi: '#3A3A48', giTrim: '#2A2A35', headband: '#C9403A', aura: false },
  { gi: '#1C1C24', giTrim: '#D9A441', headband: '#C9403A', aura: true },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function Avatar({
  xp,
  config,
  size = 180,
  scene = false,
}: {
  xp: number;
  config?: AvatarConfig | null;
  size?: number;
  /** Affiche un décor de dojo minimaliste derrière le personnage. */
  scene?: boolean;
}) {
  const cfg = config ?? DEFAULT_AVATAR;
  const idx = tierIndex(xp);
  const outfit = TIER_OUTFIT[idx];
  const beltColor = tierForXp(xp).beltColor;

  // Progression 0 (Novice) → 1 (Hero).
  const t = idx / (TIERS.length - 1);
  const isF = cfg.gender === 'femme';
  const start = BUILD_START[cfg.build];

  // Physique cible au grade Hero, légèrement moins massif pour les femmes.
  const target = isF
    ? { shoulder: 40, waist: 23, arm: 14, leg: 13 }
    : { shoulder: 48, waist: 26, arm: 18, leg: 15 };

  const shoulder = lerp(start.shoulder * (isF ? 0.9 : 1), target.shoulder, t);
  const waist = lerp(start.waist, target.waist, t);
  const arm = lerp(start.arm * (isF ? 0.9 : 1), target.arm, t);
  const leg = lerp(start.leg, target.leg, t);
  const belly = start.belly * (1 - t); // le ventre fond avec les grades
  const hipHalf = waist + (isF ? 3 : 0);

  const headY = 52;
  const shoulderY = 88;
  const beltY = 148;
  const hipY = 160;
  const footY = 222;

  const skin = cfg.skinTone;
  const hair = cfg.hairColor;

  return (
    <View style={{ width: size, height: size * 1.2 }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 240">
        {/* Décor dojo minimaliste (modifiable dans une future mise à jour) */}
        {scene && (
          <>
            <Circle cx={100} cy={112} r={92} stroke="#D9A441" strokeWidth={3} opacity={0.12} fill="none" />
            <Line x1={14} y1={229} x2={186} y2={229} stroke="#B8B0A0" strokeWidth={2} opacity={0.25} />
          </>
        )}

        {outfit.aura && (
          <>
            <Circle cx={100} cy={118} r={95} fill="#D9A441" opacity={0.12} />
            <Circle cx={100} cy={118} r={78} fill="#D9A441" opacity={0.12} />
          </>
        )}

        {/* Cheveux longs : masse derrière la tête et les épaules */}
        {cfg.hairStyle === 'long' && (
          <Path
            d={`M 76 40 Q 100 18 124 40 L 128 96 Q 114 104 100 100 Q 86 104 72 96 Z`}
            fill={hair}
          />
        )}

        {/* Jambes (pantalon de kimono) */}
        <Rect x={100 - hipHalf + 4} y={hipY - 6} width={leg} height={footY - hipY} rx={leg / 2} fill={outfit.gi} />
        <Rect x={100 + hipHalf - 4 - leg} y={hipY - 6} width={leg} height={footY - hipY} rx={leg / 2} fill={outfit.gi} />
        <Ellipse cx={100 - hipHalf + 4 + leg / 2} cy={footY} rx={leg / 2 + 3} ry={5} fill={DARK} />
        <Ellipse cx={100 + hipHalf - 4 - leg / 2} cy={footY} rx={leg / 2 + 3} ry={5} fill={DARK} />

        {/* Bras */}
        <Rect x={100 - shoulder - arm} y={shoulderY - 2} width={arm} height={54} rx={arm / 2} fill={skin} />
        <Rect x={100 + shoulder} y={shoulderY - 2} width={arm} height={54} rx={arm / 2} fill={skin} />

        {/* Torse (kimono) */}
        <Path
          d={`M ${100 - shoulder} ${shoulderY}
              L ${100 + shoulder} ${shoulderY}
              L ${100 + hipHalf} ${hipY}
              L ${100 - hipHalf} ${hipY} Z`}
          fill={outfit.gi}
        />
        {/* Ventre (corpulence ronde, fond avec la progression) */}
        {belly > 1 && (
          <Ellipse cx={100} cy={136} rx={waist + belly * 0.9} ry={12 + belly * 0.6} fill={outfit.gi} />
        )}
        {/* Col croisé du kimono */}
        <Path
          d={`M ${100 - shoulder * 0.55} ${shoulderY} L 100 ${shoulderY + 34} L ${100 - 4} ${shoulderY + 34} L ${100 - shoulder * 0.75} ${shoulderY} Z`}
          fill={outfit.giTrim}
        />
        <Path
          d={`M ${100 + shoulder * 0.55} ${shoulderY} L 100 ${shoulderY + 34} L ${100 + 4} ${shoulderY + 34} L ${100 + shoulder * 0.75} ${shoulderY} Z`}
          fill={outfit.giTrim}
        />
        {/* Pectoraux marqués (grades avancés) */}
        {t >= 0.6 && (
          <>
            <Line x1={100 - shoulder * 0.6} y1={shoulderY + 26} x2={100 - 6} y2={shoulderY + 30} stroke={outfit.giTrim} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={100 + shoulder * 0.6} y1={shoulderY + 26} x2={100 + 6} y2={shoulderY + 30} stroke={outfit.giTrim} strokeWidth={2.5} strokeLinecap="round" />
          </>
        )}

        {/* Ceinture + nœud (couleur du grade) */}
        <Rect x={100 - hipHalf - 2} y={beltY} width={(hipHalf + 2) * 2} height={10} fill={beltColor} stroke="#00000022" strokeWidth={1} />
        <Rect x={94} y={beltY - 1} width={12} height={12} rx={2} fill={beltColor} stroke="#00000033" strokeWidth={1} />
        <Path d={`M 96 ${beltY + 11} L 92 ${beltY + 26} L 97 ${beltY + 26} L 99 ${beltY + 12} Z`} fill={beltColor} />
        <Path d={`M 104 ${beltY + 11} L 108 ${beltY + 26} L 103 ${beltY + 26} L 101 ${beltY + 12} Z`} fill={beltColor} />

        {/* Tête */}
        <Circle cx={100} cy={headY} r={26} fill={skin} />

        {/* Coiffures */}
        {cfg.hairStyle !== 'rase' && (
          <Path d="M 74 48 A 26 26 0 0 1 126 48 L 122 40 Q 100 24 78 40 Z" fill={hair} />
        )}
        {cfg.hairStyle === 'chignon' && <Ellipse cx={100} cy={24} rx={9} ry={6} fill={hair} />}
        {cfg.hairStyle === 'long' && (
          <Path d={`M 74 48 Q 70 66 74 80 L 80 78 Q 76 62 78 48 Z`} fill={hair} />
        )}
        {cfg.hairStyle === 'long' && (
          <Path d={`M 126 48 Q 130 66 126 80 L 120 78 Q 124 62 122 48 Z`} fill={hair} />
        )}

        {/* Bandeau (grades avancés) */}
        {outfit.headband && (
          <>
            <Rect x={74} y={40} width={52} height={8} rx={3} fill={outfit.headband} />
            <Path d={`M 126 42 L 140 38 L 138 46 Z`} fill={outfit.headband} />
          </>
        )}

        {/* Yeux (iris de la couleur choisie) + sourire */}
        <Circle cx={90} cy={54} r={3.2} fill={cfg.eyeColor} />
        <Circle cx={110} cy={54} r={3.2} fill={cfg.eyeColor} />
        <Circle cx={90} cy={54} r={1.4} fill={DARK} />
        <Circle cx={110} cy={54} r={1.4} fill={DARK} />
        <Path d="M 93 64 Q 100 69 107 64" stroke={DARK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
