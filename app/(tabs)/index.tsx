import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button, Card } from '@/components/ui';
import { XpBar } from '@/components/xp-bar';
import { TIERS, tierForXp } from '@/lib/xp';
import { useAuth } from '@/providers/auth-provider';

export default function DojoScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const xp = profile?.xp ?? 0;
  const tier = tierForXp(xp);
  const name = profile?.displayName || user?.displayName || 'Athlète';

  function confirmSignOut() {
    Alert.alert('Quitter le dojo', 'Se déconnecter de Gym Level UP ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-sumi" contentContainerClassName="p-5 pb-10">
      {/* En-tête */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-paper-faint text-sm">Bienvenue au dojo</Text>
          <Text className="text-paper text-2xl font-extrabold">{name}</Text>
        </View>
        <Pressable onPress={confirmSignOut} hitSlop={12} accessibilityLabel="Se déconnecter">
          <Text className="text-paper-faint text-2xl">⏻</Text>
        </Pressable>
      </View>

      {/* Avatar + palier */}
      <Card className="mt-5 items-center py-6">
        <Text className="text-gold text-5xl font-black mb-1">{tier.kanji}</Text>
        <Avatar xp={xp} size={190} />
        <Text className="text-paper text-xl font-extrabold mt-2">{tier.name}</Text>
        <Text className="text-paper-faint text-xs mt-1 text-center px-6">{tier.description}</Text>
        <View className="w-full mt-5">
          <XpBar xp={xp} />
        </View>
      </Card>

      {/* Statistiques */}
      <View className="flex-row gap-3 mt-4">
        <Card className="flex-1 items-center py-5">
          <Text className="text-torii-soft text-2xl font-extrabold">{profile?.sessionsCompleted ?? 0}</Text>
          <Text className="text-paper-faint text-xs mt-1">Séances terminées</Text>
        </Card>
        <Card className="flex-1 items-center py-5">
          <Text className="text-gold text-2xl font-extrabold">{profile?.recordsCount ?? 0}</Text>
          <Text className="text-paper-faint text-xs mt-1">Records personnels</Text>
        </Card>
      </View>

      <Button title="⛩️  Commencer l'entraînement" onPress={() => router.push('/(tabs)/workouts')} className="mt-5" />

      {/* Paliers */}
      <Text className="text-paper font-bold text-lg mt-8 mb-3">La voie du guerrier</Text>
      {TIERS.map((t) => {
        const reached = xp >= t.minXp;
        const current = t.key === tier.key;
        return (
          <View
            key={t.key}
            className={`flex-row items-center rounded-xl px-4 py-3 mb-2 border ${
              current ? 'border-torii bg-sumi-card' : 'border-sumi-border bg-sumi-light'
            } ${reached ? '' : 'opacity-50'}`}
          >
            <Text className="text-2xl mr-3">{reached ? t.kanji : '🔒'}</Text>
            <View className="flex-1">
              <Text className="text-paper font-semibold">{t.name}</Text>
              <Text className="text-paper-faint text-xs">
                {isFinite(t.maxXp)
                  ? `${t.minXp.toLocaleString('fr-FR')} – ${t.maxXp.toLocaleString('fr-FR')} XP`
                  : `${t.minXp.toLocaleString('fr-FR')}+ XP`}
              </Text>
            </View>
            {current && <Text className="text-torii-soft text-xs font-bold">ACTUEL</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}
