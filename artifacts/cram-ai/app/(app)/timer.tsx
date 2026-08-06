import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useStreak } from '@/hooks/useStreak';
import { useAchievements } from '@/hooks/useAchievements';
import { Toast } from '@/components/Toast';
import { XP_REWARDS } from '@/lib/gamification';

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const styles = makeStyles(colors, insets);

  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(POMODORO_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; subMessage?: string; type: 'success' | 'info' | 'streak' | 'level' }>({ visible: false, message: '', type: 'info' });

  const { incrementStreakAsync } = useStreak();
  const { logProgress } = useAchievements();

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (user) {
      try {
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          duration_minutes: mode === 'study' ? POMODORO_MINUTES : BREAK_MINUTES,
          type: mode,
        });

        if (mode === 'study') {
          const streakRes = await incrementStreakAsync();
          const xpRes = await logProgress({ type: 'session', amount: POMODORO_MINUTES, xp: XP_REWARDS.STUDY_SESSION_COMPLETED });

          if (xpRes?.levelUp) {
            setToast({ visible: true, type: 'level', message: `Level Up!`, subMessage: `You are now Level ${xpRes.data.level}` });
          } else if (streakRes?.updated) {
            setToast({ visible: true, type: 'streak', message: `Streak Increased!`, subMessage: `${streakRes.current_streak} days in a row` });
          } else {
            setToast({ visible: true, type: 'success', message: 'Session Completed!', subMessage: `+${XP_REWARDS.STUDY_SESSION_COMPLETED} XP` });
          }
        } else {
          setToast({ visible: true, type: 'info', message: 'Break Completed!', subMessage: 'Ready to focus?' });
        }
      } catch (e) {
        console.error("Failed to save session", e);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(`${mode === 'study' ? 'Study session' : 'Break'} completed!`);
      } else {
        Alert.alert('Session Complete', `Your ${mode} session is over!`);
      }
    }

    // Switch mode
    if (mode === 'study') {
      setMode('break');
      setTimeLeft(BREAK_MINUTES * 60);
    } else {
      setMode('study');
      setTimeLeft(POMODORO_MINUTES * 60);
    }
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(false);
    setTimeLeft(mode === 'study' ? POMODORO_MINUTES * 60 : BREAK_MINUTES * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isStudy = mode === 'study';

  return (
    <View style={styles.root}>
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        subMessage={toast.subMessage} 
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Study Timer</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.modeTabs}>
          <Pressable 
            style={[styles.tab, isStudy && styles.tabActive]}
            onPress={() => {
              if (isActive) return;
              setMode('study');
              setTimeLeft(POMODORO_MINUTES * 60);
            }}
          >
            <Text style={[styles.tabText, isStudy && styles.tabTextActive]}>Pomodoro</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, !isStudy && styles.tabActive]}
            onPress={() => {
              if (isActive) return;
              setMode('break');
              setTimeLeft(BREAK_MINUTES * 60);
            }}
          >
            <Text style={[styles.tabText, !isStudy && styles.tabTextActive]}>Short Break</Text>
          </Pressable>
        </View>

        <View style={styles.timerCircle}>
          <Text style={styles.timeText}>{timeString}</Text>
          <Text style={styles.statusText}>{isActive ? "Focusing..." : "Paused"}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.mainBtn} onPress={toggleTimer}>
            <Ionicons name={isActive ? "pause" : "play"} size={32} color="#fff" />
          </Pressable>
          <Pressable style={styles.resetBtn} onPress={resetTimer}>
            <Ionicons name="refresh" size={24} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: any, insets: any) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
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
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingBottom: 60,
    },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 4,
      marginBottom: 60,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: '#fff',
    },
    timerCircle: {
      width: 280,
      height: 280,
      borderRadius: 140,
      borderWidth: 8,
      borderColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 60,
    },
    timeText: {
      fontSize: 64,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    statusText: {
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 8,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    mainBtn: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    resetBtn: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    }
  });
}
