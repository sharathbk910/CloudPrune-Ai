import React from 'react';
import { Sparkles, Loader2, Play, Trash2, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

export default function AuditPanel({
  isAuditing,
  auditStepText,
  onRunAudit,
  selectedCount,
  onApproveTerminate,
  onResetData,
  hasAuditResults,
  onViewResults
}) {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900 border border-gray-800 rounded-xl p-5 mb-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left: Info & Description */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Autonomous FinOps Agent Control</h3>
            <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Gemini 3.8 Flash Connected
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            CloudPrune monitors telemetry across all VPC nodes, detects zombie workloads via structured LLM reasoning, and submits actionable recommendations for human approval.
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Reset Database */}
        <button
          onClick={onResetData}
          className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors flex items-center gap-1.5"
          title="Reset instances to initial 10 seeded states"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Seeds</span>
        </button>

        {/* View Previous Audit Result */}
        {hasAuditResults && (
          <button
            onClick={onViewResults}
            className="px-3.5 py-2 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>View Analysis Report</span>
          </button>
        )}

        {/* Human-in-the-Loop Terminate Button */}
        {selectedCount > 0 && (
          <button
            onClick={onApproveTerminate}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/40 rounded-lg shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 animate-bounce"
          >
            <Trash2 className="w-4 h-4" />
            <span>Approve & Terminate ({selectedCount}) Instances</span>
          </button>
        )}

        {/* Run AI Audit Button */}
        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 ${
            isAuditing
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 text-white hover:opacity-95 hover:shadow-indigo-500/25 active:scale-95'
          }`}
        >
          {isAuditing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="font-mono">{auditStepText || "Analyzing telemetry with Gemini..."}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run AI FinOps Audit</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
