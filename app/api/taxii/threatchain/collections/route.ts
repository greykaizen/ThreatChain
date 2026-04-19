import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    collections: [
      {
        id: "default",
        title: "ThreadChain Default Collection",
        description: "Primary collection for all blockchain-verified threat intelligence",
        objects_count: 42
      },
      {
        id: "malware",
        title: "Malware Indicators",
        description: "Curated list of confirmed malware hashes and TTPs",
        objects_count: 18
      }
    ]
  })
}
