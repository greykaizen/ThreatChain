import { NextResponse } from 'next/server'
import { SupabaseRAG } from '@/lib/ai/SupabaseRAG'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  try {
    const rag = new SupabaseRAG()
    const results = await rag.searchSimilarReports(query)

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
