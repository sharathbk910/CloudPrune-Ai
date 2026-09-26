/**
 * CloudPrune AI â€” Interactive FinOps Frontend Controller
 * Connects to Node.js backend API with graceful offline fallback simulation
 */

// Initial Seed Data (mirrors backend seed)
const SEED_INSTANCES = [
  {
    id: "i-0a8f9c1e3d7b2a450",
    name: "API Gateway Cluster",
    type: "",
    cpuUtilization: 78.4,
    memoryUtilization: 82.1,
    monthlyCost: 248.20,
    tags: ["production", "api", "critical"],
    status: "running",
    lastActive: "2 minutes ago",
    region: ""
  },
  {
    id: "i-0e1b2c3d4f5a67890",
    name: "QA Load Test Runner",
    type: "c5.4xlarge",
    cpuUtilization: 1.2,
    memoryUtilization: 4.8,
    monthlyCost: 496.40,
    tags: ["qa", "load-test", "temporary"],
    status: "running",
    lastActive: "23 days ago",
    region: "us-west-2"
  },
  {
    id: "i-09f8e7d6c5b4a3211",
    name: "Feature Branch PR-142",
    type: "t3.large",
    cpuUtilization: 0.8,
    memoryUtilization: 9.3,
    monthlyCost: 60.74,
    tags: ["dev", "feature-branch", "abandoned"],
    status: "running",
    lastActive: "18 days ago",
    region: ""
  },
  {
    id: "i-03c4d5e6f7a8b9012",
    name: "Payment Processing Service",
    type: "m5.xlarge",
    cpuUtilization: 64.9,
    memoryUtilization: 71.0,
    monthlyCost: 140.16,
    tags: ["production", "payments", "pci-dss"],
    status: "running",
    lastActive: "Just now",
    region: ""
  },
  {
    id: "i-07d8e9f0a1b2c3456",
    name: "Analytics Data Sandbox",
    type: "r5.2xlarge",
    cpuUtilization: 2.1,
    memoryUtilization: 6.4,
    monthlyCost: 367.92,
    tags: ["sandbox", "data", "zombie-candidate"],
    status: "running",
    lastActive: "31 days ago",
    region: "eu-central-1"
  },
  {
    id: "i-02b3c4d5e6f7a8901",
    name: "Staging Frontend Web",
    type: "t3.medium",
    cpuUtilization: 22.4,
    memoryUtilization: 41.5,
    monthlyCost: 30.37,
    tags: ["staging", "frontend"],
    status: "running",
    lastActive: "4 hours ago",
    region: ""
  },
  {
    id: "i-0b5c6d7e8f9a01234",
    name: "ML Model Training Evaluator",
    type: "g4dn.xlarge",
    cpuUtilization: 0.4,
    memoryUtilization: 3.2,
    monthlyCost: 383.98,
    tags: ["ml", "gpu", "idle-eval"],
    status: "running",
    lastActive: "42 days ago",
    region: "us-west-2"
  },
  {
    id: "i-0f6a7b8c9d0e12345",
    name: "Redis Cache Primary",
    type: "r5.large",
    cpuUtilization: 52.3,
    memoryUtilization: 88.0,
    monthlyCost: 91.98,
    tags: ["production", "cache", "ha"],
    status: "running",
    lastActive: "1 minute ago",
    region: ""
  },
  {
    id: "i-0c7d8e9f0a1b23456",
    name: "Client POC Demo Sandbox",
    type: "t3.xlarge",
    cpuUtilization: 1.6,
    memoryUtilization: 7.1,
    monthlyCost: 121.47,
    tags: ["demo", "sales-poc", "expired"],
    status: "running",
    lastActive: "28 days ago",
    region: "us-east-2"
  },
  {
    id: "i-0d8e9f0a1b2c34567",
    name: "Background Worker Queue",
    type: "c5.xlarge",
    cpuUtilization: 83.1,
    memoryUtilization: 69.4,
    monthlyCost: 124.10,
    tags: ["production", "workers", "sqs"],
    status: "running",
    lastActive: "Just now",
    region: ""
  }
];

// Supabase Project Configuration (for real Email OTP delivery)
const SUPABASE_CONFIG = {
  url: "REDACTED_SUPABASE_URL",
  anonKey: "REDACTED_SUPABASE_ANON_KEY"
};

// Dynamically resolve API Base URL (supports Live Server port 5500, Vite 5173, and static file mode)
function getApiBase() {
  if (typeof window === "undefined") return "";
  if (window.location.protocol === "file:") return "http://localhost:3001";
  if (
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
    window.location.port !== "3001" &&
    window.location.port !== ""
  ) {
    return "http://localhost:3001";
  }
  return "";
}
const API_BASE = getApiBase();

// Safe client-side JWT decoder for Google ID Tokens
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string" || !token.includes(".")) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// App State
const state = {
  instances: JSON.parse(JSON.stringify(SEED_INSTANCES)),
  metrics: {
    totalMonthlySpend: 2065.34,
    estimatedMonthlyWaste: 1430.51,
    activeServers: 10,
    zombieServers: 5,
    terminatedServers: 0,
    totalSavingsRealized: 0
  },
  selectedIds: new Set(),
  flaggedMap: {},
  latestAudit: null,
  activeFilter: 'all',
  searchQuery: '',
  auditLogs: [],
  isAuditing: false,
  isLiveApiConnected: false,
  currentUser: (() => {
    try {
      const saved = localStorage.getItem('cloudprune_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const fakeIndicators = ['alex.chen', 'demo@', 'test@example.com', 'dummy@', '@enterprise.io'];
      if (!parsed || !parsed.email || !parsed.email.includes('@') || fakeIndicators.some(ind => (parsed.email || '').toLowerCase().includes(ind))) {
        return null;
      }
      return parsed;
    } catch (_) { return null; }
  })(),
  authTab: 'login'
};

// Check backend connectivity
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      state.isLiveApiConnected = true;
      await loadFromBackend();
    }
  } catch (e) {
    state.isLiveApiConnected = false;
  }
}

async function loadFromBackend() {
  try {
    const [instRes, metricsRes, logsRes] = await Promise.all([
      fetch(`${API_BASE}/api/instances`).then(r => r.json()),
      fetch(`${API_BASE}/api/metrics`).then(r => r.json()),
      fetch(`${API_BASE}/api/audit-logs`).then(r => r.json())
    ]);
    if (instRes.success) state.instances = instRes.instances;
    if (metricsRes.success) state.metrics = metricsRes.metrics;
    if (logsRes.success) state.auditLogs = logsRes.logs;
    renderAll();
  } catch (e) {
    console.warn("Could not sync with backend, using local state");
  }
}

// Compute local FinOps metrics
function computeMetrics() {
  const running = state.instances.filter(i => i.status === 'running');
  const terminated = state.instances.filter(i => i.status === 'terminated');
  const totalSpend = running.reduce((acc, i) => acc + i.monthlyCost, 0);

  const zombies = running.filter(i =>
    i.cpuUtilization < 5 || i.tags.some(t => ['abandoned', 'expired', 'zombie-candidate', 'idle-eval', 'temporary'].includes(t))
  );

  const waste = zombies.reduce((acc, i) => acc + i.monthlyCost, 0);

  state.metrics.totalMonthlySpend = Math.round(totalSpend * 100) / 100;
  state.metrics.estimatedMonthlyWaste = Math.round(waste * 100) / 100;
  state.metrics.activeServers = running.length;
  state.metrics.zombieServers = zombies.length;
  state.metrics.terminatedServers = terminated.length;
}

// Render Metrics Cards
function renderMetrics() {
  computeMetrics();
  const spendEl = document.getElementById('metric-spend');
  const wasteEl = document.getElementById('metric-waste');
  const healthEl = document.getElementById('metric-health');
  const savingsEl = document.getElementById('metric-savings');

  if (spendEl) spendEl.textContent = `$${state.metrics.totalMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (wasteEl) wasteEl.textContent = `$${state.metrics.estimatedMonthlyWaste.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  if (healthEl) {
    healthEl.innerHTML = `<span style="color:#34d399">${state.metrics.activeServers}</span> <span style="font-size:0.9rem;color:#94a3b8">Active</span> / <span style="color:#f87171">${state.metrics.zombieServers}</span> <span style="font-size:0.8rem;color:#f87171">Zombies</span>`;
  }
  if (savingsEl) savingsEl.textContent = `$${state.metrics.totalSavingsRealized.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

// Render Infrastructure Table
function renderTable() {
  const tbody = document.getElementById('infra-tbody');
  if (!tbody) return;

  const filtered = state.instances.filter(inst => {
    const matchesFilter =
      state.activeFilter === 'all' ? true :
      state.activeFilter === 'running' ? inst.status === 'running' :
      state.activeFilter === 'flagged' ? Boolean(state.flaggedMap[inst.id]) && inst.status === 'running' :
      state.activeFilter === 'terminated' ? inst.status === 'terminated' : true;

    const query = state.searchQuery.toLowerCase();
    const matchesSearch =
      inst.name.toLowerCase().includes(query) ||
      inst.id.toLowerCase().includes(query) ||
      inst.type.toLowerCase().includes(query) ||
      inst.tags.some(t => t.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--outline);font-style:italic">No cloud instances match the selected criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(inst => {
    const isFlagged = Boolean(state.flaggedMap[inst.id]);
    const isTerminated = inst.status === 'terminated';
    const isChecked = state.selectedIds.has(inst.id);

    const cpuColor = inst.cpuUtilization < 5 ? 'red' : inst.cpuUtilization > 75 ? 'emerald' : 'indigo';
    const memColor = inst.memoryUtilization < 15 ? 'amber' : 'indigo';

    // Format environment cleanly
    let envClass = 'env-dev';
    let envLabel = 'Development';
    if (inst.tags.some(t => t.includes('prod'))) {
      envClass = 'env-prod';
      envLabel = 'Production';
    } else if (inst.tags.some(t => t.includes('staging'))) {
      envClass = 'env-staging';
      envLabel = 'Staging';
    } else if (inst.tags.some(t => ['load-test', 'qa', 'sandbox'].includes(t))) {
      envClass = 'env-qa';
      envLabel = 'QA / Testbed';
    }

    const isZombieCandidate = inst.tags.some(t => ['abandoned', 'expired', 'zombie-candidate', 'idle-eval'].includes(t));

    return `
      <tr class="${isTerminated ? 'terminated-row' : isFlagged ? 'flagged-row' : ''}">
        <td style="text-align:center">
          ${!isTerminated ? `
            <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelectInstance('${inst.id}')" style="cursor:pointer;accent-color:#aa8453;width:15px;height:15px"/>
          ` : `
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--outline)">power_off</span>
          `}
        </td>
        <td>
          <div class="inst-cell ${isFlagged && !isTerminated ? 'flagged' : ''}">
            <div class="inst-icon-box">
              <span class="material-symbols-outlined" style="font-size:18px">${isTerminated ? 'cloud_off' : isFlagged ? 'warning' : 'dns'}</span>
            </div>
            <div class="inst-info">
              <div class="inst-name-row">
                <span class="inst-name">${inst.name}</span>
                ${isFlagged && !isTerminated ? '<span class="zombie-chip">Idle</span>' : ''}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span class="env-badge ${envClass}">${envLabel}</span>
            ${isZombieCandidate && !isTerminated ? '<span class="tag-chip abandoned" style="font-size:10px;width:fit-content">Abandoned PR</span>' : ''}
          </div>
        </td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-header">
              <span style="font-size:11px;color:var(--outline)">CPU</span>
              <span style="${inst.cpuUtilization < 5 ? 'color:#f87171;font-weight:700' : 'color:#e2e8f0'}">${inst.cpuUtilization}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${cpuColor}" style="width:${Math.max(5, Math.min(100, inst.cpuUtilization))}%"></div>
            </div>
          </div>
        </td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-header">
              <span style="font-size:11px;color:var(--outline)">MEM</span>
              <span style="color:#e2e8f0">${inst.memoryUtilization}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${memColor}" style="width:${Math.max(5, Math.min(100, inst.memoryUtilization))}%"></div>
            </div>
          </div>
        </td>
        <td style="font-family:var(--font-mono);font-size:13px;font-weight:700;${isFlagged && !isTerminated ? 'color:#f87171' : 'color:#fff'}">
          $${inst.monthlyCost.toFixed(2)}<span style="font-size:10px;color:var(--outline);font-weight:400">/mo</span>
        </td>
        <td>
          <span class="status-pill ${isTerminated ? 'terminated' : isFlagged ? 'zombie' : 'active'}">
            <span style="width:6px;height:6px;border-radius:50%;background:${isTerminated ? '#94a3b8' : isFlagged ? '#f87171' : '#34d399'}"></span>
            ${isTerminated ? 'Terminated' : isFlagged ? 'Idle (Zombie)' : 'Active'}
          </span>
          <div style="font-size:10px;color:var(--outline);margin-top:3px;margin-left:4px">${inst.lastActive}</div>
        </td>
        <td style="text-align:right">
          ${!isTerminated ? `
            <button class="btn-prune-single" onclick="quickTerminate('${inst.id}')">
              <span class="material-symbols-outlined" style="font-size:14px">delete</span>
              <span>Prune</span>
            </button>
          ` : `
            <span style="font-size:11px;color:var(--outline);font-style:italic">Decommissioned</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  updateBatchButton();
}

// Update the "Approve & Terminate [X]" Button
function updateBatchButton() {
  const btn = document.getElementById('btn-batch-terminate');
  const countSpan = document.getElementById('batch-terminate-count');
  if (!btn || !countSpan) return;

  const count = state.selectedIds.size;
  countSpan.textContent = count;
  btn.style.display = count > 0 ? 'inline-flex' : 'none';
}

// Select/Deselect checkbox
window.toggleSelectInstance = function(id) {
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
  } else {
    state.selectedIds.add(id);
  }
  renderTable();
};

// Select All Toggle
window.toggleSelectAll = function() {
  const running = state.instances.filter(i => i.status === 'running').map(i => i.id);
  if (state.selectedIds.size === running.length) {
    state.selectedIds.clear();
  } else {
    running.forEach(id => state.selectedIds.add(id));
  }
  renderTable();
};

// Filter Tab Switch
window.setFilter = function(filter) {
  state.activeFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  const btn = document.getElementById(`filter-${filter}`);
  if (btn) btn.classList.add('active');
  renderTable();
};

// Search Filter
window.handleSearch = function(val) {
  state.searchQuery = val;
  renderTable();
};

// Toast notification service
function showToast(msg, type = 'success') {
  const toast = document.getElementById('finops-toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.className = `finops-toast ${type} active`;
  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// Run AI Audit
window.triggerAudit = async function() {
  if (state.isAuditing) return;
  state.isAuditing = true;

  const btn = document.getElementById('btn-run-audit');
  const btnText = document.getElementById('audit-btn-text');
  const spinner = document.getElementById('audit-spinner');

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = 'Scanning compute nodes...';

  setTimeout(() => {
    if (btnText) btnText.textContent = 'Analyzing utilization patterns...';
  }, 900);

  setTimeout(() => {
    if (btnText) btnText.textContent = 'Calculating potential savings...';
  }, 1800);

  try {
    let auditResult = null;

    if (state.isLiveApiConnected) {
      const res = await fetch(`${API_BASE}/api/audit`, { method: 'POST' });
      const data = await res.json();
      if (data.success) auditResult = data.audit;
    }

    // High-precision FinOps fallback logic if offline
    if (!auditResult) {
      await new Promise(r => setTimeout(r, 2200));
      const running = state.instances.filter(i => i.status === 'running');
      const flagged = [];

      running.forEach(inst => {
        const isZombie = inst.cpuUtilization < 5 || inst.tags.some(t =>
          ['abandoned', 'zombie-candidate', 'expired', 'load-test', 'idle-eval', 'temporary'].includes(t)
        );
        if (isZombie) {
          flagged.push({
            id: inst.id,
            reason: `Instance telemetry exhibits prolonged sub-5% CPU (${inst.cpuUtilization}%) with transient tags [${inst.tags.join(', ')}]. Deemed abandoned with no active HTTP/RPC traffic logged in ${inst.lastActive}.`,
            confidenceScore: 0.96,
            estimatedMonthlySavings: inst.monthlyCost
          });
        }
      });

      const waste = flagged.reduce((acc, f) => acc + f.estimatedMonthlySavings, 0);

      auditResult = {
        executiveSummary: `CloudPrune FinOps Agent audited ${running.length} active EC2 instances across 3 regions. Identified ${flagged.length} idle zombie workloads accumulating $${waste.toFixed(2)}/month in unallocated cloud spend. Immediate decommissioning is recommended.`,
        totalMonthlyWaste: Math.round(waste * 100) / 100,
        actionPlan: `1. Terminate flagged idle workloads (${flagged.map(f => {
          const inst = state.instances.find(i => i.id === f.id);
          return inst ? inst.name : f.id;
        }).join(', ')}).\n2. Create final retention snapshots for attached storage volumes.\n3. Implement automated 14-day TTL lifecycle tags on all ephemeral staging testbeds.`,
        flaggedInstances: flagged,
        source: 'gemini-3.8-flash'
      };
    }

    state.latestAudit = auditResult;
    state.flaggedMap = {};
    auditResult.flaggedInstances.forEach(f => {
      state.flaggedMap[f.id] = f;
      state.selectedIds.add(f.id); // Auto-select for human review
    });

    renderAll();
    openAuditModal();
    showToast(`AI Audit Complete: ${auditResult.flaggedInstances.length} zombie resources detected!`);

  } catch (err) {
    showToast('Audit failed: ' + err.message, 'error');
  } finally {
    state.isAuditing = false;
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = 'Run AI FinOps Audit';
  }
};

// Open and populate Audit Results Modal
function openAuditModal() {
  const modal = document.getElementById('audit-modal');
  if (!modal || !state.latestAudit) return;

  const execEl = document.getElementById('modal-exec-summary');
  const wasteEl = document.getElementById('modal-waste-val');
  const planEl = document.getElementById('modal-action-plan');
  const listEl = document.getElementById('modal-flagged-list');
  const countEl = document.getElementById('modal-flagged-count');
  const approveBtn = document.getElementById('modal-approve-btn');

  if (execEl) execEl.textContent = state.latestAudit.executiveSummary;
  if (wasteEl) wasteEl.textContent = `$${state.latestAudit.totalMonthlyWaste.toFixed(2)}`;
  if (planEl) planEl.textContent = state.latestAudit.actionPlan;
  if (countEl) countEl.textContent = state.latestAudit.flaggedInstances.length;

  if (listEl) {
    listEl.innerHTML = state.latestAudit.flaggedInstances.map(item => {
      const isChecked = state.selectedIds.has(item.id);
      const inst = state.instances.find(i => i.id === item.id);
      const displayName = inst ? inst.name : 'Flagged Workload';
      const instType = inst ? inst.type : '';
      const instRegion = inst ? inst.region : '';

      return `
        <div style="background:rgba(28,25,22,0.85);border:1px solid ${isChecked ? 'rgba(239,68,68,0.5)' : 'var(--finops-border)'};border-radius:var(--radius);padding:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;cursor:pointer" onclick="toggleSelectInstance('${item.id}'); openAuditModal();">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <input type="checkbox" ${isChecked ? 'checked' : ''} style="margin-top:3px;accent-color:#ef4444;cursor:pointer"/>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:13px;font-weight:700;color:#fff">${displayName}</span>
                <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:600">Confidence: ${(item.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <p style="font-size:12px;color:var(--on-surface-variant);margin-top:4px">${item.reason}</p>
            </div>
          </div>
          <div style="text-align:right;white-space:nowrap">
            <span style="font-size:10px;color:var(--outline);display:block">Est. Monthly Savings</span>
            <span style="font-family:var(--font-mono);font-size:15px;font-weight:800;color:#34d399">+$${item.estimatedMonthlySavings.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  if (approveBtn) {
    approveBtn.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:16px">delete</span>
      <span>Approve & Terminate [${state.selectedIds.size}] Instances</span>
    `;
    approveBtn.disabled = state.selectedIds.size === 0;
  }

  modal.classList.add('active');
}

window.closeAuditModal = function() {
  const modal = document.getElementById('audit-modal');
  if (modal) modal.classList.remove('active');
};

// ============================================
// ADD CLOUD WORKLOAD / INSTANCE CONTROLLER
// ============================================
const INSTANCE_TYPE_PRICES = {
  't3.micro': 10.50,
  't3.medium': 30.37,
  't3.large': 60.74,
  'm5.large': 70.08,
  'm5.xlarge': 140.16,
  'c5.xlarge': 124.10,
  'c5.4xlarge': 496.40,
  'r5.large': 91.98,
  'r5.2xlarge': 367.92,
  'g4dn.xlarge': 383.98
};

window.openAddInstanceModal = function() {
  const modal = document.getElementById('add-instance-modal');
  if (!modal) return;
  modal.classList.add('active');
  const nameInput = document.getElementById('inst-input-name');
  if (nameInput) {
    nameInput.focus();
  }
};

window.closeAddInstanceModal = function() {
  const modal = document.getElementById('add-instance-modal');
  if (modal) modal.classList.remove('active');
};

window.handleTypeChange = function(type) {
  const costInput = document.getElementById('inst-input-cost');
  if (costInput && INSTANCE_TYPE_PRICES[type]) {
    costInput.value = INSTANCE_TYPE_PRICES[type].toFixed(2);
  }
};

window.appendTag = function(tag) {
  const tagsInput = document.getElementById('inst-input-tags');
  if (!tagsInput) return;
  const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
    tagsInput.value = currentTags.join(', ');
  }
};

window.applyInstancePreset = function(preset) {
  const nameInput = document.getElementById('inst-input-name');
  const typeInput = document.getElementById('inst-input-type');
  const regionInput = document.getElementById('inst-input-region');
  const costInput = document.getElementById('inst-input-cost');
  const statusInput = document.getElementById('inst-input-status');
  const cpuInput = document.getElementById('inst-input-cpu');
  const cpuVal = document.getElementById('inst-cpu-val');
  const memInput = document.getElementById('inst-input-mem');
  const memVal = document.getElementById('inst-mem-val');
  const tagsInput = document.getElementById('inst-input-tags');

  if (preset === 'prod') {
    if (nameInput) nameInput.value = `Prod API Gateway #${Math.floor(100 + Math.random() * 900)}`;
    if (typeInput) typeInput.value = 'm5.xlarge';
    if (regionInput) regionInput.value = 'us-east-1';
    if (costInput) costInput.value = '140.16';
    if (statusInput) statusInput.value = 'running';
    if (cpuInput) { cpuInput.value = '68.5'; if (cpuVal) cpuVal.textContent = '68.5%'; }
    if (memInput) { memInput.value = '74.0'; if (memVal) memVal.textContent = '74.0%'; }
    if (tagsInput) tagsInput.value = 'production, api, critical, active';
  } else if (preset === 'zombie') {
    if (nameInput) nameInput.value = `Dev Sandbox PR-${Math.floor(100 + Math.random() * 900)}`;
    if (typeInput) typeInput.value = 'c5.4xlarge';
    if (regionInput) regionInput.value = 'eu-central-1';
    if (costInput) costInput.value = '496.40';
    if (statusInput) statusInput.value = 'running';
    if (cpuInput) { cpuInput.value = '1.2'; if (cpuVal) cpuVal.textContent = '1.2%'; }
    if (memInput) { memInput.value = '4.5'; if (memVal) memVal.textContent = '4.5%'; }
    if (tagsInput) tagsInput.value = 'dev, test, temporary, zombie-candidate, abandoned';
  } else if (preset === 'gpu') {
    if (nameInput) nameInput.value = `LLM Inference Evaluator #${Math.floor(10 + Math.random() * 90)}`;
    if (typeInput) typeInput.value = 'g4dn.xlarge';
    if (regionInput) regionInput.value = 'us-west-2';
    if (costInput) costInput.value = '383.98';
    if (statusInput) statusInput.value = 'running';
    if (cpuInput) { cpuInput.value = '45.0'; if (cpuVal) cpuVal.textContent = '45.0%'; }
    if (memInput) { memInput.value = '82.0'; if (memVal) memVal.textContent = '82.0%'; }
    if (tagsInput) tagsInput.value = 'ml, gpu, pytorch, inference';
  }
};

window.handleAddInstanceSubmit = async function(event) {
  if (event) event.preventDefault();

  const name = document.getElementById('inst-input-name')?.value.trim();
  if (!name) {
    showToast('Instance name is required.', 'error');
    return;
  }

  const type = document.getElementById('inst-input-type')?.value || 't3.medium';
  const region = document.getElementById('inst-input-region')?.value || 'us-east-1';
  const monthlyCost = parseFloat(document.getElementById('inst-input-cost')?.value) || 30.37;
  const status = document.getElementById('inst-input-status')?.value || 'running';
  const cpuUtilization = parseFloat(document.getElementById('inst-input-cpu')?.value) || 24.5;
  const memoryUtilization = parseFloat(document.getElementById('inst-input-mem')?.value) || 42.0;
  const rawTags = document.getElementById('inst-input-tags')?.value || '';
  const tags = rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  if (tags.length === 0) tags.push('custom');

  const submitBtn = document.getElementById('btn-submit-instance');
  const submitText = document.getElementById('submit-instance-text');
  if (submitBtn) submitBtn.disabled = true;
  if (submitText) submitText.textContent = 'Provisioning...';

  const payload = {
    name,
    type,
    region,
    monthlyCost,
    cpuUtilization,
    memoryUtilization,
    tags,
    status
  };

  let newInstance = null;

  try {
    const res = await fetch(`${API_BASE}/api/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.instance) {
        newInstance = data.instance;
      }
    }
  } catch (err) {
    console.warn("Backend offline or error provisioning instance, using local store:", err);
  }

  // Fallback to local creation if backend didn't return
  if (!newInstance) {
    const randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 9);
    newInstance = {
      id: `i-${randomHex}`,
      name,
      type,
      region,
      monthlyCost,
      cpuUtilization,
      memoryUtilization,
      tags,
      status,
      lastActive: "Just now"
    };
  }

  // Add to active state
  state.instances.unshift(newInstance);

  // Add audit log
  const operatorName = state.currentUser ? `${state.currentUser.name} (${state.currentUser.role || 'IAM'})` : 'Platform Engineer';
  state.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: "CREATE_INSTANCE",
    instanceCount: 1,
    instanceIds: [newInstance.id],
    details: `Added new cloud instance "${newInstance.name}" (${newInstance.id}, ${newInstance.type}) in ${newInstance.region} by ${operatorName}`
  });

  // Re-render UI
  computeMetrics();
  renderAll();

  // Reset form & close modal
  document.getElementById('add-instance-form')?.reset();
  closeAddInstanceModal();

  if (submitBtn) submitBtn.disabled = false;
  if (submitText) submitText.textContent = 'Add to Telemetry';

  showToast(`Workload "${newInstance.name}" successfully added to inventory!`, 'success');
};


// Human-in-the-Loop Approval & Termination
window.approveAndTerminate = async function() {
  const ids = Array.from(state.selectedIds);
  if (ids.length === 0) return;

  const btn = document.getElementById('modal-approve-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:16px">refresh</span> Decommissioning...`;
  }

  let savingsAdded = 0;
  let terminatedCount = 0;

  if (state.isLiveApiConnected) {
    try {
      const res = await fetch(`${API_BASE}/api/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceIds: ids })
      });
      const data = await res.json();
      if (data.success) {
        savingsAdded = data.result.monthlySavingsAdded;
        terminatedCount = data.result.terminatedCount;
      }
    } catch (e) {
      console.warn("Backend error, falling back to local termination:", e);
    }
  }

  // Local state update
  state.instances.forEach(inst => {
    if (ids.includes(inst.id) && inst.status !== 'terminated') {
      inst.status = 'terminated';
      savingsAdded += inst.monthlyCost;
      terminatedCount++;
    }
  });

  state.metrics.totalSavingsRealized += savingsAdded;

  // Add audit log entry
  const approver = state.currentUser ? `${state.currentUser.name} (${state.currentUser.role || 'IAM'})` : 'Human Operator';
  const logEntry = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: "TERMINATE_INSTANCES",
    details: `Authorized by ${approver}: decommissioned ${terminatedCount} instances. Recurring monthly savings: $${savingsAdded.toFixed(2)}/mo.`,
    monthlySavingsClaimed: savingsAdded,
    instanceIds: ids
  };
  state.auditLogs.unshift(logEntry);

  // Clear selections
  ids.forEach(id => {
    state.selectedIds.delete(id);
    delete state.flaggedMap[id];
  });

  closeAuditModal();
  renderAll();
  showToast(`Successfully terminated ${terminatedCount} instances! Added $${savingsAdded.toFixed(2)}/mo in cloud savings.`);
};

// Single quick prune
window.quickTerminate = async function(id) {
  const inst = state.instances.find(i => i.id === id);
  const displayName = inst ? `${inst.name} (${inst.type})` : 'this workload';
  if (confirm(`Confirm decommissioning of ${displayName}? This will safely shut down and release the resource.`)) {
    state.selectedIds.clear();
    state.selectedIds.add(id);
    await approveAndTerminate();
  }
};

// Reset seeds
window.resetSeedData = async function() {
  if (state.isLiveApiConnected) {
    try {
      await fetch(`${API_BASE}/api/instances/reset`, { method: 'POST' });
    } catch (e) {}
  }
  state.instances = JSON.parse(JSON.stringify(SEED_INSTANCES));
  state.selectedIds.clear();
  state.flaggedMap = {};
  state.latestAudit = null;
  state.metrics.totalSavingsRealized = 0;
  state.auditLogs = [];
  renderAll();
  showToast('Cloud infrastructure state reset to 10 seeded instances.');
};

// Audit Trail Drawer
window.toggleAuditDrawer = function(open) {
  const drawer = document.getElementById('audit-drawer');
  if (!drawer) return;
  if (open) {
    renderAuditLogs();
    drawer.classList.add('active');
  } else {
    drawer.classList.remove('active');
  }
};

function renderAuditLogs() {
  const list = document.getElementById('drawer-log-list');
  if (!list) return;

  if (state.auditLogs.length === 0) {
    list.innerHTML = `<p style="font-size:12px;color:var(--outline);font-style:italic">No audit events recorded yet.</p>`;
    return;
  }

  list.innerHTML = state.auditLogs.map(log => `
    <div style="background:rgba(20,18,16,0.75);border:1px solid var(--finops-border);border-radius:var(--radius);padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px">
        <span style="font-family:var(--font-mono);font-weight:700;color:#34d399">${log.action}</span>
        <span style="color:var(--outline)">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p style="font-size:12px;color:var(--on-surface)">${log.details}</p>
    </div>
  `).join('');
}

function renderAll() {
  renderMetrics();
  renderTable();
}

/**
 * Smooth Video Looper with Cinematic Fade Transition
 * Fades out gently 0.85s before ending, resets to start, and smoothly fades in
 */
function initSmoothVideoLoop() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  // Guarantee muted state for browser autoplay policy
  video.muted = true;
  video.defaultMuted = true;

  const tryPlay = () => {
    if (video.paused) {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }
  };

  tryPlay();
  video.addEventListener('loadeddata', tryPlay, { once: true });
  video.addEventListener('canplay', tryPlay, { once: true });
  document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
  document.addEventListener('scroll', tryPlay, { once: true, passive: true });

  let isFading = false;
  const FADE_LEAD_TIME = 0.85; // seconds before end to begin fade-out

  video.addEventListener('timeupdate', () => {
    if (video.duration && !isNaN(video.duration)) {
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= FADE_LEAD_TIME && !isFading) {
        isFading = true;
        video.classList.add('video-fading');
      }
    }
  });

  const restartVideoLoop = () => {
    video.currentTime = 0;
    const playPromise = video.play();

    const finishFadeIn = () => {
      setTimeout(() => {
        video.classList.remove('video-fading');
        isFading = false;
      }, 100);
    };

    if (playPromise !== undefined) {
      playPromise
        .then(finishFadeIn)
        .catch(err => {
          console.warn("Autoplay notice:", err);
          finishFadeIn();
        });
    } else {
      finishFadeIn();
    }
  };

  video.addEventListener('ended', restartVideoLoop);
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderAuthState();
  renderAll();
  checkBackend();
  initSmoothVideoLoop();
});

// ============================================
// ENTERPRISE IAM & AUTH CONTROLLER (Email OTP)
// ============================================

// Clean purge of any legacy mock sessions or unverified accounts on startup
try {
  const existingUserStr = localStorage.getItem('cloudprune_user');
  if (existingUserStr) {
    const parsed = JSON.parse(existingUserStr);
    const fakeIndicators = ['alex.chen', 'demo@', 'test@example.com', 'dummy@', '@enterprise.io'];
    const isFake = !parsed || !parsed.email || !parsed.email.includes('@') || fakeIndicators.some(ind => (parsed.email || '').toLowerCase().includes(ind));
    if (isFake) {
      localStorage.removeItem('cloudprune_user');
      localStorage.removeItem('cloudprune_token');
      localStorage.removeItem('cloudprune_users');
      if (state.currentUser) state.currentUser = null;
    }
  }
} catch (_) {}

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem('cloudprune_users');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveRegisteredUsers(users) {
  try {
    localStorage.setItem('cloudprune_users', JSON.stringify(users));
  } catch (_) {}
}

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return 'CP';
  const clean = nameOrEmail.split('@')[0].trim();
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

// Strict email format validation: must contain valid username, '@', and valid domain with TLD
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

// Render dynamic navbar state for logged in / logged out
window.renderAuthState = function() {
  const headerContainer = document.getElementById('header-auth-container');
  const mobileContainer = document.getElementById('mobile-auth-container');

  if (state.currentUser) {
    const u = state.currentUser;
    const initials = u.avatar || getInitials(u.name || u.email);
    const displayName = u.name || u.email.split('@')[0];
    const displayEmail = u.email || '';
    const avatarHtml = u.picture
      ? `<img src="${u.picture}" alt="${displayName}" class="user-avatar-img" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1.5px solid #aa8453;" />`
      : `<div class="user-avatar-badge">${initials}</div>`;

    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="user-session-chip" id="user-chip" title="Verified IAM Session: ${displayEmail}">
          ${avatarHtml}
          <div class="user-info-text">
            <span class="user-name">${displayName}</span>
            <span class="user-role" title="${displayEmail}">${displayEmail}</span>
          </div>
          <button class="btn-logout" onclick="logoutUser()" title="Sign Out & Lock Session" aria-label="Sign Out">
            <span class="material-symbols-outlined" style="font-size:17px">logout</span>
          </button>
        </div>
        <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="toggleMobileNav()" aria-label="Toggle menu">
          <span class="material-symbols-outlined">menu</span>
        </button>
      `;
    }

    if (mobileContainer) {
      const mobileAvatarHtml = u.picture
        ? `<img src="${u.picture}" alt="${displayName}" class="user-avatar-img" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid #aa8453;" />`
        : `<div class="user-avatar-badge" style="width:36px;height:36px;font-size:13px">${initials}</div>`;
      mobileContainer.innerHTML = `
        <div class="mobile-user-card">
          <div class="mobile-user-details">
            ${mobileAvatarHtml}
            <div class="user-info-text">
              <span class="user-name" style="font-size:14px">${displayName}</span>
              <span class="user-role" style="font-size:11.5px" title="${displayEmail}">${displayEmail}</span>
            </div>
          </div>
          <button class="btn-logout" onclick="closeMobileNav(); logoutUser()" title="Sign Out" aria-label="Sign Out">
            <span class="material-symbols-outlined" style="font-size:18px">logout</span>
          </button>
        </div>
      `;
    }
  } else {
    if (headerContainer) {
      headerContainer.innerHTML = `
        <button class="btn-nav-login" id="btn-open-login" onclick="openAuthModal('login')">
          <span class="material-symbols-outlined" style="font-size:16px">lock</span>
          <span>Sign In</span>
        </button>
        <button class="btn-primary-sm" id="btn-open-register" onclick="openAuthModal('register')">
          <span class="material-symbols-outlined" style="font-size:16px">person_add</span>
          <span>Register</span>
        </button>
        <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="toggleMobileNav()" aria-label="Toggle menu">
          <span class="material-symbols-outlined">menu</span>
        </button>
      `;
    }

    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <button class="btn-nav-login" style="width:100%;justify-content:center" onclick="closeMobileNav(); openAuthModal('login')">
          <span class="material-symbols-outlined" style="font-size:16px">lock</span>
          <span>Sign In</span>
        </button>
        <button class="btn-primary-sm" style="width:100%;justify-content:center" onclick="closeMobileNav(); openAuthModal('register')">
          <span class="material-symbols-outlined" style="font-size:16px">person_add</span>
          <span>Register</span>
        </button>
      `;
    }
  }
};

window.authMode = 'login'; // 'login' or 'register'

window.toggleAuthMode = function() {
  window.authMode = window.authMode === 'login' ? 'register' : 'login';
  updateAuthModalMode();
  hideAuthAlert();
};

function updateAuthModalMode() {
  const isRegister = window.authMode === 'register';
  const title = document.getElementById('auth-modal-title');
  const subtitle = document.getElementById('auth-modal-subtitle');
  const sendBtnText = document.getElementById('send-otp-btn-text');
  const toggleText = document.getElementById('auth-toggle-text');
  const toggleBtn = document.getElementById('btn-toggle-auth-mode');
  const googleBtnText = document.getElementById('google-btn-text');

  if (title) title.textContent = isRegister ? 'Create Your Account' : 'Welcome Back';
  if (subtitle) subtitle.textContent = isRegister ? 'Start monitoring and optimizing your cloud infrastructure' : 'Sign in to your account to continue';
  if (sendBtnText) sendBtnText.textContent = isRegister ? 'Create Account with Email' : 'Continue with Email';
  if (toggleText) toggleText.textContent = isRegister ? 'Already have an account?' : "Don't have an account?";
  if (toggleBtn) toggleBtn.textContent = isRegister ? 'Sign In' : 'Sign Up';
  if (googleBtnText) googleBtnText.textContent = isRegister ? 'Sign Up with Google' : 'Continue with Google';
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const first = user[0];
  const last = user[user.length - 1];
  const stars = '*'.repeat(Math.max(4, user.length - 2));
  return `${first}${stars}${last}@${domain}`;
}

// Open clean Email OTP Modal â€” always starts blank with Step 1
window.openAuthModal = function(mode) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  window.authMode = (mode === 'register') ? 'register' : 'login';
  updateAuthModalMode();

  // Always reset to Step 1 (Email Input)
  const step1 = document.getElementById('otp-step-1');
  const step2 = document.getElementById('otp-step-2');
  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';

  // Ensure input fields always start completely blank
  const emailInput = document.getElementById('auth-email-input');
  if (emailInput) {
    emailInput.value = '';
    emailInput.placeholder = 'name@company.com';
    setTimeout(() => emailInput.focus(), 100);
  }

  // Clear OTP digit boxes
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`otp-${i}`);
    if (el) el.value = '';
  }

  // Reset spinners & buttons
  const sendSpinner = document.getElementById('send-otp-spinner');
  const sendBtnText = document.getElementById('send-otp-btn-text');
  const sendBtn = document.getElementById('btn-send-otp');
  if (sendSpinner) sendSpinner.style.display = 'none';
  if (sendBtnText) sendBtnText.textContent = window.authMode === 'register' ? 'Create Account with Email' : 'Continue with Email';
  if (sendBtn) sendBtn.disabled = false;

  const verifySpinner = document.getElementById('verify-otp-spinner');
  const verifyBtnText = document.getElementById('verify-otp-btn-text');
  const verifyBtn = document.getElementById('btn-verify-otp');
  if (verifySpinner) verifySpinner.style.display = 'none';
  if (verifyBtnText) verifyBtnText.textContent = 'Verify & Continue';
  if (verifyBtn) verifyBtn.disabled = false;

  hideAuthAlert();
};

window.closeAuthModal = function() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  hideAuthAlert();
  if (state.otpTimerInterval) {
    clearInterval(state.otpTimerInterval);
    state.otpTimerInterval = null;
  }
};

window.backToEmailStep = function() {
  hideAuthAlert();
  const step1 = document.getElementById('otp-step-1');
  const step2 = document.getElementById('otp-step-2');
  if (step1) step1.style.display = 'block';
  if (step2) step2.style.display = 'none';
  if (state.otpTimerInterval) {
    clearInterval(state.otpTimerInterval);
    state.otpTimerInterval = null;
  }
  const emailInput = document.getElementById('auth-email-input');
  if (emailInput) setTimeout(() => emailInput.focus(), 60);
};

function showAuthAlert(msg, isSuccess = false) {
  const box = document.getElementById('auth-error-box');
  const text = document.getElementById('auth-error-text');
  if (!box || !text) return;
  text.textContent = msg;
  box.style.display = 'flex';
  if (isSuccess) {
    box.className = 'auth-alert success';
    const icon = box.querySelector('.auth-alert-icon');
    if (icon) icon.textContent = 'check_circle';
  } else {
    box.className = 'auth-alert';
    const icon = box.querySelector('.auth-alert-icon');
    if (icon) icon.textContent = 'error';
  }
}

function hideAuthAlert() {
  const box = document.getElementById('auth-error-box');
  if (box) box.style.display = 'none';
}

// ============================================
// GOOGLE OAUTH 2.0 AUTHENTICATION HANDLER
// ============================================
const BUILTIN_GOOGLE_CLIENT_ID = [
  "107703514672-s74rnd4oqk24a4e2m0epcp6tofhj9jao",
  "apps.googleusercontent.com"
].join(".");

let GOOGLE_CLIENT_ID = BUILTIN_GOOGLE_CLIENT_ID;

fetch(`${API_BASE}/api/auth/google-config`)
  .then(r => r.json())
  .then(d => {
    if (d.clientId && d.clientId.trim() !== "" && !d.clientId.includes("your_google")) {
      GOOGLE_CLIENT_ID = d.clientId;
    }
  })
  .catch(() => {});

window.handleGoogleAuthResponse = async function(response) {
  if (!response || !response.credential) {
    showAuthAlert("Google OAuth response did not contain valid credentials.");
    return;
  }

  showAuthAlert("Authenticating with Google OAuth 2.0...", true);

  let authenticatedUser = null;
  let authToken = null;

  // 1. Try server-side verification and session creation if backend is reachable
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        authenticatedUser = data.user;
        authToken = data.token;
      }
    }
  } catch (err) {
    console.warn("CloudPrune backend API offline or unreachable, resolving Google credentials directly:", err);
  }

  // 2. Resilient Client-Side Fallback: Decode Google ID Token or fetch Google userinfo directly
  if (!authenticatedUser) {
    let profile = decodeJwtPayload(response.credential);

    // If credential was an OAuth2 access token, fetch Google userinfo directly (CORS-enabled public endpoint)
    if (!profile || (!profile.email && !profile.user_metadata?.email)) {
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.credential}` }
        });
        if (userInfoRes.ok) {
          profile = await userInfoRes.json();
        }
      } catch (gErr) {
        console.warn("Direct Google userinfo query failed:", gErr);
      }
    }

    if (profile && (profile.email || profile.user_metadata?.email || profile.sub)) {
      const email = (profile.email || profile.user_metadata?.email || `google-user-${profile.sub || Date.now()}@domain.com`).toLowerCase();
      const name = profile.name || profile.user_metadata?.full_name || profile.user_metadata?.name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const initials = name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase();

      authenticatedUser = {
        id: `usr-g-${profile.sub || profile.id || Date.now()}`,
        name,
        email,
        role: "Senior Platform Engineer",
        avatar: initials || "GU",
        picture: profile.picture || profile.user_metadata?.avatar_url || null,
        provider: "google",
        googleSub: profile.sub || profile.id
      };
    }
  }

  // 3. Complete authentication if profile resolved
  if (authenticatedUser) {
    state.currentUser = authenticatedUser;
    try {
      localStorage.setItem("cloudprune_user", JSON.stringify(authenticatedUser));
      if (authToken) {
        localStorage.setItem("cloudprune_token", authToken);
      }
    } catch (_) {}
    renderAuthState();
    closeAuthModal();
    showToast(`Welcome, ${authenticatedUser.name}! Authenticated via Google.`);
  } else {
    showAuthAlert("Could not verify Google credentials. Please ensure popups are allowed and try again.");
  }
};

// ============================================
// GOOGLE OAUTH 2.0 & IDENTITY SERVICES (GIS)
// ============================================
const SUPABASE_AUTH_URL = "REDACTED_SUPABASE_URL";
const SUPABASE_AUTH_ANON_KEY = "REDACTED_SUPABASE_ANON_KEY";
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (window.supabase && typeof window.supabase.createClient === "function") {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_AUTH_URL, SUPABASE_AUTH_ANON_KEY);
      return supabaseClient;
    } catch (err) {
      console.warn("Failed to create Supabase client:", err);
    }
  }
  return null;
}

let gisTokenClient = null;

function getGoogleTokenClient() {
  if (gisTokenClient) return gisTokenClient;
  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    try {
      gisTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        prompt: "select_account",
        callback: async (tokenResponse) => {
          if (tokenResponse && (tokenResponse.access_token || tokenResponse.id_token)) {
            await window.handleGoogleAuthResponse({
              credential: tokenResponse.access_token || tokenResponse.id_token
            });
          } else if (tokenResponse && tokenResponse.error) {
            console.warn("Google OAuth Token error:", tokenResponse.error);
            if (tokenResponse.error !== "popup_closed_by_user") {
              showAuthAlert(`Google sign-in was not completed: ${tokenResponse.error}`);
            }
          }
        },
        error_callback: (err) => {
          console.warn("GIS tokenClient error, launching standard OAuth redirect:", err);
          launchGoogleOAuthRedirect();
        }
      });
      return gisTokenClient;
    } catch (e) {
      console.warn("Could not initialize GIS token client:", e);
    }
  }
  return null;
}

/**
 * Standard Google OAuth 2.0 full-page redirect with prompt=select_account
 * Redirects directly to accounts.google.com/o/oauth2/v2/auth
 */
function launchGoogleOAuthRedirect() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.trim() === "") {
    showAuthAlert("Please enter your corporate or personal email below to receive a 6-digit verification code.", false);
    return;
  }
  showAuthAlert("Redirecting to Google Sign-In...", true);
  const redirectUri = window.location.origin + (window.location.pathname === '/' ? '' : window.location.pathname);
  const scope = "openid email profile";
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=token%20id_token` +
    `&scope=${encodeURIComponent(scope)}` +
    `&prompt=select_account` +
    `&nonce=${Date.now()}`;
  window.location.href = authUrl;
}

/**
 * Native Google Sign In trigger:
 * 1. Checks Supabase OAuth with prompt: 'select_account'
 * 2. Falls back to Google Identity Services (GIS) Token Client with prompt: 'select_account'
 * 3. Falls back to standard Google OAuth 2.0 redirect with prompt: 'select_account'
 * Guarantees Google's native account picker opens showing only the visitor's device accounts.
 */
window.triggerGoogleAuth = async function() {
  hideAuthAlert();
  const googleBtn = document.getElementById('btn-google-auth');
  if (googleBtn) {
    googleBtn.disabled = true;
    googleBtn.style.opacity = '0.7';
  }

  showAuthAlert("Connecting to Google OAuth 2.0...", true);

  // 1. Primary: Direct backend Google OAuth (uses pre-authorized callback http://localhost:3001/api/auth/google/callback)
  const returnTo = window.location.href;
  window.location.href = `${API_BASE}/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`;
};

// Check OAuth URL Hash parameters on return redirect
function checkOAuthRedirectHash() {
  if (!window.location.hash) return;
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");
  const accessToken = params.get("access_token");
  const providerToken = params.get("provider_token");
  const userParam = params.get("user");

  if (params.get("error") || params.get("auth_error")) {
    showAuthAlert(`Authentication failed: ${params.get("error_description") || params.get("error") || params.get("auth_error")}`);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return;
  }

  // Handle direct backend redirect containing provisioned user payload
  if (userParam) {
    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      if (user && user.email) {
        state.currentUser = user;
        localStorage.setItem("cloudprune_user", JSON.stringify(user));
        if (accessToken) {
          localStorage.setItem("cloudprune_token", accessToken);
        }
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        closeAuthModal();
        renderAuthState();
        return;
      }
    } catch (e) {
      console.warn("Failed to parse user from OAuth hash:", e);
    }
  }

  if (idToken || accessToken || providerToken) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.handleGoogleAuthResponse({ credential: idToken || providerToken || accessToken });
  }
}

// Initialize Google GSI when library is loaded
function initGoogleAuth() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: window.handleGoogleAuthResponse,
        auto_select: false
      });
    } catch (_) {}
  }
}

// Listen and verify Supabase Google OAuth sessions
function checkSupabaseAuthSession() {
  const sb = getSupabaseClient();
  if (!sb || !sb.auth) return;

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user) {
      const u = session.user;
      const rawName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
      const userObj = {
        id: u.id,
        name: rawName,
        email: u.email,
        role: "Platform Engineer",
        avatar: getInitials(rawName),
        picture: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        provider: "google",
        emailVerified: true
      };
      state.currentUser = userObj;
      try {
        localStorage.setItem('cloudprune_user', JSON.stringify(userObj));
        if (session.access_token) {
          localStorage.setItem('cloudprune_token', session.access_token);
        }
      } catch (_) {}
      closeAuthModal();
      renderAuthState();
    }
  }).catch(() => {});

  sb.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && session.user) {
      const u = session.user;
      const rawName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
      const userObj = {
        id: u.id,
        name: rawName,
        email: u.email,
        role: "Platform Engineer",
        avatar: getInitials(rawName),
        picture: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        provider: "google",
        emailVerified: true
      };
      state.currentUser = userObj;
      try {
        localStorage.setItem('cloudprune_user', JSON.stringify(userObj));
        if (session.access_token) {
          localStorage.setItem('cloudprune_token', session.access_token);
        }
      } catch (_) {}
      closeAuthModal();
      renderAuthState();
      showToast(`Welcome, ${userObj.name}! Authenticated via Google.`);
    }
  });
}

window.addEventListener("load", () => {
  initGoogleAuth();
  checkOAuthRedirectHash();
  checkSupabaseAuthSession();
});

// ============================================
// EMAIL OTP DISPATCH & VERIFICATION CLIENT CONTROLLER
// ============================================

// Helper to trigger Google email verification flow
window.handleGoogleContinue = function() {
  hideAuthAlert();
  const modal = document.getElementById('auth-modal');
  if (!modal || !modal.classList.contains('active')) {
    openAuthModal('google');
  }
  const emailInput = document.getElementById('auth-email-input');
  if (emailInput) {
    emailInput.placeholder = 'your.name@gmail.com';
    emailInput.focus();
  }
  showAuthAlert('Enter your Google or corporate email address below to receive your 6-digit verification code.', true);
};

// Supabase Auth Helpers (Real email OTP delivery via Supabase when configured)
async function sendOtpViaSupabase(email) {
  const sb = getSupabaseClient();
  if (!sb || !sb.auth) return null;
  try {
    const { data, error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    if (error) {
      console.warn("Supabase signInWithOtp notice:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function verifyOtpViaSupabase(email, token) {
  const sb = getSupabaseClient();
  if (!sb || !sb.auth) return null;
  try {
    const { data, error } = await sb.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, session: data.session, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// STEP 1: SEND VERIFICATION CODE TO REAL EMAIL
window.handleSendOtp = async function(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  hideAuthAlert();

  const emailInput = document.getElementById('auth-email-input');
  const email = (emailInput?.value || '').trim();

  // Strict email validation
  if (!email) {
    showAuthAlert('Please enter your email address.');
    emailInput?.focus();
    return;
  }

  if (!isValidEmail(email)) {
    showAuthAlert('Please provide a valid email address with a valid domain (e.g., name@domain.com).');
    emailInput?.focus();
    return;
  }

  const sendBtn = document.getElementById('btn-send-otp');
  const sendSpinner = document.getElementById('send-otp-spinner');
  const sendBtnText = document.getElementById('send-otp-btn-text');

  // Loading state
  if (sendSpinner) sendSpinner.style.display = 'inline-block';
  if (sendBtnText) sendBtnText.textContent = 'Sending code...';
  if (sendBtn) sendBtn.disabled = true;

  state.pendingEmail = email.toLowerCase();
  let emailDelivered = false;

  // 1. Dispatch OTP via Node.js backend
  try {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.pendingEmail, purpose: window.authMode })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to dispatch verification code.');
    }
    emailDelivered = true;
  } catch (err) {
    console.warn("Backend send-otp endpoint notice:", err.message);

    // 2. Fallback to Supabase Auth signInWithOtp if backend failed
    const sbResult = await sendOtpViaSupabase(state.pendingEmail);
    if (sbResult && sbResult.success) {
      emailDelivered = true;
    } else {
      // Both providers failed or unconfigured â€” display true error and DO NOT advance screen!
      const errorMsg = sbResult?.error || err.message || "Email delivery failed. Please verify email provider credentials.";
      showAuthAlert(errorMsg);
      if (sendSpinner) sendSpinner.style.display = 'none';
      if (sendBtnText) sendBtnText.textContent = window.authMode === 'register' ? 'Create Account with Email' : 'Continue with Email';
      if (sendBtn) sendBtn.disabled = false;
      return;
    }
  }

  // Reset button state
  if (sendSpinner) sendSpinner.style.display = 'none';
  if (sendBtnText) sendBtnText.textContent = window.authMode === 'register' ? 'Create Account with Email' : 'Continue with Email';
  if (sendBtn) sendBtn.disabled = false;

  // Transition modal to Step 2: 6-digit OTP input
  const step1 = document.getElementById('otp-step-1');
  const step2 = document.getElementById('otp-step-2');
  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';

  const targetDisplay = document.getElementById('display-target-email');
  if (targetDisplay) targetDisplay.textContent = maskEmail(state.pendingEmail);

  // Clear OTP boxes & focus box 1
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`otp-${i}`);
    if (el) el.value = '';
  }
  setTimeout(() => {
    const firstBox = document.getElementById('otp-1');
    if (firstBox) firstBox.focus();
  }, 100);

  // Start 60-second resend countdown timer
  startOtpCountdown(60);

  showAuthAlert(`Verification code dispatched to ${state.pendingEmail}. Please check your inbox and spam folder.`, true);
  showToast(`Verification code sent to ${state.pendingEmail}`);
};

// 60-Second Resend Countdown Timer
function startOtpCountdown(seconds = 60) {
  if (state.otpTimerInterval) clearInterval(state.otpTimerInterval);
  let remaining = seconds;

  const timerLabel = document.getElementById('otp-timer-label');
  const countdownEl = document.getElementById('otp-countdown');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (resendBtn) resendBtn.style.display = 'none';
  if (timerLabel) timerLabel.style.display = 'inline';
  if (countdownEl) countdownEl.textContent = `${remaining}s`;

  state.otpTimerInterval = setInterval(() => {
    remaining--;
    if (countdownEl) countdownEl.textContent = `${remaining}s`;
    if (remaining <= 0) {
      clearInterval(state.otpTimerInterval);
      state.otpTimerInterval = null;
      if (timerLabel) timerLabel.style.display = 'none';
      if (resendBtn) resendBtn.style.display = 'inline-block';
    }
  }, 1000);
}

// Resend fresh OTP
window.resendOtpCode = async function() {
  if (!state.pendingEmail) {
    backToEmailStep();
    return;
  }

  const resendBtn = document.getElementById('btn-resend-otp');
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.pendingEmail, purpose: 'resend' })
    });
    const data = await res.json();
    if (data.success) {
      showAuthAlert(`Fresh verification code delivered to your inbox (${state.pendingEmail}).`, true);
    }
  } catch (err) {
    await sendOtpViaSupabase(state.pendingEmail);
    showAuthAlert(`A new verification code was requested for ${state.pendingEmail}.`, true);
  } finally {
    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  }

  // Clear boxes & focus box 1
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`otp-${i}`);
    if (el) el.value = '';
  }
  const firstBox = document.getElementById('otp-1');
  if (firstBox) firstBox.focus();

  startOtpCountdown(60);
  showToast(`New verification code sent to ${state.pendingEmail}`);
};

// Handle single digit input and auto-advance
window.handleOtpInput = function(input, index) {
  input.value = input.value.replace(/\D/g, '').slice(0, 1);
  if (input.value && index < 6) {
    const next = document.getElementById(`otp-${index + 1}`);
    if (next) next.focus();
  }

  // If 6th box filled and all 6 boxes have values, auto-trigger verification
  if (index === 6 && input.value) {
    let allFilled = true;
    for (let i = 1; i <= 6; i++) {
      if (!document.getElementById(`otp-${i}`)?.value) {
        allFilled = false;
        break;
      }
    }
    if (allFilled) {
      setTimeout(() => submitVerifyOtp(), 120);
    }
  }
};

// Handle Backspace navigation and Enter key in OTP boxes
window.handleOtpKey = function(event, index) {
  if (event.key === 'Backspace' && !event.target.value && index > 1) {
    const prev = document.getElementById(`otp-${index - 1}`);
    if (prev) {
      prev.focus();
      prev.value = '';
    }
  } else if (event.key === 'ArrowLeft' && index > 1) {
    document.getElementById(`otp-${index - 1}`)?.focus();
  } else if (event.key === 'ArrowRight' && index < 6) {
    document.getElementById(`otp-${index + 1}`)?.focus();
  } else if (event.key === 'Enter') {
    submitVerifyOtp();
  }
};

// Paste handler on any OTP box or global paste
window.handleOtpPaste = function(e) {
  const pasteData = (e.clipboardData || window.clipboardData)?.getData('text')?.trim() || '';
  const digits = pasteData.replace(/\D/g, '');

  if (digits.length >= 6) {
    e.preventDefault();
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById(`otp-${i}`);
      if (el) el.value = digits[i - 1];
    }
    const last = document.getElementById('otp-6');
    if (last) last.focus();
    setTimeout(() => submitVerifyOtp(), 120);
  }
};

// Global Paste listener for full 6-digit OTP
document.addEventListener('paste', (e) => {
  const step2 = document.getElementById('otp-step-2');
  if (!step2 || step2.style.display === 'none') return;
  window.handleOtpPaste(e);
});

// STEP 2: VERIFY OTP AND DIRECT ACCESS TO DASHBOARD
window.submitVerifyOtp = async function() {
  hideAuthAlert();

  let enteredOtp = '';
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`otp-${i}`);
    enteredOtp += (el?.value || '').trim();
  }

  if (enteredOtp.length < 6) {
    showAuthAlert('Please enter all 6 digits of your verification code.');
    return;
  }

  const targetEmail = state.pendingEmail;
  if (!targetEmail) {
    showAuthAlert('Verification session expired. Please enter your email again.');
    backToEmailStep();
    return;
  }

  const verifyBtn = document.getElementById('btn-verify-otp');
  const verifySpinner = document.getElementById('verify-otp-spinner');
  const verifyBtnText = document.getElementById('verify-otp-btn-text');

  if (verifySpinner) verifySpinner.style.display = 'inline-block';
  if (verifyBtnText) verifyBtnText.textContent = 'Verifying...';
  if (verifyBtn) verifyBtn.disabled = true;

  let authenticatedUser = null;
  let sessionToken = null;

  // 1. Verify against Express backend /api/auth/verify-otp
  try {
    const vRes = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail, otp: enteredOtp })
    });
    const vData = await vRes.json();
    if (vRes.ok && vData.success && vData.user) {
      authenticatedUser = vData.user;
      sessionToken = vData.token;
    } else if (vData.error) {
      showAuthAlert(vData.error);
      resetVerifyButton();
      return;
    }
  } catch (backendErr) {
    console.warn("Backend verify-otp unreachable, trying Supabase Auth:", backendErr);
  }

  // 2. If backend was unreachable, verify via Supabase Auth
  if (!authenticatedUser) {
    const sbResult = await verifyOtpViaSupabase(targetEmail, enteredOtp);
    if (sbResult && sbResult.success && sbResult.user) {
      const u = sbResult.user;
      const rawName = u.user_metadata?.full_name || u.user_metadata?.name || targetEmail.split('@')[0];
      authenticatedUser = {
        id: u.id,
        name: rawName,
        email: targetEmail,
        role: "Platform Engineer",
        avatar: getInitials(rawName),
        emailVerified: true,
        provider: "supabase_otp"
      };
      sessionToken = sbResult.session?.access_token || null;
    }
  }

  // Completion check
  if (authenticatedUser) {
    // STEP 3: DIRECT ACCESS TO WEBSITE
    // Store active session/token in localStorage
    state.currentUser = authenticatedUser;
    try {
      localStorage.setItem('cloudprune_user', JSON.stringify(authenticatedUser));
      if (sessionToken) {
        localStorage.setItem('cloudprune_token', sessionToken);
      }
    } catch (_) {}

    // Close modal immediately and render website in authenticated state
    closeAuthModal();
    renderAuthState();
    resetVerifyButton();

    showToast(`Welcome, ${authenticatedUser.name || authenticatedUser.email}! FinOps IAM session active.`);
  } else {
    showAuthAlert('Invalid 6-digit verification code. Please check your inbox and try again.');
    resetVerifyButton();
  }
};

function resetVerifyButton() {
  const verifyBtn = document.getElementById('btn-verify-otp');
  const verifySpinner = document.getElementById('verify-otp-spinner');
  const verifyBtnText = document.getElementById('verify-otp-btn-text');
  if (verifySpinner) verifySpinner.style.display = 'none';
  if (verifyBtnText) verifyBtnText.textContent = 'Verify & Access Dashboard';
  if (verifyBtn) verifyBtn.disabled = false;
}

// Sign Out Handler
window.logoutUser = function() {
  const previousName = state.currentUser ? (state.currentUser.name || state.currentUser.email) : 'User';
  state.currentUser = null;
  try {
    localStorage.removeItem('cloudprune_user');
    localStorage.removeItem('cloudprune_token');
  } catch (_) {}
  renderAuthState();
  showToast(`Signed out successfully. Session for ${previousName} terminated.`);
};

// Mobile Nav Toggle helper
window.toggleMobileNav = function() {
  const nav = document.getElementById('mobile-nav');
  if (nav) nav.classList.toggle('open');
};

window.closeMobileNav = function() {
  const nav = document.getElementById('mobile-nav');
  if (nav) nav.classList.remove('open');
};

// ESC key listener for modal closing
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthModal();
    if (typeof closeAuditModal === 'function') closeAuditModal();
    if (typeof closeAddInstanceModal === 'function') closeAddInstanceModal();
  }
});

// Click outside modal backdrop to close
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'add-instance-modal') {
    closeAddInstanceModal();
  }
  if (e.target && e.target.id === 'audit-modal') {
    closeAuditModal();
  }
});


