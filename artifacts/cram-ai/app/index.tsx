import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { session, loading, configured } = useAuth();
  const colors = useColors();

  if (!configured) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="warning-outline" size={40} color={colors.accent} />
        <Text style={[styles.configTitle, { color: colors.foreground }]}>
          Setup Required
        </Text>
        <Text style={[styles.configBody, { color: colors.mutedForeground }]}>
          Add your Supabase and Gemini credentials in Secrets to activate CramAI.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 14,
  },
  configTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  configBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
