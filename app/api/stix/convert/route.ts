import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseRAG } from '@/lib/ai/SupabaseRAG'
import { SupabaseTrustCalculator } from '@/lib/trust-engine/SupabaseTrustCalculator'
import crypto from 'crypto'

// Using require for the JS blockchain service
const ethereumService = require('@/blockchain/EthereumService');

/**
 * Canonicalize JSON object by sorting keys alphabetically
 */
function canonicalize(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  return Object.keys(obj).sort().reduce((acc: any, key: string) => {
    acc[key] = canonicalize(obj[key]);
    return acc;
  }, {});
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    const body = await request.json()
    const { stixBundle, knowledgeGraph, sourceData } = body

    // 1. Generate Hash from canonical content
    const canonicalContent = JSON.stringify(canonicalize(stixBundle))
    const hash = crypto.createHash('sha256').update(canonicalContent).digest('hex')

    // 2. Extract basic info
    const title = sourceData?.fileName || `Report ${new Date().toISOString()}`
    const indicatorsCount = stixBundle.objects?.filter((obj: any) => obj.type === 'indicator').length || 0

    // 3. Save to Supabase Storage (Archival - Using Admin Client)
    const storagePath = `${hash}-converted.json`
    try {
      await supabaseAdmin.storage.from('reports').upload(storagePath, canonicalContent, {
        contentType: 'application/json',
        upsert: true
      })
    } catch (sErr) {
      console.error('Storage archival failed (converted):', sErr)
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('reports').getPublicUrl(storagePath)
    const publicUrl = publicUrlData?.publicUrl || null

    // 4. Save to Supabase DB
    const { data: report, error } = await supabase
      .from('stix_reports')
      .upsert({
        title,
        content: canonicalize(stixBundle),
        hash,
        file_url: publicUrl,
        indicators_count: indicatorsCount,
        stix_version: '2.1'
      }, {
        onConflict: 'hash'
      })
      .select()
      .single()

    if (error) throw error

    // 5. Rule-Based Trust Calculation
    const calculator = new SupabaseTrustCalculator()
    await calculator.calculate('report', report.id)

    // 6. Blockchain Registration (Improved Robustness)
    let blockchainResult = { success: false, txHash: null, blockNumber: 0 };
    
    // Create the transaction record IMMEDIATELY (Guarantees Dashboard Updates)
    const { data: dbTx } = await supabase.from('blockchain_transactions').upsert({
      report_id: report.id,
      report_hash: hash,
      status: 'pending',
      tx_hash: 'pending-' + hash.substring(0, 10)
    }, { onConflict: 'report_hash' }).select().single();

    try {
      if (!ethereumService.isEnabled) ethereumService.initialize();
      
      if (ethereumService.isEnabled) {
        blockchainResult = await ethereumService.registerReportHash(hash, report.id);
        
        if (blockchainResult.success) {
          await supabase.from('blockchain_transactions').update({
            tx_hash: blockchainResult.txHash,
            block_number: blockchainResult.blockNumber,
            gas_used: blockchainResult.gasUsed,
            status: 'confirmed',
            confirmation_time: blockchainResult.timestamp
          }).eq('id', dbTx.id);

          await supabase.from('provenance_records').insert({
            report_id: report.id,
            action_type: 'verified',
            actor: 'System',
            metadata: { txHash: blockchainResult.txHash, source: 'live-sepolia' }
          });
        }
      }
    } catch (bcErr) {
      console.error('Blockchain Registration Error:', bcErr);
    }

    // 7. Trigger RAG Indexing
    try {
      const rag = new SupabaseRAG()
      await rag.indexReport(report.id, canonicalContent)
    } catch (ragErr) {
      console.error('RAG Indexing failed but report saved:', ragErr)
    }

    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      hash,
      blockchain: blockchainResult.success ? blockchainResult : { status: 'recorded-locally', txHash: dbTx.tx_hash }
    })
  } catch (error: any) {
    console.error('STIX Convert Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
