import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, LoadingScreen } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/format';
import { watchRecords, watchSessions } from '@/lib/sessions';
import type { PersonalRecord, Session } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

export default function HistoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [records, setRecords] = useState<(PersonalRecord & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubSessions = watchSessions(user.uid, setSessions);
    const unsubRecords = watchRecords(user.uid, setRecords);
    return () => {
      unsubSessions();
      unsubRecords();
    };
  }, [user]);

  if (!user || sessions === null) return <LoadingScreen />;

  return (
    <FlatList
      className="flex-1 bg-sumi"
      data={sessions}
      keyExtractor={(s) => s.id}
      contentContainerClassName="p-5 pb-10"
      ListHeaderComponent={
        <View>
          {/* Records personnels mis en avant */}
          <Text className="text-paper font-bold text-lg mb-3">🏆 Records personnels</Text>
          {records.length === 0 ? (
            <Text className="text-paper-faint text-sm mb-6">
              Termine une séance pour enregistrer tes premiers records.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-5 px-5">
              {records.map((r) => (
                <View key={r.id} className="mr-3 rounded-2xl border border-gold/40 bg-sumi-card px-4 py-3 min-w-[150px]">
                  <Text className="text-gold font-bold" numberOfLines={1}>
                    {r.exerciseName}
                  </Text>
                  <Text className="text-paper text-lg font-extrabold mt-1">
                    {r.weight > 0 ? `${r.weight} kg × ${r.reps}` : `${r.reps} reps`}
                  </Text>
                  <Text className="text-paper-faint text-xs mt-1">{formatDate(r.achievedAt)}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <Text className="text-paper font-bold text-lg mb-3">Séances passées</Text>
        </View>
      }
      ListEmptyComponent={
        <View className="items-center mt-10 px-8">
          <Text className="text-5xl mb-4">📜</Text>
          <Text className="text-paper text-lg font-bold text-center">Aucune séance terminée</Text>
          <Text className="text-paper-faint text-sm text-center mt-2">
            Ton historique d'entraînement apparaîtra ici, séance après séance.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/history/[sessionId]', params: { sessionId: item.id } })}
        >
          <Card className="mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center">
                  <Text className="text-paper text-base font-bold">{item.workoutName}</Text>
                  {item.recordsBroken.length > 0 && <Text className="ml-2">🏆</Text>}
                </View>
                <Text className="text-paper-faint text-xs mt-0.5">{formatDateTime(item.completedAt)}</Text>
                <Text className="text-paper-dim text-xs mt-2">
                  {item.totals.exercises} exercices • {item.totals.reps} reps •{' '}
                  {item.totals.volume.toLocaleString('fr-FR')} kg soulevés
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gold font-extrabold">+{item.xpEarned} XP</Text>
                <Text className="text-paper-faint text-lg mt-1">›</Text>
              </View>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}
