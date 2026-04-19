import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1'

  const headers = new Headers()
  headers.set('Content-Type', TAXII_MEDIA_TYPE)
  headers.set('X-TAXII-Date-Added-First', new Date().toISOString())
  headers.set('X-TAXII-Date-Added-Last', new Date().toISOString())

  return NextResponse.json({
    title: 'ThreatChain TAXII 2.1 Server',
    description: 'Blockchain-verified threat intelligence sharing platform',
    contact: 'security@threatchain.io',
    default: `${origin}/api/taxii/threatchain/`,
    api_roots: [
      `${origin}/api/taxii/threatchain/`
    ]
  }, { headers })
}
