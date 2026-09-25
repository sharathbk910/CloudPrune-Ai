"""
Autonomous Customer Churn Prevention Swarm
Multi-Agent Orchestration built with LangGraph & Pydantic
Agents:
  1. Data Agent: Monitors engagement telemetry and identifies at-risk accounts.
  2. Strategy Agent: Analyzes user historical context and formulates customized retention interventions.
  3. Action Agent: Drafts executive communications, syncs CRM records, and schedules SRE/CS tasks.
Includes: Human-In-The-Loop (HITL) approval gate before dispatching outbound communications.
"""

import os
import sys
import json
import uuid
import hashlib
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta

# Ensure clean UTF-8 console output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    from pydantic import BaseModel, Field
except ImportError:
    from dataclasses import dataclass, field
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    def Field(default=None, **kwargs):
        return default

# ============================================================================
# 1. DOMAIN SCHEMAS & DATA STRUCTURES
# ============================================================================

class AccountTelemetry(BaseModel):
    account_id: str
    company_name: str
    tier: str  # Enterprise, Growth, Starter
    monthly_recurring_revenue: float
    login_frequency_drop_pct: float
    feature_utilization_score: float  # 0.0 - 10.0
    support_tickets_count: int
    unresolved_bugs: int
    days_since_last_active: int
    churn_risk_score: float  # 0.0 - 1.0 (calculated)
    primary_contact_email: str
    primary_contact_name: str

class RetentionStrategy(BaseModel):
    account_id: str
    root_cause: str
    recommended_tier_action: str  # Discount, Executive Check-in, Dedicated Engineer, Training
    incentive_details: str
    expected_retention_lift: str
    strategy_confidence: float
    risk_category: str  # CRITICAL, HIGH, MEDIUM
    estimated_save_value: float  # Dollar value of retention

class ActionExecution(BaseModel):
    account_id: str
    email_subject: str
    email_body_preview: str
    crm_deal_stage: str
    follow_up_task: str
    follow_up_deadline: str
    slack_channel: str
    requires_human_approval: bool = True
    approval_status: str = "PENDING_REVIEW"  # PENDING_REVIEW, APPROVED, REJECTED
    dispatched: bool = False

class SwarmState(TypedDict):
    """Global execution context passed sequentially between LangGraph nodes."""
    raw_accounts: List[Dict[str, Any]]
    flagged_accounts: List[AccountTelemetry]
    current_index: int
    active_account: Optional[AccountTelemetry]
    retention_strategy: Optional[RetentionStrategy]
    action_plan: Optional[ActionExecution]
    execution_logs: List[Dict[str, str]]
    is_approved: bool
    batch_results: List[Dict[str, Any]]
    swarm_run_id: str

# ============================================================================
# 2. AGENT TOOLS & INTEGRATION INTERFACES (Mocks)
# ============================================================================

class CRMToolkit:
    """Mock CRM integration for Salesforce / HubSpot API."""
    
    _account_histories = {
        "acc-9412": {
            "contract_renewal_date": "2026-11-30",
            "net_promoter_score": 6,
            "past_discounts_applied": 0,
            "account_executive": "Elena Rostova",
            "industry": "FinTech / High-Frequency Ledger",
            "contract_value_total": 101400.0,
            "customer_since": "2024-03-15",
            "escalation_count": 2,
            "historical_notes": (
                "Customer scaled usage rapidly in Q1. Recently reported bottlenecks "
                "with distributed ledger query latency. Support ticket #8942 remained "
                "unresolved for 14 days. VP of Engineering expressed frustration in "
                "last QBR call."
            )
        },
        "acc-8104": {
            "contract_renewal_date": "2026-09-15",
            "net_promoter_score": 5,
            "past_discounts_applied": 1,
            "account_executive": "Marcus Webb",
            "industry": "Logistics / Supply Chain SaaS",
            "contract_value_total": 38400.0,
            "customer_since": "2024-08-01",
            "escalation_count": 0,
            "historical_notes": (
                "Team adopted v1 Webhook pipeline enthusiastically. After Q3 team "
                "turnover (2 senior devs left), adoption stalled. v2 migration "
                "never completed. Feature utilization dropped sharply post-turnover."
            )
        },
        "acc-7203": {
            "contract_renewal_date": "2027-01-31",
            "net_promoter_score": 4,
            "past_discounts_applied": 0,
            "account_executive": "Priya Nair",
            "industry": "HealthTech / HIPAA-Regulated Platform",
            "contract_value_total": 156000.0,
            "customer_since": "2023-11-20",
            "escalation_count": 3,
            "historical_notes": (
                "Enterprise customer with strict compliance requirements. Recent "
                "SOC2 audit revealed gaps in our logging API that blocked their "
                "HIPAA certification renewal. CTO raised concerns directly with "
                "our VP of Engineering. Contract renewal at significant risk."
            )
        },
        "acc-6550": {
            "contract_renewal_date": "2026-12-31",
            "net_promoter_score": 7,
            "past_discounts_applied": 2,
            "account_executive": "Jordan Blake",
            "industry": "EdTech / Learning Management",
            "contract_value_total": 24000.0,
            "customer_since": "2025-01-10",
            "escalation_count": 0,
            "historical_notes": (
                "Small but growing account. Budget review triggered by university "
                "fiscal year transition. Dean's office evaluating competing LMS "
                "platforms with lower sticker price. Need to demonstrate ROI."
            )
        }
    }
    
    @staticmethod
    def get_account_history(account_id: str) -> Dict[str, Any]:
        """Fetches historical contract terms, previous churn signals, and CS notes."""
        if account_id in CRMToolkit._account_histories:
            return {"account_id": account_id, **CRMToolkit._account_histories[account_id]}
        return {
            "account_id": account_id,
            "contract_renewal_date": "2026-12-31",
            "net_promoter_score": 6,
            "past_discounts_applied": 0,
            "account_executive": "Unassigned",
            "industry": "General SaaS",
            "contract_value_total": 0.0,
            "customer_since": "2025-01-01",
            "escalation_count": 0,
            "historical_notes": "No historical notes available for this account."
        }

    @staticmethod
    def update_crm_record(account_id: str, stage: str, task: str) -> bool:
        """Updates account health status and schedules high-priority account task."""
        print(f" [CRM TOOL] Updated {account_id} -> Stage: '{stage}', Task: '{task}'")
        return True

    @staticmethod
    def get_open_tickets(account_id: str) -> List[Dict[str, Any]]:
        """Retrieves open support tickets for an account."""
        tickets = {
            "acc-9412": [
                {"ticket_id": "TKT-8942", "severity": "P1", "subject": "Ledger query latency >2s", "age_days": 14, "status": "OPEN"},
                {"ticket_id": "TKT-9101", "severity": "P2", "subject": "Batch export timeout on large datasets", "age_days": 7, "status": "IN_PROGRESS"}
            ],
            "acc-7203": [
                {"ticket_id": "TKT-7788", "severity": "P1", "subject": "Audit log missing HIPAA-required fields", "age_days": 21, "status": "OPEN"},
                {"ticket_id": "TKT-7801", "severity": "P1", "subject": "SOC2 compliance gap in API auth flow", "age_days": 18, "status": "OPEN"},
                {"ticket_id": "TKT-7899", "severity": "P2", "subject": "Data retention policy not configurable", "age_days": 10, "status": "IN_PROGRESS"}
            ]
        }
        return tickets.get(account_id, [])


class CommunicationToolkit:
    """Mock transactional email and webhook notification dispatcher."""

    @staticmethod
    def send_retention_email(to_email: str, subject: str, body: str) -> Dict[str, Any]:
        print(f" [EMAIL TOOL] Dispatched retention outreach to: {to_email}")
        print(f"               Subject: {subject}")
        return {
            "status": "SENT",
            "message_id": f"msg_{uuid.uuid4().hex[:12]}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def send_followup_reminder(to_email: str, account_name: str, deadline: str) -> Dict[str, Any]:
        """Schedules an automated follow-up reminder for the account executive."""
        print(f" [EMAIL TOOL] Scheduled follow-up reminder for {account_name} -> {to_email} by {deadline}")
        return {
            "status": "SCHEDULED",
            "reminder_id": f"rem_{uuid.uuid4().hex[:8]}",
            "deadline": deadline
        }


class SlackToolkit:
    """Mock Slack workspace integration for internal CS team alerts."""

    @staticmethod
    def post_alert(channel: str, message: str, urgency: str = "high") -> Dict[str, Any]:
        emoji = "🔴" if urgency == "critical" else "🟡" if urgency == "high" else "🟢"
        print(f" [SLACK TOOL] {emoji} Posted to #{channel}: {message[:80]}...")
        return {
            "status": "POSTED",
            "channel": channel,
            "message_id": f"slack_{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def create_incident_thread(channel: str, account_name: str, risk_score: float) -> Dict[str, Any]:
        """Creates a dedicated Slack thread for coordinating the retention response."""
        print(f" [SLACK TOOL] Created incident thread in #{channel} for {account_name} (Risk: {risk_score*100:.0f}%)")
        return {
            "thread_id": f"thread_{uuid.uuid4().hex[:8]}",
            "channel": channel,
            "status": "ACTIVE"
        }


class CalendarToolkit:
    """Mock calendar integration for scheduling executive sync calls."""

    @staticmethod
    def schedule_meeting(
        attendees: List[str],
        subject: str,
        duration_minutes: int = 30,
        priority: str = "high"
    ) -> Dict[str, Any]:
        proposed_time = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d 10:00 UTC")
        print(f" [CALENDAR TOOL] Scheduled '{subject}' with {', '.join(attendees)} at {proposed_time} ({duration_minutes}min)")
        return {
            "event_id": f"cal_{uuid.uuid4().hex[:8]}",
            "proposed_time": proposed_time,
            "duration_minutes": duration_minutes,
            "status": "TENTATIVE",
            "priority": priority
        }


class AnalyticsToolkit:
    """Mock analytics platform for tracking retention campaign performance."""

    @staticmethod
    def log_intervention(account_id: str, intervention_type: str, estimated_value: float) -> Dict[str, Any]:
        """Logs the retention intervention to the analytics warehouse."""
        print(f" [ANALYTICS TOOL] Logged intervention for {account_id}: {intervention_type} (est. ${estimated_value:,.0f})")
        return {
            "event_id": f"evt_{uuid.uuid4().hex[:8]}",
            "account_id": account_id,
            "intervention_type": intervention_type,
            "estimated_value": estimated_value,
            "logged_at": datetime.now(timezone.utc).isoformat()
        }


class AuditTrailLogger:
    """Persistent JSON audit trail for all swarm decisions and actions."""

    AUDIT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audit_trail.json")

    @staticmethod
    def load() -> List[Dict[str, Any]]:
        if os.path.exists(AuditTrailLogger.AUDIT_FILE):
            try:
                with open(AuditTrailLogger.AUDIT_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    @staticmethod
    def append(entry: Dict[str, Any]) -> None:
        trail = AuditTrailLogger.load()
        entry["audit_id"] = f"aud_{uuid.uuid4().hex[:10]}"
        entry["recorded_at"] = datetime.now(timezone.utc).isoformat()
        trail.append(entry)
        try:
            with open(AuditTrailLogger.AUDIT_FILE, "w", encoding="utf-8") as f:
                json.dump(trail, f, indent=2, default=str)
        except Exception as e:
            print(f" [AUDIT] Warning: Could not persist audit entry: {e}")

    @staticmethod
    def log_swarm_run(run_id: str, flagged_count: int, accounts_processed: List[str]) -> None:
        AuditTrailLogger.append({
            "type": "SWARM_RUN",
            "run_id": run_id,
            "flagged_count": flagged_count,
            "accounts_processed": accounts_processed
        })

    @staticmethod
    def log_approval(run_id: str, account_id: str, status: str, operator: str = "system") -> None:
        AuditTrailLogger.append({
            "type": "HITL_DECISION",
            "run_id": run_id,
            "account_id": account_id,
            "decision": status,
            "operator": operator
        })

    @staticmethod
    def log_dispatch(run_id: str, account_id: str, email: str, subject: str) -> None:
        AuditTrailLogger.append({
            "type": "EMAIL_DISPATCH",
            "run_id": run_id,
            "account_id": account_id,
            "recipient": email,
            "subject": subject
        })


# ============================================================================
# 3. MULTI-AGENT SWARM NODE IMPLEMENTATIONS
# ============================================================================

def log_event(state: SwarmState, agent: str, message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
    state["execution_logs"].append({
        "timestamp": timestamp,
        "agent": agent,
        "message": message
    })
    print(f"[{timestamp}] [{agent}] {message}")

def data_agent_node(state: SwarmState) -> Dict[str, Any]:
    """
    Data Agent:
    Monitors streaming telemetry, evaluates drop-off anomalies, and flags
    accounts crossing critical churn thresholds.
    """
    log_event(state, "DATA_AGENT", "Initiating telemetry ingestion across active accounts...")
    
    flagged: List[AccountTelemetry] = []
    healthy_count = 0

    for raw in state.get("raw_accounts", []):
        # Heuristic churn propensity calculation
        login_drop = raw.get("login_frequency_drop_pct", 0)
        feature_util = raw.get("feature_utilization_score", 10.0)
        unresolved = raw.get("unresolved_bugs", 0)
        days_inactive = raw.get("days_since_last_active", 0)
        tickets = raw.get("support_tickets_count", 0)
        
        # Risk algorithm: weighted composition of inactivity, drops, and friction
        risk = (
            (login_drop / 100.0 * 0.35) +
            ((10.0 - feature_util) / 10.0 * 0.25) +
            (min(unresolved, 5) / 5.0 * 0.15) +
            (min(days_inactive, 30) / 30.0 * 0.15) +
            (min(tickets, 10) / 10.0 * 0.10)
        )
        risk_score = round(min(max(risk, 0.0), 1.0), 3)

        if risk_score >= 0.55:
            telemetry = AccountTelemetry(
                account_id=raw["account_id"],
                company_name=raw["company_name"],
                tier=raw.get("tier", "Growth"),
                monthly_recurring_revenue=raw.get("mrr", 2400.0),
                login_frequency_drop_pct=login_drop,
                feature_utilization_score=feature_util,
                support_tickets_count=tickets,
                unresolved_bugs=unresolved,
                days_since_last_active=days_inactive,
                churn_risk_score=risk_score,
                primary_contact_email=raw["email"],
                primary_contact_name=raw["contact_name"]
            )
            flagged.append(telemetry)
            risk_label = "CRITICAL" if risk_score >= 0.70 else "HIGH" if risk_score >= 0.60 else "ELEVATED"
            log_event(
                state,
                "DATA_AGENT",
                f"FLAGGED [{risk_label}]: {telemetry.company_name} ({telemetry.account_id}) | "
                f"Risk: {risk_score*100:.1f}% | Login Drop: -{login_drop}% | "
                f"Feature Score: {feature_util}/10 | Unresolved: {unresolved}"
            )
        else:
            healthy_count += 1

    log_event(
        state,
        "DATA_AGENT",
        f"Telemetry scan complete. {len(flagged)} high-risk accounts flagged, "
        f"{healthy_count} accounts healthy."
    )
    
    # Sort flagged accounts by risk score descending (highest risk first)
    flagged.sort(key=lambda a: a.churn_risk_score, reverse=True)
    
    active = flagged[0] if flagged else None
    return {
        "flagged_accounts": flagged,
        "active_account": active,
        "current_index": 0
    }

def strategy_agent_node(state: SwarmState) -> Dict[str, Any]:
    """
    Strategy Agent:
    Deep-dives into historical CRM notes and tailors a high-converting
    retention intervention tailored to the specific friction point.
    """
    account = state.get("active_account")
    if not account:
        log_event(state, "STRATEGY_AGENT", "No active at-risk account in queue. Idling.")
        return {}

    log_event(state, "STRATEGY_AGENT", f"Analyzing customer lifetime context for {account.company_name}...")
    
    # Query CRM history tool
    crm_history = CRMToolkit.get_account_history(account.account_id)
    open_tickets = CRMToolkit.get_open_tickets(account.account_id)
    
    log_event(
        state,
        "STRATEGY_AGENT",
        f"CRM context retrieved: NPS={crm_history['net_promoter_score']}/10, "
        f"Renewal={crm_history['contract_renewal_date']}, "
        f"Open Tickets={len(open_tickets)}, "
        f"Industry={crm_history['industry']}"
    )

    # Multi-branch strategic reasoning based on root cause analysis
    has_technical_issues = (
        account.unresolved_bugs > 0 or
        "latency" in crm_history["historical_notes"].lower() or
        "compliance" in crm_history["historical_notes"].lower() or
        "gap" in crm_history["historical_notes"].lower()
    )
    
    has_adoption_issues = (
        account.feature_utilization_score < 4.0 or
        "turnover" in crm_history["historical_notes"].lower() or
        "migration" in crm_history["historical_notes"].lower()
    )
    
    has_budget_issues = (
        "budget" in crm_history["historical_notes"].lower() or
        "competing" in crm_history["historical_notes"].lower() or
        "price" in crm_history["historical_notes"].lower() or
        crm_history.get("past_discounts_applied", 0) >= 2
    )

    is_enterprise = account.monthly_recurring_revenue > 5000
    is_compliance_critical = (
        "hipaa" in crm_history["historical_notes"].lower() or
        "soc2" in crm_history["historical_notes"].lower()
    )

    # Priority-weighted strategy selection
    if is_compliance_critical and has_technical_issues:
        root_cause = "Compliance-Blocking Technical Gaps (SOC2/HIPAA Certification Risk)"
        rec_action = "Emergency Engineering Sprint + Compliance Remediation Package"
        incentive = (
            "Dedicated 2-week compliance engineering sprint with Principal Security Architect, "
            "complimentary SOC2/HIPAA gap analysis report ($4,500 value), and 60-day "
            "Enterprise VIP Support SLA upgrade"
        )
        expected_lift = "+58% retention probability through compliance unblocking"
        confidence = 0.96
        risk_category = "CRITICAL"
        est_save = account.monthly_recurring_revenue * 12 * 0.58
    elif has_technical_issues and is_enterprise:
        root_cause = "Technical Friction & Unresolved Performance Bottlenecks"
        rec_action = "Dedicated Solutions Architect Pairing + Priority SLA"
        incentive = (
            "Complimentary 30-day Enterprise VIP Support credit ($1,200 value) "
            "& 1:1 Architecture Audit with Principal Engineer"
        )
        expected_lift = "+42% retention probability through engineering unblocking"
        confidence = 0.94
        risk_category = "CRITICAL"
        est_save = account.monthly_recurring_revenue * 12 * 0.42
    elif has_adoption_issues:
        root_cause = "Feature Disengagement & Team Adoption Stagnation"
        rec_action = "Personalized Interactive Masterclass + Onboarding Refresh"
        incentive = (
            "Custom 45-minute workflow migration workshop with Product Specialist, "
            "dedicated Slack channel for team Q&A, and 3 complimentary training seats"
        )
        expected_lift = "+35% retention probability through re-engagement"
        confidence = 0.87
        risk_category = "HIGH"
        est_save = account.monthly_recurring_revenue * 12 * 0.35
    elif has_budget_issues and not is_enterprise:
        root_cause = "Budget Pressure & Competitive Evaluation"
        rec_action = "ROI Demonstration + Strategic Tier Restructuring"
        incentive = (
            "Custom ROI impact report showing platform value vs. alternatives, "
            "20% loyalty incentive for annual commitment extension, and "
            "quarterly executive business review cadence"
        )
        expected_lift = "+30% retention probability through value demonstration"
        confidence = 0.83
        risk_category = "HIGH"
        est_save = account.monthly_recurring_revenue * 12 * 0.30
    elif is_enterprise:
        root_cause = "Enterprise Budget Review / Value Misalignment"
        rec_action = "Executive Sponsor Review + Tier Restructuring"
        incentive = (
            "20% loyalty incentive for annual extension + Dedicated Account Executive "
            "review + Quarterly C-level business impact briefing"
        )
        expected_lift = "+35% retention probability"
        confidence = 0.88
        risk_category = "HIGH"
        est_save = account.monthly_recurring_revenue * 12 * 0.35
    else:
        root_cause = "General Disengagement & Platform Underutilization"
        rec_action = "Proactive Customer Success Check-in"
        incentive = (
            "Personalized 30-minute success review with Customer Success Manager, "
            "custom workflow optimization playbook, and 14-day premium feature trial"
        )
        expected_lift = "+25% retention probability"
        confidence = 0.78
        risk_category = "MEDIUM"
        est_save = account.monthly_recurring_revenue * 12 * 0.25

    strategy = RetentionStrategy(
        account_id=account.account_id,
        root_cause=root_cause,
        recommended_tier_action=rec_action,
        incentive_details=incentive,
        expected_retention_lift=expected_lift,
        strategy_confidence=confidence,
        risk_category=risk_category,
        estimated_save_value=round(est_save, 2)
    )

    log_event(
        state,
        "STRATEGY_AGENT",
        f"Strategy formulated [{risk_category}]: '{rec_action}'. "
        f"Root cause: '{root_cause}'. "
        f"Confidence: {confidence*100:.0f}%. "
        f"Est. save: ${est_save:,.0f}/yr"
    )

    return {"retention_strategy": strategy}

def action_agent_node(state: SwarmState) -> Dict[str, Any]:
    """
    Action Agent:
    Synthesizes the strategic output into executive-ready communication,
    syncs the CRM lifecycle stage, and marks the state for human approval.
    """
    account = state.get("active_account")
    strategy = state.get("retention_strategy")
    if not account or not strategy:
        return {}

    log_event(state, "ACTION_AGENT", f"Drafting tailored outreach and CRM changes for {account.company_name}...")

    # Generate personalized email subject and body
    subject = f"Optimizing {account.company_name}'s Workflow & Dedicated Technical Resources"
    
    # Build context-aware email body
    contact_first_name = account.primary_contact_name.split(",")[0].split(" ")[0]
    body = (
        f"Hi {contact_first_name},\n\n"
        f"I'm reaching out because we value {account.company_name}'s partnership deeply, "
        f"and I wanted to personally address some friction points we've identified.\n\n"
    )
    
    if "latency" in strategy.root_cause.lower() or "technical" in strategy.root_cause.lower():
        body += (
            f"We understand how critical sub-second throughput is for {account.company_name}'s "
            f"infrastructure. Our engineering leadership has allocated dedicated resources "
            f"to conduct a private performance audit.\n\n"
        )
    elif "compliance" in strategy.root_cause.lower():
        body += (
            f"We recognize that compliance certification is mission-critical for "
            f"{account.company_name}. Our security engineering team has fast-tracked "
            f"a dedicated remediation sprint.\n\n"
        )
    elif "adoption" in strategy.root_cause.lower() or "disengagement" in strategy.root_cause.lower():
        body += (
            f"We noticed your team hasn't fully leveraged some of our most impactful features. "
            f"We'd love to host a tailored workshop designed specifically for "
            f"{account.company_name}'s workflows.\n\n"
        )
    else:
        body += (
            f"We've been monitoring usage patterns and want to ensure {account.company_name} "
            f"is getting maximum value from the platform.\n\n"
        )
    
    body += (
        f"Here's what we've arranged: {strategy.incentive_details}\n\n"
        f"Would 15 minutes this Thursday work for an executive sync?\n\n"
        f"Best regards,\n"
        f"CloudPrune AI Customer Engineering Swarm"
    )

    # Determine CRM stage and follow-up urgency
    if strategy.risk_category == "CRITICAL":
        crm_stage = "CRITICAL_RISK_IMMEDIATE_ACTION"
        follow_up_task = "Emergency Executive Architecture Sync (within 24h)"
        follow_up_deadline = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        slack_channel = "cs-critical-alerts"
    elif strategy.risk_category == "HIGH":
        crm_stage = "AT_RISK_INTERVENTION_REQUIRED"
        follow_up_task = "High-Priority Executive Sync (within 48h)"
        follow_up_deadline = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
        slack_channel = "cs-retention-pipeline"
    else:
        crm_stage = "MONITOR_PROACTIVE_OUTREACH"
        follow_up_task = "Customer Success Check-in (within 1 week)"
        follow_up_deadline = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        slack_channel = "cs-general"

    action = ActionExecution(
        account_id=account.account_id,
        email_subject=subject,
        email_body_preview=body,
        crm_deal_stage=crm_stage,
        follow_up_task=follow_up_task,
        follow_up_deadline=follow_up_deadline,
        slack_channel=slack_channel,
        requires_human_approval=True,
        approval_status="PENDING_REVIEW",
        dispatched=False
    )

    # Sync CRM immediately to alert CS team
    CRMToolkit.update_crm_record(
        account.account_id,
        action.crm_deal_stage,
        action.follow_up_task
    )

    # Post Slack alert to CS team
    SlackToolkit.post_alert(
        slack_channel,
        f"🚨 Churn risk detected: {account.company_name} ({account.churn_risk_score*100:.0f}% risk). "
        f"Strategy: {strategy.recommended_tier_action}. Awaiting HITL approval.",
        urgency="critical" if strategy.risk_category == "CRITICAL" else "high"
    )

    # Create incident thread for coordination
    SlackToolkit.create_incident_thread(
        slack_channel,
        account.company_name,
        account.churn_risk_score
    )

    # Log intervention to analytics
    AnalyticsToolkit.log_intervention(
        account.account_id,
        strategy.recommended_tier_action,
        strategy.estimated_save_value
    )

    log_event(
        state,
        "ACTION_AGENT",
        f"Prepared outreach: '{subject}'. CRM stage: {crm_stage}. "
        f"Deadline: {follow_up_deadline}. Waiting for Human-in-the-Loop manager sign-off."
    )

    return {"action_plan": action}

def human_approval_gate(state: SwarmState) -> Dict[str, Any]:
    """
    Human-in-the-loop Gate:
    In automated execution, checks approval flag.
    In real system, acts as an interrupt/breakpoint.
    """
    action = state.get("action_plan")
    account = state.get("active_account")
    strategy = state.get("retention_strategy")
    if not action or not account:
        return {}

    run_id = state.get("swarm_run_id", "unknown")

    if state.get("is_approved", False):
        log_event(state, "HITL_SUPERVISOR", f"Manager APPROVAL RECEIVED for {account.company_name}.")
        
        # Dispatch communications via tools
        CommunicationToolkit.send_retention_email(
            account.primary_contact_email,
            action.email_subject,
            action.email_body_preview
        )
        action.approval_status = "APPROVED"
        action.dispatched = True
        
        # Schedule follow-up meeting
        CalendarToolkit.schedule_meeting(
            attendees=[account.primary_contact_email, "cs-team@cloudprune.ai"],
            subject=f"Executive Sync: {account.company_name} Retention Review",
            duration_minutes=30,
            priority="high"
        )

        # Schedule AE follow-up reminder
        crm_history = CRMToolkit.get_account_history(account.account_id)
        ae_email = f"{crm_history.get('account_executive', 'unassigned').lower().replace(' ', '.')}@cloudprune.ai"
        CommunicationToolkit.send_followup_reminder(
            ae_email,
            account.company_name,
            action.follow_up_deadline
        )

        # Log to persistent audit trail
        AuditTrailLogger.log_approval(run_id, account.account_id, "APPROVED", "human_operator")
        AuditTrailLogger.log_dispatch(run_id, account.account_id, account.primary_contact_email, action.email_subject)
        
        log_event(state, "ACTION_AGENT", f"Outbound retention campaign delivered to {account.primary_contact_email}.")
        
        # Post confirmation to Slack
        SlackToolkit.post_alert(
            action.slack_channel,
            f"✅ Manager APPROVED retention plan for {account.company_name}. "
            f"Email dispatched to {account.primary_contact_email}. "
            f"Follow-up scheduled by {action.follow_up_deadline}.",
            urgency="high"
        )
    else:
        log_event(state, "HITL_SUPERVISOR", f"Approval paused. Action queued in Human Review Console.")
        action.approval_status = "AWAITING_OPERATOR_CLICK"
        AuditTrailLogger.log_approval(run_id, account.account_id, "AWAITING", "system")

    return {"action_plan": action}

# ============================================================================
# 4. SWARM PIPELINE COMPILATION (LangGraph Architecture)
# ============================================================================

def build_churn_prevention_graph():
    """
    Builds the state graph coordinating Data Agent -> Strategy Agent -> Action Agent -> HITL.
    Supports either direct LangGraph if installed, or deterministic execution harness.
    """
    try:
        from langgraph.graph import StateGraph, END
        workflow = StateGraph(SwarmState)
        
        workflow.add_node("data_agent", data_agent_node)
        workflow.add_node("strategy_agent", strategy_agent_node)
        workflow.add_node("action_agent", action_agent_node)
        workflow.add_node("human_gate", human_approval_gate)
        
        workflow.set_entry_point("data_agent")
        workflow.add_edge("data_agent", "strategy_agent")
        workflow.add_edge("strategy_agent", "action_agent")
        workflow.add_edge("action_agent", "human_gate")
        workflow.add_edge("human_gate", END)
        
        return workflow.compile()
    except ImportError:
        # Self-contained executable fallback if langgraph isn't yet installed
        class FallbackSwarmGraph:
            def invoke(self, state: SwarmState) -> SwarmState:
                current_state = dict(state)
                # 1. Data Agent
                d_out = data_agent_node(current_state)
                current_state.update(d_out)
                # 2. Strategy Agent
                s_out = strategy_agent_node(current_state)
                current_state.update(s_out)
                # 3. Action Agent
                a_out = action_agent_node(current_state)
                current_state.update(a_out)
                # 4. Human Approval Gate
                h_out = human_approval_gate(current_state)
                current_state.update(h_out)
                return current_state
        return FallbackSwarmGraph()

# ============================================================================
# 5. SEED TELEMETRY DATA (6 Realistic SaaS Accounts)
# ============================================================================

SAMPLE_TELEMETRY_DATA = [
    {
        "account_id": "acc-9412",
        "company_name": "Apex Quant Capital",
        "tier": "Enterprise",
        "mrr": 8450.0,
        "login_frequency_drop_pct": 74.2,
        "feature_utilization_score": 2.1,
        "support_tickets_count": 6,
        "unresolved_bugs": 3,
        "days_since_last_active": 18,
        "email": "sarah.jenkins@apexquant.io",
        "contact_name": "Sarah Jenkins, VP of Trading Tech"
    },
    {
        "account_id": "acc-7203",
        "company_name": "MedVault Health Systems",
        "tier": "Enterprise",
        "mrr": 13000.0,
        "login_frequency_drop_pct": 62.8,
        "feature_utilization_score": 3.4,
        "support_tickets_count": 8,
        "unresolved_bugs": 3,
        "days_since_last_active": 12,
        "email": "raj.patel@medvault.health",
        "contact_name": "Dr. Raj Patel, CTO"
    },
    {
        "account_id": "acc-8104",
        "company_name": "Veloce Logistics API",
        "tier": "Growth",
        "mrr": 3200.0,
        "login_frequency_drop_pct": 54.1,
        "feature_utilization_score": 3.8,
        "support_tickets_count": 2,
        "unresolved_bugs": 0,
        "days_since_last_active": 9,
        "email": "devon@veloce.io",
        "contact_name": "Devon Vance, Lead Platform SRE"
    },
    {
        "account_id": "acc-6550",
        "company_name": "BrightPath EdTech",
        "tier": "Starter",
        "mrr": 2000.0,
        "login_frequency_drop_pct": 48.5,
        "feature_utilization_score": 4.2,
        "support_tickets_count": 1,
        "unresolved_bugs": 0,
        "days_since_last_active": 14,
        "email": "amanda.li@brightpath.edu",
        "contact_name": "Amanda Li, Director of Digital Learning"
    },
    {
        "account_id": "acc-8821",
        "company_name": "Starlight Microservices",
        "tier": "Growth",
        "mrr": 1850.0,
        "login_frequency_drop_pct": 12.0,
        "feature_utilization_score": 8.4,
        "support_tickets_count": 1,
        "unresolved_bugs": 0,
        "days_since_last_active": 1,
        "email": "dev@starlight.io",
        "contact_name": "Marcus Vance"
    },
    {
        "account_id": "acc-9900",
        "company_name": "Fortress Security Labs",
        "tier": "Enterprise",
        "mrr": 9800.0,
        "login_frequency_drop_pct": 8.5,
        "feature_utilization_score": 9.1,
        "support_tickets_count": 0,
        "unresolved_bugs": 0,
        "days_since_last_active": 0,
        "email": "ops@fortress.sec",
        "contact_name": "Lena Okafor, CISO"
    }
]

# ============================================================================
# 6. CLI EXECUTION & SEED RUNNER
# ============================================================================

def run_swarm_batch(accounts_data: List[Dict[str, Any]], auto_approve: bool = False):
    """
    Run the full swarm pipeline, processing ALL flagged accounts sequentially.
    Returns a list of batch results with strategies and action plans.
    """
    run_id = f"run_{uuid.uuid4().hex[:10]}"
    
    print("\n" + "="*70)
    print(" 🚀 INITIATING AUTONOMOUS CUSTOMER CHURN PREVENTION SWARM")
    print(f"    Run ID: {run_id}")
    print("    Agents: DataAgent -> StrategyAgent -> ActionAgent -> HumanGate")
    print("="*70 + "\n")

    # Phase 1: Data Agent scans all accounts
    initial_state: SwarmState = {
        "raw_accounts": accounts_data,
        "flagged_accounts": [],
        "current_index": 0,
        "active_account": None,
        "retention_strategy": None,
        "action_plan": None,
        "execution_logs": [],
        "is_approved": False,
        "batch_results": [],
        "swarm_run_id": run_id
    }

    graph = build_churn_prevention_graph()
    
    # First pass: identify all at-risk accounts
    result = graph.invoke(initial_state)
    flagged = result.get("flagged_accounts", [])
    
    if not flagged:
        print("\n✅ No high-risk accounts detected. All accounts healthy.")
        return []

    batch_results = []
    
    # Process first account (already done by the graph)
    if result.get("action_plan") and result.get("retention_strategy"):
        batch_results.append({
            "account": result["active_account"],
            "strategy": result["retention_strategy"],
            "action": result["action_plan"]
        })

    # Process remaining flagged accounts
    for i in range(1, len(flagged)):
        account = flagged[i]
        print(f"\n{'─'*70}")
        print(f" Processing account {i+1}/{len(flagged)}: {account.company_name}")
        print(f"{'─'*70}\n")
        
        next_state: SwarmState = {
            "raw_accounts": [],
            "flagged_accounts": flagged,
            "current_index": i,
            "active_account": account,
            "retention_strategy": None,
            "action_plan": None,
            "execution_logs": result.get("execution_logs", []),
            "is_approved": False,
            "batch_results": [],
            "swarm_run_id": run_id
        }
        
        # Run Strategy + Action + Gate for this account
        s_out = strategy_agent_node(next_state)
        next_state.update(s_out)
        a_out = action_agent_node(next_state)
        next_state.update(a_out)
        h_out = human_approval_gate(next_state)
        next_state.update(h_out)
        
        if next_state.get("action_plan") and next_state.get("retention_strategy"):
            batch_results.append({
                "account": account,
                "strategy": next_state["retention_strategy"],
                "action": next_state["action_plan"]
            })

    # Log the full swarm run
    AuditTrailLogger.log_swarm_run(
        run_id,
        len(flagged),
        [a.account_id for a in flagged]
    )

    # Print summary
    print("\n" + "="*70)
    print(f" 📋 SWARM BATCH SUMMARY — {len(batch_results)} Accounts Processed")
    print("="*70)
    
    total_mrr_at_risk = 0.0
    total_est_savings = 0.0
    
    for idx, br in enumerate(batch_results):
        acct = br["account"]
        strat = br["strategy"]
        action = br["action"]
        total_mrr_at_risk += acct.monthly_recurring_revenue
        total_est_savings += strat.estimated_save_value
        
        print(f"\n  [{idx+1}] {acct.company_name} ({acct.account_id})")
        print(f"      MRR: ${acct.monthly_recurring_revenue:,.0f}/mo | Risk: {acct.churn_risk_score*100:.1f}% [{strat.risk_category}]")
        print(f"      Cause: {strat.root_cause}")
        print(f"      Offer: {strat.incentive_details[:80]}...")
        print(f"      Email: '{action.email_subject}'")
        print(f"      Status: {action.approval_status}")

    print(f"\n{'─'*70}")
    print(f"  Total MRR at Risk:      ${total_mrr_at_risk:,.0f}/mo (${total_mrr_at_risk*12:,.0f}/yr)")
    print(f"  Estimated Retention:    ${total_est_savings:,.0f}/yr")
    print(f"  Accounts Queued:        {len(batch_results)}")
    print(f"  Awaiting HITL Approval: {sum(1 for b in batch_results if b['action'].approval_status == 'AWAITING_OPERATOR_CLICK')}")
    print(f"{'─'*70}\n")

    return batch_results


if __name__ == "__main__":
    batch_results = run_swarm_batch(SAMPLE_TELEMETRY_DATA, auto_approve=False)
    
    if batch_results:
        # Simulate human operator approving the highest-risk account
        print("\n--- [SIMULATING HUMAN OPERATOR CLICKING 'APPROVE & DISPATCH'] ---")
        top_result = batch_results[0]
        approval_state: SwarmState = {
            "raw_accounts": [],
            "flagged_accounts": [],
            "current_index": 0,
            "active_account": top_result["account"],
            "retention_strategy": top_result["strategy"],
            "action_plan": top_result["action"],
            "execution_logs": [],
            "is_approved": True,
            "batch_results": [],
            "swarm_run_id": f"run_{uuid.uuid4().hex[:10]}"
        }
        approved_result = human_approval_gate(approval_state)
        print(f"Final Status: {approved_result['action_plan'].approval_status} "
              f"(Dispatched: {approved_result['action_plan'].dispatched})\n")
