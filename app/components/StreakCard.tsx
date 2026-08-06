import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import type { StreakData } from '@/hooks/useStreak';

type StreakCardProps = {
  streak: StreakData | null;
  isLoading: boolean;
};

export function StreakCard({ streak, isLoading }: StreakCardProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak?.current_streak && streak.current_streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [streak?.current_streak, pulseAnim]);

  if (isLoading) {
    return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, minHeight: 100 }]} />;
  }

  const isHot = (streak?.current_streak ?? 0) > 2;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={[styles.title, { color: colors.mutedForeground }]}>Current Streak</Text>
          <View style={styles.streakRow}>
            <Text style={[styles.streakCount, { color: colors.foreground }]}>
              {streak?.current_streak ?? 0}
            </Text>
            <Text style={[styles.daysLabel, { color: colors.mutedForeground }]}>
              {streak?.current_streak === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
          <Text style={[styles.longest, { color: colors.mutedForeground }]}>
            Longest: {streak?.longest_streak ?? 0} days
          </Text>
        </View>

        <Animated.View style={[styles.fireContainer, isHot && { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={isHot ? ['#F97316', '#EF4444'] : ['#4B5563', '#374151']}
            style={styles.fireBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.fireIcon, !isHot && { opacity: 0.5 }]}>🔥</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  streakCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 36,
  },
  daysLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  longest: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  fireContainer: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fireBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireIcon: {
    fontSize: 32,
  },
});
