import React, { useState, useMemo } from 'react';
import {
  Cpu, HardDrive, Tag, Clock, Check, AlertCircle, Trash2, PowerOff,
  ShieldCheck, Plus, ArrowUpDown, ArrowUp, ArrowDown, Download, Layers, Loader2
} from 'lucide-react';

export default function InfrastructureTable({
  instances,
  isLoading = false,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  flaggedMap = {},
  onQuickTerminate,
  terminatingIds = [],
  onOpenAddModal
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortField, setSortField] = useState('monthlyCost');
  const [sortAsc, setSortAsc] = useState(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    instances.forEach(i => (i.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [instances]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Filtered & Sorted instances
  const processedInstances = useMemo(() => {
    let list = instances.filter(inst => {
      const matchesFilter =
        filter === 'all' ? true :
        filter === 'running' ? inst.status === 'running' :
        filter === 'flagged' ? Boolean(flaggedMap[inst.id]) && inst.status === 'running' :
        filter === 'terminated' ? inst.status === 'terminated' : true;

      const matchesTag = !selectedTag || (inst.tags && inst.tags.includes(selectedTag));

      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        inst.name.toLowerCase().includes(q) ||
        inst.id.toLowerCase().includes(q) ||
        inst.type.toLowerCase().includes(q) ||
        (inst.region && inst.region.toLowerCase().includes(q)) ||
        (inst.tags && inst.tags.some(t => t.toLowerCase().includes(q)));

      return matchesFilter && matchesTag && matchesSearch;
    });

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortAsc ? cmp : -cmp;
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [instances, filter, search, selectedTag, sortField, sortAsc, flaggedMap]);

  const runningCount = instances.filter(i => i.status === 'running').length;
  const flaggedCount = Object.keys(flaggedMap).filter(id => {
    const item = instances.find(i => i.id === id);
    return item && item.status === 'running';
  }).length;

  // Selected items savings sum
  const selectedSavings = useMemo(() => {
    return selectedIds.reduce((sum, id) => {
      const item = instances.find(i => i.id === id);
      return sum + (item && item.status === 'running' ? item.monthlyCost || 0 : 0);
    }, 0);
  }, [selectedIds, instances]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['Instance ID', 'Name', 'Type', 'Region', 'CPU %', 'Memory %', 'Monthly Cost ($)', 'Status', 'Tags', 'Last Active'];
    const rows = processedInstances.map(i => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      i.type,
      i.region || 'us-east-1',
      i.cpuUtilization,
      i.memoryUtilization,
      i.monthlyCost.toFixed(2),
      i.status,
      `"${(i.tags || []).join(';')}"`,
      `"${i.lastActive || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cloudprune_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-600 inline ml-1 opacity-60" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-indigo-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400 inline ml-1" />
    );
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl mb-8">
      {/* Header with Search and Filters */}
      <div className="p-5 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Live Cloud Infrastructure Telemetry</span>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-gray-800 text-gray-300 border border-gray-700">
              {instances.length} Nodes
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time compute utilization across multi-region VPC instances</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Instance Button */}
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-all active:scale-95"
              title="Add a new cloud instance"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Instance</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
            title="Download CSV export"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, type..."
            className="px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
          />

          {/* Tag Dropdown */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          )}

          {/* Filter Tabs */}
          <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({instances.length})
            </button>
            <button
              onClick={() => setFilter('running')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'running' ? 'bg-emerald-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Active ({runningCount})
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                filter === 'flagged' ? 'bg-red-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Zombies ({flaggedCount})</span>
            </button>
            <button
              onClick={() => setFilter('terminated')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'terminated' ? 'bg-gray-800 text-gray-300 font-medium' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Terminated
            </button>
          </div>
        </div>
      </div>

      {/* Selected Action Strip */}
      {selectedIds.length > 0 && (
        <div className="px-5 py-2.5 bg-indigo-950/40 border-b border-indigo-800/40 flex items-center justify-between flex-wrap gap-2 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>{selectedIds.length} workload{selectedIds.length > 1 ? 's' : ''} selected</span>
            <span className="text-gray-500">•</span>
            <span className="text-emerald-400 font-mono font-bold">+${selectedSavings.toFixed(2)}/mo potential savings</span>
          </div>
          <button
            onClick={() => onToggleSelect('ALL_CLEAR')}
            className="text-[11px] text-gray-400 hover:text-white underline underline-offset-2"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-950/60 text-gray-400 border-b border-gray-800 font-mono uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  onChange={onSelectAll}
                  checked={
                    processedInstances.filter(i => i.status === 'running').length > 0 &&
                    processedInstances.filter(i => i.status === 'running').every(i => selectedIds.includes(i.id))
                  }
                  className="rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  aria-label="Select all running instances"
                />
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                Instance {renderSortIndicator('name')}
              </th>
              <th className="py-3 px-4">Environment & Tags</th>
              <th
                onClick={() => handleSort('cpuUtilization')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                CPU Load {renderSortIndicator('cpuUtilization')}
              </th>
              <th
                onClick={() => handleSort('memoryUtilization')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                Memory {renderSortIndicator('memoryUtilization')}
              </th>
              <th
                onClick={() => handleSort('monthlyCost')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                Monthly Cost {renderSortIndicator('monthlyCost')}
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                Status {renderSortIndicator('status')}
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-sans">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-4 px-4 text-center">
                    <div className="w-4 h-4 bg-gray-800 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-800" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-gray-800 rounded" />
                        <div className="h-2.5 w-24 bg-gray-800/60 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-1.5">
                      <div className="h-4 w-12 bg-gray-800 rounded" />
                      <div className="h-4 w-16 bg-gray-800 rounded" />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 w-20 bg-gray-800 rounded mb-1.5" />
                    <div className="h-1.5 w-28 bg-gray-800/50 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 w-16 bg-gray-800 rounded mb-1.5" />
                    <div className="h-1.5 w-20 bg-gray-800/50 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-14 bg-gray-800 rounded mb-1" />
                    <div className="h-2 w-10 bg-gray-800/50 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-gray-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-6 w-16 bg-gray-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : processedInstances.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                  <p className="text-sm font-medium text-gray-400">No cloud workloads found matching criteria</p>
                  <p className="text-xs text-gray-600 mt-1">Try resetting the search query or changing your filter tab</p>
                </td>
              </tr>
            ) : (
              processedInstances.map((inst) => {
                const isFlagged = Boolean(flaggedMap[inst.id]);
                const isTerminated = inst.status === 'terminated';
                const isSelected = selectedIds.includes(inst.id);

                return (
                  <tr
                    key={inst.id}
                    className={`transition-colors duration-150 ${
                      isTerminated ? 'bg-gray-950/30 opacity-60' :
                      isFlagged ? 'bg-red-950/10 hover:bg-red-950/20' :
                      'hover:bg-gray-800/30'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      {!isTerminated ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(inst.id)}
                          className="rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          aria-label={`Select instance ${inst.name}`}
                        />
                      ) : (
                        <PowerOff className="w-3.5 h-3.5 text-gray-600 mx-auto" />
                      )}
                    </td>

                    {/* Instance Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{inst.name}</span>
                            {isFlagged && !isTerminated && (
                              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 rounded animate-pulse">
                                Idle Zombie
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <span className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-[10px] font-medium border border-indigo-800/30">{inst.type}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                              {inst.region || 'us-east-1'}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500 text-[10px]">{inst.lastActive || 'Active'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Environment & Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(inst.tags || []).map((t, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              t.includes('prod')
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                : t.includes('staging') || t.includes('qa')
                                ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                                : t.includes('abandoned') || t.includes('zombie') || t.includes('expired')
                                ? 'bg-red-950/60 text-red-400 border border-red-800/40 font-bold'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* CPU Load */}
                    <td className="py-3.5 px-4">
                      <div className="w-32">
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className={inst.cpuUtilization < 5 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                            {inst.cpuUtilization}%
                          </span>
                          <span className="text-gray-500 text-[10px]">
                            {inst.cpuUtilization < 5 ? 'Underutilized' : 'Normal'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              inst.cpuUtilization < 5 ? 'bg-red-500' :
                              inst.cpuUtilization > 75 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(inst.cpuUtilization, 3)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Memory */}
                    <td className="py-3.5 px-4">
                      <div className="w-28">
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="text-gray-300">{inst.memoryUtilization}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${inst.memoryUtilization}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-sm">
                        ${inst.monthlyCost.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        ${(inst.monthlyCost / 730).toFixed(3)}/hr
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isTerminated ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-800/80 text-gray-400 border border-gray-700">
                          <PowerOff className="w-3 h-3" />
                          Decommissioned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Running
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {!isTerminated ? (
                        <button
                          onClick={() => onQuickTerminate(inst.id)}
                          disabled={terminatingIds.includes(inst.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            terminatingIds.includes(inst.id)
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : isFlagged
                              ? 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600 hover:text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                          }`}
                          title={`Decommission ${inst.name}`}
                          aria-label={`Decommission ${inst.name}`}
                        >
                          {terminatingIds.includes(inst.id) ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin text-red-400" />
                              <span>Pruning...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                              <span>Prune</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-600 font-mono">Archived</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
