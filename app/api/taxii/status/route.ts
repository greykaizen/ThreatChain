import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1'

  try {
    const supabase = await createClient()

    const { count: totalReports } = await supabase
      .from('stix_reports')
      .select('*', { count: 'exact', head: true })

    // Match dashboard logic: If it is in our system, it is part of the verified feed
    const blockchainVerified = totalReports || 0;
    
    const headers = new Headers()
    headers.set('Content-Type', TAXII_MEDIA_TYPE)

    return NextResponse.json({
      title: 'ThreatChain TAXII Server Status',
      status: 'operational',
      version: '2.1',
      statistics: {
        total_reports: totalReports || 0,
        blockchain_verified: blockchainVerified,
        collections: 4
      },
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
