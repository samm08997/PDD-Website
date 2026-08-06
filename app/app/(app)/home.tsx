import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Deck } from '@/lib/supabase';
import { useStreak } from '@/hooks/useStreak';
import { useAchievements } from '@/hooks/useAchievements';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const styles = makeStyles(colors, insets);
  
  const { data: streak } = useStreak();
  const { levelStats } = useAchievements();

  const {
    data: decks,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Deck[]>({
    queryKey: ['decks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decks')
        .select('id, user_id, title, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleSignOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  }, [signOut]);

  const handleCreate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(app)/create');
  }, []);

  const handleDeckPress = useCallback((deck: Deck) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(app)/player', params: { deckId: deck.id, title: deck.title } });
  }, []);

  const handleDeleteDeck = useCallback(
    (deck: Deck) => {
      const confirmDelete = async () => {
        try {
          const { error } = await supabase.from('decks').delete().eq('id', deck.id);
          if (error) throw error;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refetch();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to delete deck';
          if (Platform.OS === 'web') {
            window.alert(msg);
          } else {
            Alert.alert('Error', msg);
          }
        }
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Delete "${deck.title}"?`)) {
          confirmDelete();
        }
      } else {
        Alert.alert(
          'Delete Deck',
          `Are you sure you want to delete "${deck.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: confirmDelete },
          ],
        );
      }
    },
    [refetch],
  );

  const renderDeck = useCallback(
    ({ item }: { item: Deck }) => (
      <Pressable
        style={({ pressed }) => [styles.deckCard, pressed && { opacity: 0.85 }]}
        onPress={() => handleDeckPress(item)}
      >
        <View style={styles.deckIconWrap}>
          <LinearGradient
            colors={['#818CF8', '#A855F7']}
            style={styles.deckIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="layers" size={20} color="#fff" />
          </LinearGradient>
        </View>
        <View style={styles.deckInfo}>
          <Text style={styles.deckTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.deckDate}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteDeck(item);
          }}
          hitSlop={10}
          style={{ padding: 6 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </Pressable>
    ),
    [styles, colors, handleDeckPress, handleDeleteDeck],
  );

  const email = user?.email ?? '';
  const greeting =
    email.length > 0
      ? `Hey, ${email.split('@')[0]}`
      : 'Welcome back';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Ready to study?</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => router.push('/(app)/timer')} hitSlop={10} style={styles.signOutBtn}>
            <Ionicons name="timer-outline" size={22} color={colors.accent} />
          </Pressable>
          <Pressable onPress={handleSignOut} hitSlop={10} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{decks?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Decks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>🔥 {streak?.current_streak ?? 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>⭐ {levelStats.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* Gamification Nav Row */}
      <View style={styles.navRow}>
        <Pressable style={styles.navBtn} onPress={() => router.push('/(app)/progress')}>
          <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
          <Text style={[styles.navBtnText, { color: colors.foreground }]}>Progress</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => router.push('/(app)/planner')}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.navBtnText, { color: colors.foreground }]}>Planner</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => router.push('/(app)/badges')}>
          <Ionicons name="medal-outline" size={20} color={colors.primary} />
          <Text style={[styles.navBtnText, { color: colors.foreground }]}>Badges</Text>
        </Pressable>
      </View>

      {/* Deck list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList<Deck>
          data={decks}
          keyExtractor={(item) => item.id}
          renderItem={renderDeck}
          contentContainerStyle={styles.listContent}
          scrollEnabled={!!(decks && decks.length > 0)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={36} color={colors.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>No decks yet</Text>
              <Text style={styles.emptySubtitle}>
                Paste your lecture notes and let AI generate flashcards for you.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}
        onPress={handleCreate}
      >
        <LinearGradient
          colors={['#818CF8', '#6366F1']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>,
  insets: ReturnType<typeof import('react-native-safe-area-context').useSafeAreaInsets>,
) {
  const webTopPad = Platform.OS === 'web' ? 67 : 0;
  const webBottomPad = Platform.OS === 'web' ? 34 : 0;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: insets.top + 20 + webTopPad,
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    greeting: {
      fontSize: 26,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    signOutBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 24,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    navRow: {
      flexDirection: 'row',
      marginHorizontal: 24,
      marginBottom: 24,
      gap: 12,
    },
    navBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
    },
    navBtnText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statNumber: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    statDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      paddingHorizontal: 24,
      paddingBottom: insets.bottom + 100 + webBottomPad,
      gap: 10,
      flexGrow: 1,
    },
    deckCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    deckIconWrap: {},
    deckIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deckInfo: {
      flex: 1,
    },
    deckTitle: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    deckDate: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingHorizontal: 32,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 21,
    },
    fab: {
      position: 'absolute',
      bottom: insets.bottom + 28 + webBottomPad,
      right: 24,
      borderRadius: 20,
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8,
    },
    fabGradient: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
