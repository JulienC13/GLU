import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card, LoadingScreen } from '@/components/ui';
import { formatDateTime, formatWeight } from '@/lib/format';
import { watchSession } from '@/lib/sessions';
import type { Session } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

export default function SessionDetailScreen() {
  const { user } = useAuth();
  const { sessionId, celebrate } = useLocalSearchParams<{ sessionId: string; celebrate?: string }>();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!user || !sessionId) return;
    return watchSession(user.uid, sessionId, setSession);
  }, [user, sessionId]);

  if (session === undefined) return <LoadingScreen />;
  if (session === null) {
    return (
      <View className="flex-1 items-center justify-center bg-sumi px-8">
        <Text className="text-paper text-lg font-bold">Séance introuvable</Text>
      </View>
    );
  }

  const recordSet = new Set(session.recordsBroken);

  return (
    <ScrollView className="flex-1 bg-sumi" contentContainerClassName="p-5 pb-12">
      {/* Célébration après validation */}
      {celebrate === '1' && (
        <Card className="mb-4 items-center border-gold/60 py-6">
          <Text className="text-4xl mb-2">🎉</Text>
          <Text className="text-paper text-xl font-extrabold">Séance validée !</Text>
          <Text className="text-gold text-3xl font-black mt-2">+{session.xpEarned} XP</Text>
          {session.recordsBroken.length > 0 && (
            <Text className="text-torii-soft font-semibold mt-2 text-center">
              🏆 Record battu : {session.recordsBroken.join(', ')}
            </Text>
          )}
        </Card>
      )}

      <Text className="text-paper text-2xl font-extrabold">{session.workoutName}</Text>
      <Text className="text-paper-faint text-sm mt-1">{formatDateTime(session.completedAt)}</Text>

      {/* Résumé */}
      <View className="flex-row gap-3 mt-4">
        <Card className="flex-1 items-center py-4">
          <Text className="text-paper text-lg font-extrabold">{session.totals.exercises}</Text>
          <Text className="text-paper-faint text-xs mt-1">Exercices</Text>
        </Card>
        <Card className="flex-1 items-center py-4">
          <Text className="text-paper text-lg font-extrabold">{session.totals.reps}</Text>
          <Text className="text-paper-faint text-xs mt-1">Répétitions</Text>
        </Card>
        <Card className="flex-1 items-center py-4">
          <Text className="text-paper text-lg font-extrabold">
            {session.totals.volume.toLocaleString('fr-FR')}
          </Text>
          <Text className="text-paper-faint text-xs mt-1">kg soulevés</Text>
        </Card>
      </View>

      {/* Détail XP */}
      <Card className="mt-4">
        <Text className="text-paper font-bold mb-3">Expérience gagnée</Text>
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-paper-dim text-sm">Séance terminée</Text>
          <Text className="text-gold font-semibold">+{session.xpBreakdown.completion} XP</Text>
        </View>
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-paper-dim text-sm">Perfs améliorées</Text>
          <Text className="text-gold font-semibold">+{session.xpBreakdown.performance} XP</Text>
        </View>
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-paper-dim text-sm">Records battus</Text>
          <Text className="text-gold font-semibold">+{session.xpBreakdown.records} XP</Text>
        </View>
        <View className="mt-2 border-t border-sumi-border pt-2 flex-row justify-between">
          <Text className="text-paper font-bold">Total</Text>
          <Text className="text-gold font-extrabold">+{session.xpEarned} XP</Text>
        </View>
      </Card>

      {/* Exercices */}
      <Text className="text-paper font-bold text-lg mt-6 mb-3">Exercices</Text>
      {session.exercises.map((ex, i) => (
        <Card key={`${ex.name}-${i}`} className="mb-3">
          <View className="flex-row items-center">
            <Text className="text-paper text-base font-bold flex-1">{ex.name}</Text>
            {recordSet.has(ex.name) && (
              <View className="rounded-full bg-gold/20 px-2.5 py-1">
                <Text className="text-gold text-xs font-bold">🏆 RECORD</Text>
              </View>
            )}
          </View>
          <Text className="text-paper-faint text-xs mt-0.5">
            Objectif : {formatWeight(ex.targetWeight)} × {ex.targetReps} reps — repos {ex.restSec}s
          </Text>
          <View className="mt-3">
            {ex.sets.map((set, j) => (
              <View key={j} className="flex-row items-center py-1">
                <Text className="w-12 text-paper-faint text-sm">#{j + 1}</Text>
                <Text className={`flex-1 text-sm ${set.done ? 'text-paper' : 'text-paper-faint line-through'}`}>
                  {formatWeight(set.weight)} × {set.reps} reps
                </Text>
                <Text className="text-sm">{set.done ? '✅' : '—'}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
