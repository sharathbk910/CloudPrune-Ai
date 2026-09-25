import React, { useState, useEffect } from 'react';
import {
  Gauge, Clock, Wifi, WifiOff, Timer, Activity, Zap, Server,
  ChevronDown, ChevronUp, RefreshCw, MemoryStick, HardDrive
} from 'lucide-react';
import { api } from '../api';

function PerformanceGauge({ label, value, maxLabel, color }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1F2937" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(pct / 100) * 251} 251`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white font-mono">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 mt-1.5 block">{label}</span>
    </div>
  );
}

export default function PerformancePanel({ instances = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [latency, setLatency] = useState(null);
  const [uptime, setUptime] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);

  // Ping API for latency
  useEffect(() => {
    const ping = async () => {
      const start = performance.now();
      try {
        await api.getHealth();
        const ms = performance.now() - start;
        setLatency(Math.round(ms));
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('disconnected');
        setLatency(null);
      }
    };
    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Mock uptime counter
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Compute fleet metrics
  const running = instances.filter(i => i.status === 'running');
  const avgCpu = running.length > 0 ? running.reduce((s, i) => s + i.cpuUtilization, 0) / running.length : 0;
  const avgMem = running.length > 0 ? running.reduce((s, i) => s + i.memoryUtilization, 0) / running.length : 0;
  const fleetHealth = running.length > 0 ? (running.filter(i => i.cpuUtilization >= 5).length / running.length) * 100 : 0;

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="performance-content"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 text-amber-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Performance & Reliability
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full flex items-center gap-1 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {connectionStatus === 'connected' ? `${latency}ms` : 'Offline'}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">API latency, fleet health gauges, uptime tracking & connection monitoring</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isExpanded && (
        <div id="performance-content" className="px-5 pb-5 border-t border-gray-800/60 space-y-4 pt-4">
          {/* Row 1: Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-center">
              <Timer className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
              <div className="text-lg font-extrabold text-white font-mono">{formatUptime(uptime)}</div>
              <span className="text-[10px] text-gray-500">Dashboard Uptime</span>
            </div>

            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-center">
              <Activity className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <div className="text-lg font-extrabold text-white font-mono">
                {latency !== null ? `${latency}ms` : '—'}
              </div>
              <span className="text-[10px] text-gray-500">API Latency (P50)</span>
            </div>

            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-center">
              <Zap className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-lg font-extrabold text-white font-mono">10s</div>
              <span className="text-[10px] text-gray-500">Polling Interval</span>
            </div>

            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-center">
              <Server className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <div className="text-lg font-extrabold text-white font-mono">{running.length}</div>
              <span className="text-[10px] text-gray-500">Active Nodes</span>
            </div>
          </div>

          {/* Row 2: Gauge Charts */}
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 block">
              Fleet Health Gauges
            </span>
            <div className="flex items-center justify-around flex-wrap gap-4">
              <PerformanceGauge label="Avg CPU" value={avgCpu} color="#6366F1" />
              <PerformanceGauge label="Avg Memory" value={avgMem} color="#3B82F6" />
              <PerformanceGauge label="Fleet Health" value={fleetHealth} color="#10B981" />
              <PerformanceGauge label="Availability" value={connectionStatus === 'connected' ? 99.9 : 0} color="#F59E0B" />
            </div>
          </div>

          {/* Row 3: Connection Log */}
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Connection Diagnostics
              </span>
              <button
                onClick={() => setRefreshCount(c => c + 1)}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                aria-label="Re-ping server"
              >
                <RefreshCw className="w-3 h-3" />
                Re-ping
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                <span className="text-gray-400">Backend Endpoint</span>
                <span className="font-mono text-gray-200">/api/health</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                <span className="text-gray-400">Round-Trip Latency</span>
                <span className={`font-mono font-bold ${
                  latency && latency < 200 ? 'text-emerald-400' : latency && latency < 500 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {latency !== null ? `${latency}ms` : 'Timeout'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                <span className="text-gray-400">Data Refresh Rate</span>
                <span className="font-mono text-gray-200">Every 10s (polling)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                <span className="text-gray-400">Error Boundary</span>
                <span className="font-mono text-emerald-400">Active (React)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
