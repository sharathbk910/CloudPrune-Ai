import React, { useState } from 'react';
import { X, Server, Plus, Cpu, HardDrive, DollarSign, Globe, Tag, Sparkles } from 'lucide-react';

const INSTANCE_TYPES = [
  { type: 't3.micro', desc: '2 vCPU, 1 GiB', cost: 10.50 },
  { type: 't3.medium', desc: '2 vCPU, 4 GiB', cost: 30.37 },
  { type: 't3.large', desc: '2 vCPU, 8 GiB', cost: 60.74 },
  { type: 'm5.large', desc: '2 vCPU, 8 GiB', cost: 70.08 },
  { type: 'm5.xlarge', desc: '4 vCPU, 16 GiB', cost: 140.16 },
  { type: 'c5.xlarge', desc: '4 vCPU, 8 GiB', cost: 124.10 },
  { type: 'c5.4xlarge', desc: '16 vCPU, 32 GiB', cost: 496.40 },
  { type: 'r5.large', desc: '2 vCPU, 16 GiB', cost: 91.98 },
  { type: 'r5.2xlarge', desc: '8 vCPU, 64 GiB', cost: 367.92 },
  { type: 'g4dn.xlarge', desc: '4 vCPU, 16 GiB, 1 GPU', cost: 383.98 }
];

const REGIONS = [
  { code: 'us-east-1', name: 'us-east-1 (N. Virginia)' },
  { code: 'us-west-2', name: 'us-west-2 (Oregon)' },
  { code: 'eu-central-1', name: 'eu-central-1 (Frankfurt)' },
  { code: 'eu-west-1', name: 'eu-west-1 (Ireland)' },
  { code: 'ap-southeast-1', name: 'ap-southeast-1 (Singapore)' },
  { code: 'ap-south-1', name: 'ap-south-1 (Mumbai)' }
];

export default function AddInstanceModal({ isOpen, onClose, onAddInstance }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('t3.medium');
  const [region, setRegion] = useState('us-east-1');
  const [monthlyCost, setMonthlyCost] = useState('30.37');
  const [cpuUtilization, setCpuUtilization] = useState(25);
  const [memoryUtilization, setMemoryUtilization] = useState(45);
  const [tags, setTags] = useState('custom, web');
  const [status, setStatus] = useState('running');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    const found = INSTANCE_TYPES.find(t => t.type === selectedType);
    if (found) {
      setMonthlyCost(found.cost.toFixed(2));
    }
  };

  const applyPreset = (preset) => {
    if (preset === 'prod') {
      setName(`Production API Gateway #${Math.floor(100 + Math.random() * 900)}`);
      handleTypeSelect('m5.xlarge');
      setRegion('us-east-1');
      setCpuUtilization(68);
      setMemoryUtilization(75);
      setTags('production, api, critical, active');
      setStatus('running');
    } else if (preset === 'zombie') {
      setName(`QA Abandoned Testbed #${Math.floor(100 + Math.random() * 900)}`);
      handleTypeSelect('c5.4xlarge');
      setRegion('eu-central-1');
      setCpuUtilization(1.5);
      setMemoryUtilization(4.2);
      setTags('qa, temporary, zombie-candidate, abandoned');
      setStatus('running');
    } else if (preset === 'gpu') {
      setName(`LLM Training Worker #${Math.floor(10 + Math.random() * 90)}`);
      handleTypeSelect('g4dn.xlarge');
      setRegion('us-west-2');
      setCpuUtilization(42);
      setMemoryUtilization(88);
      setTags('ml, gpu, pytorch, inference');
      setStatus('running');
    }
  };

  const handleAddTag = (tag) => {
    const arr = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!arr.includes(tag)) {
      arr.push(tag);
      setTags(arr.join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const tagArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    await onAddInstance({
      name: name.trim(),
      type,
      region,
      monthlyCost: parseFloat(monthlyCost) || 30.0,
      cpuUtilization: parseFloat(cpuUtilization) || 10.0,
      memoryUtilization: parseFloat(memoryUtilization) || 20.0,
      tags: tagArray.length ? tagArray : ['custom'],
      status
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Cloud Workload</h3>
              <p className="text-xs text-gray-400">Provision a new instance to real-time telemetry monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Presets */}
          <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('prod')}
                className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Healthy Prod</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('zombie')}
                className="px-2.5 py-1 text-xs rounded-lg bg-red-950/50 text-red-300 border border-red-800/60 hover:bg-red-900/60 transition-colors flex items-center gap-1"
              >
                <span>⚠️ Zombie Dev Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('gpu')}
                className="px-2.5 py-1 text-xs rounded-lg bg-purple-950/50 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 transition-colors flex items-center gap-1"
              >
                <span>⚡ GPU Cluster</span>
              </button>
            </div>
          </div>

          {/* Instance Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Workload Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment Gateway API, Cache Primary"
              required
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Type & Region Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Instance Type
              </label>
              <select
                value={type}
                onChange={(e) => handleTypeSelect(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {INSTANCE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.type} ({t.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Cost & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Monthly Cost ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="running">Running (Active)</option>
                <option value="terminated">Terminated (Inactive)</option>
              </select>
            </div>
          </div>

          {/* Simulated Utilization Sliders */}
          <div className="p-3.5 bg-gray-950/60 border border-gray-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Simulated Utilization</span>
              <span className="text-[11px] text-gray-500">Live telemetry</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">CPU Load</span>
                <span className="font-mono text-emerald-400 font-bold">{cpuUtilization}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={cpuUtilization}
                onChange={(e) => setCpuUtilization(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>0% (Idle / Zombie)</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Memory Load</span>
                <span className="font-mono text-emerald-400 font-bold">{memoryUtilization}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={memoryUtilization}
                onChange={(e) => setMemoryUtilization(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Tags <span className="text-gray-500 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. production, web, critical"
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleAddTag('production')}
                className="px-2 py-0.5 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
              >
                + production
              </button>
              <button
                type="button"
                onClick={() => handleAddTag('staging')}
                className="px-2 py-0.5 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
              >
                + staging
              </button>
              <button
                type="button"
                onClick={() => handleAddTag('dev')}
                className="px-2 py-0.5 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
              >
                + dev
              </button>
              <button
                type="button"
                onClick={() => handleAddTag('abandoned')}
                className="px-2 py-0.5 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
              >
                + abandoned
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Provisioning...' : 'Add to Telemetry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
