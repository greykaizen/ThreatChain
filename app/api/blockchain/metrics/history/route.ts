import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '24h'

  try {
    const supabase = await createClient()

    // Determine time interval based on range
    let days = 1
    if (range === '1h') days = 0.04
    else if (range === '7d') days = 7
    else if (range === '30d') days = 30

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: metrics, error } = await supabase
      .from('blockchain_metrics_history')
      .select('*')
      .gt('timestamp', cutoff)
      .order('timestamp', { ascending: true })

    if (error) throw error

    // Map database columns to the frontend's expected format
    const formattedMetrics = metrics?.map(m => ({
      timestamp: m.timestamp,
      gasFee: m.gas_fee,
      tps: m.tps,
      successRate: m.success_rate,
      latency: m.latency,
      utilization: m.utilization,
      throughput: m.throughput
    })) || []

    return NextResponse.json({ 
      success: true, 
      data: { metrics: formattedMetrics } 
    })
  } catch (error: any) {
    console.error('Blockchain History API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
