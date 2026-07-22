import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { setBaseUrl } from '@workspace/api-client-react';

// Set API base URL
if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

type GeneratedCard = { question: string; answer: string };

type Step = 'idle' | 'generating' | 'saving';

const STEP_LABELS: Record<Step, string> = {
  idle: 'Generate with AI',
  generating: 'Generating flashcards...',
  saving: 'Saving to your library...',
};

export default function CreateDeckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const styles = makeStyles(colors, insets);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<Step>('idle');

  const isLoading = step !== 'idle';

  const handleGenerate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a deck title.');
      return;
    }
    if (notes.trim().length < 50) {
      Alert.alert('Notes too short', 'Please paste at least a few sentences of lecture notes.');
      return;
    }
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('generating');

    try {
      // Call backend to generate flashcards with Gemini
      const apiBase = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : '';
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: notes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const flashcards: GeneratedCard[] = data.flashcards;

      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('No flashcards were generated. Try with more detailed notes.');
      }

      // Save deck to Supabase
      setStep('saving');

      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({ user_id: user.id, title: title.trim() })
        .select()
        .single();

      if (deckError) throw deckError;

      const cardRows = flashcards.map((c) => ({
        deck_id: deck.id,
        question: c.question,
        answer: c.answer,
      }));

      const { error: cardsError } = await supabase.from('flashcards').insert(cardRows);
      if (cardsError) throw cardsError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ['decks', user.id] });

      router.replace({
        pathname: '/(app)/player',
        params: { deckId: deck.id, title: deck.title },
      });
    } catch (err: unknown) {
      setStep('idle');
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Generation failed', message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>New Deck</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Deck title */}
        <View style={styles.section}>
          <Text style={styles.label}>Deck Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="e.g. Organic Chemistry Ch.4"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            editable={!isLoading}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Lecture Notes</Text>
            <Text style={styles.charCount}>{notes.length} chars</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="Paste your lecture notes, textbook excerpts, or any study material here. The more content, the better the flashcards."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {/* AI tip */}
        <View style={styles.tipBox}>
          <Ionicons name="information-circle" size={16} color={colors.accent} />
          <Text style={styles.tipText}>
            Gemini AI will extract key concepts and create Q&A flashcard pairs automatically.
          </Text>
        </View>

        {/* Generate button */}
        <Pressable
          style={({ pressed }) => [
            styles.generateBtn,
            pressed && !isLoading && { opacity: 0.85 },
            isLoading && { opacity: 0.7 },
          ]}
          onPress={handleGenerate}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#818CF8', '#6366F1', '#A855F7']}
            style={styles.generateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateText}>{STEP_LABELS[step]}</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.generateText}>Generate with AI</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </KeyboardAwareScrollView>
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
      fontSize: 17,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: insets.bottom + 40 + webBottomPad,
      gap: 20,
    },
    section: {
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    charCount: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    titleInput: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
    },
    notesInput: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      height: 220,
      lineHeight: 22,
    },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: '#1A1030',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#2D1F50',
      padding: 12,
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    generateBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    generateGradient: {
      paddingVertical: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    generateText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
  });
}
