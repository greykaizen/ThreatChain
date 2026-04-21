import { NextResponse } from 'next/server'
import { SupabaseRAG } from '@/lib/ai/SupabaseRAG'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question, provider = 'gemini' } = body

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const rag = new SupabaseRAG()
    const result = await rag.answerQuestion(question, provider)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('RAG Query API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
