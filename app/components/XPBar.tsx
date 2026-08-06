import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

type XPBarProps = {
  level: number;
  xp: number;
  nextLevelXp: number;
  progress: number;
  isLoading?: boolean;
};

export function XPBar({ level, xp, nextLevelXp, progress, isLoading = false }: XPBarProps) {
  const colors = useColors();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.spring(widthAnim, {
        toValue: isNaN(progress) ? 0 : progress,
        useNativeDriver: false, // width cannot use native driver
        tension: 40,
        friction: 7,
      }).start();
    }
  }, [progress, isLoading, widthAnim]);

  if (isLoading) {
    return <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, minHeight: 80 }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lvl {level}</Text>
        </View>
        <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{xp}</Text> / {nextLevelXp} XP
        </Text>
      </View>
      
      <View style={[styles.track, { backgroundColor: colors.secondary }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#D946EF']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF640',
  },
  levelText: {
    color: '#A78BFA',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  xpText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  track: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
