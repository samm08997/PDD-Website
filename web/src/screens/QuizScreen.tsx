import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, ArrowRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function QuizScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [deck, setDeck] = useState<any>(null);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    async function loadQuiz() {
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
          .eq('deck_id', id);
          
        if (cardsErr) throw cardsErr;
        
        if (!cardsData || cardsData.length === 0) {
          throw new Error('No flashcards found in this deck to generate a quiz.');
        }

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await fetch(`${apiBase}/api/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flashcards: cardsData.map((c: any) => ({ question: c.question, answer: c.answer })) }),
        });

        if (!res.ok) {
          throw new Error('Failed to generate quiz');
        }

        const data = await res.json();
        setQuizData(data.quiz);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, [id]);

  const currentQ = quizData?.[currentIndex];
  const total = quizData?.length || 0;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  const handleSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (currentQ && idx === currentQ.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setSelectedOption(null);
      setCurrentIndex(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Generating AI Quiz...</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive font-medium text-lg mb-4">{error || 'Quiz not found'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-secondary rounded-xl text-foreground font-medium">Go Back</button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Trophy className="w-24 h-24 text-yellow-500 mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Quiz Completed!</h1>
        <p className="text-muted-foreground mb-6">You scored {score} out of {total}</p>
        <div className="text-5xl font-extrabold text-primary mb-12">{percentage}%</div>
        <button onClick={() => navigate(`/player/${id}`)} className="px-8 py-3.5 bg-card border border-border rounded-xl text-foreground font-semibold hover:bg-secondary transition-colors">
          Back to Deck
        </button>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground truncate px-4 flex-1 text-center">Quiz: {deck.title}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-8 pb-20 max-w-xl mx-auto w-full flex flex-col overflow-y-auto">
        
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

        {/* Question Card */}
        <div className="bg-card border border-border rounded-[20px] p-6 mb-8 shadow-lg">
          <p className="text-lg font-semibold text-foreground leading-relaxed">{currentQ.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            const showStatus = selectedOption !== null;

            let bgColor = 'bg-card';
            let borderColor = 'border-border';
            let textColor = 'text-foreground';
            let Icon = null;

            if (showStatus) {
              if (isCorrect) {
                bgColor = 'bg-emerald-500/10';
                borderColor = 'border-emerald-500';
                textColor = 'text-emerald-500';
                Icon = CheckCircle2;
              } else if (isSelected && !isCorrect) {
                bgColor = 'bg-red-500/10';
                borderColor = 'border-red-500';
                textColor = 'text-red-500';
                Icon = XCircle;
              } else {
                bgColor = 'bg-card opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={showStatus}
                onClick={() => handleSelect(idx)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${bgColor} ${borderColor} ${!showStatus ? 'hover:bg-secondary' : ''}`}
              >
                <span className={`text-[15px] font-medium text-left flex-1 pr-4 ${textColor}`}>{opt}</span>
                {Icon && <Icon className={`w-5 h-5 shrink-0 ${textColor}`} />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {selectedOption !== null && (
          <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
              <h3 className="text-[12px] font-bold text-primary uppercase tracking-wider mb-2">Explanation</h3>
              <p className="text-[14px] text-foreground leading-relaxed">{currentQ.explanation}</p>
            </div>
            
            <button 
              onClick={handleNext}
              className="w-full py-4 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              {currentIndex < total - 1 ? "Next Question" : "Finish Quiz"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
