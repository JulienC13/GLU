import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Field } from '@/components/ui';
import {
  resolveExercisePicker,
  searchLocalExercises,
  searchOnlineExercises,
  type LibraryExercise,
} from '@/lib/exercise-db';

/** Recherche d'exercices dans la bibliothèque (API wger + liste locale). */
export default function ExercisePickerScreen() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<LibraryExercise[]>(searchLocalExercises(''));
  const [source, setSource] = useState<'local' | 'online'>('local');
  const abortRef = useRef<AbortController | null>(null);

  // Recherche avec debounce : locale immédiate, en ligne dès 2 caractères.
  useEffect(() => {
    abortRef.current?.abort();
    const local = searchLocalExercises(term);
    setResults(local);
    setSource('local');

    if (term.trim().length < 2) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const online = await searchOnlineExercises(term.trim(), controller.signal);
        if (controller.signal.aborted) return;
        if (online.length > 0) {
          // Fusionne : résultats en ligne d'abord, puis locaux non doublonnés.
          const names = new Set(online.map((e) => e.name.toLowerCase()));
          setResults([...online, ...local.filter((e) => !names.has(e.name.toLowerCase()))]);
          setSource('online');
        }
      } catch {
        // Hors ligne ou API indisponible : la liste locale reste affichée.
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  function onSelect(exercise: LibraryExercise) {
    resolveExercisePicker(exercise);
    router.back();
  }

  return (
    <View className="flex-1 bg-sumi p-5">
      <Field
        value={term}
        onChangeText={setTerm}
        placeholder="Rechercher un exercice (ex. squat, biceps…)"
        autoFocus
      />
      <Text className="text-paper-faint text-xs mt-2">
        {source === 'online'
          ? 'Résultats de la bibliothèque en ligne (wger) + liste intégrée'
          : 'Liste intégrée — la recherche en ligne se lance dès 2 caractères'}
      </Text>

      <FlatList
        className="mt-3"
        data={results}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-10"
        ListEmptyComponent={
          <Text className="text-paper-faint text-sm text-center mt-10">
            Aucun exercice trouvé. Tu peux fermer cet écran et saisir le nom librement.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            className="flex-row items-center justify-between rounded-xl border border-sumi-border bg-sumi-card px-4 py-3 mb-2 active:opacity-70"
          >
            <View className="flex-1 pr-3">
              <Text className="text-paper font-semibold">{item.name}</Text>
              {!!item.category && <Text className="text-paper-faint text-xs mt-0.5">{item.category}</Text>}
            </View>
            <Text className="text-torii-soft text-lg">＋</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
