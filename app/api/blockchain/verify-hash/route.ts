import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
const ethereumService = require('@/blockchain/EthereumService');

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hash } = body

    if (!hash) {
      return NextResponse.json({ error: 'Hash is required' }, { status: 400 })
    }

    // Clean hash (remove 0x if present for DB check)
    const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
    const hexHash = hash.startsWith('0x') ? hash : '0x' + hash;

    const supabase = await createClient()

    // 1. Check local database transaction records
    const { data: tx, error } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .or(`report_hash.eq.${cleanHash},report_hash.eq.${hexHash}`)
      .eq('status', 'confirmed')
      .maybeSingle()

    // 2. Cross-verify with Live Ethereum Contract (The ultimate source of truth)
    let onChainData = { exists: false };
    try {
      if (ethereumService.isEnabled) {
        const result = await ethereumService.verifyReportHash(cleanHash);
        if (result.success && result.exists) {
          onChainData = {
            exists: true,
            timestamp: result.timestamp,
            uploader: result.uploader,
            reportId: result.reportId
          };
        }
      }
    } catch (bcErr) {
      console.error('On-chain verification error:', bcErr);
    }

    const isVerified = !!tx || onChainData.exists;

    return NextResponse.json({
      success: true,
      verified: isVerified,
      data: isVerified ? {
        exists: true,
        blockNumber: tx?.block_number || null,
        timestamp: tx?.confirmation_time || onChainData.timestamp || null,
        txHash: tx?.tx_hash || null,
        onChainProof: onChainData.exists,
        uploader: onChainData.uploader || null
      } : { exists: false }
    })
  } catch (error: any) {
    console.error('Verify Hash API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
