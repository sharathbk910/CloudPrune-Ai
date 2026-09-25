import React, { useState } from 'react';
import {
  LayoutDashboard, BarChart3, Shield, Gauge, Database, Terminal, Keyboard,
  ChevronLeft, ChevronRight, X, Sparkles, Cloud, Plus, RefreshCw,
  HelpCircle, Loader2
} from 'lucide-react';

export function SidebarNav({ activeSection, onNavigate, onRunAudit, isAuditing = false, onOpenAddModal, onResetData }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const sections = [
    { id: 'metrics', label: 'Metrics Overview', shortLabel: 'Metrics', icon: LayoutDashboard, shortcut: '1' },
    { id: 'audit', label: 'AI Audit Control', shortLabel: 'Audit', icon: Sparkles, shortcut: '2' },
    { id: 'analytics', label: 'Analytics & Graphs', shortLabel: 'Charts', icon: BarChart3, shortcut: '3' },
    { id: 'infrastructure', label: 'Infrastructure', shortLabel: 'Nodes', icon: Cloud, shortcut: '4' },
    { id: 'security', label: 'Security', shortLabel: 'Security', icon: Shield, shortcut: '5' },
    { id: 'performance', label: 'Performance', shortLabel: 'Health', icon: Gauge, shortcut: '6' },
    { id: 'database', label: 'Database', shortLabel: 'Database', icon: Database, shortcut: '7' }
  ];

  const quickActions = [
    { label: 'Run AI Audit', icon: Sparkles, action: onRunAudit, color: 'text-indigo-400' },
    { label: 'Add Instance', icon: Plus, action: onOpenAddModal, color: 'text-emerald-400' },
    { label: 'Reset Seeds', icon: RefreshCw, action: onResetData, color: 'text-gray-400' }
  ];

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <nav
        className={`hidden sm:flex fixed left-0 top-16 bottom-0 z-30 bg-gray-950/95 backdrop-blur-xl border-r border-gray-800 flex-col transition-all duration-300 ${
          isCollapsed ? 'w-14' : 'w-52'
        }`}
        role="navigation"
        aria-label="Desktop main navigation"
      >
        {/* Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2.5 mx-auto mt-2 text-gray-500 hover:text-white transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Section Links */}
        <div className="flex-1 px-2 mt-2 space-y-1 overflow-y-auto">
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => onNavigate(sec.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
                title={isCollapsed ? sec.label : undefined}
                aria-label={sec.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{sec.label}</span>
                    <kbd className="text-[9px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded font-mono border border-gray-700">
                      {sec.shortcut}
                    </kbd>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-2 pb-2 space-y-1 border-t border-gray-800 pt-2 mt-2">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider px-2 block mb-1">Quick Actions</span>
            {quickActions.map(act => {
              const Icon = act.icon;
              const isAuditAction = act.label === 'Run AI Audit';
              const isDisabled = isAuditAction && isAuditing;
              return (
                <button
                  key={act.label}
                  onClick={isDisabled ? undefined : act.action}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                    isDisabled
                      ? 'text-gray-600 cursor-not-allowed bg-gray-900/40'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                  aria-label={act.label}
                >
                  {isAuditAction && isAuditing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${act.color}`} />
                  )}
                  <span>{isAuditAction && isAuditing ? 'Auditing...' : act.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Keyboard hint */}
        <div className="px-2 pb-3 border-t border-gray-800 pt-2">
          <button
            onClick={() => {
              const el = document.getElementById('keyboard-shortcuts-trigger');
              if (el) el.click();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="w-3 h-3" />
            {!isCollapsed && <span>Ctrl+K Shortcuts</span>}
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (<640px) */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 px-2 py-1.5 flex items-center justify-around shadow-2xl"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => onNavigate(sec.id)}
              className={`flex flex-col items-center justify-center px-1.5 py-1 rounded-lg transition-colors ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label={sec.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">{sec.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

// ─── Keyboard Shortcuts Modal ─────────────────────────────────────
export function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['1'], desc: 'Jump to Metrics Overview' },
    { keys: ['2'], desc: 'Jump to AI Audit Control' },
    { keys: ['3'], desc: 'Jump to Analytics & Graphs' },
    { keys: ['4'], desc: 'Jump to Infrastructure Nodes' },
    { keys: ['5'], desc: 'Jump to Security & Compliance' },
    { keys: ['6'], desc: 'Jump to Performance & Telemetry' },
    { keys: ['7'], desc: 'Jump to Database Layer' },
    { keys: ['Ctrl', 'K'], desc: 'Toggle Shortcuts Panel' },
    { keys: ['Ctrl', 'Shift', 'A'], desc: 'Execute AI FinOps Audit' },
    { keys: ['Ctrl', 'Shift', 'N'], desc: 'Provision New Instance' },
    { keys: ['Esc'], desc: 'Dismiss Active Modal / Drawer' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-gray-400">Power-user hotkeys for swift navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-800/40 last:border-0">
              <span className="text-gray-300 font-medium">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <span className="text-gray-600 text-[10px]">+</span>}
                    <kbd className="px-2 py-0.5 bg-gray-800 text-gray-200 border border-gray-700 rounded text-[10px] font-mono min-w-[24px] text-center shadow-sm">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-gray-950/60 border-t border-gray-800 text-center">
          <span className="text-[11px] text-gray-500">Press <kbd className="text-gray-400 font-mono">Esc</kbd> anytime to close dialogs</span>
        </div>
      </div>
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-8">
          <div className="bg-gray-900 border border-red-800/40 rounded-2xl p-8 max-w-lg text-center shadow-2xl">
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 w-fit mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-400 mb-4">
              An unexpected error occurred in the CloudPrune dashboard. This has been logged for review.
            </p>
            <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-[10px] text-red-300 font-mono text-left overflow-auto max-h-32 mb-4">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-950"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
