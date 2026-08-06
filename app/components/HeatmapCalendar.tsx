import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type HeatmapCalendarProps = {
  // Array of YYYY-MM-DD strings representing study days
  studyDates: string[];
};

export function HeatmapCalendar({ studyDates }: HeatmapCalendarProps) {
  const colors = useColors();

  // Generate last 12 weeks of data (84 days)
  const heatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back 83 days to get 84 total days
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      data.push({
        dateStr,
        active: studyDates.includes(dateStr),
      });
    }
    
    // Group by week (7 days per column)
    const weeks = [];
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7));
    }
    return weeks;
  }, [studyDates]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Study Consistency</Text>
      
      <View style={styles.grid}>
        {heatmapData.map((week, wIndex) => (
          <View key={`w-${wIndex}`} style={styles.column}>
            {week.map((day, dIndex) => (
              <View
                key={day.dateStr}
                style={[
                  styles.cell,
                  {
                    backgroundColor: day.active ? colors.primary : colors.secondary,
                    borderColor: day.active ? '#8B5CF6' : colors.border,
                  }
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Less</Text>
        <View style={[styles.cell, { backgroundColor: colors.secondary, borderColor: colors.border, marginHorizontal: 4 }]} />
        <View style={[styles.cell, { backgroundColor: colors.primary, borderColor: '#8B5CF6', marginHorizontal: 4 }]} />
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>More</Text>
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
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    gap: 4,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
