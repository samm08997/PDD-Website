import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// ─── Smart Answer Renderer ────────────────────────────────────────────────────
// Parses the AI's structured answer (newlines, bullet points, inline `code`)
// and renders each segment with appropriate styling.
function AnswerRenderer({ text, isQuestion = false }: { text: string; isQuestion?: boolean }) {
  // Split into lines first
  const lines = text.split(/\\n|\n/);

  return (
    <View style={{ gap: isQuestion ? 8 : 6 }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={lineIdx} style={{ height: 4 }} />;

        // Detect bullet points: •, -, *, 1., 2., etc.
        const isBullet = !isQuestion && /^(•|-|\*|\d+\.)\s/.test(trimmed);
        const bulletContent = isBullet ? trimmed.replace(/^(•|-|\*|\d+\.)\s/, '') : trimmed;
        const bulletSymbol = trimmed.match(/^(\d+\.)/)?.[1] ?? '•';

        // Detect code block lines: lines starting with ``` 
        const isCodeBlock = trimmed.startsWith('```') || trimmed.endsWith('```');
        if (isCodeBlock) return null; // skip fence markers

        // Detect if this line is inside a code block (indented or monospace content)
        const looksLikeCode = !isQuestion && /^(def |class |import |from |return |const |let |var |function |if |for |while |print|console)/.test(trimmed);

        if (looksLikeCode) {
          return (
            <View key={lineIdx} style={answerStyles.codeLineBlock}>
              <Text style={answerStyles.codeLine}>{trimmed}</Text>
            </View>
          );
        }

        // Split line by inline `code` segments
        const segments = bulletContent.split(/(`.+?`)/g);

        return (
          <View key={lineIdx} style={isBullet ? { flexDirection: 'row', gap: 6, alignItems: 'flex-start' } : {}}>
            {isBullet && (
              <Text style={answerStyles.bullet}>{/^\d+\./.test(trimmed) ? bulletSymbol : '•'}</Text>
            )}
            <Text style={[
              isQuestion ? answerStyles.questionLine : answerStyles.line,
              isBullet && { flex: 1 }
            ]}>
              {segments.map((seg, segIdx) => {
                if (seg.startsWith('`') && seg.endsWith('`')) {
                  return (
                    <Text key={segIdx} style={isQuestion ? answerStyles.questionCode : answerStyles.code}>
                      {seg.slice(1, -1)}
                    </Text>
                  );
                }
                return <Text key={segIdx}>{seg}</Text>;
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const answerStyles = StyleSheet.create({
  questionLine: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#E8EBF3',
    lineHeight: 26,
    textAlign: 'center',
  },
  questionCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#7DD3FC',
    backgroundColor: 'rgba(125, 211, 252, 0.12)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  line: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#D0D4E8',
    lineHeight: 22,
  },
  bullet: {
    fontSize: 14,
    color: '#A855F7',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
    minWidth: 16,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#7DD3FC',
    backgroundColor: 'rgba(125, 211, 252, 0.12)',
    paddingHorizontal: 3,
    borderRadius: 4,
  },
  codeLineBlock: {
    backgroundColor: 'rgba(15, 20, 40, 0.8)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#818CF8',
  },
  codeLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#93C5FD',
    lineHeight: 20,
  },
});

type Props = {
  question: string;
  answer: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onRate?: (rating: 'hard' | 'good' | 'easy') => void;
};

const SWIPE_THRESHOLD = 80;

export default function FlashCard({ question, answer, onSwipeLeft, onSwipeRight, onRate }: Props) {
  const colors = useColors();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useSharedValue(0);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const handleRate = (rating: 'hard' | 'good' | 'easy') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onRate) onRate(rating);
    // After rating, trigger next card (swipe left)
    if (onSwipeLeft) {
      translateX.value = withTiming(-500, { duration: 240 }, () => {
        runOnJS(onSwipeLeft)();
        translateX.value = 500;
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
      });
    }
  };

  const triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    flipAnim.value = withTiming(nextFlipped ? 1 : 0, { duration: 420 });
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      // Hide the back of the front face once past 90°
      opacity: flipAnim.value > 0.5 ? 0 : 1,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      opacity: flipAnim.value > 0.5 ? 1 : 0,
    };
  });

  const cardSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD && onSwipeLeft) {
        translateX.value = withTiming(-500, { duration: 240 }, () => {
          runOnJS(triggerHaptic)();
          runOnJS(onSwipeLeft)();
          translateX.value = 500;
          translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        });
      } else if (event.translationX > SWIPE_THRESHOLD && onSwipeRight) {
        translateX.value = withTiming(500, { duration: 240 }, () => {
          runOnJS(triggerHaptic)();
          runOnJS(onSwipeRight)();
          translateX.value = -500;
          translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.wrapper, cardSlideStyle]}>
        <Pressable onPress={handleFlip} style={styles.pressArea}>
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
                  <Ionicons name="help-circle" size={14} color="#818CF8" />
                  <Text style={[styles.badgeText, { color: '#818CF8' }]}>Question</Text>
                </View>
              </View>
              <View style={styles.contentCenter}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                >
                  <AnswerRenderer text={question} isQuestion />
                </ScrollView>
              </View>
              <View style={styles.tapHint}>
                <Ionicons name="sync" size={14} color="#7B80A0" />
                <Text style={styles.tapHintText}>Tap to reveal answer</Text>
              </View>
            </View>
          </Animated.View>

          {/* Back — Detailed Answer */}
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
                  <Ionicons name="checkmark-circle" size={14} color="#A855F7" />
                  <Text style={[styles.badgeText, { color: '#A855F7' }]}>Answer</Text>
                </View>
              </View>
              <ScrollView
                style={styles.answerScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.answerScrollContent}
              >
                <AnswerRenderer text={answer} />
              </ScrollView>
              
              <View style={styles.srContainer}>
                <Text style={styles.srLabel}>How was it?</Text>
                <View style={styles.srButtons}>
                  <Pressable style={[styles.srBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} onPress={() => handleRate('hard')}>
                    <Text style={[styles.srBtnText, { color: '#EF4444' }]}>Hard</Text>
                  </Pressable>
                  <Pressable style={[styles.srBtn, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} onPress={() => handleRate('good')}>
                    <Text style={[styles.srBtnText, { color: '#3B82F6' }]}>Good</Text>
                  </Pressable>
                  <Pressable style={[styles.srBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} onPress={() => handleRate('easy')}>
                    <Text style={[styles.srBtnText, { color: '#10B981' }]}>Easy</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.tapHint}>
                <Ionicons name="sync" size={14} color="#7B80A0" />
                <Text style={styles.tapHintText}>Tap anywhere to flip back</Text>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 320,
    maxHeight: 480,
  },
  pressArea: {
    flex: 1,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    borderWidth: 1,
    borderColor: '#252838',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBack: {
    shadowColor: '#A855F7',
  },
  cardBorder: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 19,
    fontFamily: 'Inter_600SemiBold',
    color: '#E8EBF3',
    lineHeight: 28,
    textAlign: 'center',
  },
  answerScroll: {
    flex: 1,
  },
  answerScrollContent: {
    paddingVertical: 8,
  },
  answerText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#E8EBF3',
    lineHeight: 24,
    textAlign: 'left',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  tapHintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#7B80A0',
  },
  srContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  srLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#7B80A0',
    marginBottom: 8,
  },
  srButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  srBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  srBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  }
});
