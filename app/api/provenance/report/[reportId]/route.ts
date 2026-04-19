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
      .select('id, title, hash')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    // 2. Get all provenance records with joined blockchain transactions
    const { data: provenance, error: provError } = await supabase
      .from('provenance_records')
      .select(`
        *,
        blockchain_transactions (
          tx_hash,
          block_number,
          status
        )
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })

    if (provError) throw provError

    return NextResponse.json({
      success: true,
      data: {
        report,
        provenance,
        totalRecords: provenance.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Provenance Report API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
