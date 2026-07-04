import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { Button, Card, LoadingScreen } from '@/components/ui';
import { formatWeight } from '@/lib/format';
import type { Workout } from '@/lib/types';
import { deleteWorkout, duplicateWorkout, watchWorkouts } from '@/lib/workouts';
import { useAuth } from '@/providers/auth-provider';

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchWorkouts(user.uid, setWorkouts);
  }, [user]);

  if (!user || workouts === null) return <LoadingScreen />;

  function openActions(workout: Workout) {
    Alert.alert(workout.name, 'Que veux-tu faire ?', [
      { text: 'Modifier', onPress: () => router.push({ pathname: '/workout/new', params: { id: workout.id } }) },
      { text: 'Dupliquer', onPress: () => void duplicateWorkout(user!.uid, workout) },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Supprimer la séance', `Supprimer « ${workout.name} » ? L'historique est conservé.`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => void deleteWorkout(user!.uid, workout.id) },
          ]),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  return (
    <View className="flex-1 bg-sumi">
      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        contentContainerClassName="p-5 pb-28"
        ListEmptyComponent={
          <View className="items-center mt-20 px-8">
            <Text className="text-5xl mb-4">🥋</Text>
            <Text className="text-paper text-lg font-bold text-center">Aucune séance pour l'instant</Text>
            <Text className="text-paper-faint text-sm text-center mt-2">
              Crée ta première séance avec tes exercices, puis lance-la pour gagner de l'XP.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="mb-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-paper text-lg font-bold">{item.name}</Text>
                <Text className="text-paper-faint text-xs mt-0.5">
                  {item.exercises.length} exercice{item.exercises.length > 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable onPress={() => openActions(item)} hitSlop={12} accessibilityLabel="Options de la séance">
                <Text className="text-paper-dim text-xl">⋯</Text>
              </Pressable>
            </View>

            <View className="mt-3">
              {item.exercises.slice(0, 3).map((ex) => (
                <Text key={ex.id} className="text-paper-dim text-sm" numberOfLines={1}>
                  • {ex.name} — {formatWeight(ex.weight)} × {ex.reps} reps × {ex.sets} séries
                </Text>
              ))}
              {item.exercises.length > 3 && (
                <Text className="text-paper-faint text-xs mt-1">+ {item.exercises.length - 3} autres…</Text>
              )}
            </View>

            <Button
              title="Lancer la séance"
              onPress={() => router.push({ pathname: '/session/[workoutId]', params: { workoutId: item.id } })}
              className="mt-4"
            />
          </Card>
        )}
      />

      <View className="absolute bottom-6 left-5 right-5">
        <Button title="＋  Créer une séance" onPress={() => router.push('/workout/new')} variant="success" />
      </View>
    </View>
  );
}
