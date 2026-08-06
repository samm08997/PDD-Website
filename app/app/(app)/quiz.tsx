import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { supabase, type FlashcardRow } from '@/lib/supabase';
import { useAchievements } from '@/hooks/useAchievements';
import { useStreak } from '@/hooks/useStreak';
import { XP_REWARDS } from '@/lib/gamification';

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function QuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deckId, title } = useLocalSearchParams<{ deckId: string; title: string }>();
  const styles = makeStyles(colors, insets);

  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [errorQuiz, setErrorQuiz] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const { logProgress } = useAchievements();
  const { incrementStreakAsync } = useStreak();
  const [xpAwarded, setXpAwarded] = useState(false);

  useEffect(() => {
    if (isFinished && !xpAwarded) {
      setXpAwarded(true);
      logProgress({ type: 'quiz', xp: XP_REWARDS.QUIZ_COMPLETED });
      incrementStreakAsync();
    }
  }, [isFinished, xpAwarded, logProgress, incrementStreakAsync]);

  // 1. Fetch Flashcards
  const { data: cards, isLoading: loadingCards, error: cardsError } = useQuery<FlashcardRow[]>({
    queryKey: ['flashcards', deckId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      return data ?? [];
    },
    enabled: !!deckId,
  });

  // 2. Generate Quiz
  useEffect(() => {
    if (cards && cards.length > 0 && !quizData && !loadingQuiz && !errorQuiz) {
      generateQuiz(cards);
    }
  }, [cards]);

  const generateQuiz = async (flashcards: FlashcardRow[]) => {
    setLoadingQuiz(true);
    try {
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080');

      const res = await fetch(`${apiBase}/api/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcards: flashcards.map(c => ({ question: c.question, answer: c.answer })) }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data = await res.json();
      if (!data.quiz || !Array.isArray(data.quiz)) throw new Error('Invalid quiz format');

      setQuizData(data.quiz);
    } catch (e: any) {
      setErrorQuiz(e.message || 'Unknown error');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(idx);
    
    if (quizData && idx === quizData[currentIndex].correctIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = () => {
    if (!quizData) return;
    if (currentIndex < quizData.length - 1) {
      setSelectedOption(null);
      setCurrentIndex(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  const currentQ = quizData?.[currentIndex];
  const total = quizData?.length || 0;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;
  const isLoading = loadingCards || loadingQuiz;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Quiz: {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Generating AI Quiz...</Text>
        </View>
      ) : cardsError || errorQuiz ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.destructive} />
          <Text style={styles.errorText}>Failed to load quiz</Text>
        </View>
      ) : isFinished ? (
        <View style={styles.center}>
          <Ionicons name="trophy" size={80} color="#FBBF24" />
          <Text style={styles.scoreTitle}>Quiz Completed!</Text>
          <Text style={styles.scoreText}>
            You scored {score} out of {total}
          </Text>
          <Text style={styles.scorePercentage}>
            {Math.round((score / total) * 100)}%
          </Text>
          {xpAwarded && (
            <Text style={{ color: '#A855F7', fontFamily: 'Inter_600SemiBold', marginTop: 12 }}>
              +{XP_REWARDS.QUIZ_COMPLETED} XP Earned!
            </Text>
          )}
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Back to Deck</Text>
          </Pressable>
        </View>
      ) : currentQ ? (
        <View style={styles.quizBody}>
          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{currentIndex + 1} / {total}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Question Card */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{currentQ.question}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                const showStatus = selectedOption !== null;

                let optionStyle = styles.optionBtn;
                let textStyle = styles.optionText;
                let icon = null;

                if (showStatus) {
                  if (isCorrect) {
                    optionStyle = [styles.optionBtn, styles.optionCorrect];
                    textStyle = [styles.optionText, styles.optionTextCorrect];
                    icon = <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
                  } else if (isSelected && !isCorrect) {
                    optionStyle = [styles.optionBtn, styles.optionIncorrect];
                    textStyle = [styles.optionText, styles.optionTextIncorrect];
                    icon = <Ionicons name="close-circle" size={20} color="#EF4444" />;
                  } else {
                    optionStyle = [styles.optionBtn, { opacity: 0.5 }];
                  }
                }

                return (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      optionStyle,
                      pressed && !showStatus && { opacity: 0.7 }
                    ]}
                    onPress={() => handleSelect(idx)}
                    disabled={showStatus}
                  >
                    <Text style={textStyle}>{opt}</Text>
                    {icon}
                  </Pressable>
                );
              })}
            </View>

            {/* Explanation & Next Button */}
            {selectedOption !== null && (
              <View style={styles.feedbackContainer}>
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationTitle}>Explanation</Text>
                  <Text style={styles.explanationText}>{currentQ.explanation}</Text>
                </View>
                
                <Pressable style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>
                    {currentIndex < total - 1 ? "Next Question" : "Finish Quiz"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: any, insets: any) {
  const webTopPad = Platform.OS === 'web' ? 67 : 0;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 12 + webTopPad,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      marginHorizontal: 8,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 20,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 8,
    },
    errorText: {
      fontSize: 15,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    quizBody: {
      flex: 1,
      paddingHorizontal: 20,
    },
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: colors.secondary,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    progressLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      minWidth: 40,
      textAlign: 'right',
    },
    questionCard: {
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    questionText: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      lineHeight: 28,
    },
    optionsContainer: {
      gap: 12,
    },
    optionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionCorrect: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10B981',
    },
    optionIncorrect: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: '#EF4444',
    },
    optionText: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Inter_500Medium',
      color: colors.foreground,
      paddingRight: 8,
    },
    optionTextCorrect: {
      color: '#10B981',
    },
    optionTextIncorrect: {
      color: '#EF4444',
    },
    feedbackContainer: {
      marginTop: 24,
      gap: 16,
    },
    explanationBox: {
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    explanationTitle: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: '#A855F7',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    explanationText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      lineHeight: 22,
    },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 16,
    },
    nextBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: '#fff',
    },
    scoreTitle: {
      fontSize: 24,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginTop: 24,
    },
    scoreText: {
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      marginTop: 8,
    },
    scorePercentage: {
      fontSize: 48,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      marginVertical: 16,
    },
    doneBtn: {
      backgroundColor: colors.card,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 24,
    },
    doneBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    }
  });
}
