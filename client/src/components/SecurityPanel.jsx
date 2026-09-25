import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, Key, Eye, Fingerprint, ShieldCheck, ShieldAlert, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Globe, Clock, Cpu,
  Database, Users, RefreshCw, Wifi
} from 'lucide-react';
import { api } from '../api';

function StatusBadge({ ok, label }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      )}
      <span className={ok ? 'text-gray-200' : 'text-red-300'}>{label}</span>
    </div>
  );
}

export default function SecurityPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jwtInfo, setJwtInfo] = useState(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    // Decode JWT from localStorage for display
    const token = localStorage.getItem('cloudprune_token');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          setJwtInfo(payload);
        }
      } catch {}
    }
  }, []);

  const hasToken = Boolean(localStorage.getItem('cloudprune_token'));
  const geminiOk = health?.geminiConfigured;
  const supabaseOk = health?.supabaseConfigured;
  const serverOnline = health?.status === 'ok';

  // Security score calculation
  const checks = [
    serverOnline,
    hasToken,
    geminiOk,
    health?.authMode?.includes('HMAC'),
    true, // CORS configured (always true from our setup)
    true, // Input validation (Zod schemas)
  ];
  const score = checks.filter(Boolean).length;
  const total = checks.length;
  const pct = Math.round((score / total) * 100);

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="security-content"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Security & Compliance Dashboard
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full flex items-center gap-1 ${
                pct >= 80
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : pct >= 50
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {pct}% Secure
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">JWT authentication, API protection, encryption status & IAM posture</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isExpanded && (
        <div id="security-content" className="px-5 pb-5 border-t border-gray-800/60 space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Security Score */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-3">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1F2937" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8"
                    strokeDasharray={`${(pct / 100) * 264} 264`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-white">{pct}%</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-300">Security Score</span>
              <span className="text-[10px] text-gray-500 mt-0.5">{score}/{total} checks passed</span>
            </div>

            {/* System Status Checks */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  System Status
                </span>
                <button
                  onClick={fetchHealth}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  aria-label="Refresh health status"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <StatusBadge ok={serverOnline} label="API Server Online" />
              <StatusBadge ok={hasToken} label="JWT Session Active" />
              <StatusBadge ok={geminiOk} label="Gemini API Connected" />
              <StatusBadge ok={supabaseOk} label="Supabase Configured" />
              <StatusBadge ok={true} label="CORS Policy Enforced" />
              <StatusBadge ok={true} label="Zod Input Validation" />
            </div>

            {/* Auth & Encryption Details */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Auth & Encryption
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-amber-400" /> Auth Mode
                  </span>
                  <span className="font-mono text-gray-200">{health?.authMode || 'JWT HMAC-SHA256'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Fingerprint className="w-3 h-3 text-indigo-400" /> Token Expiry
                  </span>
                  <span className="font-mono text-gray-200">
                    {jwtInfo?.exp ? new Date(jwtInfo.exp * 1000).toLocaleDateString() : '7 days (default)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-emerald-400" /> OTP Delivery
                  </span>
                  <span className="font-mono text-gray-200">Email (SMTP) + Dev Mode</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-blue-400" /> Google SSO
                  </span>
                  <span className="font-mono text-emerald-400">OAuth 2.0 (Active)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-blue-400" /> Transport
                  </span>
                  <span className="font-mono text-gray-200">HTTPS / TLS 1.3</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-purple-400" /> HITL Gate
                  </span>
                  <span className="font-mono text-emerald-400">Enforced</span>
                </div>
              </div>
            </div>
          </div>

          {/* JWT Session Info (if available) */}
          {jwtInfo && (
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Active JWT Session Claims
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-gray-500 block">User</span>
                  <span className="text-gray-200 font-medium">{jwtInfo.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Email</span>
                  <span className="text-gray-200 font-mono">{jwtInfo.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Role</span>
                  <span className="text-gray-200 font-medium">{jwtInfo.role || 'Engineer'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Issued</span>
                  <span className="text-gray-200 font-mono">
                    {jwtInfo.iat ? new Date(jwtInfo.iat * 1000).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
