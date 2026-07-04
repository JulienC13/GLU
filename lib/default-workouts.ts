import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ExerciseTemplate } from '@/lib/types';
import { workoutsCollection } from '@/lib/workouts';

type DefaultWorkout = { name: string; exercises: ExerciseTemplate[] };

/** Séances proposées par défaut aux nouveaux comptes. */
export const DEFAULT_WORKOUTS: DefaultWorkout[] = [
  {
    name: 'Full Body Découverte',
    exercises: [
      { id: 'fb-squat', name: 'Squat gobelet', weight: 12, reps: 12, sets: 3, restSec: 90 },
      { id: 'fb-dc', name: 'Développé couché haltères', weight: 10, reps: 10, sets: 3, restSec: 90 },
      { id: 'fb-rowing', name: 'Rowing haltère un bras', weight: 12, reps: 10, sets: 3, restSec: 90 },
      { id: 'fb-dm', name: 'Développé militaire', weight: 8, reps: 10, sets: 3, restSec: 90 },
      { id: 'fb-crunch', name: 'Crunchs', weight: 0, reps: 15, sets: 3, restSec: 60 },
    ],
  },
  {
    name: 'Haut du corps',
    exercises: [
      { id: 'up-dc', name: 'Développé couché', weight: 40, reps: 8, sets: 4, restSec: 120 },
      { id: 'up-traction', name: 'Tractions', weight: 0, reps: 6, sets: 4, restSec: 120 },
      { id: 'up-dm', name: 'Développé militaire', weight: 25, reps: 8, sets: 3, restSec: 90 },
      { id: 'up-curl', name: 'Curl biceps haltères', weight: 10, reps: 12, sets: 3, restSec: 60 },
      { id: 'up-triceps', name: 'Extension triceps poulie', weight: 15, reps: 12, sets: 3, restSec: 60 },
    ],
  },
  {
    name: 'Bas du corps',
    exercises: [
      { id: 'low-squat', name: 'Squat barre', weight: 50, reps: 8, sets: 4, restSec: 120 },
      { id: 'low-presse', name: 'Presse à cuisses', weight: 100, reps: 10, sets: 3, restSec: 90 },
      { id: 'low-fentes', name: 'Fentes marchées', weight: 20, reps: 12, sets: 3, restSec: 90 },
      { id: 'low-sdt', name: 'Soulevé de terre roumain', weight: 40, reps: 10, sets: 3, restSec: 90 },
      { id: 'low-mollets', name: 'Extensions mollets debout', weight: 40, reps: 15, sets: 4, restSec: 60 },
    ],
  },
];

/** Ajoute les séances par défaut au compte (utilisé à l'inscription et depuis le labo admin). */
export async function seedDefaultWorkouts(uid: string): Promise<void> {
  const batch = writeBatch(db);
  for (const workout of DEFAULT_WORKOUTS) {
    batch.set(doc(workoutsCollection(uid)), {
      name: workout.name,
      exercises: workout.exercises,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
