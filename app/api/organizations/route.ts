import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(20)

    if (error) throw error

    const orgIds = orgs?.map(o => o.id) || []
    const { data: scores } = await supabase
      .from('trust_scores')
      .select('*')
      .in('entity_id', orgIds)
      .eq('entity_type', 'organization')

    const formattedOrgs = orgs?.map(org => {
      const score = scores?.find(s => s.entity_id === org.id)
      return {
        id: org.id,
        name: org.name,
        type: "Private",
        country: "Global",
        status: "Active",
        joinDate: org.created_at,
        lastActivity: "Today",
        trustScore: score?.overall_score || 85,
        reportsShared: 24,
        reportsReceived: 112,
        specialization: ["Threat Intelligence", "IOC Tracking"],
        contactPerson: "Lead Analyst",
        email: `contact@${org.domain || 'threadchain.io'}`
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: { organizations: formattedOrgs }
    })
  } catch (error: any) {
    console.error('Organizations API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
