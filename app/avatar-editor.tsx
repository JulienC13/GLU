import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui';
import {
  BUILDS,
  DEFAULT_AVATAR,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
} from '@/lib/avatar-options';
import { db } from '@/lib/firebase';
import type { AvatarConfig } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl border px-4 py-2.5 active:opacity-70 ${
        selected ? 'border-torii bg-sumi-card' : 'border-sumi-border bg-sumi-light'
      }`}
    >
      <Text className={selected ? 'text-torii-soft font-bold' : 'text-paper-dim font-medium'}>{label}</Text>
    </Pressable>
  );
}

function Swatch({ color, selected, onPress }: { color: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Couleur ${color}`}
      className={`h-10 w-10 rounded-full border-2 ${selected ? 'border-gold' : 'border-sumi-border'}`}
      style={{ backgroundColor: color }}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text className="text-paper font-bold mb-2.5">{title}</Text>
      {children}
    </View>
  );
}

/** Créateur d'avatar — à l'inscription (onboarding) puis modifiable à tout moment. */
export default function AvatarEditorScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';

  const [config, setConfig] = useState<AvatarConfig>(profile?.avatar ?? DEFAULT_AVATAR);
  const [saving, setSaving] = useState(false);

  function patch(p: Partial<AvatarConfig>) {
    setConfig((c) => ({ ...c, ...p }));
  }

  async function onSave() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { avatar: config });
      if (isOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.back();
      }
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer l'avatar. Vérifie ta connexion.");
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-sumi">
      <Stack.Screen
        options={{
          title: isOnboarding ? 'Crée ton avatar' : 'Modifier mon avatar',
          headerBackVisible: !isOnboarding,
          gestureEnabled: !isOnboarding,
        }}
      />
      <ScrollView contentContainerClassName="p-5 pb-16">
        {isOnboarding && (
          <Text className="text-paper-faint text-sm mb-2">
            Ton avatar évoluera avec ton XP : sa musculature se développe à chaque grade, quelle que soit
            sa corpulence de départ.
          </Text>
        )}

        {/* Aperçu en direct */}
        <View className="items-center rounded-2xl border border-sumi-border bg-sumi-card py-5">
          <Avatar xp={profile?.xp ?? 0} config={config} size={180} scene />
        </View>

        <Section title="Sexe">
          <View className="flex-row gap-2">
            {GENDERS.map((g) => (
              <Chip key={g.key} label={g.label} selected={config.gender === g.key} onPress={() => patch({ gender: g.key })} />
            ))}
          </View>
        </Section>

        <Section title="Corpulence de départ">
          <View className="flex-row gap-2">
            {BUILDS.map((b) => (
              <Chip key={b.key} label={b.label} selected={config.build === b.key} onPress={() => patch({ build: b.key })} />
            ))}
          </View>
          <Text className="text-paper-faint text-xs mt-2">
            {BUILDS.find((b) => b.key === config.build)?.hint}
          </Text>
        </Section>

        <Section title="Peau">
          <View className="flex-row gap-2.5">
            {SKIN_TONES.map((c) => (
              <Swatch key={c} color={c} selected={config.skinTone === c} onPress={() => patch({ skinTone: c })} />
            ))}
          </View>
        </Section>

        <Section title="Coiffure">
          <View className="flex-row flex-wrap gap-2">
            {HAIR_STYLES.map((h) => (
              <Chip key={h.key} label={h.label} selected={config.hairStyle === h.key} onPress={() => patch({ hairStyle: h.key })} />
            ))}
          </View>
        </Section>

        {config.hairStyle !== 'rase' && (
          <Section title="Couleur des cheveux">
            <View className="flex-row flex-wrap gap-2.5">
              {HAIR_COLORS.map((c) => (
                <Swatch key={c} color={c} selected={config.hairColor === c} onPress={() => patch({ hairColor: c })} />
              ))}
            </View>
          </Section>
        )}

        <Section title="Couleur des yeux">
          <View className="flex-row gap-2.5">
            {EYE_COLORS.map((c) => (
              <Swatch key={c} color={c} selected={config.eyeColor === c} onPress={() => patch({ eyeColor: c })} />
            ))}
          </View>
        </Section>

        <Button
          title={isOnboarding ? 'Entrer dans le dojo' : 'Enregistrer'}
          onPress={onSave}
          loading={saving}
          className="mt-8"
        />
      </ScrollView>
    </View>
  );
}
