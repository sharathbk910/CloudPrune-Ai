# CloudPrune AI — Autonomous FinOps Agent

> **Autonomous Cloud Cost Optimization with Google Gemini 3.8 Flash & Strict Human-in-the-Loop Safeguards.**

CloudPrune AI is a full-stack, production-ready FinOps web application that identifies idle, orphaned, and "zombie" cloud resources across multi-region VPC instances and enables safe human-in-the-loop termination.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Node.js, Express.js.
- **AI & Validation**: `@google/genai` utilizing Structured JSON output mode with `gemini-3.8-flash`, validated strictly via `zod`.
- **Data Persistence**: In-memory database with local JSON file persistence (`server/db.json`), pre-seeded with 10 realistic EC2 instances (high-utilization production workloads vs. abandoned dev/test zombies).
- **Frontend Dual-Delivery**:
  1. **Integrated Web Experience**: Upgraded interactive landing page (`index.html`, `style.css`, `app.js`) with fullscreen looping video background, live KPI metrics, telemetry table, and modal drawer.
  2. **Modern React Client**: Complete Vite + Tailwind CSS + Lucide React SPA located in `/client`.

---

## 📁 File Structure

```
finois/
├── server.js                      # Root server entry point
├── package.json                   # Root dependencies (express, @google/genai, zod, cors, dotenv)
├── .env.example                   # Environment variable template
├── .env                           # Local environment config
├── index.html                     # Live website & FinOps dashboard (with video background)
├── style.css                      # Design tokens, glassmorphism, micro-animations
├── app.js                         # Frontend controller driving live telemetry & audits
├── gemini_generated_video_a53d7be8.mp4 # Hero background video
├── server/
│   ├── server.js                  # Express API server & routes
│   ├── gemini.js                  # Gemini 3.8 Flash integration + Zod validation & FinOps heuristic fallback
│   ├── schemas.js                 # Strict Zod schemas for structured AI output & termination
│   └── db.js                      # Cloud instances state manager & audit trail
└── client/                        # Modern React + Vite application
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                # Main FinOps dashboard layout
        ├── index.css
        ├── api.js                 # API service client
        └── components/
            ├── MetricsBar.jsx            # High-level FinOps KPIs
            ├── InfrastructureTable.jsx   # Live telemetry table with CPU/Mem bars
            ├── AuditPanel.jsx            # AI audit runner with animated stages
            ├── AuditResultsModal.jsx     # AI executive summary & HITL approval
            └── AuditLogDrawer.jsx        # Historical decommission trail
```

---

## 🚀 Quick Start Guide

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and provide your Google Gemini API key:
```env
PORT=3001
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*(Note: If no API key is provided, CloudPrune AI includes an intelligent deterministic FinOps heuristic engine so all audits, calculations, and approvals work seamlessly out of the box).*

---

### 2. Start the Node.js Express Backend
From the root directory:
```bash
# Install backend dependencies
npm install

# Start the full-stack server
npm start
```
The server will start at:
- **Web Dashboard**: [http://localhost:3001](http://localhost:3001)
- **API Health**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

### 3. (Optional) Run the React (Vite) Client
If you want to run the React developer server with hot reloading:
```bash
cd client
npm install
npm run dev
```
The React dashboard will be accessible at: [http://localhost:5173](http://localhost:5173).

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/instances` | Returns all cloud instances with live telemetry |
| `GET` | `/api/metrics` | Computes Total Spend, Estimated Waste, Server Health, and Savings |
| `POST` | `/api/audit` | Triggers Gemini AI audit with strict Zod structured output validation |
| `POST` | `/api/terminate` | Human-in-the-loop termination of specified `{ instanceIds: string[] }` |
| `GET` | `/api/audit-logs` | Retrieves full historical audit trail of terminated instances |
| `POST` | `/api/instances/reset` | Resets all 10 instances to initial seeded states for repeat testing |
| `GET` | `/api/health` | Health check and Gemini configuration status |

---

## 🛡️ Strict Zod Validation Schema

Responses from the Gemini model are strictly validated against:

```typescript
const AuditResponseSchema = z.object({
  executiveSummary: z.string(),
  totalMonthlyWaste: z.number(),
  actionPlan: z.string(),
  flaggedInstances: z.array(z.object({
    id: z.string(),
    reason: z.string(),
    confidenceScore: z.number(),
    estimatedMonthlySavings: z.number()
  }))
});
```

---

## 💡 How Human-in-the-Loop Termination Works

1. **Ingest Telemetry**: Telemetry from all active cloud instances is streamed into the table.
2. **AI Audit**: Clicking **"Run AI Audit"** analyzes CPU utilization, memory, tags, and inactivity timestamps.
3. **Structured Verification**: Gemini 3.8 Flash produces a structured assessment validated against the Zod schema.
4. **Review & Select**: The DevOps engineer inspects the flagged instances, confidence scores, and reasons in the modal.
5. **Approve & Terminate**: Clicking **"Approve & Terminate [X] Instances"** updates the instance statuses to `terminated`, recalculates monthly waste, and adds the savings to the **Total Savings Realized** counter.
