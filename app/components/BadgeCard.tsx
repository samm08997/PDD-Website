import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import type { BadgeDefinition } from '@/hooks/useAchievements';

type BadgeCardProps = {
  badge: BadgeDefinition;
  isUnlocked: boolean;
  unlockedAt?: string;
};

export function BadgeCard({ badge, isUnlocked, unlockedAt }: BadgeCardProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(isUnlocked ? 1 : 0.95)).current;

  // Simple animation on mount for unlocked badges
  useEffect(() => {
    if (isUnlocked) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [isUnlocked, scaleAnim]);

  const getRarityColors = () => {
    if (!isUnlocked) return ['#374151', '#1F2937'] as const;
    switch (badge.rarity) {
      case 'Legendary': return ['#F59E0B', '#EF4444'] as const;
      case 'Epic': return ['#8B5CF6', '#D946EF'] as const;
      case 'Rare': return ['#3B82F6', '#2DD4BF'] as const;
      default: return ['#6366F1', '#818CF8'] as const;
    }
  };

  const gradientColors = getRarityColors();

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.iconWrapper, { borderColor: isUnlocked ? gradientColors[0] : colors.border }]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.icon, !isUnlocked && styles.lockedIcon]}>{badge.icon}</Text>
        </LinearGradient>
      </View>
      
      <Text style={[styles.name, { color: isUnlocked ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
        {badge.name}
      </Text>
      
      <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
        {badge.description}
      </Text>

      {isUnlocked && unlockedAt ? (
        <Text style={[styles.date, { color: colors.primary }]}>
          {new Date(unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      ) : (
        <View style={styles.xpTag}>
          <Text style={styles.xpText}>+{badge.xp_reward} XP</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 104,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    padding: 3,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  lockedIcon: {
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 14,
  },
  date: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  xpTag: {
    backgroundColor: '#37415140',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  xpText: {
    color: '#9CA3AF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
});
