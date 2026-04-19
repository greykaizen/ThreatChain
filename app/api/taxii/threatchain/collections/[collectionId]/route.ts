import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getCollectionStats(supabase: any, collectionId: string) {
  let query = supabase.from('stix_reports').select('id', { count: 'exact', head: true })
  
  if (collectionId === 'malware-reports') {
    query = query.or('content->>objects.ilike.%malware%,content->>objects.ilike.%trojan%,content->>objects.ilike.%ransomware%')
  } else if (collectionId === 'apt-campaigns') {
    query = query.or('content->>objects.ilike.%campaign%,content->>objects.ilike.%apt%,content->>objects.ilike.%threat-actor%')
  } else if (collectionId === 'indicators') {
    query = query.or('content->>objects.ilike.%indicator%,content->>objects.ilike.%observable%')
  }
  
  const { count } = await query
  return count || 0
}

export async function GET(
  request: Request,
  { params }: { params: { collectionId: string } }
) {
  const { collectionId } = await params
  const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1'
  const STIX_MEDIA_TYPE = 'application/stix+json;version=2.1'

  const collections: Record<string, any> = {
    'all-threats': {
      id: 'all-threats',
      title: 'All Threat Intelligence',
      description: 'Complete feed of all threat intelligence reports with blockchain verification',
      can_read: true,
      can_write: false,
      media_types: [STIX_MEDIA_TYPE]
    },
    'malware-reports': {
      id: 'malware-reports',
      title: 'Malware Reports',
      description: 'Malware analysis, ransomware, trojans, and malicious software intelligence',
      can_read: true,
      can_write: false,
      media_types: [STIX_MEDIA_TYPE]
    },
    'apt-campaigns': {
      id: 'apt-campaigns',
      title: 'APT Campaigns',
      description: 'Advanced Persistent Threats and campaign tracking',
      can_read: true,
      can_write: false,
      media_types: [STIX_MEDIA_TYPE]
    },
    'indicators': {
      id: 'indicators',
      title: 'Threat Indicators',
      description: 'Indicators of Compromise (IOCs) and observables',
      can_read: true,
      can_write: false,
      media_types: [STIX_MEDIA_TYPE]
    }
  }

  const collection = collections[collectionId]
  if (!collection) {
    return NextResponse.json({ 
      title: 'Not Found',
      description: 'Collection not found' 
    }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const count = await getCollectionStats(supabase, collectionId)
    collection.objects_count = count

    const headers = new Headers()
    headers.set('Content-Type', TAXII_MEDIA_TYPE)

    return NextResponse.json(collection, { headers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
