const { z } = require("zod");

/**
 * Zod schema for validating Gemini AI FinOps Audit Response
 */
const FlaggedInstanceSchema = z.object({
  id: z.string().describe("The cloud instance ID, e.g. i-0123456789abcdef0"),
  reason: z.string().describe("Specific technical and financial justification for flagging as idle or zombie"),
  confidenceScore: z.number().min(0).max(1).describe("AI confidence score between 0.0 and 1.0"),
  estimatedMonthlySavings: z.number().nonnegative().describe("Monthly dollar amount saved if terminated")
});

const AuditResponseSchema = z.object({
  executiveSummary: z.string().describe("High-level executive overview of infrastructure waste and risk"),
  totalMonthlyWaste: z.number().nonnegative().describe("Sum of monthly waste across all flagged instances"),
  actionPlan: z.string().describe("Recommended step-by-step phased remediation strategy"),
  flaggedInstances: z.array(FlaggedInstanceSchema).describe("List of flagged zombie or low-utilization instances")
});

const TerminateRequestSchema = z.object({
  instanceIds: z.array(z.string()).min(1, "At least one instance ID must be provided")
});

module.exports = {
  AuditResponseSchema,
  FlaggedInstanceSchema,
  TerminateRequestSchema
};
