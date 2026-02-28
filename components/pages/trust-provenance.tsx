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
import { Shield, Lock, FileCheck, Share2 } from "lucide-react"
import { useEffect, useState } from "react"

const TRUST_BAR_COLORS = ["#93c5fd", "#86efac", "#2c2c2c", "#c4b5fd"]

interface XGBoostData {
  abuseScore: number;
  confidence: number;
  autoBlocked: boolean;
  probability: number;
}

interface TrustScoreData {
  entityType: string;
  entityId: string;
  productionScore: number;
  ruleBased: {
    overallScore: number;
    dimensions: {
      reputation: number;
      quality: number;
      timeliness: number;
      verification: number;
      behavior: number;
    };
  };
  xgboost: XGBoostData | null;
  comparison: {
    difference: number;
    percentDifference: number;
    agreement: boolean;
    higherScore: string;
  } | null;
  calculatedAt: string;
}

interface TrustData {
  success: boolean;
  data: TrustScoreData;
}

export default function TrustProvenance() {
  const [trustData, setTrustData] = useState<TrustData | null>(null);
  const [datasetResults, setDatasetResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mlServiceOnline, setMlServiceOnline] = useState<boolean | null>(null);

  const fetchAllData = async () => {
    try {
      const demoRes = await fetch('http://localhost:3001/api/trust/score-demo');
      const demoData = await demoRes.json();
      setTrustData(demoData);
      setMlServiceOnline(demoData?.data?.mlServiceOnline ?? false);

      const dsRes = await fetch('http://localhost:3001/api/trust/dataset-results');
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
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Data Preparation ───────────────────────────────────────────────────
  const trustMetrics = trustData?.data?.ruleBased?.dimensions ? [
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
              {mlServiceOnline ? '🤖 XGBoost Core: ACTIVE' : '⚠ DEMO MODE'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-400 font-medium">Calibrating Scoring Engines...</p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* ════ SECTION 1: ENTITY SPOTLIGHT (Detailed Individual Analysis) ════ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4">
              <h3 className="text-xl font-bold text-gray-900">Entity Spotlight: <span className="font-mono text-blue-600">{trustData?.data?.entityId}</span></h3>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-widest">Single Validation</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar: Dimensions */}
              <div style={cardStyle} className="p-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Trust Vector Analysis</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={trustMetrics}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: 600, fill: '#6b7280' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#111827', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar: Dimensions List */}
              <div style={cardStyle} className="p-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Dimension breakdown</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trustMetrics} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="metric" type="category" tick={{ fontSize: 11, fontWeight: 700 }} width={100} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                      {trustMetrics.map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Entity KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div style={cardStyle} className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase">Overall Trust</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{trustData?.data?.productionScore?.toFixed(1) || '0.0'}</p>
                <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${trustData?.data?.productionScore}%` }} />
                </div>
              </div>
              <div style={cardStyle} className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase">XGBoost Abuse</p>
                <p className="text-3xl font-black text-purple-600 mt-1">{trustData?.data?.xgboost?.abuseScore?.toFixed(1) || '0.0'}%</p>
                <p className="text-[10px] text-gray-500 font-bold mt-2">CONFIDENCE: {trustData?.data?.xgboost?.confidence?.toFixed(1)}%</p>
              </div>
              <div style={cardStyle} className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase">Safe Status</p>
                <div className="mt-1 flex items-center gap-2">
                  {trustData?.data?.xgboost?.autoBlocked ?
                    <><Lock className="w-6 h-6 text-red-600" /><span className="text-xl font-black text-red-600">BLOCKED</span></> :
                    <><Shield className="w-6 h-6 text-green-600" /><span className="text-xl font-black text-green-600">SECURE</span></>}
                </div>
              </div>
              <div style={cardStyle} className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase">Last Validated</p>
                <p className="text-lg font-bold text-gray-900 mt-2">{trustData?.data?.calculatedAt ? new Date(trustData.data.calculatedAt).toLocaleTimeString() : 'N/A'}</p>
                <p className="text-[10px] text-blue-600 font-black cursor-pointer hover:underline mt-1">REFRESH NOW</p>
              </div>
            </div>

            {/* Dual Comparison UI */}
            <div style={cardStyle} className="overflow-hidden bg-gray-50/50">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-blue-100 p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-blue-800 text-lg">Rule-Based Score</h5>
                    <FileCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-4xl font-black text-blue-600 my-2">{trustData?.data?.ruleBased?.overallScore?.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 font-medium">Deterministic evaluation based on history, volume, and provenance rules.</p>
                </div>
                <div className="bg-white border border-purple-100 p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-purple-800 text-lg">XGBoost ML Score</h5>
                    <Share2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-4xl font-black text-purple-600 my-2">{trustData?.data?.xgboost?.abuseScore?.toFixed(1)}</p>
                  <div className="flex gap-4 mt-2">
                    <div><p className="text-[10px] uppercase font-bold text-gray-400">Decision</p><p className="text-xs font-bold text-purple-700">{trustData?.data?.xgboost?.autoBlocked ? 'REJECT' : 'ALLOW'}</p></div>
                    <div><p className="text-[10px] uppercase font-bold text-gray-400">Probability</p><p className="text-xs font-bold text-purple-700">{((trustData?.data?.xgboost?.probability || 0) * 100).toFixed(1)}%</p></div>
                  </div>
                </div>
              </div>
              {trustData?.data?.comparison && (
                <div className="mx-6 mb-6 p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${trustData.data.comparison.agreement ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Share2 className={`w-5 h-5 ${trustData.data.comparison.agreement ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Model Agreement: {trustData.data.comparison.agreement ? 'HIGH' : 'DIVERGED'}</p>
                      <p className="text-xs text-gray-500">Delta Variance: {trustData.data.comparison.difference.toFixed(2)} pts</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold px-3 py-1 bg-gray-900 text-white rounded-full">DOMINANT ENGINE: {trustData.data.comparison.higherScore.toUpperCase()}</p>
                </div>
              )}
            </div>
          </section>

          {/* ════ SECTION 2: GLOBAL DATASET INTELLIGENCE Hub ════ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-purple-600 pl-4">
              <h3 className="text-xl font-bold text-gray-900">Global Dataset Intelligence</h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase tracking-widest">Aggregate View ({datasetResults?.stats?.total || '0'})</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dataset Summary Table */}
              <div style={cardStyle} className="col-span-1 lg:col-span-2 p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">IP Trust Terminal</h4>
                  <div className="flex gap-4">
                    <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Avg Trust</p><p className="text-lg font-bold text-blue-600 leading-none">{datasetResults?.stats?.avgRb || '0'}</p></div>
                    <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Avg Abuse</p><p className="text-lg font-bold text-purple-600 leading-none">{datasetResults?.stats?.avgXgb || '0'}</p></div>
                  </div>
                </div>
                <div className="overflow-auto max-h-[350px]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="py-3 px-2">Host Indicator</th>
                        <th className="py-3 px-2">RB Trust</th>
                        <th className="py-3 px-2">XGB Abuse</th>
                        <th className="py-3 px-2">Auto-Block</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {datasetResults?.rows?.slice(0, 50).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-2 font-mono font-bold text-gray-900 flex items-center gap-2">
                            {row.ip} <span className="text-[10px] px-1 bg-gray-100 text-gray-500 rounded">{row.country}</span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-100 h-1 rounded-full"><div className="bg-blue-500 h-full" style={{ width: `${row.rb_trust_score}%` }} /></div>
                              <span className="font-bold">{row.rb_trust_score.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-bold text-purple-600">{row.xgb_abuse.toFixed(1)}%</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${row.xgb_auto_block ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.xgb_auto_block ? 'Blocked' : 'Secure'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dataset Distribution Chart */}
              <div style={cardStyle} className="p-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Model Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datasetDistribution} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} width={100} tick={{ fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {datasetDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2 text-center tracking-widest">Inference Accuracy</p>
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
      )}
    </div>
  )
}