import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import '@/global.css';
import { LoadingScreen } from '@/components/ui';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

function RootNavigator() {
  const { user, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Garde d'authentification : redirige selon l'état de connexion.
  useEffect(() => {
    if (user === undefined) return; // état inconnu, on attend Firebase
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, router]);

  // Onboarding : un compte sans avatar passe d'abord par le créateur d'avatar.
  useEffect(() => {
    if (!user || !profile || profile.avatar) return;
    if (segments[0] !== 'avatar-editor' && segments[0] !== '(auth)') {
      router.replace({ pathname: '/avatar-editor', params: { onboarding: '1' } });
    }
  }, [user, profile, segments, router]);

  if (user === undefined) return <LoadingScreen />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#14141C' },
        headerTintColor: '#F3EAD8',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#14141C' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="avatar-editor" options={{ title: 'Mon avatar' }} />
      <Stack.Screen name="workout/new" options={{ title: 'Nouvelle séance', presentation: 'modal' }} />
      <Stack.Screen name="exercise-picker" options={{ title: "Bibliothèque d'exercices", presentation: 'modal' }} />
      <Stack.Screen name="admin" options={{ title: 'Labo admin' }} />
      <Stack.Screen name="session/[workoutId]" options={{ title: 'Entraînement', headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="history/[sessionId]" options={{ title: 'Détail de la séance' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
