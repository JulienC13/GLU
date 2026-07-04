import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ExerciseTemplate, Workout } from '@/lib/types';

export function workoutsCollection(uid: string) {
  return collection(db, 'users', uid, 'workouts');
}

/** Écoute en temps réel la liste des séances de l'utilisateur. */
export function watchWorkouts(uid: string, onChange: (workouts: Workout[]) => void) {
  const q = query(workoutsCollection(uid), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workout));
  });
}

export async function createWorkout(uid: string, name: string, exercises: ExerciseTemplate[]) {
  const ref = await addDoc(workoutsCollection(uid), {
    name,
    exercises,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWorkout(uid: string, workoutId: string, name: string, exercises: ExerciseTemplate[]) {
  await updateDoc(doc(db, 'users', uid, 'workouts', workoutId), {
    name,
    exercises,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorkout(uid: string, workoutId: string) {
  await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
}

export async function duplicateWorkout(uid: string, workout: Workout) {
  return createWorkout(uid, `${workout.name} (copie)`, workout.exercises);
}
