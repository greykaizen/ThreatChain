import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const supabase = await createClient()

    const { data: records, error } = await supabase
      .from('provenance_records')
      .select('*, stix_reports(title, indicators_count), organizations(name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const activities = records?.map(rec => ({
      id: rec.id,
      organization: (rec as any).organizations?.name || 'ThreadChain Partner',
      action: rec.action_type === 'created' ? 'Shared Report' : 
              rec.action_type === 'verified' ? 'Verified Report' : 'Updated Report',
      reportTitle: (rec as any).stix_reports?.title || 'Threat Intel Report',
      timestamp: new Date(rec.created_at).toLocaleString(),
      indicators: (rec as any).stix_reports?.indicators_count || 0,
      trustImpact: rec.action_type === 'verified' ? 5 : 2
    })) || []

    return NextResponse.json({
      success: true,
      data: { activities }
    })
  } catch (error: any) {
    console.error('Activities API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
