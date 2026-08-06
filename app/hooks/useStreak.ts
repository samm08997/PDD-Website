import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { getLocalDayString, isConsecutiveDay } from '@/lib/gamification';

export type StreakData = {
  current_streak: number;
  longest_streak: number;
  total_study_days: number;
  last_study_date: string | null;
  updated_at: string;
};

export function useStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async (): Promise<StreakData> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record doesn't exist yet, return defaults
          return {
            current_streak: 0,
            longest_streak: 0,
            total_study_days: 0,
            last_study_date: null,
            updated_at: new Date().toISOString(),
          };
        }
        throw error;
      }
      
      // Visually reset current streak if they missed a day
      const today = getLocalDayString();
      if (data.last_study_date && data.last_study_date !== today && !isConsecutiveDay(data.last_study_date, today)) {
        return { ...data, current_streak: 0 };
      }
      
      return data;
    },
    enabled: !!user,
  });

  const incrementStreak = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const currentData = query.data;
      const today = getLocalDayString();
      
      // If already studied today, do nothing
      if (currentData?.last_study_date === today) {
        return { updated: false, ...currentData };
      }

      let newCurrentStreak = 1;
      let newTotalDays = (currentData?.total_study_days || 0) + 1;

      if (currentData?.last_study_date) {
        if (isConsecutiveDay(currentData.last_study_date, today)) {
          newCurrentStreak = currentData.current_streak + 1;
        } else {
          // Streak broken
          newCurrentStreak = 1;
        }
      }

      const newLongestStreak = Math.max(
        currentData?.longest_streak || 0,
        newCurrentStreak
      );

      const payload = {
        user_id: user.id,
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        total_study_days: newTotalDays,
        last_study_date: today,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('study_streaks')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return { updated: true, ...data };
    },
    onSuccess: (data) => {
      if (data.updated) {
        queryClient.invalidateQueries({ queryKey: ['streak', user?.id] });
      }
    },
  });

  return {
    ...query,
    incrementStreak: incrementStreak.mutate,
    incrementStreakAsync: incrementStreak.mutateAsync,
    isIncrementing: incrementStreak.isPending,
  };
}
