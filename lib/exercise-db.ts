import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bibliothèque d'exercices — deux sources complémentaires :
 *
 *  - Une liste française "rapide" (LOCAL_EXERCISES), sans image, pour une
 *    saisie instantanée hors ligne.
 *  - Une base enrichie en anglais avec photo + instructions détaillées,
 *    chargée depuis le jeu de données ouvert free-exercise-db
 *    (https://github.com/yuhonas/free-exercise-db, ~800 exercices, gratuit,
 *    sans clé API), mise en cache localement après le premier chargement.
 */

export type LibraryExercise = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  description?: string;
  level?: string;
  equipment?: string;
  primaryMuscles?: string[];
};

/** Liste locale de secours — les classiques de la salle, en français. */
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

/** Filtre la liste locale française par terme de recherche. */
export function searchLocalExercises(term: string): LibraryExercise[] {
  const t = normalize(term.trim());
  if (!t) return LOCAL_EXERCISES;
  return LOCAL_EXERCISES.filter(
    (ex) => normalize(ex.name).includes(t) || normalize(ex.category).includes(t)
  );
}

// --- Base enrichie (free-exercise-db) : photo + instructions, en anglais.

const EXERCISES_JSON_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
const STORAGE_KEY = 'glu_exercise_library_v1';

type RawExercise = {
  id: string;
  name: string;
  category: string;
  level?: string;
  equipment?: string | null;
  primaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
};

function mapRaw(e: RawExercise): LibraryExercise {
  return {
    id: `fedb-${e.id}`,
    name: e.name,
    category: e.category,
    level: e.level,
    equipment: e.equipment ?? undefined,
    primaryMuscles: e.primaryMuscles,
    description: e.instructions?.join('\n\n'),
    imageUrl: e.images?.[0] ? `${IMAGE_BASE_URL}${e.images[0]}` : undefined,
  };
}

let cachedLibrary: LibraryExercise[] | null = null;
let loadingPromise: Promise<LibraryExercise[]> | null = null;

/**
 * Charge la base enrichie : cache mémoire → cache disque (hors ligne) →
 * réseau (rafraîchit le cache disque). Ne lève jamais : renvoie [] si tout échoue.
 */
export async function loadExerciseLibrary(): Promise<LibraryExercise[]> {
  if (cachedLibrary) return cachedLibrary;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) cachedLibrary = JSON.parse(stored) as LibraryExercise[];
    } catch {
      // cache disque corrompu ou indisponible : on retente le réseau
    }

    try {
      const res = await fetch(EXERCISES_JSON_URL);
      if (res.ok) {
        const raw = (await res.json()) as RawExercise[];
        const mapped = raw.map(mapRaw);
        cachedLibrary = mapped;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)).catch(() => {});
      }
    } catch (e) {
      console.warn('[GLU] Base enrichie indisponible (hors ligne ?)', e);
    }

    return cachedLibrary ?? [];
  })();

  return loadingPromise;
}

/** Filtre la base enrichie déjà chargée par nom, catégorie ou muscle ciblé. */
export function searchExerciseLibrary(library: LibraryExercise[], term: string, limit = 30): LibraryExercise[] {
  const t = normalize(term.trim());
  const matches = t
    ? library.filter(
        (e) =>
          normalize(e.name).includes(t) ||
          normalize(e.category).includes(t) ||
          (e.equipment && normalize(e.equipment).includes(t)) ||
          e.primaryMuscles?.some((m) => normalize(m).includes(t))
      )
    : library;
  return matches.slice(0, limit);
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
