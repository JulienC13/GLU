import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from 'react-native';

/** Bouton principal — rouge torii. */
export function Button({
  title,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}: PressableProps & {
  title: string;
  variant?: 'primary' | 'success' | 'ghost' | 'danger';
  loading?: boolean;
  className?: string;
}) {
  const base = 'flex-row items-center justify-center rounded-xl px-5 py-3.5 active:opacity-80';
  const variants = {
    primary: 'bg-torii',
    success: 'bg-matcha',
    ghost: 'bg-transparent border border-sumi-border',
    danger: 'bg-transparent border border-torii',
  } as const;
  const textVariants = {
    primary: 'text-paper',
    success: 'text-sumi',
    ghost: 'text-paper-dim',
    danger: 'text-torii-soft',
  } as const;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color="#F3EAD8" style={{ marginRight: 8 }} />}
      <Text className={`font-bold text-base ${textVariants[variant]}`}>{title}</Text>
    </Pressable>
  );
}

/** Champ de saisie avec libellé. */
export const Field = forwardRef<TextInput, TextInputProps & { label?: string; className?: string }>(
  function Field({ label, className = '', ...props }, ref) {
    return (
      <View className={className}>
        {label ? <Text className="mb-1.5 text-paper-dim text-sm font-medium">{label}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#7E7A70"
          className="rounded-xl border border-sumi-border bg-sumi-light px-4 py-3 text-paper text-base"
          {...props}
        />
      </View>
    );
  }
);

/** Carte sombre standard. */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-sumi-border bg-sumi-card p-4 ${className}`}>{children}</View>
  );
}

/** Écran de chargement plein écran. */
export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-sumi">
      <ActivityIndicator size="large" color="#C9403A" />
    </View>
  );
}
