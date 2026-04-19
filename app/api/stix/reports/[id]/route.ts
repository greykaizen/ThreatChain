import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('stix_reports')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Report deleted successfully' })
  } catch (error: any) {
    console.error('STIX Delete API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    const { data: report, error } = await supabase
      .from('stix_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: report })
  } catch (error: any) {
    console.error('STIX Detail API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
