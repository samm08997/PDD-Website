import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Zap, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email. We sent you a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // The App component's onAuthStateChange listener will automatically detect the new session
        // and redirect the user to the /home route.
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
         style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0A0B0F 60%)' }}>
      
      {/* Decorative glow orb */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[80px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ backgroundColor: '#6366F1', opacity: 0.12, filter: 'blur(40px)' }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] z-10"
      >
        {/* Brand/Logo Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-[72px] h-[72px] rounded-[22px] bg-[#1E2040] flex items-center justify-center mb-4 border border-[#2D3060] shadow-lg">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-none">
            CramAI
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2 font-medium">
            {isSignUp ? 'Create your account' : 'Your AI study companion'}
          </p>
        </div>

        {/* Auth Card */}
        <form onSubmit={handleAuth} className="bg-card p-6 md:p-8 rounded-[20px] shadow-2xl border border-border flex flex-col">
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 bg-[#2A1515] border border-[#4A2020] text-destructive rounded-xl p-3 mb-5 overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[13px] font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px] text-muted-foreground" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 border border-border rounded-xl bg-secondary text-[15px] text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  placeholder="you@university.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] text-muted-foreground" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 border border-border rounded-xl bg-secondary text-[15px] text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 mb-5 p-0 overflow-hidden rounded-[14px] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <div className="w-full py-3.5 flex items-center justify-center bg-gradient-to-r from-[#818CF8] to-[#6366F1]">
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                />
              ) : (
                <span className="text-[16px] font-semibold text-white tracking-wide">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </span>
              )}
            </div>
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[14px] text-muted-foreground transition-colors group"
            >
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span className="text-primary font-semibold group-hover:underline">
                {isSignUp ? 'Sign In' : 'Create Account'}
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
