import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getCollectionStats(supabase: any, collectionId: string) {
  let query = supabase.from('stix_reports').select('id', { count: 'exact', head: true })
  
  // Basic filtering based on keywords in title/content
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

export async function GET() {
  const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1'
  const STIX_MEDIA_TYPE = 'application/stix+json;version=2.1'

  try {
    const supabase = await createClient()

    const [malwareCount, aptCount, indicatorCount, totalCount] = await Promise.all([
      getCollectionStats(supabase, 'malware-reports'),
      getCollectionStats(supabase, 'apt-campaigns'),
      getCollectionStats(supabase, 'indicators'),
      getCollectionStats(supabase, 'all-threats')
    ])

    const headers = new Headers()
    headers.set('Content-Type', TAXII_MEDIA_TYPE)

    return NextResponse.json({
      collections: [
        {
          id: 'all-threats',
          title: 'All Threat Intelligence',
          description: 'Complete feed of all threat intelligence reports with blockchain verification',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: totalCount
        },
        {
          id: 'malware-reports',
          title: 'Malware Reports',
          description: 'Malware analysis, ransomware, trojans, and malicious software intelligence',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: malwareCount
        },
        {
          id: 'apt-campaigns',
          title: 'APT Campaigns',
          description: 'Advanced Persistent Threats and campaign tracking',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: aptCount
        },
        {
          id: 'indicators',
          title: 'Threat Indicators',
          description: 'Indicators of Compromise (IOCs) and observables',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: indicatorCount
        }
      ]
    }, { headers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
