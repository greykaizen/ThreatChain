import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { reportId, actionType, actor, metadata } = body

    if (!reportId || !actionType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get latest blockchain transaction for this report
    const { data: blockchainTx } = await supabase
      .from('blockchain_transactions')
      .select('id')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 2. Create provenance record
    const { data: record, error } = await supabase
      .from('provenance_records')
      .insert({
        report_id: reportId,
        blockchain_tx_id: blockchainTx ? blockchainTx.id : null,
        action_type: actionType,
        actor: actor || 'system',
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: record,
      message: 'Provenance record created successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Provenance Record API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
