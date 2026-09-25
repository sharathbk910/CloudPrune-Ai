import React from 'react';
import { X, Clock, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AuditLogDrawer({ isOpen, onClose, logs, instances = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">FinOps Audit Trail</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No termination audits recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {log.action}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-gray-300 font-sans">{log.details}</p>

                  {log.monthlySavingsClaimed > 0 && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-900 text-[11px]">
                      <span className="text-gray-400">Monthly Savings Added:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        +${log.monthlySavingsClaimed.toFixed(2)}/mo
                      </span>
                    </div>
                  )}

                  {log.instanceIds && (
                    <div className="text-[10px] text-gray-400 font-sans flex flex-wrap gap-1 mt-1">
                      {log.instanceIds.map(id => {
                        const inst = instances.find(i => i.id === id);
                        return (
                          <span key={id} className="bg-gray-900 text-gray-300 px-2 py-0.5 rounded border border-gray-800">
                            {inst ? inst.name : id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
