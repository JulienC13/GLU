import {
  Timestamp,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { exerciseSlug } from '@/lib/format';
import type { PersonalRecord, Session, SessionExercise, XpBreakdown } from '@/lib/types';
import { XP_PERF_IMPROVED, XP_RECORD_BROKEN, XP_SESSION_COMPLETED } from '@/lib/xp';

export function sessionsCollection(uid: string) {
  return collection(db, 'users', uid, 'sessions');
}

export function recordsCollection(uid: string) {
  return collection(db, 'users', uid, 'records');
}

/** Écoute en temps réel l'historique des séances (plus récentes en premier). */
export function watchSessions(uid: string, onChange: (sessions: Session[]) => void) {
  const q = query(sessionsCollection(uid), orderBy('completedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session));
  });
}

export function watchSession(uid: string, sessionId: string, onChange: (session: Session | null) => void) {
  return onSnapshot(doc(db, 'users', uid, 'sessions', sessionId), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Session) : null);
  });
}

/** Écoute en temps réel les records personnels. */
export function watchRecords(uid: string, onChange: (records: (PersonalRecord & { id: string })[]) => void) {
  const q = query(recordsCollection(uid), orderBy('achievedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PersonalRecord & { id: string }));
  });
}

/** Meilleure série d'un exercice : poids le plus lourd, puis reps à poids égal. */
function bestSet(exercise: SessionExercise): { weight: number; reps: number } | null {
  const done = exercise.sets.filter((s) => s.done && (s.reps > 0 || s.weight > 0));
  if (done.length === 0) return null;
  return done.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best
  );
}

export type CompletionResult = {
  sessionId: string;
  xpEarned: number;
  xpBreakdown: XpBreakdown;
  recordsBroken: string[];
};

/**
 * Valide une séance : enregistre la session, met à jour les records
 * personnels et crédite l'XP, le tout dans un batch Firestore atomique.
 *
 * Règles XP :
 *  - +50 : séance validée
 *  - +10 par exercice où la perf progresse (poids ou reps au-dessus de la
 *    cible, ou premier enregistrement de l'exercice)
 *  - +30 par record personnel battu
 */
export async function completeSession(
  uid: string,
  params: {
    workoutId: string;
    workoutName: string;
    startedAt: Date;
    exercises: SessionExercise[];
  }
): Promise<CompletionResult> {
  const { workoutId, workoutName, startedAt, exercises } = params;

  // Records existants, pour comparaison.
  const recordsSnap = await getDocs(recordsCollection(uid));
  const records = new Map<string, PersonalRecord>();
  recordsSnap.forEach((d) => records.set(d.id, d.data() as PersonalRecord));

  const batch = writeBatch(db);
  const now = Timestamp.now();

  const sessionRef = doc(sessionsCollection(uid));

  let performanceXp = 0;
  let recordXp = 0;
  const recordsBroken: string[] = [];
  let newRecordsCount = 0;

  for (const exercise of exercises) {
    const best = bestSet(exercise);
    if (!best) continue;

    const slug = exerciseSlug(exercise.name);
    const existing = records.get(slug);

    const beatsRecord =
      !!existing &&
      (best.weight > existing.weight || (best.weight === existing.weight && best.reps > existing.reps));

    const beatsTarget = best.weight > exercise.targetWeight || best.reps > exercise.targetReps;

    if (!existing || beatsRecord || beatsTarget) {
      // Perf ajoutée : première trace de l'exercice, record battu, ou cible dépassée.
      performanceXp += XP_PERF_IMPROVED;
    }

    if (!existing || beatsRecord) {
      if (existing) {
        recordXp += XP_RECORD_BROKEN;
        recordsBroken.push(exercise.name);
      } else {
        newRecordsCount += 1;
      }
      batch.set(doc(recordsCollection(uid), slug), {
        exerciseName: exercise.name,
        weight: best.weight,
        reps: best.reps,
        achievedAt: now,
        sessionId: sessionRef.id,
      } satisfies PersonalRecord);
    }
  }

  const xpBreakdown: XpBreakdown = {
    completion: XP_SESSION_COMPLETED,
    performance: performanceXp,
    records: recordXp,
  };
  const xpEarned = xpBreakdown.completion + xpBreakdown.performance + xpBreakdown.records;

  const doneSets = exercises.flatMap((e) => e.sets.filter((s) => s.done));
  const totals = {
    exercises: exercises.filter((e) => e.sets.some((s) => s.done)).length,
    reps: doneSets.reduce((sum, s) => sum + s.reps, 0),
    volume: doneSets.reduce((sum, s) => sum + s.weight * s.reps, 0),
  };

  batch.set(sessionRef, {
    workoutId,
    workoutName,
    startedAt: Timestamp.fromDate(startedAt),
    completedAt: now,
    exercises,
    xpEarned,
    xpBreakdown,
    recordsBroken,
    totals,
  } satisfies Omit<Session, 'id'>);

  batch.update(doc(db, 'users', uid), {
    xp: increment(xpEarned),
    sessionsCompleted: increment(1),
    recordsCount: increment(recordsBroken.length + newRecordsCount),
  });

  await batch.commit();

  return { sessionId: sessionRef.id, xpEarned, xpBreakdown, recordsBroken };
}
