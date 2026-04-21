"use client"

import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { useState, useEffect } from "react"
import { Shield, Database, Cpu, Activity, Clock, Server, CheckCircle2, AlertTriangle, Zap, ArrowRight, TrendingUp } from "lucide-react"

interface TrustData {
  success: boolean
  data: {
    entityId: string
    productionScore: number
    mlServiceOnline: boolean
    ruleBased: {
      overallScore: number
      dimensions: {
        reputation: number
        quality: number
        timeliness: number
        verification: number
        behavior: number
      }
    }
    xgboost: {
      abuseScore: number
      confidence: number
      autoBlocked: boolean
      probability: number
    }
    comparison: {
      difference: number
      agreement: boolean
      higherScore: string
    }
    calculatedAt: string
  }
}

export default function TrustProvenance() {
  const [trustData, setTrustData] = useState<TrustData | null>(null);
  const [datasetResults, setDatasetResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mlServiceOnline, setMlServiceOnline] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchAllData = async (targetId?: string) => {
    try {
      const url = targetId ? `/api/trust/score-demo?id=${targetId}` : '/api/trust/score-demo';
      const engineRes = await fetch(url);
      const engineData = await engineRes.json();
      setTrustData(engineData);
      setMlServiceOnline(engineData?.data?.mlServiceOnline ?? false);

      const dsRes = await fetch('/api/trust/dataset-results');
      const dsData = await dsRes.json();
      if (dsData.success) {
        setDatasetResults(dsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setMlServiceOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(selectedId || undefined);
    const interval = setInterval(() => fetchAllData(selectedId || undefined), 30000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const handleRowClick = (id: string) => {
    setSelectedId(id);
  };

  const radarData = trustData?.data?.ruleBased?.dimensions ? [
    { metric: "Reputation", value: trustData.data.ruleBased.dimensions.reputation },
    { metric: "Quality", value: trustData.data.ruleBased.dimensions.quality },
    { metric: "Timeliness", value: trustData.data.ruleBased.dimensions.timeliness },
    { metric: "Verification", value: trustData.data.ruleBased.dimensions.verification },
    { metric: "Behavior", value: trustData.data.ruleBased.dimensions.behavior },
  ] : [
    { metric: "Reputation", value: 50 },
    { metric: "Quality", value: 50 },
    { metric: "Timeliness", value: 50 },
    { metric: "Verification", value: 50 },
    { metric: "Behavior", value: 50 },
  ];

  const datasetDistribution = datasetResults?.stats?.distribution ? [
    { name: 'Low Risk (0-25)', count: datasetResults.stats.distribution.xgb.low, color: '#86efac' },
    { name: 'Medium (25-50)', count: datasetResults.stats.distribution.xgb.lowMed, color: '#93c5fd' },
    { name: 'High (50-75)', count: datasetResults.stats.distribution.xgb.med, color: '#fcd34d' },
    { name: 'Critical (75-100)', count: datasetResults.stats.distribution.xgb.high, color: '#f87171' },
  ] : [];

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  };

  if (loading && !trustData) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-400 font-medium">Calibrating Scoring Engines...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trust Intelligence Terminal</h2>
          <p className="text-gray-500 mt-1">Cross-Validation of Deterministic Rules vs. XGBoost Learning</p>
        </div>
        {mlServiceOnline !== null && (
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${mlServiceOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${mlServiceOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {mlServiceOnline ? 'Hybrid Intelligence Core: OPERATIONAL' : 'Heuristic Logic: STANDBY'}
            </span>
          </div>
        )}
      </div>

      {/* ════ SECTION 1: ENTITY SPOTLIGHT ════ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4">
          <h3 className="text-xl font-bold text-gray-900">Entity Spotlight: <span className="font-mono text-blue-600">{trustData?.data?.entityId}</span></h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-widest">Single Validation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Rule-Based Dimensions</h4>
              <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                Weighted Mean: {trustData?.data?.ruleBased.overallScore.toFixed(1)}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Dimensions" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div style={cardStyle} className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">XGBoost Inference</h4>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{trustData?.data?.xgboost.abuseScore.toFixed(1)}%</span>
                  <span className="text-purple-600 font-bold mb-1 uppercase text-xs tracking-widest">Abuse Score</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-1.5">
                      <span>Inference Confidence</span>
                      <span>{trustData?.data?.xgboost.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full transition-all duration-1000" style={{ width: `${trustData?.data?.xgboost.confidence}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle} className="p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Security Decision</h4>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${trustData?.data?.xgboost.autoBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {trustData?.data?.xgboost.autoBlocked ? 'Auto-Blocked' : 'Verified Secure'}
                </span>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                  "Based on the extracted STIX features and identified TTPs, the XGBoost model has determined a 
                  <span className="text-gray-900 font-bold mx-1">{(trustData?.data?.xgboost.probability * 100).toFixed(1)}% probability</span> 
                  of malicious intent."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SECTION 2: DATASET OVERVIEW ════ */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-l-4 border-purple-600 pl-4">
          <h3 className="text-xl font-bold text-gray-900">Global Dataset Intelligence</h3>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase tracking-widest">Aggregate View ({datasetResults?.stats?.total || '0'})</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div style={cardStyle} className="lg:col-span-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="py-3 px-4">Entity ID (Short)</th>
                    <th className="py-3 px-2">Rule Score</th>
                    <th className="py-3 px-2">XGB Abuse</th>
                    <th className="py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {datasetResults?.rows?.slice(0, 50).map((row: any, i: number) => {
                    const isSelected = selectedId === row.entity_id;
                    return (
                      <tr key={i} onClick={() => handleRowClick(row.entity_id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-100/50' : 'hover:bg-blue-50/30'}`}>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900 flex items-center gap-2">
                          {row.ip} <span className="text-[10px] px-1 bg-gray-100 text-gray-500 rounded">{row.country}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full"><div className="bg-blue-500 h-full" style={{ width: `${row.rb_trust_score}%` }} /></div>
                            <span className="font-bold">{row.rb_trust_score.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-bold text-purple-600">{row.xgb_abuse.toFixed(1)}%</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${row.xgb_auto_block ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.xgb_auto_block ? 'Blocked' : 'Secure'}</span>
                        </td>
                      </tr>
                    )})}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle} className="p-6 flex flex-col">
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Risk Distribution</h4>
            <div className="flex-1 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datasetDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {datasetDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-500">Mean Confidence</span>
                <span className="text-gray-900">{datasetResults?.stats?.avgConf || '0'}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${datasetResults?.stats?.avgConf}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
