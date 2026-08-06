import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { StreakCard } from '@/components/StreakCard';
import { XPBar } from '@/components/XPBar';
import { HeatmapCalendar } from '@/components/HeatmapCalendar';
import { BadgeCard } from '@/components/BadgeCard';
import { useStreak } from '@/hooks/useStreak';
import { useAchievements } from '@/hooks/useAchievements';
import { usePlanner } from '@/hooks/usePlanner';
import { PlannerItem } from '@/components/PlannerItem';

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);
  
  const { data: streak, isLoading: loadingStreak } = useStreak();
  const { progress, badgesData, levelStats, isLoadingProgress, isLoadingBadges } = useAchievements();
  const { tasks, isLoading: loadingTasks, updateTask } = usePlanner();

  // Get recently unlocked badges (max 3)
  const recentBadges = badgesData?.userBadges
    .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
    .slice(0, 3) || [];

  // Get today's active tasks (max 3)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => 
    t.status !== 'Archived' && 
    t.status !== 'Completed' && 
    (t.due_date === todayStr || t.status === 'Overdue')
  ).slice(0, 3);

  const quotes = [
    "You're on fire! 🔥",
    "Small progress every day adds up.",
    "One more day to beat your record.",
    "Keep learning every day.",
  ];
  const randomQuote = quotes[new Date().getDay() % quotes.length];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={15} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>{randomQuote}</Text>
        </View>

        {/* Level & XP */}
        <View style={styles.section}>
          <XPBar
            level={levelStats.level}
            xp={progress?.total_xp ?? 0}
            nextLevelXp={levelStats.nextLevelXp}
            progress={levelStats.progress}
            isLoading={isLoadingProgress}
          />
        </View>

        {/* Streaks */}
        <View style={styles.section}>
          <StreakCard streak={streak ?? null} isLoading={loadingStreak} />
        </View>

        {/* Badges Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <Pressable onPress={() => router.push('/(app)/badges')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          
          <View style={styles.badgesRow}>
            {isLoadingBadges ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : recentBadges.length > 0 ? (
              recentBadges.map(ub => (
                <BadgeCard
                  key={ub.badge_id}
                  badge={ub.badges}
                  isUnlocked={true}
                  unlockedAt={ub.unlocked_at}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No badges earned yet.</Text>
                <Text style={styles.emptySub}>Complete tasks to earn some!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Heatmap */}
        <View style={styles.section}>
          <HeatmapCalendar studyDates={streak?.last_study_date ? [streak.last_study_date] : []} />
        </View>

        {/* Today's Planner */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <Pressable onPress={() => router.push('/(app)/planner')}>
              <Text style={styles.seeAll}>Planner</Text>
            </Pressable>
          </View>

          {loadingTasks ? (
            <Text style={styles.emptyText}>Loading tasks...</Text>
          ) : todayTasks.length > 0 ? (
            todayTasks.map(task => (
              <PlannerItem
                key={task.id}
                task={task}
                onPress={() => router.push('/(app)/planner')}
                onToggleComplete={(t) => {
                  updateTask({
                    id: t.id,
                    updates: {
                      status: t.status === 'Completed' ? 'Pending' : 'Completed',
                      completed_at: t.status !== 'Completed' ? new Date().toISOString() : null
                    }
                  });
                }}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>All caught up for today!</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  insets: ReturnType<typeof useSafeAreaInsets>
) {
  const webTopPad = Platform.OS === 'web' ? 20 : 0;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 10 + webTopPad,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    backBtn: {
      padding: 4,
    },
    headerTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      color: colors.foreground,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: insets.bottom + 100,
    },
    quoteBox: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#F9731615',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#F97316',
      marginBottom: 24,
    },
    quoteText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: '#F97316',
      fontStyle: 'italic',
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: colors.foreground,
    },
    seeAll: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.primary,
    },
    badgesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    emptyCard: {
      flex: 1,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.foreground,
      marginBottom: 4,
    },
    emptySub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: colors.mutedForeground,
    }
  });
}
