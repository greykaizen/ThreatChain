import { NextResponse } from 'next/server'
import { getDashboardStats, getBlockchainActivity } from '@/lib/services/dashboard'
const ethereumService = require('@/blockchain/EthereumService');

export async function GET() {
  try {
    // Force re-init if not enabled (ensures env vars are fresh)
    if (!ethereumService.isEnabled) {
      ethereumService.initialize();
    }

    const [stats, activity] = await Promise.all([
      getDashboardStats(),
      getBlockchainActivity()
    ])

    return NextResponse.json({ stats, activity })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
