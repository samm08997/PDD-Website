import { ArrowLeft, Flame, Award, Calendar as CalendarIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProgressScreen() {
  const navigate = useNavigate();
  
  const quotes = [
    "You're on fire! 🔥",
    "Small progress every day adds up.",
    "One more day to beat your record.",
    "Keep learning every day.",
  ];
  const randomQuote = quotes[new Date().getDay() % quotes.length];

  const levelStats = { level: 5, xp: 1250, nextLevelXp: 2000, progress: 0.625 };
  const streak = { current_streak: 3, longest_streak: 12 };

  const recentBadges = [
    { id: 1, name: "First Deck", icon: "📚", color: "#818CF8" },
    { id: 2, name: "3 Day Streak", icon: "🔥", color: "#F97316" },
  ];

  const todayTasks = [
    { id: 1, title: "Review Biology Chapter 3", status: 'Pending' },
    { id: 2, title: "Take Math Quiz", status: 'Pending' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Progress</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* Quote */}
        <div className="py-3 px-4 bg-[#F97316]/10 rounded-xl border-l-4 border-[#F97316]">
          <span className="text-[14px] italic font-medium text-[#F97316]">{randomQuote}</span>
        </div>

        {/* Level & XP */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-foreground">Level {levelStats.level}</h2>
            <span className="text-[13px] font-medium text-primary">{levelStats.xp} / {levelStats.nextLevelXp} XP</span>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
              style={{ width: `${levelStats.progress * 100}%` }}
            />
          </div>
        </section>

        {/* Streaks */}
        <section className="bg-card border border-border rounded-2xl p-5 flex flex-row items-center justify-around">
          <div className="flex flex-col items-center">
            <Flame className="w-8 h-8 text-[#F97316] mb-2" />
            <span className="text-[22px] font-bold text-foreground">{streak.current_streak}</span>
            <span className="text-[13px] text-muted-foreground">Current Streak</span>
          </div>
          <div className="w-[1px] h-12 bg-border" />
          <div className="flex flex-col items-center">
            <Award className="w-8 h-8 text-accent mb-2" />
            <span className="text-[22px] font-bold text-foreground">{streak.longest_streak}</span>
            <span className="text-[13px] text-muted-foreground">Longest Streak</span>
          </div>
        </section>

        {/* Recent Badges */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-foreground">Recent Badges</h2>
            <button onClick={() => navigate('/badges')} className="text-[14px] font-medium text-primary hover:underline">See All</button>
          </div>
          <div className="flex gap-3">
            {recentBadges.map(badge => (
              <div key={badge.id} className="flex-1 bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${badge.color}20` }}>
                  {badge.icon}
                </div>
                <span className="text-[13px] font-semibold text-foreground text-center">{badge.name}</span>
              </div>
            ))}
            <div onClick={() => navigate('/badges')} className="flex-1 bg-secondary border border-border rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/80">
              <span className="text-[13px] font-medium text-muted-foreground">View More</span>
            </div>
          </div>
        </section>

        {/* Heatmap Placeholder */}
        <section className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-2">
          <CalendarIcon className="w-8 h-8 text-muted-foreground opacity-50" />
          <span className="text-[14px] text-muted-foreground font-medium">Study Activity Calendar</span>
          <div className="flex gap-1 mt-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${i % 3 === 0 ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        </section>

        {/* Today's Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-foreground">Today's Tasks</h2>
            <button onClick={() => navigate('/planner')} className="text-[14px] font-medium text-primary hover:underline">Planner</button>
          </div>
          <div className="space-y-2">
            {todayTasks.map(task => (
              <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                  </div>
                  <span className="text-[14px] font-medium text-foreground">{task.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
