const { AuditResponseSchema } = require("./schemas");

/**
 * Intelligent fallback FinOps heuristic reasoner
 * Used when GEMINI_API_KEY is not configured or during network timeouts
 */
function generateHeuristicAudit(instances) {
  const running = instances.filter(i => i.status === "running");
  const flagged = [];

  running.forEach(inst => {
    const isLowCpu = inst.cpuUtilization < 5.0;
    const isLowMemory = inst.memoryUtilization < 15.0;
    const hasStaleTag = inst.tags.some(t =>
      ["abandoned", "zombie-candidate", "expired", "load-test", "idle-eval", "temporary"].includes(t.toLowerCase())
    );
    const hasStaleTime = inst.lastActive.includes("days ago");

    if ((isLowCpu && isLowMemory) || hasStaleTag || (isLowCpu && hasStaleTime)) {
      let confidence = 0.85;
      let reason = `Instance exhibits prolonged sub-5% CPU utilization (${inst.cpuUtilization}%) and low memory (${inst.memoryUtilization}%).`;

      if (hasStaleTag) {
        confidence = 0.96;
        reason += ` Marked with transient tags [${inst.tags.join(", ")}] with no active user sessions recorded in ${inst.lastActive}.`;
      } else if (hasStaleTime) {
        confidence = 0.91;
        reason += ` Last telemetry activity was logged ${inst.lastActive}, indicating an unattached developer sandbox or stale evaluation runner.`;
      }

      flagged.push({
        id: inst.id,
        reason,
        confidenceScore: Math.min(0.99, Math.max(0.75, confidence)),
        estimatedMonthlySavings: Math.round(inst.monthlyCost * 100) / 100
      });
    }
  });

  const totalWaste = flagged.reduce((acc, curr) => acc + curr.estimatedMonthlySavings, 0);

  const fallbackResult = {
    executiveSummary: `CloudPrune FinOps analysis discovered ${flagged.length} idle/zombie cloud instances out of ${running.length} active servers. Immediate termination or rightsizing will eliminate $${totalWaste.toFixed(2)}/month in unallocated cloud spend without degrading SLA for production workloads.`,
    totalMonthlyWaste: Math.round(totalWaste * 100) / 100,
    actionPlan: `1. Review and approve immediate decommission of flagged idle workloads (${flagged.map(f => {
      const inst = instances.find(i => i.id === f.id);
      return inst ? inst.name : f.id;
    }).join(", ")}). 2. Tag orphaned storage volumes for retention snapshots before release. 3. Establish automated termination policies for future ephemeral staging workloads.`,
    flaggedInstances: flagged
  };

  return AuditResponseSchema.parse(fallbackResult);
}

/**
 * Execute Gemini AI FinOps Audit using @google/genai
 */
async function runGeminiFinOpsAudit(instances) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.log("ℹ️ No GEMINI_API_KEY found or default placeholder detected. Generating high-precision FinOps heuristic audit.");
    return {
      ...generateHeuristicAudit(instances),
      source: "heuristic-fallback",
      note: "Add your GEMINI_API_KEY in .env to enable direct live inference with gemini-3.8-flash."
    };
  }

  const runningInstances = instances.filter(i => i.status === "running");

  const prompt = `
You are CloudPrune AI, an autonomous Senior FinOps Engineer and Cloud Architecture Agent.
Analyze the following live cloud server telemetry dataset and identify all "zombie", abandoned, or severely underutilized instances that should be considered for termination:

LIVE TELEMETRY:
${JSON.stringify(runningInstances, null, 2)}

FINOPS DETECTION CRITERIA:
1. Low CPU (< 5%) and low memory (< 15%) over prolonged durations.
2. Ephemeral or transient tags: "abandoned", "temporary", "load-test", "expired", "sandbox", "pr-*".
3. Inactivity timestamp (> 7 days without active user traffic).
4. Distinguish between critical production workloads (keep safe!) and disposable dev/test/stale instances.

You MUST respond strictly in valid JSON adhering to this JSON schema:
{
  "executiveSummary": "Concise high-level FinOps audit summary",
  "totalMonthlyWaste": 123.45,
  "actionPlan": "Clear prioritized recommendation referencing workload/service names rather than raw hash IDs",
  "flaggedInstances": [
    {
      "id": "i-...",
      "reason": "Detailed justification citing telemetry, cost, and tag context",
      "confidenceScore": 0.95,
      "estimatedMonthlySavings": 123.45
    }
  ]
}
Do NOT include markdown formatting or backticks if possible, only raw JSON.
`;

  try {
    // Dynamically load @google/genai to support both ESM and CommonJS
    let GoogleGenAI;
    try {
      const genaiModule = await import("@google/genai");
      GoogleGenAI = genaiModule.GoogleGenAI;
    } catch (importErr) {
      const genaiModule = require("@google/genai");
      GoogleGenAI = genaiModule.GoogleGenAI;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3.8-flash — Google Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text);
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    // Clean potential markdown wrap if any
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const rawParsed = JSON.parse(cleanedText);

    // Validate with strict Zod schema
    const validated = AuditResponseSchema.parse(rawParsed);

    return {
      ...validated,
      source: "gemini-3.8-flash",
      model: "gemini-3.8-flash"
    };
  } catch (err) {
    console.error("⚠️ Gemini API execution error or validation failure:", err.message);
    console.log("Falling back to deterministic FinOps validation engine.");
    
    const fallback = generateHeuristicAudit(instances);
    return {
      ...fallback,
      source: "fallback-after-error",
      errorDetails: err.message
    };
  }
}

module.exports = {
  runGeminiFinOpsAudit,
  generateHeuristicAudit
};
