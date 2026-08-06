import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function AppLayout() {
  const colors = useColors();
  const { session, loading } = useAuth();

  const isTestMode = typeof window !== 'undefined' && window.localStorage?.getItem('cram_test_mode') === 'true';

  if (!loading && !session && !isTestMode) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
