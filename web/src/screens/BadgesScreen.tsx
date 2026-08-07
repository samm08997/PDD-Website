import { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_BADGES = [
  { id: 1, title: 'First Deck', description: 'Create your first flashcard deck', rarity: 'Common', icon: '📚', color: '#818CF8', unlocked: true },
  { id: 2, title: '3 Day Streak', description: 'Study for 3 days in a row', rarity: 'Common', icon: '🔥', color: '#F97316', unlocked: true },
  { id: 3, title: 'Quiz Master', description: 'Score 100% on a quiz', rarity: 'Rare', icon: '🎯', color: '#10B981', unlocked: false },
  { id: 4, title: 'Night Owl', description: 'Study after midnight', rarity: 'Rare', icon: '🌙', color: '#6366F1', unlocked: false },
  { id: 5, title: '7 Day Streak', description: 'Study for a week straight', rarity: 'Epic', icon: '⚡', color: '#A855F7', unlocked: false },
  { id: 6, title: 'Legend', description: 'Reach Level 100', rarity: 'Legendary', icon: '👑', color: '#EAB308', unlocked: false },
];

export default function BadgesScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Common' | 'Rare' | 'Epic' | 'Legendary'>('All');
  const tabs = ['All', 'Common', 'Rare', 'Epic', 'Legendary'] as const;

  const filteredBadges = MOCK_BADGES.filter(b => filter === 'All' || b.rarity === filter);
  const unlockedCount = MOCK_BADGES.filter(b => b.unlocked).length;
  const progressPercent = Math.round((unlockedCount / MOCK_BADGES.length) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Achievements</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full">
        
        {/* Progress Summary */}
        <div className="m-6 p-4 bg-card rounded-2xl border border-border">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-[15px] font-semibold text-foreground">Total Unlocked</span>
            <span className="text-[16px] font-bold text-primary">{unlockedCount} / {MOCK_BADGES.length}</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-6 pb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-2xl text-[13px] font-medium transition-colors border whitespace-nowrap ${
                filter === tab 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-3 gap-y-6 px-4">
          {filteredBadges.map(badge => (
            <div key={badge.id} className="flex flex-col items-center group">
              <div 
                className={`w-[72px] h-[72px] rounded-2xl border flex items-center justify-center mb-2 relative transition-all ${
                  badge.unlocked 
                    ? 'border-transparent bg-secondary' 
                    : 'border-border bg-transparent opacity-60'
                }`}
                style={{ 
                  backgroundColor: badge.unlocked ? `${badge.color}20` : undefined,
                  borderColor: badge.unlocked ? badge.color : undefined
                }}
              >
                {!badge.unlocked && (
                  <div className="absolute inset-0 bg-background/40 rounded-2xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <span className="text-3xl">{badge.icon}</span>
              </div>
              <span className={`text-[12px] font-semibold text-center leading-tight px-1 ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {badge.title}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                {badge.rarity}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
