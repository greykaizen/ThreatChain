import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { collectionId: string } }
) {
  const { collectionId } = await params
  const { searchParams } = new URL(request.url)
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
  const addedAfter = searchParams.get('added_after')
  const nextParam = searchParams.get('next')
  const offset = nextParam ? parseInt(nextParam) : 0

  const STIX_MEDIA_TYPE = 'application/stix+json;version=2.1'

  try {
    const supabase = await createClient()

    // 1. Build Query
    let query = supabase.from('stix_reports').select(`
      id, 
      content, 
      hash, 
      created_at, 
      updated_at
    `)
    
    // Filtering based on collection type
    if (collectionId === 'malware-reports') {
      query = query.or('content->>objects.ilike.%malware%,content->>objects.ilike.%trojan%,content->>objects.ilike.%ransomware%')
    } else if (collectionId === 'apt-campaigns') {
      query = query.or('content->>objects.ilike.%campaign%,content->>objects.ilike.%apt%,content->>objects.ilike.%threat-actor%')
    } else if (collectionId === 'indicators') {
      query = query.or('content->>objects.ilike.%indicator%,content->>objects.ilike.%observable%')
    }

    if (addedAfter) {
      query = query.gt('created_at', new Date(addedAfter).toISOString())
    }

    const { data: reports, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit)

    if (error) throw error

    // 2. Build STIX objects with blockchain metadata
    const stixObjects: any[] = []
    
    for (const report of reports || []) {
      const stixContent = report.content as any
      
      // Get blockchain verification data
      const { data: bcTx } = await supabase
        .from('blockchain_transactions')
        .select('tx_hash, block_number, gas_used, timestamp, status')
        .eq('report_hash', report.hash)
        .eq('status', 'confirmed')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()

      const blockchainMeta = {
        verified: !!bcTx,
        tx_hash: bcTx?.tx_hash || null,
        block_number: bcTx?.block_number || null,
        timestamp: bcTx?.timestamp || null,
        report_hash: report.hash
      }

      if (stixContent.objects && Array.isArray(stixContent.objects)) {
        stixContent.objects.forEach((obj: any) => {
          stixObjects.push({
            ...obj,
            x_threatchain_blockchain: blockchainMeta
          })
        })
      } else if (stixContent.type) {
        stixObjects.push({
          ...stixContent,
          x_threatchain_blockchain: blockchainMeta
        })
      }
    }

    // 3. Build TAXII envelope
    const hasMore = (reports?.length || 0) > limit
    const envelope: any = {
      more: hasMore,
      objects: stixObjects.slice(0, limit)
    }

    if (hasMore) {
      envelope.next = (offset + limit).toString()
    }

    const headers = new Headers()
    headers.set('Content-Type', STIX_MEDIA_TYPE)
    if (reports && reports.length > 0) {
      headers.set('X-TAXII-Date-Added-First', reports[reports.length - 1].created_at)
      headers.set('X-TAXII-Date-Added-Last', reports[0].created_at)
    }

    return NextResponse.json(envelope, { headers })

  } catch (error: any) {
    console.error('TAXII Objects API Error:', error)
    return NextResponse.json({ 
      title: 'Internal Server Error',
      description: error.message 
    }, { status: 500 })
  }
}
