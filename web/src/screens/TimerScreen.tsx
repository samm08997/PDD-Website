import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function TimerScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(POMODORO_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    
    // Save session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          duration_minutes: mode === 'study' ? POMODORO_MINUTES : BREAK_MINUTES,
          type: mode,
        });
        alert(`${mode === 'study' ? 'Study session' : 'Break'} completed!`);
      } catch (e) {
        console.error("Failed to save session", e);
      }
    }

    // Switch mode
    if (mode === 'study') {
      setMode('break');
      setTimeLeft(BREAK_MINUTES * 60);
    } else {
      setMode('study');
      setTimeLeft(POMODORO_MINUTES * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? POMODORO_MINUTES * 60 : BREAK_MINUTES * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isStudy = mode === 'study';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Study Timer</h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        
        {/* Mode Tabs */}
        <div className="flex bg-card rounded-2xl p-1 mb-16 border border-border">
          <button 
            className={`px-6 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${isStudy ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => {
              if (isActive) return;
              setMode('study');
              setTimeLeft(POMODORO_MINUTES * 60);
            }}
          >
            Pomodoro
          </button>
          <button 
            className={`px-6 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${!isStudy ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => {
              if (isActive) return;
              setMode('break');
              setTimeLeft(BREAK_MINUTES * 60);
            }}
          >
            Short Break
          </button>
        </div>

        {/* Timer Circle */}
        <div className="w-[280px] h-[280px] rounded-full border-[8px] border-card flex flex-col items-center justify-center mb-16 relative shadow-lg">
          {/* Subtle glow behind timer */}
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl -z-10" />
          
          <span className="text-6xl font-bold text-foreground tracking-tight">{timeString}</span>
          <span className="text-base text-muted-foreground mt-2 font-medium">
            {isActive ? "Focusing..." : "Paused"}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleTimer}
            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform"
          >
            {isActive ? (
              <Pause className="w-8 h-8 text-white fill-white" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            )}
          </button>
          
          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </main>
    </div>
  );
}
