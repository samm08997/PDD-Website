import { useEffect, useState } from 'react';
import { LogOut, Timer, Flame, Star, BarChart2, Calendar, Award, BookCopy, Plus, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

type Deck = {
  id: string;
  title: string;
  created_at: string;
};

export default function HomeScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });

    supabase
      .from('decks')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setDecks(data);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteDeck = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      const { error } = await supabase.from('decks').delete().eq('id', id);
      if (error) throw error;
      setDecks(decks => decks.filter(d => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete deck');
    }
  };

  const greeting = email ? `Hey, ${email.split('@')[0]}` : 'Welcome back';

  // Mock gamification stats since hooks aren't ported yet
  const streak = 3;
  const level = 5;

  return (
    <div className="min-h-screen bg-background flex flex-col relative pb-32">
      
      {/* Header */}
      <header className="flex items-start justify-between px-6 pt-12 pb-4">
        <div>
          <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">{greeting}</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Ready to study?</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/timer')} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border hover:bg-secondary/80 transition-colors">
            <Timer className="w-5 h-5 text-accent" />
          </button>
          <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border hover:bg-secondary/80 transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="mx-6 mb-4 bg-card rounded-[14px] border border-border py-3.5 px-5 flex items-center justify-between shadow-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold text-primary">{decks.length}</span>
          <span className="text-[13px] text-muted-foreground">Decks</span>
        </div>
        <div className="w-[1px] h-5 bg-border" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold text-primary">🔥 {streak}</span>
          <span className="text-[13px] text-muted-foreground">Streak</span>
        </div>
        <div className="w-[1px] h-5 bg-border" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-bold text-primary">⭐ {level}</span>
          <span className="text-[13px] text-muted-foreground">Level</span>
        </div>
      </div>

      {/* Gamification Nav Row */}
      <div className="mx-6 mb-6 flex gap-3">
        <button onClick={() => navigate('/progress')} className="flex-1 flex flex-row items-center justify-center gap-1.5 bg-card rounded-xl border border-border py-2.5 hover:bg-secondary/50 transition-colors">
          <BarChart2 className="w-[18px] h-[18px] text-primary" />
          <span className="font-medium text-[13px] text-foreground">Progress</span>
        </button>
        <button onClick={() => navigate('/planner')} className="flex-1 flex flex-row items-center justify-center gap-1.5 bg-card rounded-xl border border-border py-2.5 hover:bg-secondary/50 transition-colors">
          <Calendar className="w-[18px] h-[18px] text-primary" />
          <span className="font-medium text-[13px] text-foreground">Planner</span>
        </button>
        <button onClick={() => navigate('/badges')} className="flex-1 flex flex-row items-center justify-center gap-1.5 bg-card rounded-xl border border-border py-2.5 hover:bg-secondary/50 transition-colors">
          <Award className="w-[18px] h-[18px] text-primary" />
          <span className="font-medium text-[13px] text-foreground">Badges</span>
        </button>
      </div>

      {/* Deck List */}
      <main className="flex-1 px-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 px-8 text-center">
            <div className="w-[72px] h-[72px] rounded-[22px] bg-secondary flex items-center justify-center mb-4 border border-border">
              <BookCopy className="w-9 h-9 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No decks yet</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Paste your lecture notes and let AI generate flashcards for you.
            </p>
          </div>
        ) : (
          decks.map(deck => (
            <div key={deck.id} onClick={() => navigate(`/player/${deck.id}`)} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3.5 hover:border-primary/40 cursor-pointer transition-colors group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#818CF8] to-[#A855F7] flex items-center justify-center shrink-0">
                <BookCopy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground truncate">{deck.title}</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {new Date(deck.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" onClick={(e) => handleDeleteDeck(e, deck.id, deck.title)}>
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
              <ChevronRight className="w-[18px] h-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          ))
        )}
      </main>

      {/* FAB */}
      <button onClick={() => navigate('/create')} className="fixed bottom-8 right-6 rounded-[20px] shadow-[0_6px_12px_rgba(99,102,241,0.45)] hover:scale-95 transition-transform">
        <div className="w-[60px] h-[60px] rounded-[20px] bg-gradient-to-br from-[#818CF8] to-[#6366F1] flex items-center justify-center">
          <Plus className="w-8 h-8 text-white" />
        </div>
      </button>

    </div>
  );
}
