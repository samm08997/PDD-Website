import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, Platform, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { usePlanner } from '@/hooks/usePlanner';
import { PlannerItem } from '@/components/PlannerItem';

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets);
  
  const { tasks, isLoading, updateTask, createTask } = usePlanner();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('All');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('30');
  
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTask({
        title: newTaskTitle.trim(),
        subject: newTaskSubject.trim() || 'General',
        description: '',
        category: 'General',
        priority: 'Medium',
        estimated_minutes: parseInt(newTaskMinutes, 10) || 30,
        due_date: new Date().toISOString().split('T')[0],
        reminder_time: null,
        color_tag: '#6366F1',
        notes: '',
      });
      setNewTaskTitle('');
      setNewTaskSubject('');
      setNewTaskMinutes('30');
      setModalVisible(false);
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert("Save failed! Please make sure you ran the gamification_schema.sql in your Supabase SQL Editor. Error: " + e.message);
      } else {
        Alert.alert("Save Failed", "Please make sure you ran the gamification_schema.sql in your Supabase SQL Editor.\n\nError: " + e.message);
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return t.status !== 'Archived';
    return t.status === filter;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={15} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Study Planner</Text>
        </View>
        <Pressable onPress={() => setModalVisible(true)} hitSlop={10} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['All', 'Pending', 'Overdue', 'Completed'] as const).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, filter === tab && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, { color: filter === tab ? '#fff' : colors.mutedForeground }]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Task List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PlannerItem
              task={item}
              onPress={() => {}}
              onToggleComplete={(t) => {
                updateTask({
                  id: t.id,
                  updates: {
                    status: t.status === 'Completed' ? 'Pending' : 'Completed',
                    completed_at: t.status !== 'Completed' ? new Date().toISOString() : null
                  }
                });
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySub}>Tap the + button to create a study plan.</Text>
            </View>
          }
        />
      )}

      {/* Add Task Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Study Task</Text>
            
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Task Name</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g., Read Chapter 4"
              placeholderTextColor={colors.mutedForeground}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Subject</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g., History"
              placeholderTextColor={colors.mutedForeground}
              value={newTaskSubject}
              onChangeText={setNewTaskSubject}
            />
            
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Estimated Time (minutes)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g., 30"
              placeholderTextColor={colors.mutedForeground}
              value={newTaskMinutes}
              onChangeText={setNewTaskMinutes}
              keyboardType="number-pad"
            />
            
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.secondary }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleCreateTask}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save Task</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  insets: ReturnType<typeof useSafeAreaInsets>
) {
  const webTopPad = Platform.OS === 'web' ? 20 : 0;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 10 + webTopPad,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      padding: 4,
    },
    headerTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      color: colors.foreground,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#6366F120',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabsRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 8,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    tabText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: insets.bottom + 40,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
    },
    emptyTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      color: colors.foreground,
      marginBottom: 6,
    },
    emptySub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      padding: 24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      paddingBottom: insets.bottom + 24,
    },
    modalTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      marginBottom: 20,
    },
    inputLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      marginBottom: 6,
      marginLeft: 2,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalBtnText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
    }
  });
}
