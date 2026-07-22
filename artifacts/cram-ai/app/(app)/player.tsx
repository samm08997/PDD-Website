import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { supabase, type FlashcardRow } from '@/lib/supabase';
import FlashCard from '@/components/FlashCard';

export default function PlayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { deckId, title } = useLocalSearchParams<{ deckId: string; title: string }>();
  const styles = makeStyles(colors, insets);

  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: cards, isLoading, error } = useQuery<FlashcardRow[]>({
    queryKey: ['flashcards', deckId],
    queryFn: async () => {
      const { data, err } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true }) as unknown as { data: FlashcardRow[]; err: unknown };
      if (err) throw err;
      return data ?? [];
    },
    enabled: !!deckId,
  });

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (cards && currentIndex < cards.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((i) => i + 1);
    }
  };

  const currentCard = cards?.[currentIndex];
  const total = cards?.length ?? 0;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.destructive} />
          <Text style={styles.errorText}>Failed to load flashcards</Text>
        </View>
      ) : !cards || cards.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="layers-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.errorText}>No cards in this deck</Text>
        </View>
      ) : (
        <View style={styles.playerBody}>
          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentIndex + 1) / total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {currentIndex + 1} / {total}
            </Text>
          </View>

          {/* Tap hint */}
          <Text style={styles.tapHint}>Tap card to reveal answer</Text>

          {/* Flash Card */}
          {currentCard ? (
            <FlashCard
              key={`${currentCard.id}-${currentIndex}`}
              question={currentCard.question}
              answer={currentCard.answer}
            />
          ) : null}

          {/* Navigation */}
          <View style={styles.navRow}>
            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                pressed && { opacity: 0.7 },
                currentIndex === 0 && styles.navBtnDisabled,
              ]}
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={currentIndex === 0 ? colors.mutedForeground : colors.foreground}
              />
            </Pressable>

            {/* Center badge */}
            <LinearGradient
              colors={['#1E2040', '#252850']}
              style={styles.indexBadge}
            >
              <Text style={styles.indexText}>
                Card {currentIndex + 1}
              </Text>
            </LinearGradient>

            <Pressable
              style={({ pressed }) => [
                styles.navBtn,
                pressed && { opacity: 0.7 },
                currentIndex === total - 1 && styles.navBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={currentIndex === total - 1}
            >
              <Ionicons
                name="arrow-forward"
                size={22}
                color={currentIndex === total - 1 ? colors.mutedForeground : colors.foreground}
              />
            </Pressable>
          </View>

          {/* Completion message */}
          {currentIndex === total - 1 && (
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={styles.doneText}>You've reviewed all cards!</Text>
            </View>
          )}
        </View>
      )}
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
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    errorText: {
      fontSize: 15,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    playerBody: {
      flex: 1,
      paddingHorizontal: 24,
      paddingBottom: insets.bottom + 24 + webBottomPad,
      gap: 16,
    },
    progressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: colors.secondary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
      minWidth: 40,
      textAlign: 'right',
    },
    tapHint: {
      textAlign: 'center',
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navBtn: {
      width: 52,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    navBtnDisabled: {
      opacity: 0.4,
    },
    indexBadge: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    indexText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    doneBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#1A0F30',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: '#2D1F50',
    },
    doneText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.accent,
    },
  });
}
