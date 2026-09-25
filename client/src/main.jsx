import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AuthPage from './components/AuthPage.jsx';
import { supabase, isSupabaseConfigured } from './supabase.js';
import './index.css';

function Root() {
  // null = still resolving session | false = not authenticated | object = Supabase user
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // If Supabase is not configured, skip auth gating and go straight to the dashboard
    if (!isSupabaseConfigured || !supabase) {
      setSessionChecked(true);
      setUser(false);
      return;
    }

    // 1. Check for an existing session immediately (handles page refresh & Magic Link redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? false);
      setSessionChecked(true);
    });

    // 2. Listen for future auth changes (sign-in via Google redirect, OTP verify, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Loading splash while session is resolving
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center">
            {/* Minimal cloud icon inline to avoid extra imports */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-400 fill-current">
              <path d="M18 10a6 6 0 0 0-11.1-3.1A4.5 4.5 0 1 0 4.5 15H18a4 4 0 0 0 0-8z" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-mono">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show auth gate
  if (!user) {
    return (
      <AuthPage
        onAuthenticated={(supabaseUser) => setUser(supabaseUser)}
      />
    );
  }

  // Authenticated — render the full CloudPrune dashboard
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
