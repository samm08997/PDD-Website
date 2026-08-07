import { useState } from 'react';
import { ArrowLeft, Zap, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Step = 'idle' | 'generating' | 'saving';

const STEP_LABELS: Record<Step, string> = {
  idle: 'Generate with AI',
  generating: 'AI is building your master deck… (may take up to 30s)',
  saving: 'Saving to your library...',
};

export default function CreateScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const isLoading = step !== 'idle';

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a deck title.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User session expired. Please sign in again.');
      return;
    }

    setError(null);
    setStep('generating');

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: title.trim(), text: notes.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const flashcards = data.flashcards;

      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error('No flashcards were generated. Try with more detailed notes.');
      }

      setStep('saving');

      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .insert({ user_id: user.id, title: title.trim() })
        .select()
        .single();

      if (deckError) throw deckError;

      const cardRows = flashcards.map((c: any) => ({
        deck_id: deck.id,
        question: c.question,
        answer: c.answer,
      }));

      const { error: cardsError } = await supabase.from('flashcards').insert(cardRows);
      if (cardsError) throw cardsError;

      // Navigate to player
      navigate(`/player/${deck.id}`);
    } catch (err: any) {
      setStep('idle');
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <header className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Create Study Deck</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-6 pb-20 max-w-2xl mx-auto w-full">
        <form onSubmit={handleGenerate} className="space-y-6">
          
          {/* Topic */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-1">Topic</label>
            <p className="text-[11px] text-muted-foreground mb-3">Enter the subject you want to study</p>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Photosynthesis, World War II..."
              className="w-full bg-card border border-border rounded-[14px] px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[13px] font-semibold text-foreground">Detailed Explanation</label>
              <span className="text-[11px] text-muted-foreground">{notes.length} chars</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Optional — the more detail, the smarter the questions</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isLoading}
              placeholder="Explain the topic in detail — include definitions, examples, mechanisms, or any study material. AI will generate 10 smart questions from this."
              className="w-full bg-card border border-border rounded-[14px] px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary disabled:opacity-50 transition-colors h-[220px] resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-[#2A1515] border border-[#4A2020] rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-[13px] text-destructive flex-1">{error}</p>
            </div>
          )}

          {/* AI Tip */}
          <div className="flex items-start gap-2 bg-[#1A1030] border border-[#2D1F50] rounded-xl p-3">
            <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              AI generates 10 master-level flashcards tailored to your topic — coding, history, science, politics, and more. Typos in your topic are auto-corrected. Generation may take up to 30 seconds.
            </p>
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-2xl overflow-hidden shadow-[0_6px_12px_rgba(99,102,241,0.4)] transition-all ${
              isLoading ? 'opacity-70 scale-[0.98]' : 'hover:scale-[0.99] active:scale-[0.97]'
            }`}
          >
            <div className="w-full bg-gradient-to-r from-[#818CF8] via-[#6366F1] to-[#A855F7] py-[17px] flex items-center justify-center gap-2.5">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-5 h-5 text-white fill-white" />
              )}
              <span className="text-[16px] font-semibold text-white">
                {STEP_LABELS[step]}
              </span>
            </div>
          </button>
        </form>
      </main>
    </div>
  );
}
