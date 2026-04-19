import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Fetch latest reports
    const { data: reports, error } = await supabase
      .from('stix_reports')
      .select('id, title, content, indicators_count')
      .limit(50)

    if (error) throw error

    const nodes: any[] = []
    const links: any[] = []
    const seen = new Set<string>()

    // 2. Transform STIX data into Graphify format
    reports?.forEach((report, index) => {
      const reportId = report.id
      const community = (index % 5) + 1 // Simple community clustering for demo

      // Add Report Node
      if (!seen.has(reportId)) {
        nodes.push({
          id: reportId,
          label: report.title,
          type: 'report',
          community: community
        })
        seen.add(reportId)
      }

      // Extract Indicators from STIX content
      const stix = report.content as any
      stix.objects?.forEach((obj: any) => {
        if (obj.type === 'indicator' || obj.type === 'malware') {
          const objId = obj.id
          if (!seen.has(objId)) {
            nodes.push({
              id: objId,
              label: obj.name || obj.value || 'Indicator',
              type: obj.type,
              community: community
            })
            seen.add(objId)
          }

          // Link to report
          links.push({
            source: reportId,
            target: objId,
            value: 1
          })
        }
      })
    })

    return NextResponse.json({ nodes, links })

  } catch (error: any) {
    console.error('Graphify Bridge Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
