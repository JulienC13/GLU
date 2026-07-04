import type { Timestamp } from 'firebase/firestore';

/** Profil utilisateur — document `users/{uid}` */
export type UserProfile = {
  displayName: string;
  email: string;
  xp: number;
  sessionsCompleted: number;
  recordsCount: number;
  createdAt: Timestamp;
};

/** Exercice défini dans une séance (modèle) */
export type ExerciseTemplate = {
  id: string;
  name: string;
  weight: number; // kg (0 = poids de corps)
  reps: number;
  sets: number;
  restSec: number;
};

/** Séance créée par l'utilisateur — document `users/{uid}/workouts/{id}` */
export type Workout = {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Une série réellement effectuée pendant une séance */
export type SetLog = {
  weight: number;
  reps: number;
  done: boolean;
};

/** Un exercice tel que réalisé pendant une séance */
export type SessionExercise = {
  name: string;
  targetWeight: number;
  targetReps: number;
  restSec: number;
  sets: SetLog[];
};

export type XpBreakdown = {
  /** +50 XP : séance validée */
  completion: number;
  /** +10 XP par exercice où la perf progresse (poids ou reps) */
  performance: number;
  /** +30 XP par record personnel battu */
  records: number;
};

/** Séance terminée — document `users/{uid}/sessions/{id}` */
export type Session = {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: Timestamp;
  completedAt: Timestamp;
  exercises: SessionExercise[];
  xpEarned: number;
  xpBreakdown: XpBreakdown;
  /** Noms des exercices dont le record a été battu pendant cette séance */
  recordsBroken: string[];
  totals: {
    exercises: number;
    reps: number;
    /** Volume total soulevé en kg (poids × reps des séries validées) */
    volume: number;
  };
};

/** Record personnel — document `users/{uid}/records/{slug}` */
export type PersonalRecord = {
  exerciseName: string;
  weight: number;
  reps: number;
  achievedAt: Timestamp;
  sessionId: string;
};
