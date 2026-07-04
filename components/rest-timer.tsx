import { Pressable, Text, View } from 'react-native';

import { formatDuration } from '@/lib/format';

/** Bandeau de repos entre deux séries, avec compte à rebours. */
export function RestTimer({
  secondsLeft,
  totalSeconds,
  onSkip,
  onExtend,
}: {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
  onExtend: (seconds: number) => void;
}) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;

  return (
    <View className="rounded-2xl border border-torii bg-sumi-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-torii-soft font-bold">⏳ Repos</Text>
        <Text className="text-paper text-3xl font-black tabular-nums">{formatDuration(secondsLeft)}</Text>
      </View>
      <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sumi-light">
        <View className="h-full rounded-full bg-torii" style={{ width: `${progress * 100}%` }} />
      </View>
      <View className="flex-row gap-3 mt-3">
        <Pressable
          onPress={() => onExtend(15)}
          className="flex-1 items-center rounded-xl border border-sumi-border py-2 active:opacity-70"
        >
          <Text className="text-paper-dim font-semibold">+15 s</Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          className="flex-1 items-center rounded-xl bg-torii py-2 active:opacity-80"
        >
          <Text className="text-paper font-semibold">Passer</Text>
        </Pressable>
      </View>
    </View>
  );
}
