import type { Timestamp } from 'firebase/firestore';

/** "Lundi 12 mai 2025, 18h23" */
export function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const s = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}, ${time}`;
}

/** "12 mai 2025" */
export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  return ts.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatWeight(kg: number): string {
  return kg > 0 ? `${kg} kg` : 'Poids de corps';
}

/** "1:30" pour 90 secondes */
export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "1 min 30 s" pour 90 secondes, "45 s" pour 45, "2 min" pour 120. */
export function formatRest(totalSec: number): string {
  if (totalSec < 60) return `${totalSec} s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
}

/** Identifiant stable pour un exercice ("Développé couché" -> "developpe-couche") */
export function exerciseSlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'exercice'
  );
}
