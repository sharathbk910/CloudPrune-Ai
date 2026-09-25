'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Terminal,
  ShieldAlert,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  UserCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Mail,
  Database,
  BrainCircuit,
  Bot,
  DollarSign,
  Users,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  BarChart3,
  Zap,
  History,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LogEntry {
  id: string;
  timestamp: string;
  agent: 'DATA' | 'STRATEGY' | 'ACTION' | 'HITL' | 'SYSTEM';
  message: string;
  type: 'info' | 'warn' | 'success' | 'action' | 'critical';
}

interface AtRiskAccount {
  id: string;
  companyName: string;
  tier: string;
  mrr: number;
  churnRisk: number;
  loginDropPct: number;
  featureScore: number;
  unresolvedBugs: number;
  daysSinceActive: number;
  supportTickets: number;
  primaryContact: string;
  email: string;
  industry: string;
  contractRenewal: string;
  diagnosedCause: string;
  retentionOffer: string;
  riskCategory: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  strategyConfidence: number;
  estimatedSaveValue: number;
  emailSubject: string;
  emailBody: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISMISSED';
  processedAt: string;
}

interface AuditRecord {
  id: string;
  accountName: string;
  accountId: string;
  action: string;
  operator: string;
  timestamp: string;
  outcome: 'APPROVED' | 'DISMISSED' | 'DISPATCHED';
  mrr: number;
}

// ============================================================================
// SEED DATA (4 At-Risk Accounts)
// ============================================================================

const INITIAL_ACCOUNTS: AtRiskAccount[] = [
  {
    id: 'acc-9412',
    companyName: 'Apex Quant Capital',
    tier: 'Enterprise',
    mrr: 8450,
    churnRisk: 74.2,
    loginDropPct: 78.4,
    featureScore: 2.1,
    unresolvedBugs: 3,
    daysSinceActive: 18,
    supportTickets: 6,
    primaryContact: 'Sarah Jenkins (VP Trading Tech)',
    email: 'sarah.jenkins@apexquant.io',
    industry: 'FinTech / High-Frequency Ledger',
    contractRenewal: '2026-11-30',
    diagnosedCause: 'Technical friction with distributed query latency; support ticket unresolved 14 days. VP of Engineering expressed frustration in last QBR call.',
    retentionOffer: 'Complimentary 30-day VIP Support SLA credit ($1,200 value) & 1:1 Principal Architect pairing session.',
    riskCategory: 'CRITICAL',
    strategyConfidence: 0.94,
    estimatedSaveValue: 42588,
    emailSubject: "Optimizing Apex Quant Capital's Query Latency & Dedicated Architecture Support",
    emailBody: `Hi Sarah,

I'm reaching out because we value Apex Quant Capital's partnership deeply, and I wanted to personally address some friction points we've identified.

We understand how critical sub-second throughput is for Apex Quant Capital's infrastructure. Our engineering leadership has allocated dedicated resources to conduct a private performance audit.

Here's what we've arranged: Complimentary 30-day Enterprise VIP Support credit ($1,200 value) & 1:1 Architecture Audit with Principal Engineer.

Would 15 minutes this Thursday work for an executive sync?

Best regards,
CloudPrune AI Customer Engineering Swarm`,
    status: 'PENDING_APPROVAL',
    processedAt: '16:20:05.105'
  },
  {
    id: 'acc-7203',
    companyName: 'MedVault Health Systems',
    tier: 'Enterprise',
    mrr: 13000,
    churnRisk: 71.8,
    loginDropPct: 62.8,
    featureScore: 3.4,
    unresolvedBugs: 3,
    daysSinceActive: 12,
    supportTickets: 8,
    primaryContact: 'Dr. Raj Patel (CTO)',
    email: 'raj.patel@medvault.health',
    industry: 'HealthTech / HIPAA-Regulated',
    contractRenewal: '2027-01-31',
    diagnosedCause: 'Compliance-blocking technical gaps. SOC2 audit revealed logging API gaps blocking HIPAA certification renewal. CTO raised concerns directly with VP of Engineering.',
    retentionOffer: 'Dedicated 2-week compliance engineering sprint with Principal Security Architect, complimentary SOC2/HIPAA gap analysis report ($4,500 value), and 60-day Enterprise VIP Support SLA upgrade.',
    riskCategory: 'CRITICAL',
    strategyConfidence: 0.96,
    estimatedSaveValue: 90480,
    emailSubject: "MedVault Health Systems — Dedicated Compliance Engineering Sprint & HIPAA Remediation",
    emailBody: `Hi Dr. Patel,

I'm reaching out because we value MedVault Health Systems' partnership deeply, and I wanted to personally address some friction points we've identified.

We recognize that compliance certification is mission-critical for MedVault Health Systems. Our security engineering team has fast-tracked a dedicated remediation sprint.

Here's what we've arranged: Dedicated 2-week compliance engineering sprint with Principal Security Architect, complimentary SOC2/HIPAA gap analysis report ($4,500 value), and 60-day Enterprise VIP Support SLA upgrade.

Would 15 minutes this Thursday work for an executive sync?

Best regards,
CloudPrune AI Customer Engineering Swarm`,
    status: 'PENDING_APPROVAL',
    processedAt: '16:20:08.442'
  },
  {
    id: 'acc-8104',
    companyName: 'Veloce Logistics API',
    tier: 'Growth',
    mrr: 3200,
    churnRisk: 58.0,
    loginDropPct: 54.1,
    featureScore: 3.8,
    unresolvedBugs: 0,
    daysSinceActive: 9,
    supportTickets: 2,
    primaryContact: 'Devon Vance (Lead Platform SRE)',
    email: 'devon@veloce.io',
    industry: 'Logistics / Supply Chain SaaS',
    contractRenewal: '2026-09-15',
    diagnosedCause: 'Low feature utilization on Webhook Ingestion engine following recent team turnover. v2 migration never completed after 2 senior devs left.',
    retentionOffer: 'Custom 45-minute workflow migration workshop with Product Specialist, dedicated Slack channel for team Q&A, and 3 complimentary training seats.',
    riskCategory: 'HIGH',
    strategyConfidence: 0.87,
    estimatedSaveValue: 13440,
    emailSubject: "Custom Webhook Migration Workshop for Veloce Logistics",
    emailBody: `Hi Devon,

I'm reaching out because we value Veloce Logistics API's partnership deeply, and I wanted to personally address some friction points we've identified.

We noticed your team hasn't fully leveraged some of our most impactful features. We'd love to host a tailored workshop designed specifically for Veloce Logistics API's workflows.

Here's what we've arranged: Custom 45-minute workflow migration workshop with Product Specialist, dedicated Slack channel for team Q&A, and 3 complimentary training seats.

Would 15 minutes this Thursday work for an executive sync?

Best regards,
CloudPrune AI Customer Engineering Swarm`,
    status: 'PENDING_APPROVAL',
    processedAt: '16:20:11.287'
  },
  {
    id: 'acc-6550',
    companyName: 'BrightPath EdTech',
    tier: 'Starter',
    mrr: 2000,
    churnRisk: 55.2,
    loginDropPct: 48.5,
    featureScore: 4.2,
    unresolvedBugs: 0,
    daysSinceActive: 14,
    supportTickets: 1,
    primaryContact: 'Amanda Li (Dir. Digital Learning)',
    email: 'amanda.li@brightpath.edu',
    industry: 'EdTech / Learning Management',
    contractRenewal: '2026-12-31',
    diagnosedCause: 'Budget pressure from university fiscal year transition. Dean\'s office evaluating competing LMS platforms with lower sticker price.',
    retentionOffer: 'Custom ROI impact report showing platform value vs. alternatives, 20% loyalty incentive for annual commitment extension, and quarterly executive business review cadence.',
    riskCategory: 'MEDIUM',
    strategyConfidence: 0.83,
    estimatedSaveValue: 7200,
    emailSubject: "BrightPath EdTech — ROI Impact Report & Loyalty Incentive",
    emailBody: `Hi Amanda,

I'm reaching out because we value BrightPath EdTech's partnership deeply, and I wanted to personally address some friction points we've identified.

We've been monitoring usage patterns and want to ensure BrightPath EdTech is getting maximum value from the platform.

Here's what we've arranged: Custom ROI impact report showing platform value vs. alternatives, 20% loyalty incentive for annual commitment extension, and quarterly executive business review cadence.

Would 15 minutes this Thursday work for an executive sync?

Best regards,
CloudPrune AI Customer Engineering Swarm`,
    status: 'PENDING_APPROVAL',
    processedAt: '16:20:14.003'
  }
];

// ============================================================================
// INITIAL AUDIT TRAIL
// ============================================================================

const INITIAL_AUDIT_LOG: AuditRecord[] = [
  {
    id: 'aud-001',
    accountName: 'NexGen Robotics',
    accountId: 'acc-5510',
    action: 'Retention email dispatched — Dedicated engineering sprint + 15% renewal credit',
    operator: 'Elena Rostova',
    timestamp: '2026-09-23 14:22:08 UTC',
    outcome: 'APPROVED',
    mrr: 6200
  },
  {
    id: 'aud-002',
    accountName: 'CloudBridge Analytics',
    accountId: 'acc-4401',
    action: 'False positive — Account was migrating to new SSO provider (temporary login drop)',
    operator: 'Marcus Webb',
    timestamp: '2026-09-22 09:15:44 UTC',
    outcome: 'DISMISSED',
    mrr: 4100
  },
  {
    id: 'aud-003',
    accountName: 'Pinnacle Insurance Group',
    accountId: 'acc-3322',
    action: 'VIP support upgrade + Executive QBR scheduled — High compliance sensitivity',
    operator: 'Priya Nair',
    timestamp: '2026-09-20 16:48:31 UTC',
    outcome: 'APPROVED',
    mrr: 11500
  }
];

// ============================================================================
// SIMULATION LOG SEQUENCES
// ============================================================================

const SIMULATION_SEQUENCES: {agent: LogEntry['agent'], message: string, type: LogEntry['type'], delay: number}[][] = [
  // Wave 1: Data Agent scanning
  [
    { agent: 'DATA', message: 'Initiating deep telemetry anomaly scan across 482 active tenant accounts...', type: 'info', delay: 0 },
    { agent: 'DATA', message: 'Scanning region: us-east-1 (142 accounts)... us-west-2 (98 accounts)... eu-west-1 (242 accounts)...', type: 'info', delay: 800 },
    { agent: 'DATA', message: 'FLAGGED [CRITICAL]: MedVault Health Systems (acc-7203) | Risk: 71.8% | Login Drop: -62.8% | Unresolved: 3', type: 'critical', delay: 1500 },
    { agent: 'DATA', message: 'FLAGGED [HIGH]: Veloce Logistics API (acc-8104) | Risk: 58.0% | Login Drop: -54.1% | Feature Score: 3.8/10', type: 'warn', delay: 2200 },
    { agent: 'DATA', message: 'FLAGGED [MEDIUM]: BrightPath EdTech (acc-6550) | Risk: 55.2% | Login Drop: -48.5% | Days Inactive: 14', type: 'warn', delay: 2800 },
    { agent: 'DATA', message: 'Telemetry scan complete. 4 high-risk accounts flagged, 478 accounts healthy.', type: 'success', delay: 3500 },
  ],
  // Wave 2: Strategy Agent analysis
  [
    { agent: 'STRATEGY', message: 'Processing priority queue: MedVault Health Systems ($13,000/mo MRR)...', type: 'info', delay: 4200 },
    { agent: 'STRATEGY', message: 'CRM context retrieved: NPS=4/10, Renewal=2027-01-31, Open Tickets=3, Industry=HealthTech/HIPAA', type: 'info', delay: 4800 },
    { agent: 'STRATEGY', message: 'Root cause identified: Compliance-Blocking Technical Gaps (SOC2/HIPAA Certification Risk)', type: 'warn', delay: 5400 },
    { agent: 'STRATEGY', message: 'Strategy [CRITICAL]: Emergency Engineering Sprint + Compliance Remediation Package. Confidence: 96%. Est. save: $90,480/yr', type: 'success', delay: 6000 },
    { agent: 'STRATEGY', message: 'Processing next: Veloce Logistics API — Feature Disengagement & Team Adoption Stagnation...', type: 'info', delay: 6800 },
    { agent: 'STRATEGY', message: 'Strategy [HIGH]: Personalized Interactive Masterclass + Onboarding Refresh. Confidence: 87%.', type: 'success', delay: 7500 },
  ],
  // Wave 3: Action Agent execution
  [
    { agent: 'ACTION', message: 'Drafting executive communications for 4 at-risk accounts...', type: 'action', delay: 8200 },
    { agent: 'ACTION', message: '[CRM TOOL] Updated acc-7203 → Stage: CRITICAL_RISK_IMMEDIATE_ACTION, Task: Emergency Executive Sync (24h)', type: 'action', delay: 8800 },
    { agent: 'ACTION', message: '[SLACK TOOL] 🔴 Posted to #cs-critical-alerts: Churn risk — MedVault Health Systems (72% risk)', type: 'action', delay: 9400 },
    { agent: 'ACTION', message: '[ANALYTICS TOOL] Logged intervention for acc-7203: Emergency Engineering Sprint (est. $90,480)', type: 'info', delay: 10000 },
    { agent: 'HITL', message: 'Swarm execution held at checkpoint. 4 interventions staged. Manual approval required before dispatch.', type: 'warn', delay: 10800 },
  ]
];

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AgentMonitoringDashboard() {
  const [accounts, setAccounts] = useState<AtRiskAccount[]>(INITIAL_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('acc-9412');
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(true);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOG);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '16:20:01.102',
      agent: 'SYSTEM',
      message: 'ChurnGuard AI Swarm v2.1 initialized. Connected to LangGraph StateGraph orchestrator.',
      type: 'info'
    },
    {
      id: '2',
      timestamp: '16:20:01.340',
      agent: 'DATA',
      message: 'Monitoring stream connected. Ingesting event telemetry across 482 active accounts.',
      type: 'info'
    },
    {
      id: '3',
      timestamp: '16:20:02.418',
      agent: 'DATA',
      message: 'FLAGGED [CRITICAL]: Apex Quant Capital (acc-9412) usage down -78.4% WoW. Churn risk: 74.2%.',
      type: 'critical'
    },
    {
      id: '4',
      timestamp: '16:20:03.204',
      agent: 'STRATEGY',
      message: 'CRM context retrieved: NPS=6/10, Renewal=2026-11-30, 2 pending P1 tickets on query latency.',
      type: 'info'
    },
    {
      id: '5',
      timestamp: '16:20:04.011',
      agent: 'STRATEGY',
      message: 'Strategy [CRITICAL]: "Dedicated Architect Pairing + $1,200 VIP SLA Credit". Confidence: 94%.',
      type: 'success'
    },
    {
      id: '6',
      timestamp: '16:20:04.558',
      agent: 'ACTION',
      message: '[CRM TOOL] Updated acc-9412 → Stage: AT_RISK_INTERVENTION_REQUIRED. [SLACK] Posted to #cs-critical-alerts.',
      type: 'action'
    },
    {
      id: '7',
      timestamp: '16:20:05.105',
      agent: 'HITL',
      message: 'Intervention paused: Awaiting human operator approval before dispatch.',
      type: 'warn'
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = useCallback((agent: LogEntry['agent'], message: string, type: LogEntry['type']) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    setLogs(prev => [...prev, { id: Math.random().toString(), timestamp: timeStr, agent, message, type }]);
  }, []);

  const runSwarmSimulation = useCallback(() => {
    setIsSwarmRunning(true);
    setActiveStep(1);

    const allEvents = SIMULATION_SEQUENCES.flat();
    allEvents.forEach((event, index) => {
      setTimeout(() => {
        addLog(event.agent, event.message, event.type);
        // Update pipeline step indicator
        if (event.agent === 'DATA') setActiveStep(1);
        if (event.agent === 'STRATEGY') setActiveStep(2);
        if (event.agent === 'ACTION') setActiveStep(3);
        if (event.agent === 'HITL') {
          setActiveStep(4);
          setIsSwarmRunning(false);
        }
      }, event.delay);
    });
  }, [addLog]);

  const handleApprove = (id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
    const target = accounts.find(a => a.id === id);
    if (target) {
      addLog('HITL', `Manager manually APPROVED retention plan for ${target.companyName}.`, 'success');
      addLog('ACTION', `[EMAIL TOOL] Dispatched outbound communication to ${target.email}.`, 'action');
      addLog('ACTION', `[CRM TOOL] Deal stage updated to INTERVENTION_IN_PROGRESS. Follow-up task created.`, 'action');
      addLog('ACTION', `[CALENDAR TOOL] Executive sync scheduled with ${target.primaryContact} (within 48h).`, 'info');
      addLog('ACTION', `[SLACK TOOL] ✅ Posted confirmation to #cs-retention-pipeline.`, 'success');
      setAuditLogs(prev => [{
        id: `aud-${Date.now()}`,
        accountName: target.companyName,
        accountId: target.id,
        action: `Retention email dispatched — ${target.retentionOffer.slice(0, 60)}...`,
        operator: 'Current Operator',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        outcome: 'APPROVED',
        mrr: target.mrr
      }, ...prev]);
    }
  };

  const handleDismiss = (id: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'DISMISSED' } : a));
    const target = accounts.find(a => a.id === id);
    if (target) {
      addLog('HITL', `Manager DISMISSED churn alert for ${target.companyName} (marked false-positive).`, 'warn');
      addLog('ACTION', `[ANALYTICS TOOL] Logged false-positive feedback for model retraining.`, 'info');
      setAuditLogs(prev => [{
        id: `aud-${Date.now()}`,
        accountName: target.companyName,
        accountId: target.id,
        action: `Alert dismissed — Marked as false positive by operator`,
        operator: 'Current Operator',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        outcome: 'DISMISSED',
        mrr: target.mrr
      }, ...prev]);
    }
  };

  const handleReset = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setActiveStep(0);
    setAuditLogs(INITIAL_AUDIT_LOG);
    setLogs([{
      id: 'reset',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.000',
      agent: 'SYSTEM',
      message: 'Dashboard reset to initial state. All accounts restored to PENDING_APPROVAL.',
      type: 'info'
    }]);
  };

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Compute live KPIs
  const totalMrrAtRisk = accounts.reduce((sum, a) => sum + a.mrr, 0);
  const totalEstSavings = accounts.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + a.estimatedSaveValue, 0);
  const pendingCount = accounts.filter(a => a.status === 'PENDING_APPROVAL').length;
  const avgRisk = accounts.reduce((sum, a) => sum + a.churnRisk, 0) / accounts.length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-gradient-to-br from-[#c5a880]/20 to-[#aa8453]/20 border border-[#c5a880]/30 text-[#c5a880]">
              <BrainCircuit className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Customer Churn Prevention Swarm
            </h1>
            <span className="ml-2 px-2.5 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Swarm Online
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Autonomous multi-agent orchestration: Data Agent → Strategy Agent → Action Agent with Human-In-The-Loop Sign-Off
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuditDrawer(true)}
            className="px-3.5 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
          <button
            onClick={runSwarmSimulation}
            disabled={isSwarmRunning}
            className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-[#ffe885] via-[#ffb830] to-[#c5a880] hover:brightness-110 rounded-xl shadow-lg shadow-[#ffb830]/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-current ${isSwarmRunning ? 'animate-spin' : ''}`} />
            <span>{isSwarmRunning ? 'Swarm Reasoning...' : 'Run Swarm Trigger'}</span>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPI METRICS BAR */}
      {/* ================================================================ */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MRR at Risk */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-red-950 border border-red-800/40">
              <DollarSign className="w-3.5 h-3.5 text-red-400" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">MRR at Risk</span>
          </div>
          <div className="text-2xl font-extrabold text-white">${totalMrrAtRisk.toLocaleString()}<span className="text-sm text-gray-400 font-normal">/mo</span></div>
          <div className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            ${(totalMrrAtRisk * 12).toLocaleString()}/yr annual exposure
          </div>
        </div>

        {/* Accounts Flagged */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-amber-950 border border-amber-800/40">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Accounts Flagged</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{accounts.length}</div>
          <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {pendingCount} awaiting human approval
          </div>
        </div>

        {/* Avg Risk Score */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800/40">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Avg Risk Score</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{avgRisk.toFixed(1)}%</div>
          <div className="mt-2 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all"
              style={{ width: `${avgRisk}%` }}
            />
          </div>
        </div>

        {/* Revenue Saved */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800/40">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Revenue Saved</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">${totalEstSavings.toLocaleString()}<span className="text-sm text-gray-400 font-normal">/yr</span></div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {accounts.filter(a => a.status === 'APPROVED').length} interventions dispatched
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN CONTENT GRID */}
      {/* ================================================================ */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Real-Time Agent Telemetry Terminal */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Agent Pipeline Visualizer */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#c5a880]" />
              Swarm Execution Pipeline
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeStep >= 1
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-gray-950/60 border-gray-800/80 text-gray-400'
              }`}>
                <Database className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <div className="text-[11px] font-bold">1. Data</div>
                <div className="text-[9px] text-gray-500 font-mono">Anomaly</div>
              </div>

              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeStep >= 2
                  ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-gray-950/60 border-gray-800/80 text-gray-400'
              }`}>
                <BrainCircuit className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                <div className="text-[11px] font-bold">2. Strategy</div>
                <div className="text-[9px] text-gray-500 font-mono">CRM</div>
              </div>

              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeStep >= 3
                  ? 'bg-[#c5a880]/10 border-[#c5a880]/50 text-[#ffe885] ring-2 ring-[#c5a880]/20'
                  : 'bg-gray-950/60 border-gray-800/80 text-gray-400'
              }`}>
                <Send className="w-4 h-4 mx-auto mb-1 text-[#c5a880]" />
                <div className="text-[11px] font-bold">3. Action</div>
                <div className="text-[9px] text-gray-500 font-mono">Draft</div>
              </div>

              <div className={`p-3 rounded-xl border text-center transition-all ${
                activeStep >= 4
                  ? 'bg-purple-500/10 border-purple-500/50 text-purple-300 ring-2 ring-purple-500/20'
                  : 'bg-gray-950/60 border-gray-800/80 text-gray-400'
              }`}>
                <Shield className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-[11px] font-bold">4. HITL</div>
                <div className="text-[9px] text-gray-500 font-mono">Gate</div>
              </div>
            </div>
          </div>

          {/* Real-Time Terminal Feed */}
          <div className="bg-black/90 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
            <div className="px-4 py-3 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-gray-200">SWARM_TELEMETRY_LOGS</span>
                <span className="text-[10px] font-mono text-gray-500">({logs.length} events)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block"></span>
              </div>
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2.5 select-text">
              {logs.map((log) => (
                <div key={log.id} className="leading-relaxed">
                  <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                    log.agent === 'DATA' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                    log.agent === 'STRATEGY' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/50' :
                    log.agent === 'ACTION' ? 'bg-[#aa8453]/20 text-[#ffe885] border border-[#aa8453]/40' :
                    log.agent === 'SYSTEM' ? 'bg-gray-800 text-gray-300 border border-gray-700' :
                    'bg-purple-950 text-purple-300 border border-purple-800/50'
                  }`}>
                    {log.agent}
                  </span>
                  <span className={
                    log.type === 'critical' ? 'text-red-300 font-semibold' :
                    log.type === 'warn' ? 'text-amber-300' :
                    log.type === 'success' ? 'text-emerald-300' :
                    log.type === 'action' ? 'text-sky-300' :
                    'text-gray-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            <div className="px-4 py-2 bg-gray-950 border-t border-gray-800/80 text-[11px] text-gray-500 font-mono flex items-center justify-between">
              <span>Status: Listening on LangGraph StateGraph</span>
              <span className="animate-pulse text-emerald-400">● Live Feed</span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): At-Risk Accounts & Human-In-The-Loop Approval Queue */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Account Selector Tabs */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                At-Risk Accounts Queue ({accounts.length})
              </h3>
              <span className="text-xs text-gray-400">Select account to review swarm proposal</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map(account => {
                const isSelected = account.id === selectedAccountId;
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#c5a880]/15 border-[#c5a880] ring-1 ring-[#c5a880]/40'
                        : 'bg-gray-950 hover:bg-gray-900 border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{account.companyName}</span>
                      <span className="text-xs font-mono text-[#c5a880] font-semibold">${account.mrr.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      <span className="text-red-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" /> -{account.loginDropPct}% usage
                      </span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        account.riskCategory === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800/60' :
                        account.riskCategory === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                        'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                      }`}>
                        {account.riskCategory}
                      </span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        account.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        account.status === 'DISMISSED' ? 'bg-gray-800 text-gray-400' :
                        'bg-amber-950 text-amber-400 border border-amber-800/80 animate-pulse'
                      }`}>
                        {account.status === 'PENDING_APPROVAL' ? 'Awaiting Human' : account.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Proposal Card (Human Approval Inspector) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 border-b border-gray-800 bg-gray-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">{currentAccount.companyName}</h2>
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-gray-800 text-gray-300 border border-gray-700">
                    {currentAccount.tier}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-gray-800 text-gray-400 border border-gray-700">
                    {currentAccount.industry}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Contact: {currentAccount.primaryContact} • Renewal: {currentAccount.contractRenewal}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="text-xs text-gray-400">Confidence</div>
                  <div className="text-sm font-bold text-emerald-400">{(currentAccount.strategyConfidence * 100).toFixed(0)}%</div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                  currentAccount.riskCategory === 'CRITICAL' ? 'bg-red-950/80 text-red-300 border-red-500/40' :
                  currentAccount.riskCategory === 'HIGH' ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' :
                  'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                }`}>
                  {currentAccount.churnRisk}% {currentAccount.riskCategory}
                </span>
              </div>
            </div>

            {/* Account Telemetry Mini-Bars */}
            <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/40 grid grid-cols-4 gap-3">
              <div>
                <div className="text-[10px] font-mono text-gray-500 mb-1">Login Drop</div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${currentAccount.loginDropPct}%` }} />
                </div>
                <div className="text-[10px] font-mono text-red-400 mt-0.5">-{currentAccount.loginDropPct}%</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-500 mb-1">Feature Use</div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${currentAccount.featureScore * 10}%` }} />
                </div>
                <div className="text-[10px] font-mono text-amber-400 mt-0.5">{currentAccount.featureScore}/10</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-500 mb-1">Open Bugs</div>
                <div className="text-sm font-bold text-white">{currentAccount.unresolvedBugs}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-500 mb-1">Days Inactive</div>
                <div className="text-sm font-bold text-white">{currentAccount.daysSinceActive}d</div>
              </div>
            </div>

            {/* Proposal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              
              {/* Diagnosed Cause */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
                  Strategy Agent Root-Cause Diagnosis
                </span>
                <p className="text-xs text-gray-200 leading-relaxed font-medium">
                  {currentAccount.diagnosedCause}
                </p>
              </div>

              {/* Prescribed Retention Offer */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#c5a880]/10 to-indigo-500/10 border border-[#c5a880]/30 space-y-1">
                <span className="text-[11px] font-mono text-[#ffe885] uppercase tracking-wider block flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Prescribed Retention Incentive (Est. Save: ${currentAccount.estimatedSaveValue.toLocaleString()}/yr)
                </span>
                <p className="text-xs text-gray-100 font-semibold">
                  {currentAccount.retentionOffer}
                </p>
              </div>

              {/* Action Agent Outbound Draft */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    Action Agent Outbound Draft (Pending Approval)
                  </span>
                  <button
                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                    className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                  >
                    {showEmailPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showEmailPreview ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showEmailPreview && (
                  <div className="bg-black/70 border border-gray-800 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-2">
                    <div className="text-gray-400 pb-2 border-b border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-gray-500">To:</span> {currentAccount.email}
                        <br />
                        <span className="text-gray-500">Subject:</span> {currentAccount.emailSubject}
                      </div>
                    </div>
                    <div className="whitespace-pre-line text-gray-200 leading-relaxed pt-1">
                      {currentAccount.emailBody}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Card Footer: Human Approval Controller */}
            <div className="p-5 border-t border-gray-800 bg-gray-950 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero emails dispatch without explicit human confirmation.</span>
              </div>

              <div className="flex items-center gap-3">
                {currentAccount.status === 'PENDING_APPROVAL' ? (
                  <>
                    <button
                      onClick={() => handleDismiss(currentAccount.id)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Dismiss Alert</span>
                    </button>
                    <button
                      onClick={() => handleApprove(currentAccount.id)}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 fill-black text-emerald-400" />
                      <span>Approve & Dispatch Outreach</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      currentAccount.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{currentAccount.status === 'APPROVED' ? 'Dispatched to Customer' : 'Dismissed by Operator'}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================================================================ */}
      {/* AUDIT TRAIL DRAWER (Slide-over) */}
      {/* ================================================================ */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAuditDrawer(false)}
          />
          {/* Drawer */}
          <div className="relative w-full max-w-lg bg-[#0B0F19] border-l border-gray-800 shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#c5a880]" />
                <h2 className="text-lg font-bold text-white">Audit Trail & Decision History</h2>
              </div>
              <button
                onClick={() => setShowAuditDrawer(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <History className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No audit records yet.</p>
                </div>
              ) : (
                auditLogs.map(record => (
                  <div key={record.id} className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{record.accountName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        record.outcome === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        record.outcome === 'DISPATCHED' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                        'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {record.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">{record.action}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>Operator: {record.operator}</span>
                      <span>${record.mrr.toLocaleString()}/mo</span>
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono">{record.timestamp}</div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-950 text-[11px] text-gray-500 font-mono text-center">
              {auditLogs.length} total audit records • All decisions are logged and immutable
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
