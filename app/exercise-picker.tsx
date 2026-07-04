import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Field } from '@/components/ui';
import {
  loadExerciseLibrary,
  resolveExercisePicker,
  searchExerciseLibrary,
  searchLocalExercises,
  type LibraryExercise,
} from '@/lib/exercise-db';

/** Recherche d'exercices : liste rapide en français + base enrichie (photos, en anglais). */
export default function ExercisePickerScreen() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [richLibrary, setRichLibrary] = useState<LibraryExercise[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadExerciseLibrary().then(setRichLibrary);
  }, []);

  const quick = useMemo(() => searchLocalExercises(term), [term]);
  const rich = useMemo(
    () => (richLibrary ? searchExerciseLibrary(richLibrary, term) : []),
    [richLibrary, term]
  );

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

      <ScrollView className="mt-4" keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        {/* Liste rapide française */}
        <Text className="text-paper font-bold mb-2">Suggestions rapides</Text>
        {quick.length === 0 ? (
          <Text className="text-paper-faint text-sm mb-4">Aucun résultat dans la liste rapide.</Text>
        ) : (
          <View className="mb-6">
            {quick.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item)}
                className="flex-row items-center justify-between rounded-xl border border-sumi-border bg-sumi-card px-4 py-3 mb-2 active:opacity-70"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-paper font-semibold">{item.name}</Text>
                  <Text className="text-paper-faint text-xs mt-0.5">{item.category}</Text>
                </View>
                <Text className="text-torii-soft text-lg">＋</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Base enrichie : photo + description, en anglais */}
        <Text className="text-paper font-bold mb-1">Base enrichie (photos et instructions)</Text>
        <Text className="text-paper-faint text-xs mb-2">
          Noms en anglais — modifiable après ajout. Touche un résultat pour voir photo et instructions.
        </Text>
        {richLibrary === null ? (
          <Text className="text-paper-faint text-sm">Chargement de la base…</Text>
        ) : rich.length === 0 ? (
          <Text className="text-paper-faint text-sm">
            Aucun résultat. Vérifie ta connexion ou affine ta recherche.
          </Text>
        ) : (
          rich.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <View
                key={item.id}
                className="rounded-xl border border-sumi-border bg-sumi-card mb-2 overflow-hidden"
              >
                <Pressable
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                  className="flex-row items-center px-3 py-3 active:opacity-70"
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 48, height: 48, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-12 w-12 rounded-lg bg-sumi-light items-center justify-center">
                      <Text>🏋️</Text>
                    </View>
                  )}
                  <View className="flex-1 px-3">
                    <Text className="text-paper font-semibold">{item.name}</Text>
                    <Text className="text-paper-faint text-xs mt-0.5" numberOfLines={1}>
                      {[item.category, item.equipment, item.level].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text className="text-paper-faint">{expanded ? '︿' : '﹀'}</Text>
                </Pressable>

                {expanded && (
                  <View className="px-3 pb-3">
                    {item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: 180, borderRadius: 10 }}
                        contentFit="contain"
                      />
                    )}
                    {!!item.primaryMuscles?.length && (
                      <Text className="text-gold text-xs font-semibold mt-2">
                        Muscles ciblés : {item.primaryMuscles.join(', ')}
                      </Text>
                    )}
                    {!!item.description && (
                      <Text className="text-paper-dim text-sm mt-2">{item.description}</Text>
                    )}
                    <Pressable
                      onPress={() => onSelect(item)}
                      className="mt-3 items-center rounded-lg bg-torii py-2.5 active:opacity-80"
                    >
                      <Text className="text-paper font-bold">Ajouter cet exercice</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
