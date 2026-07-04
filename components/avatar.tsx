import { View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import { tierIndex } from '@/lib/xp';

/**
 * Avatar 2D flat design, ambiance dojo.
 * La silhouette, la tenue et la ceinture évoluent avec les 5 paliers :
 * Novice → Apprenti → Intermédiaire → Athlète → Hero.
 */

type TierLook = {
  shoulder: number; // demi-largeur d'épaules
  waist: number; // demi-largeur de taille
  arm: number; // épaisseur de bras
  leg: number; // épaisseur de jambe
  gi: string; // couleur du kimono
  giTrim: string; // col / finitions
  belt: string; // ceinture
  headband: string | null;
  aura: boolean;
  chestLines: boolean;
};

const SKIN = '#E8B98A';
const HAIR = '#2A2028';

const LOOKS: TierLook[] = [
  // Novice — silhouette fine, kimono blanc, ceinture blanche
  {
    shoulder: 26, waist: 22, arm: 7, leg: 10,
    gi: '#EDE6D6', giTrim: '#D6CDB8', belt: '#F3EAD8',
    headband: null, aura: false, chestLines: false,
  },
  // Apprenti — corps plus tonique, ceinture or
  {
    shoulder: 31, waist: 23, arm: 9, leg: 11,
    gi: '#EDE6D6', giTrim: '#D6CDB8', belt: '#D9A441',
    headband: null, aura: false, chestLines: false,
  },
  // Intermédiaire — posture engagée, bandeau blanc, ceinture bleue
  {
    shoulder: 36, waist: 24, arm: 12, leg: 12,
    gi: '#E3DCCB', giTrim: '#C9BFa6', belt: '#5B84B1',
    headband: '#F3EAD8', aura: false, chestLines: false,
  },
  // Athlète — musculature visible, kimono sombre, bandeau rouge
  {
    shoulder: 42, waist: 26, arm: 15, leg: 13,
    gi: '#3A3A48', giTrim: '#2A2A35', belt: '#C9403A',
    headband: '#C9403A', aura: false, chestLines: true,
  },
  // Hero — posture héroïque, kimono noir liseré or, aura dorée
  {
    shoulder: 48, waist: 27, arm: 18, leg: 15,
    gi: '#1C1C24', giTrim: '#D9A441', belt: '#14141C',
    headband: '#C9403A', aura: true, chestLines: true,
  },
];

export function Avatar({ xp, size = 180 }: { xp: number; size?: number }) {
  const look = LOOKS[tierIndex(xp)];

  const headY = 52;
  const shoulderY = 88;
  const beltY = 148;
  const hipY = 160;
  const footY = 222;

  return (
    <View style={{ width: size, height: size * 1.2 }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 240">
        {look.aura && (
          <>
            <Circle cx={100} cy={118} r={95} fill="#D9A441" opacity={0.12} />
            <Circle cx={100} cy={118} r={78} fill="#D9A441" opacity={0.12} />
          </>
        )}

        {/* Jambes (pantalon de kimono) */}
        <Rect x={100 - look.waist + 4} y={hipY - 6} width={look.leg} height={footY - hipY} rx={look.leg / 2} fill={look.gi} />
        <Rect x={100 + look.waist - 4 - look.leg} y={hipY - 6} width={look.leg} height={footY - hipY} rx={look.leg / 2} fill={look.gi} />
        <Ellipse cx={100 - look.waist + 4 + look.leg / 2} cy={footY} rx={look.leg / 2 + 3} ry={5} fill={HAIR} />
        <Ellipse cx={100 + look.waist - 4 - look.leg / 2} cy={footY} rx={look.leg / 2 + 3} ry={5} fill={HAIR} />

        {/* Bras */}
        <Rect
          x={100 - look.shoulder - look.arm}
          y={shoulderY - 2}
          width={look.arm}
          height={54}
          rx={look.arm / 2}
          fill={SKIN}
        />
        <Rect
          x={100 + look.shoulder}
          y={shoulderY - 2}
          width={look.arm}
          height={54}
          rx={look.arm / 2}
          fill={SKIN}
        />

        {/* Torse (kimono) */}
        <Path
          d={`M ${100 - look.shoulder} ${shoulderY}
              L ${100 + look.shoulder} ${shoulderY}
              L ${100 + look.waist} ${hipY}
              L ${100 - look.waist} ${hipY} Z`}
          fill={look.gi}
        />
        {/* Col croisé du kimono */}
        <Path
          d={`M ${100 - look.shoulder * 0.55} ${shoulderY} L 100 ${shoulderY + 34} L ${100 - 4} ${shoulderY + 34} L ${100 - look.shoulder * 0.75} ${shoulderY} Z`}
          fill={look.giTrim}
        />
        <Path
          d={`M ${100 + look.shoulder * 0.55} ${shoulderY} L 100 ${shoulderY + 34} L ${100 + 4} ${shoulderY + 34} L ${100 + look.shoulder * 0.75} ${shoulderY} Z`}
          fill={look.giTrim}
        />
        {/* Pectoraux marqués (paliers avancés) */}
        {look.chestLines && (
          <>
            <Line x1={100 - look.shoulder * 0.6} y1={shoulderY + 26} x2={100 - 6} y2={shoulderY + 30} stroke={look.giTrim} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={100 + look.shoulder * 0.6} y1={shoulderY + 26} x2={100 + 6} y2={shoulderY + 30} stroke={look.giTrim} strokeWidth={2.5} strokeLinecap="round" />
          </>
        )}

        {/* Ceinture + nœud */}
        <Rect x={100 - look.waist - 2} y={beltY} width={(look.waist + 2) * 2} height={10} fill={look.belt} stroke="#00000022" strokeWidth={1} />
        <Rect x={94} y={beltY - 1} width={12} height={12} rx={2} fill={look.belt} stroke="#00000033" strokeWidth={1} />
        <Path d={`M 96 ${beltY + 11} L 92 ${beltY + 26} L 97 ${beltY + 26} L 99 ${beltY + 12} Z`} fill={look.belt} />
        <Path d={`M 104 ${beltY + 11} L 108 ${beltY + 26} L 103 ${beltY + 26} L 101 ${beltY + 12} Z`} fill={look.belt} />

        {/* Tête */}
        <Circle cx={100} cy={headY} r={26} fill={SKIN} />
        {/* Cheveux — chignon samouraï */}
        <Path d="M 74 48 A 26 26 0 0 1 126 48 L 122 40 Q 100 24 78 40 Z" fill={HAIR} />
        <Ellipse cx={100} cy={24} rx={9} ry={6} fill={HAIR} />
        {/* Bandeau */}
        {look.headband && (
          <>
            <Rect x={74} y={40} width={52} height={8} rx={3} fill={look.headband} />
            <Path d={`M 126 42 L 140 38 L 138 46 Z`} fill={look.headband} />
          </>
        )}
        {/* Yeux + sourire */}
        <Circle cx={90} cy={54} r={2.6} fill={HAIR} />
        <Circle cx={110} cy={54} r={2.6} fill={HAIR} />
        <Path d="M 93 64 Q 100 69 107 64" stroke={HAIR} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
