import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Cloud, Mail, ArrowRight, Loader2, AlertCircle, Check, KeyRound, RefreshCw, Chrome } from 'lucide-react';

// ─── OTP digit input — focuses next box automatically ────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (idx, char) => {
    const sanitized = char.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = sanitized;
    const joined = next.join('');
    onChange(joined);

    // Auto-advance focus
    if (sanitized && idx < 5) {
      const nextEl = document.getElementById(`otp-digit-${idx + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const prevEl = document.getElementById(`otp-digit-${idx - 1}`);
      if (prevEl) prevEl.focus();
      const next = [...digits];
      next[idx - 1] = '';
      onChange(next.join(''));
    }
    // Allow paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return;
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    // Focus the last filled digit
    const focusIdx = Math.min(pasted.length, 5);
    const el = document.getElementById(`otp-digit-${focusIdx}`);
    if (el) el.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          id={`otp-digit-${idx}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          disabled={disabled}
          autoFocus={idx === 0}
          className={`w-11 h-14 text-center text-xl font-bold font-mono rounded-xl border-2 bg-gray-900 text-white transition-all outline-none
            ${digits[idx]
              ? 'border-emerald-500 bg-emerald-950/20 shadow-emerald-500/20 shadow-lg'
              : 'border-gray-700 focus:border-indigo-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'}
          `}
          aria-label={`OTP digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Main AuthPage ─────────────────────────────────────────────────────────
export default function AuthPage({ onAuthenticated }) {
  // 'email' | 'otp'
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Supabase auth-state listener ─────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          onAuthenticated(session.user);
        }
      }
    );

    // Check for an existing session on mount (handles Magic Link redirects)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        onAuthenticated(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthenticated]);

  // ── Resend cooldown timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Guard: Supabase must be configured ──────────────────────────────────
  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-red-800/40 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Supabase Not Configured</h2>
          <p className="text-sm text-gray-400">
            Add <code className="text-emerald-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-emerald-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">VITE_SUPABASE_ANON_KEY</code> to{' '}
            <code className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">client/.env</code>.
          </p>
        </div>
      </div>
    );
  }

  // ── STEP 1: Send OTP / Magic Link ────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim() || isLoading) return;

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          // shouldCreateUser: true ensures new users are auto-registered on first OTP login
          shouldCreateUser: true,
        },
      });

      if (otpErr) throw otpErr;

      setStage('otp');
      setOtpValue('');
      setSuccessMsg(`A 6-digit code was sent to ${trimmed}. Check your inbox (and spam folder).`);
      setResendCooldown(60); // 60s cooldown before allowing resend
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── STEP 2: Verify the 6-digit OTP ───────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const code = otpValue.trim();
    if (code.length !== 6 || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email',
      });

      if (verifyErr) throw verifyErr;

      if (data?.user) {
        // onAuthenticated will fire via onAuthStateChange, but call directly as well
        // to handle cases where the listener fires before this resolves
        onAuthenticated(data.user);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
      setOtpValue('');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (stage === 'otp' && otpValue.length === 6 && !isLoading) {
      handleVerifyOtp();
    }
  }, [otpValue, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Google OAuth with forced account selection ────────────────────────────
  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const { error: googleErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Forces the Google account chooser dialog to appear every time.
          // Without this, Google silently reuses the active browser session.
          queryParams: { prompt: 'select_account' },
          redirectTo: window.location.origin,
        },
      });

      if (googleErr) throw googleErr;
      // Browser will redirect to Google — no further action needed here
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  // ── Back to email stage ───────────────────────────────────────────────────
  const handleBack = () => {
    setStage('email');
    setOtpValue('');
    setError('');
    setSuccessMsg('');
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    await handleSendOtp();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 30% 20%, rgba(99,102,241,0.10) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 75% 80%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* ── Logo / Brand ─────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CloudPrune<span className="text-emerald-400 font-sans">.AI</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">Autonomous FinOps Agent — Secure Sign-In</p>
        </div>

        {/* ── Card ─────────────────────────────────────────────── */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Error Banner ─────────────────────────────────── */}
          {error && (
            <div
              role="alert"
              className="px-5 py-3 bg-red-950/60 border-b border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-slideDown"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Success Banner ───────────────────────────────── */}
          {successMsg && !error && (
            <div
              role="status"
              className="px-5 py-3 bg-emerald-950/50 border-b border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-slideDown"
            >
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-7 space-y-6">

            {/* ══════════ STAGE: EMAIL ══════════════════════════════ */}
            {stage === 'email' && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white">Welcome back</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Enter your email to receive a one-time verification code.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-semibold text-gray-300 mb-1.5"
                    >
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@yourcompany.com"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-950 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 text-white font-medium text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    /* Google "G" SVG logo */
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {/* ══════════ STAGE: OTP ═══════════════════════════════ */}
            {stage === 'otp' && (
              <>
                <div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-4 transition-colors group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">Check your inbox</h2>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Enter the 6-digit code we sent you. It expires in{' '}
                    <span className="text-emerald-400 font-medium">10 minutes</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <OtpInput
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || otpValue.length < 6}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Verify &amp; Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Didn't receive it? Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Footer note ──────────────────────────────────────── */}
          <div className="px-7 py-4 border-t border-gray-800/60 bg-gray-950/40">
            <p className="text-[11px] text-gray-500 text-center leading-relaxed">
              By signing in, you agree to our{' '}
              <span className="text-gray-400">Terms of Service</span> and{' '}
              <span className="text-gray-400">Privacy Policy</span>.{' '}
              CloudPrune AI uses Supabase Auth with zero-knowledge password storage.
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SOC2 Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Supabase Auth (OAuth 2.0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Zero-knowledge
          </span>
        </div>
      </div>
    </div>
  );
}
