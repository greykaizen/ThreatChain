import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      database: 'Supabase (PostgreSQL)',
      blockchain: 'Hardhat Local node',
      ml: 'Vercel Serverless (Python)'
    }
  })
}
