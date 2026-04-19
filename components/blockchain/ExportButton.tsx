"use client";

import React, { useState } from "react";
import { Download, FileJson, FileText, Check } from "lucide-react";

interface ExportButtonProps {
  timeRange: string;
  onExport?: (format: "json" | "csv") => void;
}

export default function ExportButton({
  timeRange,
  onExport,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      // Call API to export
      const response = await fetch(
        `/api/blockchain/metrics/export?range=${timeRange}&format=${format}`
      );
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `blockchain-metrics-${timeRange}-${Date.now()}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      // Call callback if provided
      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export metrics. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          exportSuccess
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {exportSuccess ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Exported!</span>
          </>
        ) : isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-3 py-2 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-500">
                Export Format
              </p>
            </div>

            <button
              onClick={() => handleExport("json")}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <FileJson className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">JSON</p>
                <p className="text-xs text-gray-500">
                  Complete data with metadata
                </p>
              </div>
            </button>

            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">CSV</p>
                <p className="text-xs text-gray-500">
                  Spreadsheet compatible
                </p>
              </div>
            </button>

            <div className="px-3 py-2 border-t border-gray-200 mt-2">
              <p className="text-xs text-gray-500">
                Time range: <span className="font-medium">{timeRange}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
