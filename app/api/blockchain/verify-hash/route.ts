import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hash } = body

    if (!hash) {
      return NextResponse.json({ error: 'Hash is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Check if hash exists in our transaction records
    const { data: tx, error } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .eq('report_hash', hash)
      .eq('status', 'confirmed')
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      success: true,
      verified: !!tx,
      data: tx ? {
        exists: true,
        blockNumber: tx.block_number,
        timestamp: tx.confirmation_time || tx.created_at,
        txHash: tx.tx_hash
      } : { exists: false }
    })
  } catch (error: any) {
    console.error('Verify Hash API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
