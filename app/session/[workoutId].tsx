import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RestTimer } from '@/components/rest-timer';
import { Button, Card, LoadingScreen } from '@/components/ui';
import { db } from '@/lib/firebase';
import { formatWeight } from '@/lib/format';
import { completeSession } from '@/lib/sessions';
import type { SessionExercise, Workout } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

type SetDraft = { weight: string; reps: string; done: boolean };
type ExerciseState = {
  name: string;
  targetWeight: number;
  targetReps: number;
  restSec: number;
  sets: SetDraft[];
};

function parseNum(value: string): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function LiveSessionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [validating, setValidating] = useState(false);
  const startedAtRef = useRef(new Date());

  // Timer de repos : timestamp de fin, pour rester juste même si l'app rame.
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!user || !workoutId) return;
    getDoc(doc(db, 'users', user.uid, 'workouts', workoutId)).then((snap) => {
      if (!snap.exists()) {
        Alert.alert('Introuvable', "Cette séance n'existe plus.");
        router.back();
        return;
      }
      const w = { id: snap.id, ...snap.data() } as Workout;
      setWorkout(w);
      setExercises(
        w.exercises.map((ex) => ({
          name: ex.name,
          targetWeight: ex.weight,
          targetReps: ex.reps,
          restSec: ex.restSec,
          sets: Array.from({ length: ex.sets }, () => ({
            weight: ex.weight ? String(ex.weight) : '0',
            reps: String(ex.reps),
            done: false,
          })),
        }))
      );
    });
  }, [user, workoutId, router]);

  // Tick du compte à rebours.
  useEffect(() => {
    if (!rest) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [rest]);

  const restSecondsLeft = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;

  // Fin du repos : vibration et disparition du bandeau.
  useEffect(() => {
    if (rest && restSecondsLeft <= 0) {
      setRest(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [rest, restSecondsLeft]);

  function updateSet(exIndex: number, setIndex: number, patch: Partial<SetDraft>) {
    setExercises((list) =>
      list.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) }
          : ex
      )
    );
  }

  function toggleSetDone(exIndex: number, setIndex: number) {
    const set = exercises[exIndex].sets[setIndex];
    const nowDone = !set.done;
    updateSet(exIndex, setIndex, { done: nowDone });

    if (nowDone) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Lance le repos automatiquement, sauf si c'était la toute dernière série.
      const isLastSet =
        exIndex === exercises.length - 1 && setIndex === exercises[exIndex].sets.length - 1;
      const restSec = exercises[exIndex].restSec;
      if (!isLastSet && restSec > 0) {
        setNow(Date.now());
        setRest({ endsAt: Date.now() + restSec * 1000, total: restSec });
      }
    }
  }

  const doneCount = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0);
  const totalCount = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  async function onValidate() {
    if (!user || !workout) return;
    if (doneCount === 0) {
      Alert.alert('Séance vide', 'Valide au moins une série avant de terminer la séance.');
      return;
    }
    const proceed = async () => {
      setValidating(true);
      try {
        const payload: SessionExercise[] = exercises.map((ex) => ({
          name: ex.name,
          targetWeight: ex.targetWeight,
          targetReps: ex.targetReps,
          restSec: ex.restSec,
          sets: ex.sets.map((s) => ({ weight: parseNum(s.weight), reps: Math.round(parseNum(s.reps)), done: s.done })),
        }));
        const result = await completeSession(user.uid, {
          workoutId: workout.id,
          workoutName: workout.name,
          startedAt: startedAtRef.current,
          exercises: payload,
        });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
          pathname: '/history/[sessionId]',
          params: { sessionId: result.sessionId, celebrate: '1' },
        });
      } catch {
        Alert.alert('Erreur', "Impossible d'enregistrer la séance. Vérifie ta connexion.");
        setValidating(false);
      }
    };

    if (doneCount < totalCount) {
      Alert.alert(
        'Séries non faites',
        `${totalCount - doneCount} série(s) non validée(s). Terminer quand même ?`,
        [
          { text: 'Continuer la séance', style: 'cancel' },
          { text: 'Valider la séance', onPress: () => void proceed() },
        ]
      );
    } else {
      await proceed();
    }
  }

  function onQuit() {
    Alert.alert('Abandonner la séance', 'Les performances saisies seront perdues.', [
      { text: 'Continuer', style: 'cancel' },
      { text: 'Abandonner', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!workout) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-sumi">
      <Stack.Screen
        options={{
          title: workout.name,
          headerLeft: () => (
            <Pressable onPress={onQuit} hitSlop={12}>
              <Text className="text-torii-soft font-semibold">Quitter</Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="p-5 pb-40" keyboardShouldPersistTaps="handled">
          <Text className="text-paper-faint text-sm mb-4">
            {doneCount}/{totalCount} séries validées — chaque série compte. 頑張って !
          </Text>

          {exercises.map((ex, exIndex) => (
            <Card key={`${ex.name}-${exIndex}`} className="mb-4">
              <Text className="text-paper text-lg font-bold">{ex.name}</Text>
              <Text className="text-paper-faint text-xs mt-0.5">
                Objectif : {formatWeight(ex.targetWeight)} × {ex.targetReps} reps — repos {ex.restSec}s
              </Text>

              <View className="flex-row mt-4 mb-1 pr-12">
                <Text className="w-14 text-paper-faint text-xs">Série</Text>
                <Text className="flex-1 text-paper-faint text-xs text-center">Poids (kg)</Text>
                <Text className="flex-1 text-paper-faint text-xs text-center">Reps</Text>
              </View>

              {ex.sets.map((set, setIndex) => (
                <View key={setIndex} className="flex-row items-center mt-2">
                  <Text className="w-14 text-paper-dim font-semibold">#{setIndex + 1}</Text>
                  <TextInput
                    value={set.weight}
                    onChangeText={(v) => updateSet(exIndex, setIndex, { weight: v })}
                    keyboardType="decimal-pad"
                    editable={!set.done}
                    className={`flex-1 rounded-lg border px-3 py-2 text-center text-base mx-1 ${
                      set.done
                        ? 'border-matcha/40 bg-sumi-light text-paper-faint'
                        : 'border-sumi-border bg-sumi-light text-paper'
                    }`}
                  />
                  <TextInput
                    value={set.reps}
                    onChangeText={(v) => updateSet(exIndex, setIndex, { reps: v })}
                    keyboardType="number-pad"
                    editable={!set.done}
                    className={`flex-1 rounded-lg border px-3 py-2 text-center text-base mx-1 ${
                      set.done
                        ? 'border-matcha/40 bg-sumi-light text-paper-faint'
                        : 'border-sumi-border bg-sumi-light text-paper'
                    }`}
                  />
                  <Pressable
                    onPress={() => toggleSetDone(exIndex, setIndex)}
                    hitSlop={8}
                    accessibilityLabel={set.done ? 'Série validée' : 'Valider la série'}
                    className={`ml-1 h-10 w-10 items-center justify-center rounded-lg border ${
                      set.done ? 'bg-matcha border-matcha' : 'border-sumi-border bg-sumi-light'
                    }`}
                  >
                    <Text className={set.done ? 'text-sumi font-black' : 'text-paper-faint'}>✓</Text>
                  </Pressable>
                </View>
              ))}
            </Card>
          ))}
        </ScrollView>

        {/* Zone basse : timer de repos + validation */}
        <View className="absolute bottom-0 left-0 right-0 bg-sumi/95 px-5 pb-8 pt-3 border-t border-sumi-border">
          {rest && restSecondsLeft > 0 && (
            <View className="mb-3">
              <RestTimer
                secondsLeft={restSecondsLeft}
                totalSeconds={rest.total}
                onSkip={() => setRest(null)}
                onExtend={(s) => setRest((r) => (r ? { ...r, endsAt: r.endsAt + s * 1000 } : r))}
              />
            </View>
          )}
          <Button title="Valider la séance" variant="success" onPress={onValidate} loading={validating} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
