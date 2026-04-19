import { createClient } from '../supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export class SupabaseRAG {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    // Upgrading to the high-fidelity v2 architecture
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' })
  }

  /**
   * Turn a report into vectors and save to Supabase
   */
  indexReport = async (reportId: string, text: string) => {
    const supabase = await createClient()

    try {
      // 1. Generate Embedding using Gemini
      const cleanText = text.substring(0, 10000); 
      
      const result = await this.model.embedContent(cleanText)
      const embedding = result.embedding.values

      // 2. Save to Supabase Vector
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
      // 1. Generate Embedding for the query
      const result = await this.model.embedContent(queryText)
      const embedding = result.embedding.values

      // 2. Perform Vector Search using Supabase RPC
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

  answerQuestion = async (question: string) => {
    try {
      // 1. Search for context
      const sources = await this.searchSimilarReports(question)
      
      if (!sources || sources.length === 0) {
        return {
          success: true,
          answer: "I couldn't find any relevant threat reports in the database to answer your question.",
          sources: []
        }
      }

      // 2. Format context for LLM
      const context = sources.map((s: any) => 
        `Report: ${s.title}\nDescription: ${s.description}`
      ).join("\n\n")

      // 3. Generate answer using Gemini 3.x Frontier
      const chatModel = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
      const prompt = `You are a cybersecurity expert assistant for the ThreatChain platform. 
      Use the following context from STIX threat reports to answer the user's question.
      If you don't know the answer, say you don't know based on the provided data.
      
      Context:
      ${context}
      
      Question: ${question}`

      const result = await chatModel.generateContent(prompt)
      const response = await result.response
      const answer = response.text()

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
