const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "db.json");

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

class Database {
  constructor() {
    this.instances = [];
    this.auditLogs = [];
    this.totalSavingsRealized = 0;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const data = JSON.parse(raw);
        this.instances = data.instances || SEED_INSTANCES;
        this.auditLogs = data.auditLogs || [];
        this.totalSavingsRealized = data.totalSavingsRealized || 0;
      } else {
        this.reset();
      }
    } catch (e) {
      console.warn("Could not read db.json, initializing in-memory store:", e.message);
      this.reset();
    }
  }

  persist() {
    try {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
          {
            instances: this.instances,
            auditLogs: this.auditLogs,
            totalSavingsRealized: this.totalSavingsRealized,
            updatedAt: new Date().toISOString()
          },
          null,
          2
        )
      );
    } catch (e) {
      console.warn("Error persisting db.json:", e.message);
    }
  }

  reset() {
    this.instances = JSON.parse(JSON.stringify(SEED_INSTANCES));
    this.auditLogs = [
      {
        id: "log-init",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: "INITIAL_TELEMETRY_SYNC",
        details: "Ingested initial live cloud telemetry across 10 EC2 instances."
      }
    ];
    this.totalSavingsRealized = 0;
    this.persist();
  }

  getInstances() {
    return this.instances;
  }

  getInstance(id) {
    return this.instances.find(inst => inst.id === id);
  }

  // CREATE instance
  createInstance(data) {
    const id = data.id || `i-${Math.random().toString(16).substring(2, 11)}${Math.random().toString(16).substring(2, 8)}`;
    const newInstance = {
      id,
      name: data.name || "Unnamed Cloud Workload",
      type: data.type || "t3.medium",
      cpuUtilization: Number(data.cpuUtilization || 0),
      memoryUtilization: Number(data.memoryUtilization || 0),
      monthlyCost: Number(data.monthlyCost || 50.0),
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : ["custom"]),
      status: data.status || "running",
      lastActive: data.lastActive || "Just now",
      region: data.region || "us-east-1"
    };

    this.instances.unshift(newInstance);
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "CREATE_INSTANCE",
      instanceCount: 1,
      instanceIds: [newInstance.id],
      details: `Created new cloud instance "${newInstance.name}" (${newInstance.id}) in ${newInstance.region}`
    });
    this.persist();
    return newInstance;
  }

  // UPDATE instance
  updateInstance(id, updates) {
    const index = this.instances.findIndex(inst => inst.id === id);
    if (index === -1) return null;

    const current = this.instances[index];
    const updated = {
      ...current,
      ...updates,
      id: current.id, // prevent changing ID
      cpuUtilization: updates.cpuUtilization !== undefined ? Number(updates.cpuUtilization) : current.cpuUtilization,
      memoryUtilization: updates.memoryUtilization !== undefined ? Number(updates.memoryUtilization) : current.memoryUtilization,
      monthlyCost: updates.monthlyCost !== undefined ? Number(updates.monthlyCost) : current.monthlyCost,
      tags: Array.isArray(updates.tags) ? updates.tags : (updates.tags ? [updates.tags] : current.tags)
    };

    this.instances[index] = updated;
    this.persist();
    return updated;
  }

  // DELETE instance
  deleteInstance(id) {
    const index = this.instances.findIndex(inst => inst.id === id);
    if (index === -1) return null;

    const [deleted] = this.instances.splice(index, 1);
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "DELETE_INSTANCE",
      instanceCount: 1,
      instanceIds: [deleted.id],
      details: `Hard deleted instance "${deleted.name}" (${deleted.id}) from inventory`
    });
    this.persist();
    return deleted;
  }

  // DELETE/CLEAR Audit Logs
  clearAuditLogs() {
    const count = this.auditLogs.length;
    this.auditLogs = [];
    this.persist();
    return { success: true, clearedCount: count };
  }

  terminateInstances(ids, reason = "Human-in-the-loop approved termination via CloudPrune AI") {
    const terminated = [];
    let savingsFromBatch = 0;

    this.instances.forEach(inst => {
      if (ids.includes(inst.id) && inst.status !== "terminated") {
        inst.status = "terminated";
        savingsFromBatch += inst.monthlyCost;
        terminated.push({
          id: inst.id,
          name: inst.name,
          savedMonthly: inst.monthlyCost
        });
      }
    });

    this.totalSavingsRealized += savingsFromBatch;

    const auditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "TERMINATE_INSTANCES",
      instanceCount: terminated.length,
      instanceIds: ids,
      monthlySavingsClaimed: Math.round(savingsFromBatch * 100) / 100,
      reason,
      details: `Successfully terminated ${terminated.length} instances. Total estimated monthly savings realized: $${savingsFromBatch.toFixed(2)}`
    };

    this.auditLogs.unshift(auditEntry);
    this.persist();

    return {
      success: true,
      terminatedCount: terminated.length,
      monthlySavingsAdded: Math.round(savingsFromBatch * 100) / 100,
      totalSavingsRealized: Math.round(this.totalSavingsRealized * 100) / 100,
      terminatedInstances: terminated,
      auditLog: auditEntry
    };
  }

  getMetrics() {
    const totalSpend = this.instances
      .filter(i => i.status !== "terminated")
      .reduce((sum, i) => sum + i.monthlyCost, 0);

    const activeCount = this.instances.filter(i => i.status === "running").length;
    const terminatedCount = this.instances.filter(i => i.status === "terminated").length;

    // Detect idle candidates using standard FinOps heuristic threshold (< 5% CPU & inactive)
    const zombieCandidates = this.instances.filter(
      i => i.status === "running" && (i.cpuUtilization < 5 || i.tags.some(t => ["abandoned", "zombie-candidate", "expired", "load-test", "idle-eval"].includes(t)))
    );

    const estimatedMonthlyWaste = zombieCandidates.reduce((sum, i) => sum + i.monthlyCost, 0);

    return {
      totalMonthlySpend: Math.round(totalSpend * 100) / 100,
      estimatedMonthlyWaste: Math.round(estimatedMonthlyWaste * 100) / 100,
      activeServers: activeCount,
      zombieServers: zombieCandidates.length,
      terminatedServers: terminatedCount,
      totalSavingsRealized: Math.round(this.totalSavingsRealized * 100) / 100
    };
  }

  getAuditLogs() {
    return this.auditLogs;
  }
}

const db = new Database();

module.exports = db;
