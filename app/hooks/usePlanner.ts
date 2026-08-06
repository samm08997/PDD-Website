import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type PlannerTask = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimated_minutes: number;
  due_date: string | null;
  reminder_time: string | null;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Archived';
  color_tag: string;
  notes: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePlannerTask = Omit<
  PlannerTask,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at' | 'status'
> & { status?: PlannerTask['status'] };

export function usePlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planner', user?.id],
    queryFn: async (): Promise<PlannerTask[]> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_planner')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      
      // Auto-mark overdue tasks locally
      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      return (data as PlannerTask[]).map((task) => {
        if (task.status === 'Pending') {
          const isPastDueDate = task.due_date && task.due_date < todayStr;
          
          const creationTime = new Date(task.created_at);
          const deadline = new Date(creationTime.getTime() + task.estimated_minutes * 60000);
          const isTimeExpired = now > deadline;
          
          if (isPastDueDate || isTimeExpired) {
            return { ...task, status: 'Overdue' };
          }
        }
        return task;
      });
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (newTask: CreatePlannerTask) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_planner')
        .insert([{ ...newTask, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as PlannerTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner', user?.id] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PlannerTask> }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('study_planner')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PlannerTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner', user?.id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('study_planner')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner', user?.id] });
    },
  });

  return {
    ...query,
    tasks: query.data ?? [],
    createTask: createTask.mutateAsync,
    updateTask: updateTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
  };
}
