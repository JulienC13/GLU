import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui';
import {
  BEARD_STYLES,
  BUILDS,
  EYE_PALETTE,
  EYE_STYLES,
  GENDERS,
  HAIR_PALETTE,
  HAIR_STYLES,
  SKIN_PALETTE,
  randomAvatar,
} from '@/lib/avatar-options';
import { db } from '@/lib/firebase';
import type { AvatarConfig } from '@/lib/types';
import { TIERS, tierIndex } from '@/lib/xp';
import { useAuth } from '@/providers/auth-provider';

/** Ligne "‹ valeur ›" façon LaBrute : on fait défiler les variantes d'un trait. */
function Selector({
  label,
  value,
  swatch,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  swatch?: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-sumi-border bg-sumi-card px-2 py-1.5 mb-2">
      <Pressable onPress={onPrev} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
        <Ionicons name="chevron-back" size={22} color="#E06B66" />
      </Pressable>
      <View className="flex-1 items-center">
        <Text className="text-paper-faint text-xs">{label}</Text>
        <View className="flex-row items-center mt-0.5">
          {swatch && (
            <View className="mr-2 h-4 w-4 rounded border border-black/40" style={{ backgroundColor: swatch }} />
          )}
          <Text className="text-paper font-bold">{value}</Text>
        </View>
      </View>
      <Pressable onPress={onNext} hitSlop={8} className="h-9 w-9 items-center justify-center active:opacity-60">
        <Ionicons name="chevron-forward" size={22} color="#E06B66" />
      </Pressable>
    </View>
  );
}

function cycle(value: number, length: number, step: number): number {
  return (value + step + length) % length;
}

/** Créateur d'avatar — à l'inscription (onboarding) puis modifiable à tout moment. */
export default function AvatarEditorScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';

  const [config, setConfig] = useState<AvatarConfig>(() => profile?.avatar ?? randomAvatar());
  const [previewTier, setPreviewTier] = useState(() => tierIndex(profile?.xp ?? 0));
  const [saving, setSaving] = useState(false);

  const hairStyles = HAIR_STYLES[config.gender];

  function step(key: 'skin' | 'hair' | 'hairColor' | 'eyes' | 'eyeColor' | 'beard', length: number, dir: number) {
    setConfig((c) => ({ ...c, [key]: cycle(c[key], length, dir) }));
  }

  function stepBuild(dir: number) {
    setConfig((c) => {
      const i = BUILDS.findIndex((b) => b.key === c.build);
      return { ...c, build: BUILDS[cycle(i, BUILDS.length, dir)].key };
    });
  }

  function setGender(gender: AvatarConfig['gender']) {
    setConfig((c) =>
      c.gender === gender
        ? c
        : { ...c, gender, hair: Math.min(c.hair, HAIR_STYLES[gender].length - 1), beard: gender === 'femme' ? 0 : c.beard }
    );
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

  const build = BUILDS.find((b) => b.key === config.build) ?? BUILDS[1];

  return (
    <View className="flex-1 bg-sumi">
      <Stack.Screen
        options={{
          title: isOnboarding ? 'Crée ton combattant' : 'Modifier mon avatar',
          headerBackVisible: !isOnboarding,
          gestureEnabled: !isOnboarding,
        }}
      />
      <ScrollView contentContainerClassName="p-5 pb-16">
        {/* Aperçu + tirage aléatoire */}
        <View className="items-center rounded-2xl border border-sumi-border bg-sumi-card p-3">
          <Avatar xp={0} tier={previewTier} config={config} size={200} scene />
          <Pressable
            onPress={() => setConfig(randomAvatar(config.gender))}
            accessibilityLabel="Apparence aléatoire"
            className="absolute right-3 top-3 h-12 w-12 items-center justify-center rounded-xl bg-torii active:opacity-80"
          >
            <Ionicons name="dice" size={26} color="#F3EAD8" />
          </Pressable>
        </View>

        {/* Aperçu de l'évolution par grade */}
        <Text className="text-paper-faint text-xs mt-3 mb-1.5 text-center">
          Aperçu de l'évolution — ton avatar se transforme à chaque grade
        </Text>
        <View className="flex-row flex-wrap justify-center gap-1.5">
          {TIERS.map((t, i) => (
            <Pressable
              key={t.key}
              onPress={() => setPreviewTier(i)}
              className={`rounded-lg border px-2.5 py-1.5 ${
                previewTier === i ? 'border-gold bg-sumi-card' : 'border-sumi-border bg-sumi-light'
              }`}
            >
              <Text className={previewTier === i ? 'text-gold text-xs font-bold' : 'text-paper-faint text-xs'}>
                {t.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sexe */}
        <View className="flex-row gap-2 mt-5 mb-3">
          {GENDERS.map((g) => (
            <Pressable
              key={g.key}
              onPress={() => setGender(g.key)}
              className={`flex-1 items-center rounded-xl border py-2.5 ${
                config.gender === g.key ? 'border-torii bg-sumi-card' : 'border-sumi-border bg-sumi-light'
              }`}
            >
              <Text className={config.gender === g.key ? 'text-torii-soft font-bold' : 'text-paper-dim'}>
                {g.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Selector label="Corpulence de départ" value={build.label} onPrev={() => stepBuild(-1)} onNext={() => stepBuild(1)} />
        <Text className="text-paper-faint text-xs -mt-1 mb-3 text-center">{build.hint}</Text>

        <Selector
          label="Peau"
          value={`Teinte ${config.skin + 1}`}
          swatch={SKIN_PALETTE[config.skin]}
          onPrev={() => step('skin', SKIN_PALETTE.length, -1)}
          onNext={() => step('skin', SKIN_PALETTE.length, 1)}
        />
        <Selector
          label="Coiffure"
          value={hairStyles[config.hair]?.label ?? ''}
          onPrev={() => step('hair', hairStyles.length, -1)}
          onNext={() => step('hair', hairStyles.length, 1)}
        />
        <Selector
          label="Couleur des cheveux"
          value={`Couleur ${config.hairColor + 1}`}
          swatch={HAIR_PALETTE[config.hairColor]}
          onPrev={() => step('hairColor', HAIR_PALETTE.length, -1)}
          onNext={() => step('hairColor', HAIR_PALETTE.length, 1)}
        />
        <Selector
          label="Regard"
          value={EYE_STYLES[config.eyes]?.label ?? ''}
          onPrev={() => step('eyes', EYE_STYLES.length, -1)}
          onNext={() => step('eyes', EYE_STYLES.length, 1)}
        />
        <Selector
          label="Couleur des yeux"
          value={`Couleur ${config.eyeColor + 1}`}
          swatch={EYE_PALETTE[config.eyeColor]}
          onPrev={() => step('eyeColor', EYE_PALETTE.length, -1)}
          onNext={() => step('eyeColor', EYE_PALETTE.length, 1)}
        />
        {config.gender === 'homme' && (
          <Selector
            label="Pilosité"
            value={BEARD_STYLES[config.beard]?.label ?? ''}
            onPrev={() => step('beard', BEARD_STYLES.length, -1)}
            onNext={() => step('beard', BEARD_STYLES.length, 1)}
          />
        )}

        <Button
          title={isOnboarding ? 'Entrer dans le dojo' : 'Enregistrer'}
          onPress={onSave}
          loading={saving}
          className="mt-6"
        />
      </ScrollView>
    </View>
  );
}
