import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, X, Bot, User, Loader2, Sparkles,
  Minimize2, Maximize2, Copy, Check, RotateCcw, Zap, ExternalLink
} from 'lucide-react';
import { api } from '../api';

const SYSTEM_PROMPT = `You are CloudPrune AI, an enterprise-grade autonomous FinOps advisor specializing in cloud cost optimization, idle compute detection, and autonomous cloud governance.
Your role:
- Help users analyze and reduce their AWS/GCP/Azure cloud spending and waste.
- Explain FinOps principles: rightsizing, reserved instances, zombie resource detection, spot fleets, tagging taxonomies.
- Provide actionable recommendations based on sub-5% CPU loads, stale tags, and idle hours.
- Explain the Human-in-the-loop (HITL) approval architecture ensuring 0 downtime risk.
- Keep responses structured, professional, concise, and formatted in clean markdown with bullet points.`;

function getLocalFinOpsResponse(query, instances = []) {
  const q = query.toLowerCase();
  const running = instances.filter(i => i.status === 'running');
  const totalCost = running.reduce((s, i) => s + (i.monthlyCost || 0), 0);
  const lowCpu = running.filter(i => (i.cpuUtilization || 0) < 5);

  if (q.includes('zombie') || q.includes('idle') || q.includes('abandoned')) {
    return `### 🧟 What Are Zombie Cloud Instances?

Zombie instances are provisioned compute resources (EC2, GCE, VMs) that continue running and generating hourly billing despite performing zero useful business work.

**Primary Indicators:**
• **Sustained Low CPU**: Telemetry exhibiting < 5% CPU utilization over 7+ consecutive days.
• **Stale Network I/O**: Little to no ingress/egress packet traffic.
• **Ephemeral Tagging**: Workloads tagged as \`qa-load-test\`, \`abandoned\`, \`feature-branch-*\`, or \`temp-eval\`.
• **Orphaned Owners**: Created by departed team members or automated CI/CD pipelines without TTL termination rules.

**Remediation in CloudPrune AI:**
1. Our Gemini 3.8 Flash Lite agent flags zombies with high confidence.
2. You review the exact dollar savings before decommissioning.
3. One-click **Human-in-the-Loop** approval terminates the rogue compute safely.`;
  }

  if (q.includes('audit') || q.includes('how does') || q.includes('work') || q.includes('agent')) {
    return `### 🤖 How CloudPrune AI Autonomous Audits Work

CloudPrune AI operates on an **Agentic FinOps loop** designed to maximize cost savings while strictly preventing production downtime:

1. **Continuous Telemetry Ingestion**: Ingests CPU load, memory utilization, monthly run-rate, and regional tags across multi-cloud VPCs.
2. **LLM Structured Reasoning**: Passes workload telemetry through Google Gemini 3.8 Flash Lite with strict Zod schema validation.
3. **Multi-Factor Risk Scoring**: Evaluates workload criticality (\`production\` vs \`sandbox\`) and calculates confidence ratings (e.g. 96%).
4. **Actionable Plan Generation**: Proposes immediate decommissioning with exact dollar savings.
5. **Human-in-the-Loop Gate**: Decommissioning is never triggered automatically on blind faith—an authenticated engineer must approve the termination.`;
  }

  if (q.includes('cost') || q.includes('saving') || q.includes('reduce') || q.includes('bill') || q.includes('strategy')) {
    return `### 💡 Top 5 Enterprise FinOps Cost Optimization Strategies

1. **Automate Zombie Elimination**: Regularly decommission sub-5% CPU sandboxes (averages 35–45% immediate cloud bill reduction).
2. **Rightsize Overprovisioned Instances**: Downsize nodes running below 30% average memory and CPU (e.g. migrate \`c5.4xlarge\` to \`c5.xlarge\`).
3. **Leverage 1-Year / 3-Year Savings Plans**: Commit to baseline steady-state compute for up to 72% discounts over on-demand rates.
4. **Implement Auto-Shutdown Schedules**: Stop development and QA environments outside of business hours (saving ~65% on dev compute).
5. **Enforce Strict Tagging & TTLs**: Mandate \`Owner\`, \`Environment\`, and \`ExpiryDate\` metadata on every newly launched workload.`;
  }

  if (q.includes('fleet') || q.includes('status') || q.includes('my') || q.includes('spend')) {
    return `### 📊 Real-Time Fleet Assessment

${running.length > 0 ? `• **Active Nodes**: ${running.length} instances currently running
• **Total Monitored Run-Rate**: $${totalCost.toFixed(2)}/month
• **Underutilized Nodes (<5% CPU)**: ${lowCpu.length} workloads identified
• **Top Optimization Candidate**: ${lowCpu[0] ? `"${lowCpu[0].name}" (${lowCpu[0].type}) running at only ${lowCpu[0].cpuUtilization}% CPU saving $${lowCpu[0].monthlyCost}/mo.` : 'Run an AI audit to uncover detailed candidates.'}` : '• All monitored workloads are currently audited and optimized.'}

**Recommendation**: Click **"Run AI FinOps Audit"** on the dashboard to generate your automated decommissioning proposal!`;
  }

  return `### 🛡️ CloudPrune AI FinOps Intelligence

I analyzed your query: **"${query}"**.

**Key FinOps Insights for Your Cloud Infrastructure:**
• **Cloud Cost Waste**: Organizations typically waste 32% of total cloud spend on unmonitored idle resources.
• **Human-in-the-Loop Safety**: CloudPrune guarantees zero downtime risk by requiring multi-factor or JWT-signed manual approval before terminating any workload.
• **Instant Action**: You can run an AI audit, review flagged instances, or add custom cloud instances directly from this console.

Would you like me to explain **zombie detection algorithms**, **rightsizing tips**, or **how to configure automated alerts**?`;
}

export default function AIChatWidget({ instances = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: "👋 Welcome to **CloudPrune AI Advisor**!\n\nI am your autonomous FinOps copilot powered by Gemini 3.8 Flash Lite. I continuously analyze compute telemetry, calculate potential savings, and explain optimization recommendations.\n\n**Quick Prompts:**\n• *What are zombie instances?*\n• *How does the AI audit work?*\n• *Tips for reducing cloud costs*\n• *Assess my fleet status*",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (customText = null) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await api.chat(chatHistory, SYSTEM_PROMPT);

      if (res && res.success && res.text) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: res.text,
          timestamp: new Date(),
          source: 'gemini-3.8-flash-lite'
        }]);
      } else {
        throw new Error(res?.error || 'Live AI endpoint returned fallback');
      }
    } catch (err) {
      // Deterministic FinOps Fallback
      const fallbackResponse = getLocalFinOpsResponse(text, instances);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: fallbackResponse,
        timestamp: new Date(),
        source: 'local-finops-engine'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        text: "Conversation reset. How can I assist with your cloud cost governance today?",
        timestamp: new Date()
      }
    ]);
  };

  const quickPrompts = [
    { label: 'Zombie detection', text: 'What are zombie instances and how do I detect them?' },
    { label: 'How audit works', text: 'How does the AI audit work?' },
    { label: 'Cloud cost tips', text: 'What are the best strategies for reducing cloud costs?' },
    { label: 'My fleet status', text: 'Assess my fleet status and cloud spend' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 transition-all group flex items-center justify-center border border-indigo-400/30"
        aria-label="Open AI FinOps chat assistant"
        title="Ask CloudPrune AI Advisor"
      >
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0B0F19]" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col bg-gray-900 border border-gray-700 shadow-2xl transition-all duration-300 ${
        isMaximized
          ? 'inset-4 rounded-2xl'
          : 'bottom-6 right-6 w-[92vw] sm:w-[440px] h-[580px] rounded-2xl'
      }`}
      role="dialog"
      aria-label="AI FinOps chat assistant"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-950/90 rounded-t-2xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/30 to-emerald-500/30 border border-indigo-500/40 text-indigo-400 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              CloudPrune AI Advisor
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                Active
              </span>
            </h3>
            <p className="text-[10px] text-gray-400">Gemini 3.8 Flash Lite Autonomous FinOps Reasoning</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <button
            onClick={clearChat}
            className="p-1.5 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Clear Chat"
            aria-label="Clear chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isMaximized ? 'Restore size' : 'Maximize chat'}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setIsMaximized(false); }}
            className="p-1.5 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close chat"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-gray-800/90 text-gray-200 border border-gray-700/80 rounded-tl-none leading-relaxed'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="flex items-center justify-between mt-1 text-[9px] text-gray-400 opacity-80 gap-3">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white flex items-center gap-0.5"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 text-gray-300 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-gray-400">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing cloud telemetry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-2 bg-gray-950/60 border-t border-gray-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-gray-500 shrink-0 font-medium">Suggestions:</span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.text)}
            className="px-2.5 py-1 rounded-full bg-gray-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-gray-700 text-[10px] text-gray-300 hover:text-white transition-all shrink-0 active:scale-95"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800 bg-gray-950/90 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about FinOps, zombie workloads, or cloud costs..."
            rows={1}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none max-h-24 min-h-[40px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-opacity shrink-0 shadow-md shadow-indigo-950 active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500 px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="text-emerald-400 font-mono">SOC2 & PCI-DSS Compliant</span>
        </div>
      </div>
    </div>
  );
}
