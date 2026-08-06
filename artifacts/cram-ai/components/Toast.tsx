import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export type ToastProps = {
  visible: boolean;
  message: string;
  subMessage?: string;
  type?: 'success' | 'info' | 'streak' | 'badge' | 'level';
  onHide?: () => void;
  duration?: number;
};

export function Toast({
  visible,
  message,
  subMessage,
  type = 'info',
  onHide,
  duration = 3000,
}: ToastProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top + 10,
          useNativeDriver: true,
          tension: 40,
          friction: 5,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, insets.top, translateY, opacity, duration, onHide]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'streak': return <Text style={{ fontSize: 24 }}>🔥</Text>;
      case 'badge': return <Text style={{ fontSize: 24 }}>🏅</Text>;
      case 'level': return <Text style={{ fontSize: 24 }}>⭐</Text>;
      case 'success': return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      default: return <Ionicons name="information-circle" size={24} color={colors.primary} />;
    }
  };

  const getBackground = () => {
    switch (type) {
      case 'badge': return '#FFB80020';
      case 'level': return '#8B5CF620';
      case 'streak': return '#F9731620';
      default: return colors.secondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: getBackground() }]}>
        {getIcon()}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.message, { color: colors.foreground }]}>{message}</Text>
        {subMessage && (
          <Text style={[styles.subMessage, { color: colors.mutedForeground }]}>{subMessage}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  subMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
});
