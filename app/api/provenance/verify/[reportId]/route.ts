import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  const { reportId } = await params

  try {
    const supabase = await createClient()

    // 1. Get report
    const { data: report, error: reportError } = await supabase
      .from('stix_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    // 2. Get all blockchain transactions
    const { data: transactions } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .eq('report_id', reportId)
      .eq('status', 'confirmed')

    // 3. Get all provenance records
    const { data: provenanceRecords } = await supabase
      .from('provenance_records')
      .select('*')
      .eq('report_id', reportId)

    // 4. Verify hash integrity
    const currentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(report.content))
      .digest('hex')

    // Original hash from DB or from the STIX bundle itself
    const originalHash = report.hash
    const hashMatch = currentHash === originalHash

    // 5. Check blockchain records
    const blockchainVerified = (transactions?.length || 0) > 0

    // 6. Check provenance completeness
    const hasCreationRecord = provenanceRecords?.some(pr => pr.action_type === 'created')

    const verified = hashMatch && blockchainVerified && hasCreationRecord

    return NextResponse.json({
      success: true,
      data: {
        verified,
        checks: {
          hashIntegrity: hashMatch,
          blockchainRecorded: blockchainVerified,
          provenanceComplete: !!hasCreationRecord
        },
        details: {
          currentHash,
          originalHash,
          blockchainTransactions: transactions?.length || 0,
          provenanceRecords: provenanceRecords?.length || 0
        },
        message: verified ? 'Provenance verified successfully' : 'Provenance verification incomplete'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Provenance Verification API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
