import { useState, useEffect } from 'react';
import { ArrowLeft, School, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PlayerScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    async function loadDeck() {
      if (!id) return;
      try {
        const { data: deckData, error: deckErr } = await supabase
          .from('decks')
          .select('*')
          .eq('id', id)
          .single();
          
        if (deckErr) throw deckErr;
        setDeck(deckData);

        const { data: cardsData, error: cardsErr } = await supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', id)
          .order('created_at', { ascending: true });
          
        if (cardsErr) throw cardsErr;
        setCards(cardsData || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load deck');
      } finally {
        setIsLoading(false);
      }
    }
    loadDeck();
  }, [id]);

  const total = cards.length;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;
  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive font-medium text-lg mb-4">{error || 'Deck not found'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-secondary rounded-xl text-foreground font-medium">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground truncate px-4 flex-1 text-center">{deck.title}</h1>
        <button onClick={() => navigate(`/quiz/${id}`)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border hover:bg-secondary/80 transition-colors">
          <School className="w-5 h-5 text-accent" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-8 pb-20 max-w-xl mx-auto w-full flex flex-col">
        {total === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-muted-foreground">No cards in this deck.</p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-[12px] font-medium text-muted-foreground min-w-[36px] text-right">
                {currentIndex + 1} / {total}
              </span>
            </div>

            {/* Flashcard */}
            <div 
              className="relative w-full h-[360px] md:h-[440px] perspective-1000 cursor-pointer group mb-10 shrink-0"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`absolute inset-0 preserve-3d transition-transform duration-500 ease-in-out ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg hover:border-primary/30 transition-colors">
                  <span className="absolute top-6 left-6 text-[12px] font-bold text-primary uppercase tracking-wider">Question</span>
                  <RotateCcw className="absolute top-6 right-6 w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  <p className="text-lg md:text-xl font-medium text-foreground text-center leading-relaxed max-h-full overflow-y-auto no-scrollbar">
                    {currentCard.question}
                  </p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-card border border-border rounded-3xl p-8 flex flex-col shadow-lg">
                  <span className="absolute top-6 left-6 text-[12px] font-bold text-accent uppercase tracking-wider">Answer</span>
                  <RotateCcw className="absolute top-6 right-6 w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 flex items-center justify-center mt-6 mb-16 overflow-y-auto no-scrollbar">
                    <p className="text-[15px] md:text-base text-foreground/90 text-center leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>
                  
                  {/* Rating Buttons */}
                  <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 py-3 bg-[#2A1515] hover:bg-[#3A1D1D] border border-[#4A2020] rounded-xl text-destructive text-[13px] font-semibold transition-colors">Hard</button>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 py-3 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-foreground text-[13px] font-semibold transition-colors">Good</button>
                    <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="flex-1 py-3 bg-[#062c1e] hover:bg-[#0a422d] border border-[#105c3f] rounded-xl text-emerald-500 text-[13px] font-semibold transition-colors">Easy</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              
              <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1E2040] to-[#252850] border border-border/50 shadow-inner">
                <span className="text-[13px] font-medium text-foreground/80">Card {currentIndex + 1}</span>
              </div>

              <button 
                onClick={handleNext}
                disabled={currentIndex === total - 1}
                className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
              >
                <ArrowRight className="w-6 h-6 text-foreground" />
              </button>
            </div>

            {/* Done */}
            {currentIndex === total - 1 && (
              <div className="mt-8 bg-[#1A0F30] border border-[#2D1F50] rounded-xl p-4 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span className="text-[14px] font-medium text-accent">You've reviewed all {total} cards! 🎉</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
