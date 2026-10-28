import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { DEFAULT_AVATAR } from '@/lib/avatar-options';
import { GRID_H, GRID_W, buildAvatarGrid, buildDojoScene, gridToPaths } from '@/lib/pixel-avatar';
import type { AvatarConfig } from '@/lib/types';
import { tierIndex } from '@/lib/xp';

const SCENE_PATHS = gridToPaths(buildDojoScene());

/**
 * Avatar pixel art : personnalisation (sexe, corpulence, peau, cheveux, yeux,
 * barbe) × grade (tenue, ceinture, morphologie qui évolue avec l'XP).
 */
export function Avatar({
  xp,
  config,
  size = 180,
  scene = false,
  tier,
}: {
  xp: number;
  config?: AvatarConfig | null;
  size?: number;
  /** Affiche le décor de dojo derrière le personnage. */
  scene?: boolean;
  /** Force un grade (0-4) — aperçu de l'évolution, sinon déduit de l'XP. */
  tier?: number;
}) {
  const cfg = config ?? DEFAULT_AVATAR;
  const idx = tier ?? tierIndex(xp);
  const paths = useMemo(() => gridToPaths(buildAvatarGrid(cfg, idx)), [cfg, idx]);

  return (
    <View style={{ width: size, height: (size * GRID_H) / GRID_W }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${GRID_W} ${GRID_H}`}>
        {scene && SCENE_PATHS.map((p) => <Path key={`s${p.color}`} d={p.d} fill={p.color} />)}
        {paths.map((p) => (
          <Path key={p.color} d={p.d} fill={p.color} />
        ))}
      </Svg>
    </View>
  );
}
