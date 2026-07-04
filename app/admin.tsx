import { useRouter } from 'expo-router';
import { collection, doc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button, Card, Field } from '@/components/ui';
import { isAdminUser } from '@/lib/admin';
import { seedDefaultWorkouts } from '@/lib/default-workouts';
import { db } from '@/lib/firebase';
import { TIERS } from '@/lib/xp';
import { useAuth } from '@/providers/auth-provider';

/**
 * Labo admin — sandbox de test réservé aux comptes listés dans lib/admin.ts.
 * Permet de régler librement l'XP (et donc le palier/avatar), de prévisualiser
 * tous les grades, de réinjecter les séances par défaut et de tout remettre à zéro.
 */
export default function AdminScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [customXp, setCustomXp] = useState('');
  const [busy, setBusy] = useState(false);

  const admin = isAdminUser(user);

  useEffect(() => {
    if (user !== undefined && !admin) router.back();
  }, [user, admin, router]);

  if (!user || !admin) return null;

  async function setXp(value: number) {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'users', user!.uid), { xp: Math.max(0, Math.round(value)) });
    } catch {
      Alert.alert(
        'Refusé par Firestore',
        "Les règles bloquent la baisse d'XP. Vérifie que ton email est dans isAdmin() de firestore.rules et redéploie-les."
      );
    } finally {
      setBusy(false);
    }
  }

  async function addXp(delta: number) {
    await setXp((profile?.xp ?? 0) + delta);
  }

  async function resetAccount() {
    Alert.alert(
      'Réinitialiser le compte',
      'Supprime toutes les séances, sessions et records, et remet l’XP à 0. Irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              for (const sub of ['workouts', 'sessions', 'records']) {
                const snap = await getDocs(collection(db, 'users', user!.uid, sub));
                // Lots de 400 (limite Firestore : 500 écritures par batch).
                const docs = snap.docs;
                for (let i = 0; i < docs.length; i += 400) {
                  const batch = writeBatch(db);
                  docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
                  await batch.commit();
                }
              }
              await updateDoc(doc(db, 'users', user!.uid), {
                xp: 0,
                sessionsCompleted: 0,
                recordsCount: 0,
              });
              Alert.alert('Compte réinitialisé', 'Toutes les données ont été effacées.');
            } catch {
              Alert.alert('Erreur', 'La réinitialisation a échoué (règles Firestore ?).');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView className="flex-1 bg-sumi" contentContainerClassName="p-5 pb-12">
      <Text className="text-paper-faint text-sm">
        Sandbox de test — visible uniquement par les comptes admin. XP actuel :{' '}
        <Text className="text-gold font-bold">{(profile?.xp ?? 0).toLocaleString('fr-FR')}</Text>
      </Text>

      {/* Sauter à un palier */}
      <Text className="text-paper font-bold text-lg mt-6 mb-3">Sauter à un palier</Text>
      <View className="flex-row flex-wrap gap-2">
        {TIERS.map((t) => (
          <Pressable
            key={t.key}
            disabled={busy}
            onPress={() => void setXp(t.minXp)}
            className="rounded-xl border border-sumi-border bg-sumi-card px-4 py-2.5 active:opacity-70"
          >
            <Text className="text-paper font-semibold">{t.name}</Text>
            <Text className="text-paper-faint text-xs">{t.minXp.toLocaleString('fr-FR')} XP</Text>
          </Pressable>
        ))}
      </View>

      {/* Ajuster l'XP */}
      <Text className="text-paper font-bold text-lg mt-6 mb-3">Ajuster l'XP</Text>
      <View className="flex-row flex-wrap gap-2">
        {[-1000, -100, +100, +1000].map((delta) => (
          <Pressable
            key={delta}
            disabled={busy}
            onPress={() => void addXp(delta)}
            className={`rounded-xl px-4 py-2.5 active:opacity-70 border ${
              delta > 0 ? 'border-matcha bg-sumi-card' : 'border-torii bg-sumi-card'
            }`}
          >
            <Text className={delta > 0 ? 'text-matcha font-bold' : 'text-torii-soft font-bold'}>
              {delta > 0 ? `+${delta}` : delta}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row items-end gap-3 mt-3">
        <Field
          label="Valeur exacte"
          value={customXp}
          onChangeText={setCustomXp}
          keyboardType="number-pad"
          placeholder="12500"
          className="flex-1"
        />
        <Button
          title="Appliquer"
          loading={busy}
          onPress={() => {
            const n = Number(customXp);
            if (Number.isFinite(n) && n >= 0) void setXp(n);
          }}
        />
      </View>

      {/* Aperçu des 5 grades */}
      <Text className="text-paper font-bold text-lg mt-8 mb-3">Aperçu des 5 grades</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
        {TIERS.map((t) => (
          <Card key={t.key} className="mr-3 items-center px-5 py-4 w-44">
            <Avatar xp={t.minXp} size={110} />
            <Text className="text-paper font-bold mt-2">{t.name}</Text>
            <Text className="text-paper-faint text-xs text-center mt-1">{t.description}</Text>
          </Card>
        ))}
      </ScrollView>

      {/* Outils */}
      <Text className="text-paper font-bold text-lg mt-8 mb-3">Outils</Text>
      <Button
        title="Réinjecter les séances par défaut"
        variant="ghost"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await seedDefaultWorkouts(user!.uid);
            Alert.alert('OK', 'Les 3 séances par défaut ont été ajoutées.');
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        title="Réinitialiser mon compte (tout effacer)"
        variant="danger"
        className="mt-3"
        loading={busy}
        onPress={() => void resetAccount()}
      />
    </ScrollView>
  );
}
