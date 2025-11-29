"use client";

import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricsChartProps {
  title: string;
  data: any[];
  dataKey: string;
  timeRange: "1h" | "24h" | "7d" | "30d";
  onTimeRangeChange: (range: "1h" | "24h" | "7d" | "30d") => void;
  yAxisLabel: string;
  color?: string;
  type?: "line" | "area";
}

export default function MetricsChart({
  title,
  data,
  dataKey,
  timeRange,
  onTimeRangeChange,
  yAxisLabel,
  color = "#3b82f6",
  type = "line",
}: MetricsChartProps) {
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === "1h") {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (timeRange === "24h") {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const timeRanges = [
    { value: "1h", label: "1H" },
    { value: "24h", label: "24H" },
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() =>
                onTimeRangeChange(range.value as "1h" | "24h" | "7d" | "30d")
              }
              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                timeRange === range.value
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id={`color${dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: "12px", fill: "#6b7280" },
                }}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#color${dataKey})`}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: "12px", fill: "#6b7280" },
                }}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-sm">No data available</p>
            <p className="text-xs mt-1">
              Data will appear once metrics are collected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
