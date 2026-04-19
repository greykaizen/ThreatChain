import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1'

  const headers = new Headers()
  headers.set('Content-Type', TAXII_MEDIA_TYPE)

  return NextResponse.json({
    title: 'ThreatChain Intelligence Feed',
    description: 'Curated threat intelligence with blockchain verification',
    versions: ['application/taxii+json;version=2.1'],
    max_content_length: 10485760, // 10MB
    collections: [
      `${origin}/api/taxii/threatchain/collections/`
    ]
  }, { headers })
}
