import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingDown, PieChart, Globe, Activity, ChevronDown, ChevronUp,
  Download, Calendar, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';

// ─── Animated Sparkline (SVG) ─────────────────────────────────────
function Sparkline({ data, color = '#10B981', height = 48, label = '' }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${w},${height}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#grad-${label})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw"
        />
      </svg>
    </div>
  );
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────
function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1F2937" strokeWidth="10" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLen = pct * circumference;
          const dashOffset = -(cumulative / total) * circumference;
          cumulative += seg.value;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-lg font-extrabold text-white font-mono">${total.toFixed(0)}</span>
        <span className="text-[9px] text-gray-500">total/mo</span>
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────
function HorizontalBar({ label, value, maxValue, color, suffix = '%' }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="font-mono text-gray-200">{value.toFixed(1)}{suffix}</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Analytics Panel ─────────────────────────────────────────
export default function AnalyticsPanel({ instances = [], metrics = null }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Generate realistic mock time-series data
  const costTrendData = useMemo(() => {
    const base = metrics?.totalMonthlySpend || 2000;
    const periods = { '7d': 7, '30d': 30, '90d': 12 };
    const len = periods[selectedPeriod] || 7;
    return Array.from({ length: len }, (_, i) => {
      const noise = (Math.sin(i * 0.8) * 0.15 + Math.random() * 0.1 - 0.05);
      return +(base * (1 + noise - i * 0.01)).toFixed(2);
    });
  }, [metrics, selectedPeriod]);

  const savingsTrendData = useMemo(() => {
    const base = metrics?.totalSavingsRealized || 500;
    return Array.from({ length: 7 }, (_, i) =>
      +(base * (0.3 + i * 0.1 + Math.random() * 0.1)).toFixed(2)
    );
  }, [metrics]);

  // Compute utilization distribution
  const running = instances.filter(i => i.status === 'running');
  const avgCpu = running.length > 0 ? running.reduce((s, i) => s + i.cpuUtilization, 0) / running.length : 0;
  const avgMem = running.length > 0 ? running.reduce((s, i) => s + i.memoryUtilization, 0) / running.length : 0;
  const zombieCount = running.filter(i => i.cpuUtilization < 5).length;
  const healthyCount = running.filter(i => i.cpuUtilization >= 5).length;
  const terminated = instances.filter(i => i.status === 'terminated').length;

  // Donut segments for cost by environment
  const prodCost = instances.filter(i => i.tags?.some(t => t.includes('prod')) && i.status === 'running')
    .reduce((s, i) => s + i.monthlyCost, 0);
  const stagingCost = instances.filter(i => i.tags?.some(t => t.includes('staging')) && i.status === 'running')
    .reduce((s, i) => s + i.monthlyCost, 0);
  const devCost = instances.filter(i => !i.tags?.some(t => t.includes('prod') || t.includes('staging')) && i.status === 'running')
    .reduce((s, i) => s + i.monthlyCost, 0);

  const donutSegments = [
    { label: 'Production', value: prodCost, color: '#10B981' },
    { label: 'Staging', value: stagingCost, color: '#6366F1' },
    { label: 'Dev / Other', value: devCost, color: '#F59E0B' }
  ];

  // Region distribution
  const regionMap = {};
  running.forEach(i => {
    regionMap[i.region] = (regionMap[i.region] || 0) + 1;
  });
  const regionEntries = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  const maxRegionCount = Math.max(...Object.values(regionMap), 1);

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'ID,Name,Type,Region,Status,CPU%,Memory%,Monthly Cost,Tags\n';
    const rows = instances.map(i =>
      `${i.id},"${i.name}",${i.type},${i.region},${i.status},${i.cpuUtilization},${i.memoryUtilization},${i.monthlyCost},"${(i.tags || []).join('; ')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudprune_infrastructure_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!metrics) return null;

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="analytics-content"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Infrastructure Analytics & Cost Intelligence
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Live
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Cost trends, utilization heatmaps, and environment breakdowns</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleExportCSV(); }}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Export infrastructure data as CSV"
            aria-label="Export infrastructure data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div id="analytics-content" className="px-5 pb-6 space-y-6 border-t border-gray-800/60">
          {/* Period Selector */}
          <div className="flex items-center gap-2 pt-4">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-[11px]">
              {['7d', '30d', '90d'].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedPeriod === p ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  aria-label={`View ${p} period`}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Sparkline Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cost Trend */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
                  Cloud Spend Trend
                </span>
                <span className="text-xs font-mono text-indigo-300 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                  -4.2%
                </span>
              </div>
              <Sparkline data={costTrendData} color="#6366F1" height={56} label="cost" />
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500 font-mono">
                <span>Start: ${costTrendData[0]?.toFixed(0)}</span>
                <span>Current: ${costTrendData[costTrendData.length - 1]?.toFixed(0)}</span>
              </div>
            </div>

            {/* Savings Trend */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Cumulative Savings
                </span>
                <span className="text-xs font-mono text-emerald-300 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  +18.7%
                </span>
              </div>
              <Sparkline data={savingsTrendData} color="#10B981" height={56} label="savings" />
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500 font-mono">
                <span>Week 1: ${savingsTrendData[0]?.toFixed(0)}</span>
                <span>Now: ${savingsTrendData[savingsTrendData.length - 1]?.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Donut + Utilization + Region */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cost by Environment Donut */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex flex-col items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5 self-start">
                <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                Cost by Environment
              </span>
              <DonutChart segments={donutSegments} size={120} />
              <div className="mt-3 space-y-1.5 w-full">
                {donutSegments.map(seg => (
                  <div key={seg.label} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-gray-300">{seg.label}</span>
                    </span>
                    <span className="font-mono text-gray-200">${seg.value.toFixed(0)}/mo</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Utilization Distribution */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Fleet Utilization
              </span>
              <div className="space-y-3 mt-3">
                <HorizontalBar label="Avg CPU Load" value={avgCpu} maxValue={100} color="#6366F1" />
                <HorizontalBar label="Avg Memory" value={avgMem} maxValue={100} color="#3B82F6" />
                <HorizontalBar label="Healthy Instances" value={healthyCount} maxValue={running.length || 1} color="#10B981" suffix={` / ${running.length}`} />
                <HorizontalBar label="Zombie (< 5% CPU)" value={zombieCount} maxValue={running.length || 1} color="#EF4444" suffix={` / ${running.length}`} />
                <HorizontalBar label="Terminated" value={terminated} maxValue={instances.length || 1} color="#6B7280" suffix={` / ${instances.length}`} />
              </div>
            </div>

            {/* Region Distribution */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                Region Distribution
              </span>
              <div className="space-y-2.5 mt-3">
                {regionEntries.length > 0 ? regionEntries.map(([region, count]) => (
                  <div key={region} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-300 flex items-center gap-1.5 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {region}
                      </span>
                      <span className="text-gray-200 font-mono">{count} instance{count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${(count / maxRegionCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-gray-500 italic">No running instances</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
