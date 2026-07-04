import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { useAuth } from '@/providers/auth-provider';

function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/weak-password':
      return 'Mot de passe trop faible (6 caractères minimum).';
    default:
      return "Inscription impossible. Vérifiez votre réseau et votre configuration Firebase.";
  }
}

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Champs requis', 'Renseignez votre nom, votre email et un mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email, password);
    } catch (e: any) {
      Alert.alert('Inscription échouée', authErrorMessage(e?.code ?? ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-sumi">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-10">
            <Text className="text-6xl mb-3">🥋</Text>
            <Text className="text-paper text-3xl font-extrabold tracking-wide">Rejoins le dojo</Text>
            <Text className="text-paper-faint text-sm mt-2">Ton avatar évoluera avec chaque séance.</Text>
          </View>

          <Field label="Nom d'athlète" value={name} onChangeText={setName} placeholder="Ken le Guerrier" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="toi@exemple.fr"
            className="mt-4"
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="6 caractères minimum"
            className="mt-4"
          />

          <Button title="Créer mon compte" onPress={onSubmit} loading={loading} className="mt-8" />

          <View className="flex-row justify-center mt-6">
            <Text className="text-paper-faint">Déjà un compte ? </Text>
            <Link href="/(auth)/sign-in">
              <Text className="text-torii-soft font-semibold">Se connecter</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
