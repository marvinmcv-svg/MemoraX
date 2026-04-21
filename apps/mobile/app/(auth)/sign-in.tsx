import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export default function SignInScreen() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!signInLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ identifier: email, password });
    } catch (err) {
      console.error('Sign in error:', err);
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-background px-6 py-12">
      <View className="items-center mb-12">
        <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-4">
          <Text className="text-white font-bold text-4xl">M</Text>
        </View>
        <Text className="text-2xl font-bold text-text-primary">Welcome back</Text>
        <Text className="text-text-secondary mt-2">Sign in to your MemoraX account</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-text-secondary mb-2 text-sm">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#64748B"
            className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <Text className="text-text-secondary mb-2 text-sm">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
            className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
          />
        </View>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          className="bg-primary rounded-xl py-4 mt-4"
        >
          <Text className="text-white font-semibold text-center">
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="mt-6">
        <Text className="text-primary text-center">Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}
