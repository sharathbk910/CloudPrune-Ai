import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Shield, CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { signInWithGoogle, signInWithOtp, verifyOtp as supabaseVerifyOtp } from '../supabase';

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const first = user[0];
  const last = user[user.length - 1];
  const stars = '*'.repeat(Math.max(4, user.length - 2));
  return `${first}${stars}${last}@${domain}`;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [step, setStep] = useState(1); // 1 = Email Input, 2 = 6-digit OTP
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];
  const emailInputRef = useRef(null);

  // Reset state whenever modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setInfoMsg('');
      setIsSending(false);
      setIsGoogleLoading(false);
      setIsVerifying(false);
      setResendTimer(60);
      setIsResendDisabled(true);
      setMode(initialMode || 'login');
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialMode]);

  // 60-second countdown timer for Step 2
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setIsResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Real Google OAuth 2.0 Trigger
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setIsGoogleLoading(true);

    try {
      // Primary: Direct backend Google OAuth (uses pre-authorized callback http://localhost:3001/api/auth/google/callback)
      const returnTo = window.location.href;
      window.location.href = `http://localhost:3001/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`;
    } catch (err) {
      setIsGoogleLoading(false);
      setErrorMsg(err.message || 'Google authentication failed. Please check network and try again.');
    }
  };

  // Step 1: Send OTP to Real Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your email address.');
      emailInputRef.current?.focus();
      return;
    }

    if (!STRICT_EMAIL_REGEX.test(trimmed)) {
      setErrorMsg('Please provide a valid email address with a valid domain (e.g., name@domain.com).');
      emailInputRef.current?.focus();
      return;
    }

    setIsSending(true);

    try {
      // 1. Attempt dispatch via Express backend
      const res = await api.sendOtp(trimmed.toLowerCase(), mode);
      if (res && res.success) {
        setStep(2);
        setResendTimer(60);
        setIsResendDisabled(true);
        setInfoMsg(`Verification code dispatched to ${trimmed}. Check your inbox and spam folder.`);
        setTimeout(() => otpInputRefs[0].current?.focus(), 120);
      } else {
        throw new Error(res?.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      console.warn('Backend sendOtp notice, attempting Supabase fallback:', err.message);
      // 2. Supabase Auth fallback
      try {
        await signInWithOtp(trimmed.toLowerCase());
        setStep(2);
        setResendTimer(60);
        setIsResendDisabled(true);
        setInfoMsg(`Verification code dispatched to ${trimmed}. Check your inbox and spam folder.`);
        setTimeout(() => otpInputRefs[0].current?.focus(), 120);
      } catch (sbErr) {
        // Truthful error reporting: do not pretend success if delivery failed!
        setErrorMsg(sbErr.message || err.message || 'Failed to send verification code. Please check your email credentials.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Handle single digit input & auto-advance
  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setErrorMsg('');

    if (digit && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all 6 boxes are filled
    if (digit && index === 5) {
      const allFilled = newDigits.every((d) => d !== '');
      if (allFilled) {
        submitVerification(newDigits.join(''));
      }
    }
  };

  // Handle Backspace and Arrow key navigation
  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs[index - 1].current?.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    } else if (e.key === 'Enter') {
      submitVerification(otpDigits.join(''));
    }
  };

  // Handle pasting all 6 digits at once
  const handlePaste = (e) => {
    const paste = (e.clipboardData || window.clipboardData)?.getData('text')?.trim() || '';
    const digits = paste.replace(/\D/g, '');
    if (digits.length >= 6) {
      e.preventDefault();
      const newDigits = digits.slice(0, 6).split('');
      setOtpDigits(newDigits);
      otpInputRefs[5].current?.focus();
      submitVerification(newDigits.join(''));
    }
  };

  // Step 2: Submit Verification
  const submitVerification = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);

    let authenticatedUser = null;
    let token = null;

    try {
      // 1. Verify against Express backend
      const res = await api.verifyOtp(email.trim().toLowerCase(), code);
      if (res && res.success && res.user) {
        authenticatedUser = res.user;
        token = res.token;
      } else if (res && res.error) {
        setErrorMsg(res.error);
        setIsVerifying(false);
        return;
      }
    } catch (err) {
      console.warn('Backend verifyOtp error, trying Supabase Auth:', err.message);
    }

    // 2. Fallback to Supabase verifyOtp if backend did not verify
    if (!authenticatedUser) {
      try {
        const sbData = await supabaseVerifyOtp(email.trim().toLowerCase(), code);
        if (sbData && sbData.user) {
          const rawName = sbData.user.user_metadata?.full_name || sbData.user.user_metadata?.name || email.split('@')[0];
          const initials = rawName.split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'CP';
          authenticatedUser = {
            id: sbData.user.id,
            name: rawName,
            email: email.trim().toLowerCase(),
            role: 'Platform Engineer',
            avatar: initials,
            emailVerified: true,
            provider: 'supabase_otp'
          };
          token = sbData.session?.access_token || null;
        }
      } catch (sbErr) {
        console.warn('Supabase verification error:', sbErr.message);
      }
    }

    if (authenticatedUser) {
      // STEP 3: DIRECT ACCESS TO DASHBOARD
      try {
        localStorage.setItem('cloudprune_user', JSON.stringify(authenticatedUser));
        if (token) localStorage.setItem('cloudprune_token', token);
      } catch (_) {}

      setIsVerifying(false);
      onAuthSuccess(authenticatedUser);
      onClose();
    } else {
      setIsVerifying(false);
      setErrorMsg('Invalid or expired 6-digit verification code. Please check your inbox and try again.');
    }
  };

  // Resend fresh OTP
  const handleResend = async () => {
    if (isResendDisabled) return;
    setErrorMsg('');
    setInfoMsg('');
    setIsSending(true);

    try {
      const res = await api.sendOtp(email.trim().toLowerCase(), 'resend');
      if (res && res.success) {
        setResendTimer(60);
        setIsResendDisabled(true);
        setOtpDigits(['', '', '', '', '', '']);
        setInfoMsg(`Fresh verification code sent to ${email.trim()}.`);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      } else {
        throw new Error(res?.error || 'Failed to resend verification code.');
      }
    } catch (err) {
      try {
        await signInWithOtp(email.trim().toLowerCase());
        setResendTimer(60);
        setIsResendDisabled(true);
        setOtpDigits(['', '', '', '', '', '']);
        setInfoMsg(`Fresh verification code sent to ${email.trim()}.`);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      } catch (e) {
        setErrorMsg('Failed to resend verification code: ' + (e.message || err.message));
      }
    } finally {
      setIsSending(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative bg-[#0f131e] border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Header */}
        <div className="p-6 text-center border-b border-gray-800/80">
          <div className="w-11 h-11 mx-auto mb-3.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-950 shadow-lg shadow-amber-950/40">
            <Shield className="w-5 h-5" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold text-white tracking-tight">
            {step === 1 ? (isRegister ? 'Create Your Account' : 'Welcome Back') : 'Check your email'}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            {step === 1
              ? (isRegister ? 'Start optimizing your cloud infrastructure with AI' : 'Sign in to your account to continue')
              : `We sent a 6-digit verification code to ${maskEmail(email)}`}
          </p>
        </div>

        <div className="p-6">
          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800/70 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}
          {infoMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/70 flex items-start gap-2.5 text-xs text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{infoMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: LOGIN / REGISTER ================= */}
          {step === 1 && (
            <div>
              {/* REAL Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSending}
                className="w-full mb-4 py-2.5 px-4 rounded-xl bg-[#171d2c] hover:bg-[#1f273b] border border-gray-700/80 hover:border-amber-500/60 text-gray-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" className="shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{isRegister ? 'Sign Up with Google' : 'Continue with Google'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-gray-800" />
                <span className="text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold">OR</span>
                <div className="flex-1 border-t border-gray-800" />
              </div>

              <form onSubmit={handleSendOtp} noValidate>
                <div className="mb-4">
                  <label htmlFor="modal-auth-email" className="block text-xs font-semibold text-gray-300 mb-1.5 text-left">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      ref={emailInputRef}
                      id="modal-auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0b0f19] border border-gray-700/80 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending || isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-950/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>{isRegister ? 'Create Account with Email' : 'Continue with Email'}</span>
                  )}
                </button>
              </form>

              {/* Mode Toggle: Sign In vs Sign Up */}
              <div className="mt-4 pt-3 border-t border-gray-800/80 text-center text-xs text-gray-400">
                <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(isRegister ? 'login' : 'register');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline transition-colors ml-1"
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </div>

              <p className="mt-3 text-[10.5px] text-gray-500 text-center leading-relaxed">
                By continuing, you agree to CloudPrune's Terms of Service and Privacy Policy.
              </p>
            </div>
          )}

          {/* ================= STEP 2: 6-DIGIT OTP VERIFICATION ================= */}
          {step === 2 && (
            <div>
              <div className="mb-4 p-3 rounded-xl bg-[#0b0f19] border border-amber-500/20 flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate font-medium">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 ml-2"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-3 text-center">
                Enter the 6-digit numeric verification code below:
              </p>

              {/* 6 OTP Boxes with paste handler */}
              <div className="grid grid-cols-6 gap-2 mb-4" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    className="w-full h-12 text-center text-lg font-bold font-mono bg-[#0b0f19] border border-gray-700/80 rounded-xl text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                ))}
              </div>

              {/* 60s Resend Timer */}
              <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
                {resendTimer > 0 ? (
                  <span>
                    Resend code in <strong className="text-amber-400 font-mono">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSending}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
                    <span>Resend code</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => submitVerification(otpDigits.join(''))}
                disabled={isVerifying || otpDigits.some((d) => d === '')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-950/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify &amp; Continue</span>
                )}
              </button>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300 underline"
                >
                  &larr; Change email address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
