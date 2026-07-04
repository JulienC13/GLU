/**
 * Cloud Functions GLU — garde-fou serveur du système XP.
 *
 * L'app calcule et crédite l'XP côté client (fonctionne dès le plan Spark).
 * Cette fonction, déployable sur plan Blaze, revalide chaque séance créée :
 * si l'XP annoncé ne correspond pas aux règles (+50 séance, +10/perf,
 * +30/record), la séance est corrigée et l'écart retiré du profil.
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();
const db = getFirestore();

const XP_SESSION_COMPLETED = 50;
const XP_PERF_IMPROVED = 10;
const XP_RECORD_BROKEN = 30;

type SetLog = { weight: number; reps: number; done: boolean };
type SessionExercise = {
  name: string;
  targetWeight: number;
  targetReps: number;
  sets: SetLog[];
};

/** Borne supérieure de l'XP légitime pour une séance donnée. */
function maxLegitimateXp(exercises: SessionExercise[]): number {
  const exercisesWithPerf = exercises.filter((ex) =>
    ex.sets.some((s) => s.done && (s.reps > 0 || s.weight > 0))
  ).length;
  return (
    XP_SESSION_COMPLETED +
    exercisesWithPerf * XP_PERF_IMPROVED +
    exercisesWithPerf * XP_RECORD_BROKEN
  );
}

export const validateSessionXp = onDocumentCreated(
  'users/{userId}/sessions/{sessionId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const session = snap.data() as { xpEarned?: number; exercises?: SessionExercise[] };
    const claimed = session.xpEarned ?? 0;
    const ceiling = maxLegitimateXp(session.exercises ?? []);

    if (claimed <= ceiling) return;

    const excess = claimed - ceiling;
    logger.warn(
      `XP suspect pour ${event.params.userId}/${event.params.sessionId} : ` +
        `${claimed} annoncé, plafond ${ceiling}. Correction de ${excess} XP.`
    );

    await db.doc(`users/${event.params.userId}`).update({ xp: FieldValue.increment(-excess) });
    await snap.ref.update({ xpEarned: ceiling, xpFlagged: true });
  }
);
