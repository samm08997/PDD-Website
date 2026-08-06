import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { calculateLevel, BADGE_DEFINITIONS, type BadgeKey } from '@/lib/gamification';

export type UserProgress = {
  id: string;
  total_xp: number;
  level: number;
  total_sessions: number;
  total_minutes_studied: number;
  total_planner_tasks: number;
  total_quizzes: number;
  total_decks_created: number;
  subjects_studied: string[];
  on_time_tasks: number;
};

export type BadgeDefinition = {
  id: string;
  key: BadgeKey;
  name: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  xp_reward: number;
  category: string;
  requirement: any;
  sort_order: number;
};

export type UserBadge = {
  badge_id: string;
  unlocked_at: string;
  xp_awarded: number;
  badges: BadgeDefinition; // Joined data
};

export function useAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const progressQuery = useQuery({
    queryKey: ['progress', user?.id],
    queryFn: async (): Promise<UserProgress> => {
      if (!user) throw new Error('Not authenticated');

      let { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_progress')
          .insert([{ user_id: user.id }])
          .select()
          .single();
        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      return data as UserProgress;
    },
    enabled: !!user,
  });

  const badgesQuery = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: allBadges, error: badgesError } = await supabase
        .from('achievement_badges')
        .select('*')
        .order('sort_order', { ascending: true });

      if (badgesError) throw badgesError;

      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('*, badges:achievement_badges(*)')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      const unlockedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);

      return {
        allBadges: allBadges as BadgeDefinition[],
        userBadges: userBadges as UserBadge[],
        unlockedIds: unlockedBadgeIds,
      };
    },
    enabled: !!user,
  });

  const logProgress = useMutation({
    mutationFn: async ({ type, amount = 1, xp = 0 }: { type: 'session' | 'planner' | 'quiz' | 'deck'; amount?: number; xp?: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: current, error: fetchErr } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (fetchErr) throw fetchErr;

      let updates: Partial<UserProgress> = {
        total_xp: current.total_xp + xp,
      };

      if (type === 'session') {
        updates.total_sessions = current.total_sessions + 1;
        updates.total_minutes_studied = current.total_minutes_studied + amount;
      } else if (type === 'planner') {
        updates.total_planner_tasks = current.total_planner_tasks + 1;
      } else if (type === 'quiz') {
        updates.total_quizzes = current.total_quizzes + 1;
      } else if (type === 'deck') {
        updates.total_decks_created = current.total_decks_created + 1;
      }

      const { level: newLevel } = calculateLevel(updates.total_xp!);
      updates.level = newLevel;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Fire badge check in background
      checkBadges.mutateAsync().catch(console.error);
      
      return { data, levelUp: newLevel > current.level, xp };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', user?.id] });
    },
  });

  const checkBadges = useMutation({
    mutationFn: async () => {
      if (!user) return [];
      
      const { data: prog } = await supabase.from('user_progress').select('*').eq('user_id', user.id).single();
      const { data: streakData } = await supabase.from('study_streaks').select('*').eq('user_id', user.id).single();
      const { data: allBadges } = await supabase.from('achievement_badges').select('*');
      const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
      
      if (!prog || !allBadges) return [];
      const unlockedIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      const newUnlocks = [];

      for (const badge of allBadges) {
        if (unlockedIds.has(badge.id)) continue;
        
        const req = badge.requirement as any;
        let isMet = false;
        
        switch (req.type) {
          case 'sessions': isMet = prog.total_sessions >= req.value; break;
          case 'streak': isMet = streakData && streakData.current_streak >= req.value; break;
          case 'planner_created': isMet = prog.total_planner_tasks >= req.value; break;
          case 'hours': isMet = (prog.total_minutes_studied / 60) >= req.value; break;
          case 'xp': isMet = prog.total_xp >= req.value; break;
          case 'quizzes': isMet = prog.total_quizzes >= req.value; break;
          case 'decks': isMet = prog.total_decks_created >= req.value; break;
          case 'all_badges': isMet = unlockedIds.size >= req.value; break;
        }

        if (isMet) {
          const { error } = await supabase.from('user_badges').insert({
            user_id: user.id,
            badge_id: badge.id,
            xp_awarded: badge.xp_reward,
          });
          if (!error) {
            newUnlocks.push(badge);
            unlockedIds.add(badge.id); // Add it immediately for 'all_badges' logic
            // Award badge XP dynamically
            await supabase.from('user_progress').update({ total_xp: prog.total_xp + badge.xp_reward }).eq('user_id', user.id);
            prog.total_xp += badge.xp_reward; 
          }
        }
      }
      return newUnlocks;
    },
    onSuccess: (newUnlocks) => {
      if (newUnlocks && newUnlocks.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['badges', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['progress', user?.id] });
      }
    }
  });

  return {
    progress: progressQuery.data,
    isLoadingProgress: progressQuery.isLoading,
    badgesData: badgesQuery.data,
    isLoadingBadges: badgesQuery.isLoading,
    addXp: logProgress.mutateAsync, // Kept for backwards compat if needed anywhere else
    logProgress: logProgress.mutateAsync,
    checkBadges: checkBadges.mutateAsync,
    levelStats: progressQuery.data 
      ? calculateLevel(progressQuery.data.total_xp) 
      : { level: 1, nextLevelXp: 100, progress: 0 },
  };
}
