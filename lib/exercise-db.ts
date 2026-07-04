/**
 * Bibliothèque d'exercices.
 *
 * Recherche via l'API publique wger (https://wger.de — open source, sans clé,
 * avec noms français), avec repli sur une liste locale intégrée si le réseau
 * est indisponible ou que l'API ne répond pas.
 */

export type LibraryExercise = {
  id: string;
  name: string;
  category: string;
};

/** Liste locale de secours — les classiques de la salle. */
export const LOCAL_EXERCISES: LibraryExercise[] = [
  { id: 'developpe-couche', name: 'Développé couché', category: 'Pectoraux' },
  { id: 'developpe-incline', name: 'Développé incliné haltères', category: 'Pectoraux' },
  { id: 'ecarte-couche', name: 'Écarté couché', category: 'Pectoraux' },
  { id: 'pompes', name: 'Pompes', category: 'Pectoraux' },
  { id: 'dips', name: 'Dips', category: 'Pectoraux' },
  { id: 'traction', name: 'Tractions', category: 'Dos' },
  { id: 'rowing-barre', name: 'Rowing barre', category: 'Dos' },
  { id: 'rowing-haltere', name: 'Rowing haltère un bras', category: 'Dos' },
  { id: 'tirage-vertical', name: 'Tirage vertical poulie', category: 'Dos' },
  { id: 'tirage-horizontal', name: 'Tirage horizontal poulie', category: 'Dos' },
  { id: 'souleve-de-terre', name: 'Soulevé de terre', category: 'Dos' },
  { id: 'developpe-militaire', name: 'Développé militaire', category: 'Épaules' },
  { id: 'elevations-laterales', name: 'Élévations latérales', category: 'Épaules' },
  { id: 'elevations-frontales', name: 'Élévations frontales', category: 'Épaules' },
  { id: 'oiseau', name: 'Oiseau (élévations buste penché)', category: 'Épaules' },
  { id: 'curl-biceps', name: 'Curl biceps haltères', category: 'Bras' },
  { id: 'curl-barre', name: 'Curl barre EZ', category: 'Bras' },
  { id: 'curl-marteau', name: 'Curl marteau', category: 'Bras' },
  { id: 'extension-triceps', name: 'Extension triceps poulie', category: 'Bras' },
  { id: 'barre-au-front', name: 'Barre au front', category: 'Bras' },
  { id: 'squat', name: 'Squat barre', category: 'Jambes' },
  { id: 'squat-gobelet', name: 'Squat gobelet', category: 'Jambes' },
  { id: 'presse-cuisses', name: 'Presse à cuisses', category: 'Jambes' },
  { id: 'fentes', name: 'Fentes marchées', category: 'Jambes' },
  { id: 'leg-curl', name: 'Leg curl allongé', category: 'Jambes' },
  { id: 'leg-extension', name: 'Leg extension', category: 'Jambes' },
  { id: 'souleve-de-terre-roumain', name: 'Soulevé de terre roumain', category: 'Jambes' },
  { id: 'hip-thrust', name: 'Hip thrust', category: 'Fessiers' },
  { id: 'mollets-debout', name: 'Extensions mollets debout', category: 'Mollets' },
  { id: 'crunch', name: 'Crunchs', category: 'Abdominaux' },
  { id: 'gainage', name: 'Gainage planche', category: 'Abdominaux' },
  { id: 'releve-jambes', name: 'Relevés de jambes suspendu', category: 'Abdominaux' },
  { id: 'russian-twist', name: 'Russian twists', category: 'Abdominaux' },
  { id: 'burpees', name: 'Burpees', category: 'Cardio' },
  { id: 'rameur', name: 'Rameur', category: 'Cardio' },
  { id: 'course-tapis', name: 'Course sur tapis', category: 'Cardio' },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Filtre la liste locale par terme de recherche. */
export function searchLocalExercises(term: string): LibraryExercise[] {
  const t = normalize(term.trim());
  if (!t) return LOCAL_EXERCISES;
  return LOCAL_EXERCISES.filter(
    (ex) => normalize(ex.name).includes(t) || normalize(ex.category).includes(t)
  );
}

type WgerSuggestion = {
  value: string;
  data: { id: number; name: string; category: string };
};

/**
 * Recherche en ligne (API wger, français). Lève en cas d'échec réseau —
 * l'appelant retombe alors sur `searchLocalExercises`.
 */
export async function searchOnlineExercises(
  term: string,
  signal?: AbortSignal
): Promise<LibraryExercise[]> {
  const url = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(term)}&language=fr&format=json`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`wger HTTP ${res.status}`);
  const json = (await res.json()) as { suggestions?: WgerSuggestion[] };
  const seen = new Set<string>();
  const results: LibraryExercise[] = [];
  for (const s of json.suggestions ?? []) {
    const name = s.data?.name ?? s.value;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    results.push({ id: `wger-${s.data?.id ?? name}`, name, category: s.data?.category ?? '' });
  }
  return results;
}

// --- Pont de sélection : l'éditeur enregistre un callback, l'écran de
// --- recherche le résout avec l'exercice choisi.
let pickerCallback: ((exercise: LibraryExercise) => void) | null = null;

export function setExercisePickerCallback(cb: (exercise: LibraryExercise) => void) {
  pickerCallback = cb;
}

export function resolveExercisePicker(exercise: LibraryExercise) {
  pickerCallback?.(exercise);
  pickerCallback = null;
}
