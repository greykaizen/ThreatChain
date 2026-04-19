"use client";

import React, { useState, useEffect } from "react";
import MetricsCard from "../blockchain/MetricsCard";
import MetricsChart from "../blockchain/MetricsChart";
import ExportButton from "../blockchain/ExportButton";
import {
  Activity,
  Zap,
  TrendingUp,
  Database,
  Shield,
  CheckCircle,
  AlertCircle,
  Cpu,
  Clock,
  Network,
  FileCheck,
  RefreshCw,
} from "lucide-react";

interface BlockchainMetrics {
  transaction: {
    gasPrice: { wei: string; gwei: string; eth: string };
    totalTransactions: number;
    transactionsPerSecond: number;
    avgGasConsumption: number;
  };
  performance: {
    currentUtilization: number;
    throughput: number;
    avgLatency: number;
    cpuUsage: number;
  };
  consensus: {
    protocol: string;
    successRate: number;
    failureRate: number;
    faultTolerance: string;
    transactionSecurity: string;
  };
  integrity: {
    provenanceRecords: number;
    crossVerifications: number;
    challengeRecords: number;
  };
  block: {
    latestBlock: number;
    blockSize: number;
    blockUtilization: number;
    connectedNodes: number;
    ethereumBlock?: number;
  };
  timestamp: string;
}

interface HistoricalData {
  timestamp: string;
  gasFee: number;
  tps: number;
  successRate: number;
  latency: number;
  utilization: number;
  throughput: number;
}

export default function BlockchainMetrics() {
  const [metrics, setMetrics] = useState<BlockchainMetrics | null>(null);
  const [historical, setHistorical] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h"
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch current metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        "/api/blockchain/metrics"
      );
      if (!response.ok) throw new Error("Failed to fetch metrics");

      const data = await response.json();
      setMetrics(data.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to load metrics. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data
  const fetchHistorical = async (range: string) => {
    try {
      const response = await fetch(
        `/api/blockchain/metrics/history?range=${range}`
      );
      if (!response.ok) throw new Error("Failed to fetch historical data");

      const data = await response.json();
      setHistorical(data.data.metrics || []);
    } catch (err) {
      console.error("Error fetching historical data:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
    fetchHistorical(timeRange);
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Fetch historical data when time range changes
  useEffect(() => {
    fetchHistorical(timeRange);
  }, [timeRange]);

  const handleRefresh = () => {
    setLoading(true);
    fetchMetrics();
    fetchHistorical(timeRange);
  };

  if (loading && !metrics) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading blockchain metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Connection Error
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Blockchain Metrics Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()} •{" "}
            <span
              className={`${
                autoRefresh ? "text-green-600" : "text-gray-500"
              }`}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg transition-all ${
              autoRefresh
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 inline mr-2 ${
                autoRefresh ? "animate-spin" : ""
              }`}
            />
            {autoRefresh ? "Auto" : "Manual"}
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>

          <ExportButton timeRange={timeRange} />
        </div>
      </div>

      {metrics && (
        <>
          {/* Transaction Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Transaction Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard
                title="Gas Fee"
                value={parseFloat(metrics.transaction.gasPrice.gwei).toFixed(2)}
                unit="Gwei"
                icon={<Zap className="w-6 h-6" />}
                color="orange"
                alert={parseFloat(metrics.transaction.gasPrice.gwei) > 50}
                alertMessage="Gas fee is higher than normal"
              />
              <MetricsCard
                title="Total Transactions"
                value={metrics.transaction.totalTransactions.toLocaleString()}
                icon={<Activity className="w-6 h-6" />}
                color="blue"
              />
              <MetricsCard
                title="Transactions Per Second"
                value={metrics.transaction.transactionsPerSecond.toFixed(2)}
                unit="TPS"
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
              />
              <MetricsCard
                title="Avg Gas Consumption"
                value={metrics.transaction.avgGasConsumption.toLocaleString()}
                unit="gas"
                icon={<Database className="w-6 h-6" />}
                color="purple"
              />
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard
                title="Current Utilization"
                value={metrics.performance.currentUtilization.toFixed(1)}
                unit="%"
                icon={<Activity className="w-6 h-6" />}
                color="blue"
                alert={metrics.performance.currentUtilization > 80}
                alertMessage="Blockchain utilization is high"
              />
              <MetricsCard
                title="Throughput"
                value={metrics.performance.throughput.toFixed(2)}
                unit="rec/s"
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
              />
              <MetricsCard
                title="Average Latency"
                value={metrics.performance.avgLatency}
                unit="ms"
                icon={<Clock className="w-6 h-6" />}
                color="orange"
                alert={metrics.performance.avgLatency > 1000}
                alertMessage="Latency is higher than expected"
              />
              <MetricsCard
                title="CPU Usage"
                value={metrics.performance.cpuUsage}
                unit="%"
                icon={<Cpu className="w-6 h-6" />}
                color="purple"
                alert={metrics.performance.cpuUsage > 80}
                alertMessage="CPU usage is high"
              />
            </div>
          </div>

          {/* Consensus & Reliability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Consensus & Reliability
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Consensus Protocol
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {metrics.consensus.protocol}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Success Rate
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {metrics.consensus.successRate.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Failure Rate
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {metrics.consensus.failureRate.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Network className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Fault Tolerance
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">
                    {metrics.consensus.faultTolerance}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Transaction Security
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {metrics.consensus.transactionSecurity}
                  </span>
                </div>
              </div>
            </div>

            {/* Data Integrity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Integrity
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Provenance Records
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {metrics.integrity.provenanceRecords.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Cross Verifications
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {metrics.integrity.crossVerifications.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Challenge Records
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    {metrics.integrity.challengeRecords.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Charts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Historical Trends
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsChart
                title="Gas Fee Trends"
                data={historical}
                dataKey="gasFee"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                yAxisLabel="Gas Fee (Gwei)"
                color="#f59e0b"
                type="area"
              />

              <MetricsChart
                title="Transactions Per Second"
                data={historical}
                dataKey="tps"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                yAxisLabel="TPS"
                color="#3b82f6"
              />

              <MetricsChart
                title="Success Rate"
                data={historical}
                dataKey="successRate"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                yAxisLabel="Success Rate (%)"
                color="#10b981"
              />

              <MetricsChart
                title="Average Latency"
                data={historical}
                dataKey="latency"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                yAxisLabel="Latency (ms)"
                color="#8b5cf6"
              />
            </div>
          </div>

          {/* Block Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Block Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Latest Block</p>
                <p className="text-2xl font-bold text-blue-600">
                  #{metrics.block.latestBlock.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Block Size</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.block.blockSize} KB
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Block Utilization</p>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.block.blockUtilization.toFixed(1)}%
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Connected Nodes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.block.connectedNodes}
                </p>
              </div>
            </div>

            {metrics.block.ethereumBlock && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  Ethereum Network Block
                </p>
                <p className="text-xl font-bold text-gray-900">
                  #{metrics.block.ethereumBlock.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
