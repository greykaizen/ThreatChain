import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { collectionId: string, objectId: string } }
) {
  const { collectionId, objectId } = await params
  const STIX_MEDIA_TYPE = 'application/stix+json;version=2.1'

  try {
    const supabase = await createClient()

    // 1. Fetch report containing the specific object
    let query = supabase.from('stix_reports').select('id, content, hash, created_at')
    
    // Postgres JSON search for specific ID in objects array or root ID
    query = query.or(`content->>id.eq.${objectId},content->objects.cs.[{"id":"${objectId}"}]`)

    const { data: report, error } = await query.single()

    if (error || !report) {
      return NextResponse.json({
        title: 'Not Found',
        description: 'Object not found in collection'
      }, { status: 404 })
    }

    const stixContent = report.content as any
    
    // 2. Find the specific object inside the bundle
    let targetObject = null
    if (stixContent.objects && Array.isArray(stixContent.objects)) {
      targetObject = stixContent.objects.find((obj: any) => obj.id === objectId)
    } else if (stixContent.id === objectId) {
      targetObject = stixContent
    }

    if (!targetObject) {
      return NextResponse.json({
        title: 'Not Found',
        description: 'Object not found'
      }, { status: 404 })
    }

    // 3. Get blockchain verification
    const { data: bcTx } = await supabase
      .from('blockchain_transactions')
      .select('tx_hash, block_number, gas_used, timestamp, status')
      .eq('report_hash', report.hash)
      .eq('status', 'confirmed')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 4. Enrich object
    const enrichedObject = {
      ...targetObject,
      x_threatchain_blockchain: {
        verified: !!bcTx,
        tx_hash: bcTx?.tx_hash || null,
        block_number: bcTx?.block_number || null,
        timestamp: bcTx?.timestamp || null,
        report_hash: report.hash
      }
    }

    const headers = new Headers()
    headers.set('Content-Type', STIX_MEDIA_TYPE)
    headers.set('X-TAXII-Date-Added-First', report.created_at)
    headers.set('X-TAXII-Date-Added-Last', report.created_at)
    
    return NextResponse.json(enrichedObject, { headers })

  } catch (error: any) {
    console.error('TAXII Object API Error:', error)
    return NextResponse.json({
      title: 'Internal Server Error',
      description: error.message
    }, { status: 500 })
  }
}
