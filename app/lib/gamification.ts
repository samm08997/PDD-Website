export const BADGE_DEFINITIONS = {
  // Beginner
  first_session: { name: 'First Step', xp: 50, category: 'Beginner' },
  // Streaks
  streak_3: { name: '3-Day Streak', xp: 50, category: 'Consistency' },
  streak_7: { name: 'Week Warrior', xp: 100, category: 'Consistency' },
  streak_15: { name: 'Fortnight Flame', xp: 150, category: 'Consistency' },
  streak_30: { name: 'Monthly Master', xp: 200, category: 'Consistency' },
  streak_60: { name: '60-Day Legend', xp: 300, category: 'Consistency' },
  streak_100: { name: 'Century Scholar', xp: 500, category: 'Consistency' },
  // Productivity
  plan_10: { name: 'Planner Pro', xp: 50, category: 'Productivity' },
  complete_25: { name: 'Dedicated Learner', xp: 75, category: 'Productivity' },
  complete_50: { name: 'Study Champion', xp: 150, category: 'Productivity' },
  complete_100: { name: 'Session Centurion', xp: 300, category: 'Productivity' },
  // Hours
  hours_5: { name: 'First Hours', xp: 50, category: 'Time Master' },
  hours_10: { name: 'Time Investor', xp: 75, category: 'Time Master' },
  hours_25: { name: 'Quarter Century', xp: 150, category: 'Time Master' },
  hours_50: { name: 'Half Century', xp: 250, category: 'Time Master' },
  hours_100: { name: 'Century of Study', xp: 500, category: 'Time Master' },
  // Mastery
  focus_master: { name: 'Focus Master', xp: 150, category: 'Focus' },
  week_learner: { name: 'Consistent Learner', xp: 100, category: 'Consistency' },
  subject_explorer: { name: 'Subject Explorer', xp: 150, category: 'Productivity' },
  planner_champion: { name: 'Planner Champion', xp: 300, category: 'Productivity' },
  // XP
  xp_1000: { name: 'XP Climber', xp: 100, category: 'XP' },
  xp_5000: { name: 'XP Legend', xp: 200, category: 'XP' },
  // Deck & Quiz
  quiz_master: { name: 'Quiz Master', xp: 150, category: 'Productivity' },
  deck_builder: { name: 'Deck Builder', xp: 150, category: 'Productivity' },
  // Ultimate
  legendary_scholar: { name: 'Legendary Scholar', xp: 1000, category: 'Legendary' },
} as const;

export type BadgeKey = keyof typeof BADGE_DEFINITIONS;

export const XP_REWARDS = {
  STUDY_SESSION_COMPLETED: 20,
  PLANNER_TASK_COMPLETED: 10,
  QUIZ_COMPLETED: 15,
  DECK_CREATED: 15,
};

// Calculate level from XP
export function calculateLevel(xp: number): { level: number; nextLevelXp: number; progress: number } {
  // Simple formula: Level N requires N * N * 100 XP
  // e.g. L1=0, L2=400, L3=900, L4=1600...
  // Or simpler: Level = floor(sqrt(XP / 100)) + 1
  const level = Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1;
  
  const currentLevelBaseXp = (level - 1) * (level - 1) * 100;
  const nextLevelXp = level * level * 100;
  
  const xpInCurrentLevel = xp - currentLevelBaseXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelBaseXp;
  const progress = Math.max(0, Math.min(1, xpInCurrentLevel / xpNeededForNextLevel));
  
  return { level, nextLevelXp, progress };
}

// Convert a local date to a stable YYYY-MM-DD string
export function getLocalDayString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isConsecutiveDay(lastDateStr: string, currentDateStr: string): boolean {
  const [ly, lm, ld] = lastDateStr.split('-').map(Number);
  const [cy, cm, cd] = currentDateStr.split('-').map(Number);
  
  const last = Date.UTC(ly, lm - 1, ld);
  const curr = Date.UTC(cy, cm - 1, cd);
  
  const diffTime = curr - last;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  
  return diffDays === 1;
}
