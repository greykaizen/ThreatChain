"use client"

import ProtectedRoute from "@/components/ProtectedRoute";
import BlockchainMetrics from "../../components/pages/blockchain-metrics";

export default function BlockchainMetricsPage() {
  return (
    <ProtectedRoute>
      <BlockchainMetrics />
    </ProtectedRoute>
  );
}
