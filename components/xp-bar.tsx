import { Text, View } from 'react-native';

import { tierForXp, tierProgress, xpToNextTier } from '@/lib/xp';

export function XpBar({ xp }: { xp: number }) {
  const tier = tierForXp(xp);
  const progress = tierProgress(xp);
  const remaining = xpToNextTier(xp);

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between">
        <Text className="text-paper font-bold text-base">{tier.name}</Text>
        <Text className="text-gold font-semibold text-sm">{xp.toLocaleString('fr-FR')} XP</Text>
      </View>
      <View className="mt-2 h-3 w-full overflow-hidden rounded-full bg-sumi-light border border-sumi-border">
        <View className="h-full rounded-full bg-gold" style={{ width: `${Math.max(3, progress * 100)}%` }} />
      </View>
      <Text className="mt-1.5 text-paper-faint text-xs">
        {remaining !== null
          ? `${remaining.toLocaleString('fr-FR')} XP avant le palier suivant`
          : 'Palier maximum atteint — légende du dojo 🏮'}
      </Text>
    </View>
  );
}
