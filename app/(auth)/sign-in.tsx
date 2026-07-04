import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    default:
      return 'Connexion impossible. Vérifiez votre réseau et votre configuration Firebase.';
  }
}

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Champs requis', 'Renseignez votre email et votre mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // La redirection est gérée par la garde d'auth du layout racine.
    } catch (e: any) {
      Alert.alert('Connexion échouée', authErrorMessage(e?.code ?? ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-sumi">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-10">
            <Text className="text-6xl mb-3">⛩️</Text>
            <Text className="text-paper text-3xl font-extrabold tracking-wide">Gym Level UP</Text>
            <Text className="text-paper-faint text-sm mt-2">Entre dans le dojo. Deviens plus fort.</Text>
          </View>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="toi@exemple.fr"
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            className="mt-4"
          />

          <Button title="Se connecter" onPress={onSubmit} loading={loading} className="mt-8" />

          <View className="flex-row justify-center mt-6">
            <Text className="text-paper-faint">Pas encore de compte ? </Text>
            <Link href="/(auth)/sign-up">
              <Text className="text-torii-soft font-semibold">Créer un compte</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
