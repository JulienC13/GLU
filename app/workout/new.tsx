import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Field, LoadingScreen } from '@/components/ui';
import { setExercisePickerCallback } from '@/lib/exercise-db';
import { db } from '@/lib/firebase';
import type { ExerciseTemplate, Workout } from '@/lib/types';
import { createWorkout, updateWorkout } from '@/lib/workouts';
import { useAuth } from '@/providers/auth-provider';

type ExerciseDraft = {
  id: string;
  name: string;
  weight: string;
  reps: string;
  sets: string;
  restMin: string;
  restSec: string;
};

function emptyExercise(): ExerciseDraft {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    weight: '',
    reps: '',
    sets: '',
    restMin: '1',
    restSec: '30',
  };
}

function parsePositive(value: string, fallback = 0): number {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function WorkoutEditorScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseDraft[]>([emptyExercise()]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  // Mode édition : charge la séance existante.
  useEffect(() => {
    if (!id || !user) return;
    getDoc(doc(db, 'users', user.uid, 'workouts', id)).then((snap) => {
      if (snap.exists()) {
        const w = snap.data() as Workout;
        setName(w.name);
        setExercises(
          w.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            weight: ex.weight ? String(ex.weight) : '',
            reps: String(ex.reps),
            sets: String(ex.sets),
            restMin: String(Math.floor(ex.restSec / 60)),
            restSec: String(ex.restSec % 60),
          }))
        );
      }
      setLoading(false);
    });
  }, [id, user]);

  function updateExercise(exId: string, patch: Partial<ExerciseDraft>) {
    setExercises((list) => list.map((ex) => (ex.id === exId ? { ...ex, ...patch } : ex)));
  }

  function removeExercise(exId: string) {
    setExercises((list) => (list.length > 1 ? list.filter((ex) => ex.id !== exId) : list));
  }

  /** Ouvre la bibliothèque d'exercices et remplit le nom au retour. */
  function openLibrary(exId: string) {
    setExercisePickerCallback((exercise) => updateExercise(exId, { name: exercise.name }));
    router.push('/exercise-picker');
  }

  async function onSave() {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Donne un nom à ta séance (ex. « Upper body »).');
      return;
    }
    const cleaned: ExerciseTemplate[] = exercises
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        id: ex.id,
        name: ex.name.trim(),
        weight: parsePositive(ex.weight),
        reps: Math.max(1, Math.round(parsePositive(ex.reps, 1))),
        sets: Math.max(1, Math.round(parsePositive(ex.sets, 1))),
        restSec: Math.max(
          0,
          Math.round(parsePositive(ex.restMin, 0)) * 60 + Math.round(parsePositive(ex.restSec, 0))
        ),
      }));
    if (cleaned.length === 0) {
      Alert.alert('Exercice requis', 'Ajoute au moins un exercice avec un nom.');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updateWorkout(user.uid, id, name.trim(), cleaned);
      } else {
        await createWorkout(user.uid, name.trim(), cleaned);
      }
      router.back();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la séance. Vérifie ta connexion.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-sumi">
      <Stack.Screen options={{ title: id ? 'Modifier la séance' : 'Nouvelle séance' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="p-5 pb-16" keyboardShouldPersistTaps="handled">
          <Field label="Nom de la séance" value={name} onChangeText={setName} placeholder="Upper body" />

          <Text className="text-paper font-bold text-lg mt-6 mb-3">Exercices</Text>

          {exercises.map((ex, index) => (
            <Card key={ex.id} className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-torii-soft font-bold">Exercice {index + 1}</Text>
                {exercises.length > 1 && (
                  <Pressable onPress={() => removeExercise(ex.id)} hitSlop={12}>
                    <Text className="text-paper-faint">✕ Retirer</Text>
                  </Pressable>
                )}
              </View>
              <View className="flex-row items-end gap-2">
                <Field
                  value={ex.name}
                  onChangeText={(v) => updateExercise(ex.id, { name: v })}
                  placeholder="Développé couché"
                  className="flex-1"
                />
                <Pressable
                  onPress={() => openLibrary(ex.id)}
                  accessibilityLabel="Choisir dans la bibliothèque d'exercices"
                  className="h-12 w-12 items-center justify-center rounded-xl border border-sumi-border bg-sumi-light active:opacity-70"
                >
                  <Ionicons name="search" size={20} color="#D9A441" />
                </Pressable>
              </View>
              <View className="flex-row gap-3 mt-3">
                <Field
                  label="Poids (kg)"
                  value={ex.weight}
                  onChangeText={(v) => updateExercise(ex.id, { weight: v })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  className="flex-1"
                />
                <Field
                  label="Répétitions"
                  value={ex.reps}
                  onChangeText={(v) => updateExercise(ex.id, { reps: v })}
                  keyboardType="number-pad"
                  placeholder="10"
                  className="flex-1"
                />
              </View>
              <View className="flex-row gap-3 mt-3">
                <Field
                  label="Séries"
                  value={ex.sets}
                  onChangeText={(v) => updateExercise(ex.id, { sets: v })}
                  keyboardType="number-pad"
                  placeholder="4"
                  className="flex-1"
                />
                <View className="flex-1">
                  <Text className="mb-1.5 text-paper-dim text-sm font-medium">Repos</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Field
                      value={ex.restMin}
                      onChangeText={(v) => updateExercise(ex.id, { restMin: v })}
                      keyboardType="number-pad"
                      placeholder="1"
                      className="flex-1"
                    />
                    <Text className="text-paper-faint text-xs">min</Text>
                    <Field
                      value={ex.restSec}
                      onChangeText={(v) => updateExercise(ex.id, { restSec: v })}
                      keyboardType="number-pad"
                      placeholder="30"
                      className="flex-1"
                    />
                    <Text className="text-paper-faint text-xs">s</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}

          <Button
            title="＋ Ajouter un exercice"
            variant="ghost"
            onPress={() => setExercises((list) => [...list, emptyExercise()])}
          />
          <Button
            title={id ? 'Enregistrer les modifications' : 'Créer la séance'}
            onPress={onSave}
            loading={saving}
            className="mt-4"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
