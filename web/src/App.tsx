import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import TimerScreen from './screens/TimerScreen';
import ProgressScreen from './screens/ProgressScreen';
import PlannerScreen from './screens/PlannerScreen';
import BadgesScreen from './screens/BadgesScreen';
import CreateScreen from './screens/CreateScreen';
import PlayerScreen from './screens/PlayerScreen';
import QuizScreen from './screens/QuizScreen';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={!session ? <LoginScreen /> : <Navigate to="/home" />} 
        />
        <Route 
          path="/home" 
          element={session ? <HomeScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/timer" 
          element={session ? <TimerScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/progress" 
          element={session ? <ProgressScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/planner" 
          element={session ? <PlannerScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/badges" 
          element={session ? <BadgesScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/create" 
          element={session ? <CreateScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/player/:id" 
          element={session ? <PlayerScreen /> : <Navigate to="/" />} 
        />
        <Route 
          path="/quiz/:id" 
          element={session ? <QuizScreen /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
