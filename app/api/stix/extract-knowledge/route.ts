import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const { data } = await request.json()
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
      You are a Cyber Threat Intelligence analyst. I will provide you with a slice of raw threat data. 
      Extract the core entities and relationships for a knowledge graph.
      
      Entities to look for: Malware, Threat Actors, IP Addresses, Domains, File Hashes, Campaigns.
      Relationships: "used-by", "targets", "communicates-with", "attributed-to", "associated-with".

      Format your response as valid JSON with "nodes" and "links" arrays.
      Nodes must have: "id", "label", "type", "community" (number 1-5).
      Links must have: "source", "target", "label".

      Data:
      ${JSON.stringify(data.slice(0, 20))}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean up Gemini's markdown code blocks
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const graphData = JSON.parse(cleanedText)

    return NextResponse.json(graphData)

  } catch (error: any) {
    console.error('AI Extraction Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
