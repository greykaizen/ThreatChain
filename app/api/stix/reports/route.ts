import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const supabase = await createClient()

    const { data: reports, error } = await supabase
      .from('stix_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { reports: reports || [] }
    })
  } catch (error: any) {
    console.error('STIX Reports API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
