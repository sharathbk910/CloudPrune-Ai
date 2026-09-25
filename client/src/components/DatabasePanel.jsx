import React, { useState, useEffect } from 'react';
import {
  Database, ChevronDown, ChevronUp, HardDrive, Table2, Clock, CheckCircle2,
  XCircle, RefreshCw, Layers, FileJson, Server
} from 'lucide-react';
import { api } from '../api';
import { isSupabaseConfigured, SUPABASE_URL } from '../supabase';

export default function DatabasePanel({ instances = [], auditLogs = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dbStats, setDbStats] = useState(null);

  useEffect(() => {
    // Compute database statistics from current data
    const running = instances.filter(i => i.status === 'running').length;
    const terminated = instances.filter(i => i.status === 'terminated').length;
    const totalCost = instances.reduce((s, i) => s + (i.monthlyCost || 0), 0);
    const regions = [...new Set(instances.map(i => i.region))].length;
    const types = [...new Set(instances.map(i => i.type))].length;

    setDbStats({
      totalRecords: instances.length,
      running,
      terminated,
      auditLogCount: auditLogs.length,
      totalCost,
      regions,
      instanceTypes: types,
      storageType: isSupabaseConfigured ? 'Supabase (PostgreSQL)' : 'In-Memory (SQLite-compatible)',
      lastSync: new Date().toLocaleString()
    });
  }, [instances, auditLogs]);

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="database-content"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Database & Storage Layer
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full flex items-center gap-1 ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <HardDrive className="w-3 h-3" />
                {isSupabaseConfigured ? 'Supabase Connected' : 'In-Memory Mode'}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Storage backend, data model, record counts, and sync status</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isExpanded && dbStats && (
        <div id="database-content" className="px-5 pb-5 border-t border-gray-800/60 space-y-4 pt-4">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Connection Details
              </span>
              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Storage Backend</span>
                  <span className="font-mono text-gray-200">{dbStats.storageType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Supabase URL</span>
                  <span className="font-mono text-gray-200">
                    {isSupabaseConfigured
                      ? SUPABASE_URL.replace(/https?:\/\//, '').slice(0, 30) + '...'
                      : 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Connection Status</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="font-mono text-emerald-400">Active</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last Sync</span>
                  <span className="font-mono text-gray-200">{dbStats.lastSync}</span>
                </div>
              </div>
            </div>

            {/* Data Model */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Data Model (Tables)
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-800 text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Table2 className="w-3 h-3 text-indigo-400" />
                    cloud_instances
                  </span>
                  <span className="font-mono text-indigo-300">{dbStats.totalRecords} rows</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-800 text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <FileJson className="w-3 h-3 text-emerald-400" />
                    audit_logs
                  </span>
                  <span className="font-mono text-emerald-300">{dbStats.auditLogCount} rows</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-800 text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <HardDrive className="w-3 h-3 text-amber-400" />
                    auth_users
                  </span>
                  <span className="font-mono text-amber-300">In-memory</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-800 text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Clock className="w-3 h-3 text-red-400" />
                    otp_store
                  </span>
                  <span className="font-mono text-red-300">Volatile (Map)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Record Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-white font-mono">{dbStats.totalRecords}</div>
              <span className="text-[10px] text-gray-500">Total Instances</span>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-emerald-400 font-mono">{dbStats.running}</div>
              <span className="text-[10px] text-gray-500">Running</span>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-gray-400 font-mono">{dbStats.terminated}</div>
              <span className="text-[10px] text-gray-500">Terminated</span>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-indigo-400 font-mono">{dbStats.regions}</div>
              <span className="text-[10px] text-gray-500">Regions</span>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-amber-400 font-mono">{dbStats.instanceTypes}</div>
              <span className="text-[10px] text-gray-500">Instance Types</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
