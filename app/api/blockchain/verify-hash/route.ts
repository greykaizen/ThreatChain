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

    // 1. Normalize the hash for exhaustive searching
    const rawHash = hash.replace('0x', '').toLowerCase();
    const hexHash = '0x' + rawHash;

    const supabase = await createClient()

    // 2. Check local database transaction records (Search for all possible formats)
    const { data: tx } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .or(`report_hash.eq.${rawHash},report_hash.eq.${hexHash}`)
      .eq('status', 'confirmed')
      .maybeSingle()

    // 3. Fallback: Check the stix_reports table itself (Search for all possible formats)
    const { data: report } = await supabase
      .from('stix_reports')
      .select('id, title, created_at, hash')
      .or(`hash.eq.${rawHash},hash.eq.${hexHash}`)
      .maybeSingle()

    // 4. Cross-verify with Live Ethereum Contract
    let onChainData = { exists: false };
    try {
      if (!ethereumService.isEnabled) ethereumService.initialize();
      if (ethereumService.isEnabled) {
        // Contract ALWAYS expects the 0xhex format
        const result = await ethereumService.verifyReportHash(hexHash);
        if (result.success && result.exists) {
          onChainData = {
            exists: true,
            timestamp: result.timestamp,
            uploader: result.uploader
          };
        }
      }
    } catch (bcErr) {
      console.error('On-chain verification error:', bcErr);
    }

    // 🏆 FINAL DETERMINATION
    // A report is verified if it exists in our system AND has any proof of anchoring (Local DB or Blockchain)
    const isVerified = !!report && (!!tx || onChainData.exists);

    return NextResponse.json({
      success: true,
      verified: isVerified,
      data: isVerified ? {
        exists: true,
        reportId: report?.id,
        title: report?.title,
        timestamp: tx?.confirmation_time || onChainData.timestamp || report?.created_at,
        txHash: tx?.tx_hash || null,
        onChainProof: onChainData.exists,
        normalizedHash: rawHash
      } : { exists: false }
    })
  } catch (error: any) {
    console.error('Verify Hash API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
