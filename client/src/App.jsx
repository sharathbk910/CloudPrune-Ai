import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import MetricsBar from './components/MetricsBar';
import InfrastructureTable from './components/InfrastructureTable';
import AuditPanel from './components/AuditPanel';
import AuditResultsModal from './components/AuditResultsModal';
import AuditLogDrawer from './components/AuditLogDrawer';
import AddInstanceModal from './components/AddInstanceModal';
import AnalyticsPanel from './components/AnalyticsPanel';
import SecurityPanel from './components/SecurityPanel';
import PerformancePanel from './components/PerformancePanel';
import DatabasePanel from './components/DatabasePanel';
import { SidebarNav, KeyboardShortcutsModal, ErrorBoundary } from './components/NavigationShell';
import AIChatWidget from './components/AIChatWidget';
import { ShieldCheck, Cloud, Terminal, Sparkles, Check, AlertCircle, Plus, Keyboard } from 'lucide-react';

function AppContent() {
  const [instances, setInstances] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [flaggedMap, setFlaggedMap] = useState({});
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStepText, setAuditStepText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminatingIds, setTerminatingIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [activeSection, setActiveSection] = useState('metrics');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Section refs for scrolling
  const sectionRefs = {
    metrics: useRef(null),
    audit: useRef(null),
    analytics: useRef(null),
    infrastructure: useRef(null),
    security: useRef(null),
    performance: useRef(null),
    database: useRef(null)
  };

  // Show temporary toast message
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // Initial load and polling
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [instRes, metricsRes, logsRes] = await Promise.all([
        api.getInstances(),
        api.getMetrics(),
        api.getAuditLogs()
      ]);
      setInstances(instRes.instances || []);
      setMetrics(metricsRes.metrics || null);
      setAuditLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Error fetching telemetry data:', err);
      if (isInitial) {
        showToast('Connecting to backend telemetry API...', 'info');
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [loadData]);

  // Navigate to section via sidebar
  const handleNavigate = useCallback((sectionId) => {
    setActiveSection(sectionId);
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Number keys 1-7 for section navigation
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 7) {
          const sections = ['metrics', 'audit', 'analytics', 'infrastructure', 'security', 'performance', 'database'];
          handleNavigate(sections[num - 1]);
          return;
        }
      }

      // Ctrl+K: Toggle shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Ctrl+Shift+A: Run audit (guarded against concurrent runs)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (!isAuditing) {
          handleRunAudit();
        }
        return;
      }

      // Ctrl+Shift+N: Add instance
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setIsAddModalOpen(true);
        return;
      }

      // Escape: Close modals (guarded against interrupting active termination)
      if (e.key === 'Escape') {
        if (!isTerminating) {
          setIsModalOpen(false);
          setIsDrawerOpen(false);
          setIsAddModalOpen(false);
          setShowShortcuts(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNavigate, isAuditing, isTerminating]);

  // Checkbox toggle
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all running
  const handleSelectAll = () => {
    const running = instances.filter(i => i.status === 'running').map(i => i.id);
    if (selectedIds.length === running.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(running);
    }
  };

  // Run AI Audit with animated steps
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditStepText('Scanning compute nodes...');

    setTimeout(() => {
      setAuditStepText('Analyzing utilization patterns...');
    }, 1000);

    setTimeout(() => {
      setAuditStepText('Calculating potential savings...');
    }, 2000);

    try {
      const res = await api.runAudit();
      if (res.success && res.audit) {
        setAuditData(res.audit);
        const map = {};
        res.audit.flaggedInstances.forEach(f => {
          map[f.id] = f;
        });
        setFlaggedMap(map);
        setSelectedIds(res.audit.flaggedInstances.map(f => f.id));
        setIsModalOpen(true);
        showToast(`Audit complete: ${res.audit.flaggedInstances.length} zombie resources detected!`);
      }
    } catch (err) {
      console.error(err);
      showToast('Audit failed: ' + err.message, 'error');
    } finally {
      setIsAuditing(false);
      setAuditStepText('');
      loadData();
    }
  };

  // Approve & Terminate with Optimistic Updates & Safe Rollback
  const handleApproveTerminate = async (idsToTerminate) => {
    const targetIds = idsToTerminate || selectedIds;
    if (!targetIds || targetIds.length === 0) return;

    // 1. Snapshot previous state for rollback
    const prevInstances = [...instances];
    const prevMetrics = metrics ? { ...metrics } : null;
    const prevFlaggedMap = { ...flaggedMap };
    const prevAuditData = auditData ? { ...auditData } : null;

    // 2. Optimistic UI update: instantly mark workloads as terminated
    setInstances(prev =>
      prev.map(inst =>
        targetIds.includes(inst.id) ? { ...inst, status: 'terminated' } : inst
      )
    );

    // Optimistically update metrics
    if (metrics) {
      const terminatedWorkloads = instances.filter(i => targetIds.includes(i.id) && i.status === 'running');
      const monthlySavings = terminatedWorkloads.reduce((sum, i) => sum + (i.monthlyCost || 0), 0);
      setMetrics(prev => ({
        ...prev,
        activeServers: Math.max(0, (prev.activeServers || 0) - terminatedWorkloads.length),
        terminatedServers: (prev.terminatedServers || 0) + terminatedWorkloads.length,
        zombieServers: Math.max(0, (prev.zombieServers || 0) - terminatedWorkloads.length),
        totalMonthlySpend: Math.max(0, (prev.totalMonthlySpend || 0) - monthlySavings),
        estimatedMonthlyWaste: Math.max(0, (prev.estimatedMonthlyWaste || 0) - monthlySavings),
        totalSavingsRealized: (prev.totalSavingsRealized || 0) + monthlySavings
      }));
    }

    // Remove from flagged map
    const newMap = { ...flaggedMap };
    targetIds.forEach(id => delete newMap[id]);
    setFlaggedMap(newMap);

    // Prune terminated instances from auditData so modal reopen never shows stale data
    if (auditData?.flaggedInstances) {
      const remainingFlagged = auditData.flaggedInstances.filter(f => !targetIds.includes(f.id));
      const remainingWaste = remainingFlagged.reduce((sum, f) => sum + (f.estimatedMonthlySavings || 0), 0);
      setAuditData({
        ...auditData,
        flaggedInstances: remainingFlagged,
        totalMonthlyWaste: remainingWaste
      });
    }

    setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
    setIsModalOpen(false);
    setIsTerminating(true);
    setTerminatingIds(targetIds);

    try {
      const res = await api.terminateInstances(
        targetIds,
        'Human-in-the-loop verified termination via CloudPrune AI'
      );
      if (res.success) {
        showToast(
          `Decommissioned ${res.result?.terminatedCount || targetIds.length} instance(s)! Added $${(res.result?.monthlySavingsAdded || 0).toFixed(2)}/mo to realized savings.`,
          'success'
        );
        await loadData(false);
      }
    } catch (err) {
      console.error('Termination failed:', err);
      // 3. Rollback state to exact snapshot
      setInstances(prevInstances);
      setMetrics(prevMetrics);
      setFlaggedMap(prevFlaggedMap);
      setAuditData(prevAuditData);
      showToast(err.message || 'Termination failed. Restored workload state.', 'error');
    } finally {
      setIsTerminating(false);
      setTerminatingIds([]);
    }
  };

  // Quick single instance prune
  const handleQuickTerminate = async (id) => {
    const inst = instances.find(i => i.id === id);
    const displayName = inst ? `${inst.name} (${inst.type})` : 'this workload';
    if (window.confirm(`Are you sure you want to decommission ${displayName}?`)) {
      await handleApproveTerminate([id]);
    }
  };

  // Reset database seeds
  const handleResetData = async () => {
    try {
      const res = await api.resetDatabase();
      if (res.success) {
        setInstances(res.instances);
        setMetrics(res.metrics);
        setFlaggedMap({});
        setSelectedIds([]);
        setAuditData(null);
        showToast('Infrastructure state reset to 10 seeded instances.');
      }
    } catch (err) {
      console.error('Reset failed:', err);
      showToast('Reset failed: ' + (err.message || 'Server error'), 'error');
    }
  };

  // Add new cloud workload instance (no deceptive mock on error)
  const handleAddInstance = async (instanceData) => {
    try {
      const res = await api.createInstance(instanceData);
      if (res.success && res.instance) {
        setInstances(prev => [res.instance, ...prev]);
        showToast(`Instance "${res.instance.name}" provisioned and monitored!`, 'success');
        await loadData(false);
      }
    } catch (err) {
      console.error('Error creating instance:', err);
      showToast('Failed to deploy workload: ' + (err.message || 'API error'), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Accessibility: Skip to Content */}
      <a href="#main-content" className="skip-to-content" tabIndex={0}>
        Skip to main content
      </a>

      {/* Toast Notification - Elevated to z-[100] above modals */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] animate-slideDown" role="alert" aria-live="polite">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-medium backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-950/90 text-red-200 border-red-500/50'
                : toast.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <SidebarNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onRunAudit={handleRunAudit}
        isAuditing={isAuditing}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Top Navbar */}
      <header className="border-b border-gray-800/80 bg-gray-950/60 backdrop-blur-xl sticky top-0 z-40" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between sm:ml-14 ml-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-mono">
                  CloudPrune<span className="text-emerald-400 font-sans">.AI</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400 -mt-0.5">Autonomous FinOps Agent</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Link back to Landing page */}
            <a
              href="/"
              className="hidden lg:flex px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors items-center gap-1.5"
              title="Return to Landing Page & Overview"
            >
              <span>Landing Page</span>
            </a>

            {/* Keyboard Shortcuts Trigger */}
            <button
              id="keyboard-shortcuts-trigger"
              onClick={() => setShowShortcuts(true)}
              className="hidden sm:flex px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors items-center gap-1.5"
              aria-label="Open keyboard shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Ctrl+K</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950 active:scale-95"
              aria-label="Add new cloud instance"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Instance</span>
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              aria-label="Open audit trail"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Audit Trail</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:ml-14 ml-0 pb-28 sm:pb-12"
        role="main"
        aria-label="CloudPrune AI Dashboard"
      >
        {/* Hero Banner / Intro */}
        <div className="mb-8" ref={sectionRefs.metrics}>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Autonomous Cloud Resource Pruning
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Real-time telemetry ingestion with Google Gemini reasoning to identify orphaned workloads, idle dev environments, and rogue compute — with strict human-in-the-loop approval.
          </p>
        </div>

        {/* 1. Metrics Overview */}
        <section aria-label="Metrics overview">
          <MetricsBar
            metrics={metrics}
            isLoading={isLoading}
            onOpenLogs={() => setIsDrawerOpen(true)}
          />
        </section>

        {/* 2. AI Audit Control Panel */}
        <section ref={sectionRefs.audit} aria-label="AI audit control">
          <AuditPanel
            isAuditing={isAuditing}
            auditStepText={auditStepText}
            onRunAudit={handleRunAudit}
            selectedCount={selectedIds.length}
            onApproveTerminate={() => setIsModalOpen(true)}
            onResetData={handleResetData}
            hasAuditResults={Boolean(auditData)}
            onViewResults={() => setIsModalOpen(true)}
          />
        </section>

        {/* 3. Analytics & Cost Intelligence Graphs */}
        <section ref={sectionRefs.analytics} aria-label="Analytics and graphs">
          <AnalyticsPanel instances={instances} metrics={metrics} />
        </section>

        {/* 4. Live Infrastructure Table */}
        <section ref={sectionRefs.infrastructure} aria-label="Infrastructure telemetry">
          <InfrastructureTable
            instances={instances}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            flaggedMap={flaggedMap}
            onQuickTerminate={handleQuickTerminate}
            terminatingIds={terminatingIds}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </section>

        {/* 5. Security & Compliance Dashboard */}
        <section ref={sectionRefs.security} aria-label="Security and compliance">
          <SecurityPanel />
        </section>

        {/* 6. Performance & Reliability */}
        <section ref={sectionRefs.performance} aria-label="Performance and reliability">
          <PerformancePanel instances={instances} />
        </section>

        {/* 7. Database & Storage Layer */}
        <section ref={sectionRefs.database} aria-label="Database and storage">
          <DatabasePanel instances={instances} auditLogs={auditLogs} />
        </section>

        {/* Footer */}
        <footer className="mt-12 pb-8 border-t border-gray-800/60 pt-6" role="contentinfo">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span>CloudPrune AI — Autonomous FinOps Agent v2.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Powered by Gemini 3.8 Flash
              </span>
              <span>•</span>
              <span>Built for Agentic AI Hackathon 2026</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Add Instance Modal */}
      <AddInstanceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddInstance={handleAddInstance}
      />

      {/* Audit Results Modal */}
      <AuditResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        auditData={auditData}
        instances={instances}
        onApproveAndTerminate={handleApproveTerminate}
        isTerminating={isTerminating}
      />

      {/* Audit Logs Drawer */}
      <AuditLogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        logs={auditLogs}
        instances={instances}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Floating Gemini AI FinOps Assistant */}
      <AIChatWidget instances={instances} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
