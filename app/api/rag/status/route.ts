import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('stix_reports')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    if (error) throw error

    return NextResponse.json({
      online: true,
      ready: true,
      indexed_documents: count || 0,
      message: "Supabase Vector RAG Active"
    })
  } catch (error: any) {
    return NextResponse.json({ 
      online: false, 
      ready: false, 
      indexed_documents: 0, 
      message: error.message 
    })
  }
}
