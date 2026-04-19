import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ethers } from 'ethers'
const ethereumService = require('@/blockchain/EthereumService');

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Get real-time data from Ethereum Provider (Alchemy)
    let liveGasPrice = { gwei: "20" };
    let liveBlockNumber = 0;

    try {
      // Force re-init if not enabled
      if (!ethereumService.isEnabled) {
        ethereumService.initialize();
      }

      if (ethereumService.provider) {
        const [feeData, blockNumber] = await Promise.all([
          ethereumService.provider.getFeeData(),
          ethereumService.provider.getBlockNumber()
        ]);
        
        if (feeData.gasPrice) {
          liveGasPrice = {
            gwei: ethers.formatUnits(feeData.gasPrice, 'gwei')
          };
        }
        liveBlockNumber = blockNumber;
      }
    } catch (bcErr) {
      console.error('Error fetching live blockchain data:', bcErr);
    }

    // 2. Get latest metrics from blockchain_metrics_history
    const { data: latestHistory } = await supabase
      .from('blockchain_metrics_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    // 3. Aggregate counts from transactions and provenance
    const [txCount, confirmedCount, provCount] = await Promise.all([
      supabase.from('blockchain_transactions').select('*', { count: 'exact', head: true }),
      supabase.from('blockchain_transactions').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('provenance_records').select('*', { count: 'exact', head: true }).eq('action_type', 'verified')
    ])

    // 4. Format the response to match the frontend expectations
    const metrics = {
      transaction: {
        gasPrice: { wei: "0", gwei: parseFloat(liveGasPrice.gwei).toFixed(2), eth: "0" },
        totalTransactions: txCount.count || 0,
        transactionsPerSecond: latestHistory?.tps || 0.01,
        avgGasConsumption: 21000
      },
      performance: {
        currentUtilization: latestHistory?.utilization || 5,
        throughput: latestHistory?.throughput || 0.01,
        avgLatency: latestHistory?.latency || 120,
        cpuUsage: latestHistory?.cpu_usage || 2
      },
      consensus: {
        protocol: "Proof of Stake (Sepolia)",
        successRate: latestHistory?.success_rate || 100,
        failureRate: 100 - (latestHistory?.success_rate || 100),
        faultTolerance: "High",
        transactionSecurity: "Encrypted"
      },
      integrity: {
        provenanceRecords: provCount.count || 0,
        crossVerifications: confirmedCount.count || 0,
        challengeRecords: 0
      },
      block: {
        latestBlock: liveBlockNumber || latestHistory?.latest_block || 0,
        blockSize: 24,
        blockUtilization: latestHistory?.utilization || 5,
        connectedNodes: 12,
        ethereumBlock: liveBlockNumber
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, data: metrics })
  } catch (error: any) {
    console.error('Blockchain Metrics API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
