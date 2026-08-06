import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { PlannerTask } from '@/hooks/usePlanner';

type PlannerItemProps = {
  task: PlannerTask;
  onPress: (task: PlannerTask) => void;
  onToggleComplete: (task: PlannerTask) => void;
};

export function PlannerItem({ task, onPress, onToggleComplete }: PlannerItemProps) {
  const colors = useColors();
  const isCompleted = task.status === 'Completed';

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'Critical': return '#EF4444';
      case 'High': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return colors.primary;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.8 },
        isCompleted && { opacity: 0.6 }
      ]}
      onPress={() => onPress(task)}
    >
      <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor() }]} />
      
      <Pressable
        hitSlop={10}
        onPress={() => onToggleComplete(task)}
        style={styles.checkboxContainer}
      >
        <View style={[
          styles.checkbox,
          { borderColor: isCompleted ? colors.primary : colors.mutedForeground },
          isCompleted && { backgroundColor: colors.primary }
        ]}>
          {isCompleted && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.foreground },
            isCompleted && styles.titleCompleted
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        <View style={styles.metaRow}>
          {task.subject ? (
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                {task.subject}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.timeWrap}>
            <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
              {task.estimated_minutes}m
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingRight: 16,
    paddingVertical: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  priorityStrip: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  checkboxContainer: {
    paddingLeft: 16,
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
