import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reportId = searchParams.get('reportId')

  try {
    const supabase = await createClient()

    let query = supabase.from('blockchain_transactions').select('*')
    
    if (reportId) {
      query = query.eq('report_id', reportId)
    }

    const { data: transactions, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { transactions: transactions || [] }
    })
  } catch (error: any) {
    console.error('Blockchain Transactions API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
