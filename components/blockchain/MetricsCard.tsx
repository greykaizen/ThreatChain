"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  alert?: boolean;
  alertMessage?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
};

export default function MetricsCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendValue,
  alert,
  alertMessage,
  color = "blue",
}: MetricsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "stable":
        return <Minus className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all hover:shadow-lg ${
        alert ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* Alert Badge */}
      {alert && (
        <div className="absolute top-2 right-2">
          <div className="relative group">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            {alertMessage && (
              <div className="absolute right-0 top-8 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {alertMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${iconColorClasses[color]}`}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-lg text-gray-500">{unit}</span>}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {getTrendIcon()}
          {trendValue && (
            <span
              className={`text-xs font-medium ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
