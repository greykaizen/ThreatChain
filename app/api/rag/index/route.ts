import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseRAG } from '@/lib/ai/SupabaseRAG'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    
    const supabase = await createClient()
    const rag = new SupabaseRAG()

    let query = supabase.from('stix_reports').select('id, content')
    
    if (!force) {
      query = query.is('embedding', null)
    }

    const { data: reports, error } = await query

    if (error) throw error

    console.log(`🔍 Found ${reports?.length || 0} reports needing indexing`);

    const results = []
    for (const report of (reports || [])) {
      const text = JSON.stringify(report.content)
      try {
        console.log(`⏳ Indexing report ${report.id}...`);
        await rag.indexReport(report.id, text)
        results.push(report.id)
        console.log(`✅ Indexed report ${report.id}`);
      } catch (e: any) {
        console.error(`❌ Failed to index report ${report.id}:`, e.message)
      }
    }

    return NextResponse.json({
      success: true,
      indexed_count: results.length,
      message: `Indexed ${results.length} reports`
    })
  } catch (error: any) {
    console.error('RAG Index API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
