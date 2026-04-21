import { createClient } from '../supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export class SupabaseRAG {
  private genAI: GoogleGenerativeAI
  private embeddingModel: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' })
  }

  /**
   * Turn a report into vectors and save to Supabase
   */
  indexReport = async (reportId: string, text: string) => {
    const supabase = await createClient()

    try {
      const cleanText = text.substring(0, 10000); 
      const result = await this.embeddingModel.embedContent(cleanText)
      const embedding = result.embedding.values

      const { error } = await supabase
        .from('stix_reports')
        .update({ embedding })
        .eq('id', reportId)

      if (error) throw error

      return { success: true, reportId }
    } catch (error: any) {
      console.error(`RAG Indexing Error for ${reportId}:`, error.message)
      throw error
    }
  }

  /**
   * Search for similar reports using Vector Similarity
   */
  searchSimilarReports = async (queryText: string, limit = 5) => {
    const supabase = await createClient()

    try {
      const result = await this.embeddingModel.embedContent(queryText)
      const embedding = result.embedding.values

      const { data, error } = await supabase.rpc('match_reports', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: limit,
      })

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('RAG Search Error:', error.message)
      throw error
    }
  }

  answerQuestion = async (question: string, modelProvider: 'gemini' | 'openai' = 'gemini') => {
    try {
      const sources = await this.searchSimilarReports(question)
      
      if (!sources || sources.length === 0) {
        return {
          success: true,
          answer: "I couldn't find any relevant threat reports in the database to answer your question.",
          sources: []
        }
      }

      const context = sources.map((s: any) => 
        `Report: ${s.title}\nDescription: ${s.description}`
      ).join("\n\n")

      const systemPrompt = `You are a cybersecurity expert assistant for the ThreatChain platform. 
      Use the following context from STIX threat reports to answer the user's question.
      If you don't know the answer, say you don't know based on the provided data.
      
      Context:
      ${context}
      
      Question: ${question}`

      let answer = ""

      if (modelProvider === 'openai') {
        // Dynamic import to avoid crash if not installed, though we saw it's not in package.json
        // We'll use fetch directly to avoid dependency issues for the presentation
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: systemPrompt }]
          })
        });
        const data = await response.json();
        answer = data.choices?.[0]?.message?.content || "OpenAI failed to respond.";
      } else {
        const chatModel = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
        const result = await chatModel.generateContent(systemPrompt)
        const response = await result.response
        answer = response.text()
      }

      return {
        success: true,
        answer,
        sources: sources.map((s: any) => ({
          title: s.title,
          description: s.description,
          relevance_score: s.similarity
        }))
      }
    } catch (error: any) {
      console.error('RAG Answering Error:', error.message)
      throw error
    }
  }
}
