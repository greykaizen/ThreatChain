import { NextResponse } from 'next/server'
import { getDashboardStats, getBlockchainActivity } from '@/lib/services/dashboard'

export async function GET() {
  try {
    const [stats, activity] = await Promise.all([
      getDashboardStats(),
      getBlockchainActivity()
    ])

    return NextResponse.json({ stats, activity })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
