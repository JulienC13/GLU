import type { User } from 'firebase/auth';

/**
 * Comptes administrateurs — accès au Labo (sandbox de test : réglage libre
 * de l'XP, aperçu de tous les paliers, réinitialisation du compte…).
 *
 * Pour ajouter un admin : ajouter son email ici ET dans la fonction
 * isAdmin() de firestore.rules, puis redéployer les règles
 * (`npx firebase-tools deploy --only firestore:rules`).
 */
export const ADMIN_EMAILS = ['j.charpentierdev@gmail.com'];

export function isAdminUser(user: User | null | undefined): boolean {
  return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}
