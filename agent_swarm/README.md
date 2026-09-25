# 🐝 ChurnGuard AI: Autonomous Customer Churn Prevention Swarm

> **A Production-Grade, Sequential Multi-Agent System with Human-In-The-Loop (HITL) Guardrails built for the Agentic AI Hackathon.**

[![LangGraph](https://img.shields.io/badge/Orchestrator-LangGraph-blue.svg)](https://github.com/langchain-ai/langgraph)
[![Python](https://img.shields.io/badge/Backend-Python%203.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary

Modern subscription enterprises hemorrhage high-value accounts not because customers leave impulsively, but because **churn signals are scattered across disparate software silos** (product metrics, CRM history, customer support tickets). Customer Success teams lack the bandwidth to manually cross-reference telemetry, diagnose unique friction points, and craft bespoke retention campaigns before contract termination occurs.

**ChurnGuard AI** deploys an autonomous multi-agent swarm that eliminates repetitive coordination and proactive retention paralysis:
1. **Detects**: Continuous telemetry ingestion flags accounts experiencing statistical drops in login velocity and feature utilization.
2. **Diagnoses**: Cross-references historical CRM notes, contract terms, and open bug tickets to identify the exact root cause of disengagement.
3. **Prescribes**: Custom-crafts an individualized retention incentive (e.g., dedicated architect pairing sessions, VIP support SLA credits, compliance engineering sprints, or feature masterclasses) rather than margin-destroying generic discounts.
4. **Stages & Safeguards**: Drafts personalized executive communications, updates CRM deal stages, posts Slack alerts, schedules calendar syncs, and logs analytics events — pausing at a strict **Human-In-The-Loop (HITL)** approval gate before any message is sent.

---

## 🧠 System Architecture & Swarm Topology

ChurnGuard AI is structured as a sequential `StateGraph` where each agent has specialized tool access and bounded responsibilities:

```
[ Raw Telemetry Stream ] ──► (1) Data Agent
                                  │  Calculates multi-factor churn score
                                  │  (login drops, feature util, bugs, inactivity)
                                  ▼
                             (2) Strategy Agent ◄──► [ CRM Toolkit (Mock API) ]
                                  │  Diagnoses root cause & prescribes offer
                                  │  Queries: history, tickets, NPS, contracts
                                  ▼
                             (3) Action Agent ────► [ CRM Stage Sync ]
                                  │                 [ Slack Alerts ]
                                  │                 [ Calendar Scheduling ]
                                  │                 [ Analytics Logging ]
                                  │  Drafts executive email & follow-up task
                                  ▼
                             ⏸️ [ Human-In-The-Loop Approval Gate ]
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
            [APPROVED]                       [DISMISSED]
                  │                               │
        [ Communication Tool ]           [ Mark False Positive ]
        [ Calendar Tool ]                [ Log Feedback to DB ]
        [ Slack Confirmation ]           [ Model Retraining Signal ]
        (Dispatches Outreach)
```

### The 3 Core Agents

| Agent | Core Responsibility | Tools & Capabilities |
| :--- | :--- | :--- |
| **1. Data Agent** | Ingests usage telemetry, calculates weighted churn score based on login drops, feature utilization, bug tickets, support volume, and inactivity duration. | Anomaly detection algorithm, Threshold evaluation, Risk categorization (CRITICAL/HIGH/MEDIUM). |
| **2. Strategy Agent** | Diagnoses the underlying customer pain point and creates a tailored, high-converting retention incentive. Considers compliance requirements, team turnover, budget pressure, and technical friction. | `CRMToolkit.get_account_history()`, `CRMToolkit.get_open_tickets()`, Root-cause classifier with 6 strategy branches. |
| **3. Action Agent** | Synthesizes personalized executive emails, synchronizes CRM deal stages, posts Slack alerts, creates incident threads, schedules calendar meetings, logs analytics, and creates task milestones. | `CRMToolkit.update_crm_record()`, `CommunicationToolkit.send_retention_email()`, `SlackToolkit.post_alert()`, `CalendarToolkit.schedule_meeting()`, `AnalyticsToolkit.log_intervention()`. |
| **Supervisor Gate** | Holds execution state until the Human Manager verifies the proposed intervention. Logs all decisions to persistent JSON audit trail. | LangGraph interrupt mechanism, StateGraph checkpointing, `AuditTrailLogger`. |

### Integrated Tool Ecosystem (6 Mock Integrations)

| Tool | Integration | Purpose |
| :--- | :--- | :--- |
| `CRMToolkit` | Salesforce / HubSpot | Account history, open tickets, contract terms, NPS scores, deal stage updates |
| `CommunicationToolkit` | Transactional Email (SendGrid) | Personalized retention outreach dispatch, follow-up reminders |
| `SlackToolkit` | Slack Workspace | Internal CS team alerts, incident thread creation, approval confirmations |
| `CalendarToolkit` | Google Calendar / Outlook | Executive sync scheduling, meeting proposals |
| `AnalyticsToolkit` | Data Warehouse | Intervention event logging, retention campaign tracking |
| `AuditTrailLogger` | Local JSON Persistence | Immutable audit trail of all swarm decisions, approvals, and dispatches |

---

## 📂 Repository File Structure

```
agent_swarm/
├── swarm.py                 # Complete Python LangGraph / StateGraph backend pipeline
│                            # 6 mock tool integrations, 6 sample accounts,
│                            # batch processing, and persistent JSON audit trail
├── dashboard.tsx            # Next.js 14 / Tailwind real-time Agent Monitoring Dashboard
│                            # KPI metrics bar, 4 at-risk accounts, audit trail drawer,
│                            # account telemetry bars, and email preview toggle
├── HACKATHON_SUBMISSION.md  # Official Problem/Solution text, alternative concepts,
│                            # 3-min video demo script, and evaluation criteria matrix
├── audit_trail.json         # Auto-generated persistent audit trail (created on first run)
└── README.md                # Comprehensive project documentation (this file)
```

---

## 🔧 Prerequisites

| Dependency | Version | Required? | Notes |
| :--- | :--- | :--- | :--- |
| Python | 3.10+ | ✅ | Core runtime for the swarm backend |
| Node.js | 18+ | Optional | Only for running the Next.js frontend dashboard |
| npm | 9+ | Optional | Package manager for frontend dependencies |
| LangGraph | Latest | Optional | Auto-falls back to deterministic harness if not installed |
| Pydantic | v2+ | Optional | Auto-falls back to dataclass shim if not installed |

---

## ⚡ Getting Started (Local Setup)

### Option A: Run the Python Swarm CLI Backend

The Python backend is zero-dependency compatible (includes automatic standard library fallbacks if LangGraph/Pydantic are not pre-installed).

1. **Clone or navigate to the directory**:
   ```bash
   cd agent_swarm
   ```

2. **(Optional) Install LangGraph and Pydantic**:
   ```bash
   pip install langgraph pydantic
   ```

3. **Execute the Swarm Simulation**:
   ```bash
   python swarm.py
   ```

**Expected CLI Output**:
```
======================================================================
 🚀 INITIATING AUTONOMOUS CUSTOMER CHURN PREVENTION SWARM
    Run ID: run_a8f2c1e903
    Agents: DataAgent -> StrategyAgent -> ActionAgent -> HumanGate
======================================================================

[16:22:49.857] [DATA_AGENT] Initiating telemetry ingestion across active accounts...
[16:22:49.858] [DATA_AGENT] FLAGGED [CRITICAL]: Apex Quant Capital (acc-9412) | Risk: 74.2% | Login Drop: -74.2% | Feature Score: 2.1/10 | Unresolved: 3
[16:22:49.858] [DATA_AGENT] FLAGGED [CRITICAL]: MedVault Health Systems (acc-7203) | Risk: 71.8% | Login Drop: -62.8% | Feature Score: 3.4/10 | Unresolved: 3
[16:22:49.858] [DATA_AGENT] FLAGGED [HIGH]: Veloce Logistics API (acc-8104) | Risk: 58.0% | Login Drop: -54.1% | Feature Score: 3.8/10 | Unresolved: 0
[16:22:49.858] [DATA_AGENT] FLAGGED [MEDIUM]: BrightPath EdTech (acc-6550) | Risk: 55.2% | Login Drop: -48.5% | Feature Score: 4.2/10 | Unresolved: 0
[16:22:49.858] [DATA_AGENT] Telemetry scan complete. 4 high-risk accounts flagged, 2 accounts healthy.
[16:22:49.858] [STRATEGY_AGENT] Analyzing customer lifetime context for Apex Quant Capital...
[16:22:49.858] [STRATEGY_AGENT] CRM context retrieved: NPS=6/10, Renewal=2026-11-30, Open Tickets=2, Industry=FinTech
[16:22:49.858] [STRATEGY_AGENT] Strategy formulated [CRITICAL]: 'Dedicated Solutions Architect Pairing + Priority SLA'. Confidence: 94%. Est. save: $42,588/yr
[16:22:49.858] [ACTION_AGENT] Drafting tailored outreach and CRM changes for Apex Quant Capital...
 [CRM TOOL] Updated acc-9412 -> Stage: 'AT_RISK_INTERVENTION_REQUIRED', Task: 'High-Priority Executive Sync (within 48h)'
 [SLACK TOOL] 🔴 Posted to #cs-critical-alerts: 🚨 Churn risk detected: Apex Quant Capital...
 [ANALYTICS TOOL] Logged intervention for acc-9412: Dedicated Solutions Architect Pairing (est. $42,588)
[16:22:49.858] [HITL_SUPERVISOR] Approval paused. Action queued in Human Review Console.

======================================================================
 📋 SWARM BATCH SUMMARY — 4 Accounts Processed
======================================================================

  [1] Apex Quant Capital (acc-9412)
      MRR: $8,450/mo | Risk: 74.2% [CRITICAL]
      Cause: Technical Friction & Unresolved Performance Bottlenecks
      Offer: Complimentary 30-day Enterprise VIP Support credit ($1,200 value)...
      Status: AWAITING_OPERATOR_CLICK

  [2] MedVault Health Systems (acc-7203)
      MRR: $13,000/mo | Risk: 71.8% [CRITICAL]
      Cause: Compliance-Blocking Technical Gaps (SOC2/HIPAA Certification Risk)
      Offer: Dedicated 2-week compliance engineering sprint...
      Status: AWAITING_OPERATOR_CLICK

  [3] Veloce Logistics API (acc-8104)
      MRR: $3,200/mo | Risk: 58.0% [HIGH]
      Cause: Feature Disengagement & Team Adoption Stagnation
      Offer: Custom 45-minute workflow migration workshop...
      Status: AWAITING_OPERATOR_CLICK

  [4] BrightPath EdTech (acc-6550)
      MRR: $2,000/mo | Risk: 55.2% [MEDIUM]
      Cause: Budget Pressure & Competitive Evaluation
      Offer: Custom ROI impact report showing platform value...
      Status: AWAITING_OPERATOR_CLICK

──────────────────────────────────────────────────────────────────────
  Total MRR at Risk:      $26,650/mo ($319,800/yr)
  Estimated Retention:    $153,708/yr
  Accounts Queued:        4
  Awaiting HITL Approval: 4
──────────────────────────────────────────────────────────────────────

--- [SIMULATING HUMAN OPERATOR CLICKING 'APPROVE & DISPATCH'] ---
[16:22:49.858] [HITL_SUPERVISOR] Manager APPROVAL RECEIVED for Apex Quant Capital.
 [EMAIL TOOL] Dispatched retention outreach to: sarah.jenkins@apexquant.io
               Subject: Optimizing Apex Quant Capital's Workflow & Dedicated Technical Resources
 [CALENDAR TOOL] Scheduled 'Executive Sync: Apex Quant Capital Retention Review' (30min)
 [EMAIL TOOL] Scheduled follow-up reminder for Apex Quant Capital -> elena.rostova@cloudprune.ai
Final Status: APPROVED (Dispatched: True)
```

---

### Option B: Mount the Frontend Agent Monitoring Dashboard

The frontend scaffold in [`dashboard.tsx`](./dashboard.tsx) is a drop-in component designed for Next.js 13/14 App Router with Tailwind CSS and Lucide React.

1. **Add dependencies**:
   ```bash
   npm install lucide-react clsx tailwind-merge
   ```

2. **Mount the page**:
   Place `dashboard.tsx` inside your Next.js app directory (e.g. `app/swarm/page.tsx` or `pages/swarm.tsx`).

3. **Run your development server**:
   ```bash
   npm run dev
   ```

4. **Interact with the Live Dashboard**:
   - View the **KPI Metrics Bar** showing MRR at Risk, Accounts Flagged, Avg Risk Score, and Revenue Saved.
   - Watch the **Live Telemetry Terminal** render real-time agent execution events.
   - Click **"Run Swarm Trigger"** to simulate an automated ingest-and-reason cycle.
   - Inspect the **At-Risk Accounts Queue** with risk category badges (CRITICAL/HIGH/MEDIUM).
   - Review account **telemetry mini-bars** (Login Drop, Feature Use, Open Bugs, Days Inactive).
   - Read the **Strategy Agent Root-Cause Diagnosis** and **Action Agent Outbound Email Draft**.
   - Click **"Approve & Dispatch Outreach"** to experience the Human-In-The-Loop safety gate.
   - Open the **Audit Trail Drawer** to review the full decision history.

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | — | Google Gemini API key for AI-powered strategy reasoning (not used in mock mode) |
| `SLACK_WEBHOOK_URL` | Optional | — | Slack incoming webhook for real notifications (mock by default) |
| `CRM_API_KEY` | Optional | — | Salesforce/HubSpot API key for live CRM sync (mock by default) |
| `SENDGRID_API_KEY` | Optional | — | SendGrid API key for real email dispatch (mock by default) |

> **Note**: All tools operate in mock mode by default for hackathon demo purposes. No external API keys are required to run the full simulation.

---

## 📡 Swarm API Reference (CLI Mode)

| Function | Module | Description |
| :--- | :--- | :--- |
| `run_swarm_batch(accounts, auto_approve)` | `swarm.py` | Processes all accounts through the full pipeline, returns batch results |
| `data_agent_node(state)` | `swarm.py` | Telemetry ingestion and risk scoring node |
| `strategy_agent_node(state)` | `swarm.py` | CRM context synthesis and strategy formulation node |
| `action_agent_node(state)` | `swarm.py` | Email drafting, CRM sync, Slack alerts, and analytics logging node |
| `human_approval_gate(state)` | `swarm.py` | HITL checkpoint with conditional dispatch |
| `build_churn_prevention_graph()` | `swarm.py` | Compiles the LangGraph StateGraph (with fallback) |

---

## 🧪 Risk Scoring Algorithm

The Data Agent calculates churn risk using a **weighted multi-factor composition**:

```python
risk = (
    (login_frequency_drop / 100.0 * 0.35) +       # 35% weight: Login velocity decline
    ((10.0 - feature_utilization) / 10.0 * 0.25) + # 25% weight: Feature underutilization
    (min(unresolved_bugs, 5) / 5.0 * 0.15) +       # 15% weight: Unresolved bug friction
    (min(days_inactive, 30) / 30.0 * 0.15) +        # 15% weight: Account inactivity duration
    (min(support_tickets, 10) / 10.0 * 0.10)        # 10% weight: Support ticket volume
)
```

| Risk Score | Category | Action |
| :--- | :--- | :--- |
| ≥ 70% | **CRITICAL** | Immediate executive intervention (24h deadline) |
| ≥ 60% | **HIGH** | Priority retention campaign (48h deadline) |
| ≥ 55% | **MEDIUM** | Proactive outreach (1-week deadline) |
| < 55% | **Healthy** | No action required |

---

## 🛡️ Enterprise Value & Hackathon Highlights

- **Autonomous Coordination**: Eliminates the manual friction between Product Telemetry teams, CSMs, and Sales Account Executives.
- **Deep Contextual Personalization**: Rather than blanket margin-killing discounts, the Strategy Agent identifies the exact technical, adoption, compliance, or budget bottleneck.
- **Multi-Channel Action Execution**: The Action Agent simultaneously syncs CRM deal stages, posts Slack alerts, schedules calendar meetings, and logs analytics — all in a single pipeline pass.
- **Human-In-The-Loop Safety Guardrails**: Prevents brand-damaging automated hallucinations by keeping the human manager in the decision loop for high-value contractual commitments.
- **Auditable & Traceable**: Every action, tool query, approval decision, and supervisor override is logged in a structured, persistent JSON audit trail.
- **Batch Processing**: Processes all flagged accounts in a single swarm run, prioritized by risk score (highest risk first).
- **Zero-Dependency Mode**: Runs with pure Python standard library if LangGraph/Pydantic are not installed — ideal for rapid hackathon evaluation.

---

## 🏆 Hackathon Evaluation Criteria Alignment

| Criteria | How ChurnGuard AI Addresses It |
| :--- | :--- |
| **Problem Significance** | Customer churn costs SaaS companies 5-25% of revenue annually; our system targets the #1 cause of preventable churn: fragmented response workflows. |
| **Agentic Autonomy** | Three specialized agents operate autonomously with bounded tool access, requiring zero human input until the final approval gate. |
| **Multi-Agent Collaboration** | Sequential StateGraph ensures data flows through detection → diagnosis → action with each agent enriching the shared state context. |
| **Tool Integration** | 6 mock tool integrations (CRM, Email, Slack, Calendar, Analytics, Audit) demonstrate real-world enterprise API patterns. |
| **Human-In-The-Loop** | LangGraph interrupt mechanism with persistent state checkpointing ensures human oversight on high-stakes decisions. |
| **Technical Depth** | Weighted risk scoring algorithm, multi-branch strategy classification, context-aware email templating, and persistent audit trail. |
| **Frontend Quality** | Production-grade dark obsidian dashboard with KPI metrics, real-time terminal feed, risk categorization, and slide-over audit drawer. |

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
