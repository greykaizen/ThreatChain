import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Get overview stats
    const { count: totalRecords } = await supabase
      .from('provenance_records')
      .select('*', { count: 'exact', head: true })

    const { count: reportsTracked } = await supabase
      .from('stix_reports')
      .select('id', { count: 'exact', head: true })

    // 2. Get stats by action
    const { data: actionData } = await supabase
      .from('provenance_records')
      .select('action_type')

    const actionStats: Record<string, number> = {}
    actionData?.forEach(row => {
      actionStats[row.action_type] = (actionStats[row.action_type] || 0) + 1
    })

    // 3. Get recent activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('provenance_records')
      .select(`
        action_type,
        actor,
        created_at,
        stix_reports (
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) throw activityError

    const formattedActivity = recentActivity.map(row => ({
      action_type: row.action_type,
      actor: row.actor,
      timestamp: row.created_at,
      report_title: (row as any).stix_reports?.title || 'Unknown Report'
    }))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_records: totalRecords || 0,
          reports_tracked: reportsTracked || 0,
          unique_actors: 1 // Simple fallback for now
        },
        byAction: Object.entries(actionStats).map(([action_type, count]) => ({ action_type, count })),
        recentActivity: formattedActivity
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Provenance Stats API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
