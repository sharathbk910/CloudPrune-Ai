import React from 'react';
import { DollarSign, AlertTriangle, Server, CheckCircle2, TrendingDown } from 'lucide-react';

export default function MetricsBar({ metrics, isLoading, onOpenLogs }) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-5 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-gray-800 rounded" />
              <div className="w-8 h-8 rounded-lg bg-gray-800" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-8 w-36 bg-gray-800 rounded" />
              <div className="h-3 w-48 bg-gray-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Monthly Spend */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-5 shadow-lg transition-all duration-300 hover:border-gray-700 hover:shadow-indigo-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Monthly Spend</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-white font-mono">
            ${metrics.totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-xs text-gray-500 mt-1">Across {metrics.activeServers + metrics.terminatedServers} total monitored nodes</p>
        </div>
      </div>

      {/* Estimated Monthly Waste */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-red-900/30 rounded-xl p-5 shadow-lg transition-all duration-300 hover:border-red-500/50 hover:shadow-red-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Estimated Waste (AI Detected)</span>
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-red-400 font-mono">
            ${metrics.estimatedMonthlyWaste.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-xs text-red-400/80 mt-1">
            {metrics.zombieServers} zombie/idle instances burning budget
          </p>
        </div>
      </div>

      {/* Active Servers vs Zombies */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-5 shadow-lg transition-all duration-300 hover:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Infrastructure Health</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">
            {metrics.activeServers}
          </span>
          <span className="text-sm text-gray-400">Active</span>
          <span className="text-gray-600 font-mono">/</span>
          <span className="text-xl font-bold text-amber-400 font-mono">
            {metrics.zombieServers}
          </span>
          <span className="text-xs text-amber-400">Zombies</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{metrics.terminatedServers} instances safely decommissioned</p>
      </div>

      {/* Total Savings Realized */}
      <div className="bg-gradient-to-br from-emerald-950/40 to-gray-900/80 backdrop-blur-md border border-emerald-500/30 rounded-xl p-5 shadow-lg transition-all duration-300 hover:border-emerald-500/60 hover:shadow-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Savings Realized</span>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-emerald-300 font-mono">
            ${metrics.totalSavingsRealized.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          {onOpenLogs && (
            <button
              onClick={onOpenLogs}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              Audit Log →
            </button>
          )}
        </div>
        <p className="text-xs text-emerald-400/70 mt-1">Cumulative recurring monthly cost reduction</p>
      </div>
    </div>
  );
}
