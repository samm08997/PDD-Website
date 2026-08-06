import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { BadgeCard } from '@/components/BadgeCard';
import { useAchievements } from '@/hooks/useAchievements';

export default function BadgesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);
  
  const { badgesData, isLoadingBadges } = useAchievements();
  const [filter, setFilter] = useState<'All' | 'Common' | 'Rare' | 'Epic' | 'Legendary'>('All');

  const filteredBadges = badgesData?.allBadges.filter(b => {
    if (filter === 'All') return true;
    return b.rarity === filter;
  }) ?? [];

  const unlockedCount = badgesData?.unlockedIds.size ?? 0;
  const totalCount = badgesData?.allBadges.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={15} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Achievements</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Progress Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Total Unlocked</Text>
            <Text style={[styles.summaryCount, { color: colors.primary }]}>{unlockedCount} / {totalCount}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.secondary }]}>
            <View style={[styles.fill, { backgroundColor: colors.primary, width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['All', 'Common', 'Rare', 'Epic', 'Legendary'] as const).map(tab => (
            <Pressable
              key={tab}
              style={[
                styles.tab, 
                { borderColor: colors.border, backgroundColor: colors.card },
                filter === tab && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, { color: filter === tab ? '#fff' : colors.mutedForeground }]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Grid */}
        {isLoadingBadges ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredBadges.map(badge => {
              const ub = badgesData?.userBadges.find(ub => ub.badge_id === badge.id);
              return (
                <View key={badge.id} style={styles.gridItem}>
                  <BadgeCard
                    badge={badge}
                    isUnlocked={!!ub}
                    unlockedAt={ub?.unlocked_at}
                  />
                </View>
              );
            })}
          </View>
        )}
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
      paddingBottom: insets.bottom + 40,
    },
    summaryCard: {
      margin: 20,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
    },
    summaryTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 12,
    },
    summaryTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
    },
    summaryCount: {
      fontFamily: 'Inter_700Bold',
      fontSize: 16,
    },
    track: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 4,
    },
    filterScroll: {
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 20,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    tabText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 10,
    },
    gridItem: {
      width: '33.33%',
      alignItems: 'center',
    },
    center: {
      marginTop: 40,
      alignItems: 'center',
    }
  });
}
