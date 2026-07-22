import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type Props = {
  question: string;
  answer: string;
};

export default function FlashCard({ question, answer }: Props) {
  const colors = useColors();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useSharedValue(0);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    flipAnim.value = withTiming(nextFlipped ? 1 : 0, { duration: 380 });
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <Pressable onPress={handleFlip} style={styles.wrapper}>
      {/* Front — Question */}
      <Animated.View style={[styles.card, frontStyle]}>
        <LinearGradient
          colors={['#1A1C2E', '#13151E']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
        <View style={styles.cardBorder}>
          <View style={styles.labelRow}>
            <View style={[styles.badge, { backgroundColor: '#1E2040' }]}>
              <Ionicons name="help-circle" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>Question</Text>
            </View>
          </View>
          <Text style={styles.questionText}>{question}</Text>
          <View style={styles.tapHint}>
            <Ionicons name="sync" size={14} color={colors.mutedForeground} />
            <Text style={styles.tapHintText}>Tap to flip</Text>
          </View>
        </View>
      </Animated.View>

      {/* Back — Answer */}
      <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
        <LinearGradient
          colors={['#1A0D2E', '#130F1E']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
        <View style={styles.cardBorder}>
          <View style={styles.labelRow}>
            <View style={[styles.badge, { backgroundColor: '#1F0E35' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
              <Text style={[styles.badgeText, { color: colors.accent }]}>Answer</Text>
            </View>
          </View>
          <Text style={styles.answerText}>{answer}</Text>
          <View style={styles.tapHint}>
            <Ionicons name="sync" size={14} color={colors.mutedForeground} />
            <Text style={styles.tapHintText}>Tap to flip back</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 300,
    maxHeight: 420,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    borderWidth: 1,
    borderColor: '#252838',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBack: {
    shadowColor: '#A855F7',
  },
  cardBorder: {
    flex: 1,
    borderRadius: 24,
    padding: 28,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  questionText: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#E8EBF3',
    lineHeight: 30,
    textAlign: 'center',
    paddingVertical: 16,
  },
  answerText: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    color: '#E8EBF3',
    lineHeight: 27,
    textAlign: 'center',
    paddingVertical: 16,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tapHintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7B80A0',
  },
});
