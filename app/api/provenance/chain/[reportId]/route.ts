import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  const { reportId } = await params

  try {
    const supabase = await createClient()

    // 1. Get report details
    const { data: report, error: reportError } = await supabase
      .from('stix_reports')
      .select('id, title, hash, created_at, updated_at')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    // 2. Get complete provenance chain
    const { data: records, error: provError } = await supabase
      .from('provenance_records')
      .select(`
        id,
        action_type,
        actor,
        metadata,
        created_at,
        blockchain_transactions (
          tx_hash,
          block_number,
          status,
          blockchain_blocks (
            block_hash,
            previous_hash
          )
        )
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })

    if (provError) throw provError

    // 3. Build chain visualization
    const chain = records.map((record, index) => {
      const bc = (record as any).blockchain_transactions
      return {
        step: index + 1,
        action: record.action_type,
        actor: record.actor,
        timestamp: record.created_at,
        blockchainRecorded: !!bc?.tx_hash,
        blockNumber: bc?.block_number,
        txHash: bc?.tx_hash,
        blockHash: bc?.blockchain_blocks?.block_hash,
        metadata: record.metadata || {}
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        report,
        chain,
        totalSteps: chain.length,
        blockchainRecords: chain.filter(c => c.blockchainRecorded).length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Provenance Chain API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
