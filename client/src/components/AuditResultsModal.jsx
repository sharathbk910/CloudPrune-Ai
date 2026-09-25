import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle, Trash2, Shield, DollarSign, ArrowRight } from 'lucide-react';

export default function AuditResultsModal({
  isOpen,
  onClose,
  auditData,
  instances = [],
  onApproveAndTerminate,
  isTerminating
}) {
  if (!isOpen || !auditData) return null;

  const { executiveSummary, totalMonthlyWaste, actionPlan, flaggedInstances, source, model } = auditData;
  const [selectedIds, setSelectedIds] = useState(() => flaggedInstances.map(f => f.id));

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedSavings = flaggedInstances
    .filter(f => selectedIds.includes(f.id))
    .reduce((sum, f) => sum + f.estimatedMonthlySavings, 0);

  const handleApprove = () => {
    onApproveAndTerminate(selectedIds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Autonomous FinOps Audit Results</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Validated AI Analysis'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Structured telemetry audit validated via Zod schema</p>
            </div>
          </div>

          <button
            onClick={isTerminating ? undefined : onClose}
            disabled={isTerminating}
            className={`p-2 rounded-lg transition-colors ${
              isTerminating ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            aria-label="Close audit results dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Executive Summary</span>
            </h3>
            <p className="text-sm text-gray-200 leading-relaxed font-sans">{executiveSummary}</p>
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-red-400 uppercase font-semibold">Total Monthly Waste</span>
                <div className="text-2xl font-extrabold text-red-400 font-mono mt-1">
                  ${totalMonthlyWaste.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Flagged Instances</span>
                <div className="text-2xl font-bold text-white font-mono mt-1">
                  {flaggedInstances.length}
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 uppercase font-semibold">Selected for Termination</span>
                <div className="text-2xl font-extrabold text-emerald-300 font-mono mt-1">
                  ${selectedSavings.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Instances Selected</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {selectedIds.length} / {flaggedInstances.length}
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Recommended Action Plan
            </h3>
            <p className="text-xs text-gray-300 font-mono whitespace-pre-line leading-relaxed">
              {actionPlan}
            </p>
          </div>

          {/* Flagged Instances List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Flagged Zombie Candidates</span>
                <span className="text-xs text-gray-400 font-normal">
                  (Review and confirm before termination)
                </span>
              </h3>
              <div className="text-xs space-x-2">
                <button
                  onClick={() => setSelectedIds(flaggedInstances.map(f => f.id))}
                  className="text-indigo-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-600">•</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-gray-400 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {flaggedInstances.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                const inst = instances.find(i => i.id === item.id);
                const displayName = inst ? inst.name : (item.name || 'Flagged Workload');
                const instType = inst ? inst.type : '';
                const instRegion = inst ? inst.region : '';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                        : 'bg-gray-950/40 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded bg-gray-900 border-gray-700 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{displayName}</span>
                          {instType && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                              {instType}
                            </span>
                          )}
                          {instRegion && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                              {instRegion}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Confidence: {(item.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">{item.reason}</p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-xs text-gray-400 block">Est. Monthly Savings</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        +${item.estimatedMonthlySavings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-800 bg-gray-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-400">
            Human-in-the-loop verification required. No servers are terminated without explicit approval.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={isTerminating ? undefined : onClose}
              disabled={isTerminating}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                isTerminating ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'
              }`}
            >
              Cancel
            </button>

            <button
              onClick={handleApprove}
              disabled={selectedIds.length === 0 || isTerminating}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
                selectedIds.length === 0 || isTerminating
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-95'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {isTerminating
                  ? 'Terminating...'
                  : `Approve & Terminate [${selectedIds.length}] Instances`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
