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

    // Canonicalize for consistent hashing
    const canonicalContent = JSON.stringify(canonicalize(stixBundle))

    // 1. Generate Hash from canonical content
    const hash = crypto.createHash('sha256').update(canonicalContent).digest('hex')

    // 2. Extract basic info
    const title = sourceData?.fileName || `Report ${new Date().toISOString()}`
    const indicatorsCount = stixBundle.objects?.filter((obj: any) => obj.type === 'indicator').length || 0

    // 3. Save to Supabase Storage (Archival - Using Admin Client)
    const storagePath = `${hash}-converted.json`
    const { error: storageError } = await supabaseAdmin.storage.from('reports').upload(storagePath, canonicalContent, {
      contentType: 'application/json',
      upsert: true
    })

    if (storageError) {
      console.error('Supabase Storage Upload Error (Converted):', storageError.message)
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('reports').getPublicUrl(storagePath)
    const publicUrl = publicUrlData?.publicUrl || null

    // 4. Save to Supabase DB (Store the canonicalized bundle)
    const { data: report, error } = await supabase
      .from('stix_reports')
      .upsert({
        title,
        content: canonicalize(stixBundle), // Store canonical version
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

    // 6. ML Prediction Trigger
    try {
      const features = {
        indicator_count: indicatorsCount,
        has_malware: stixBundle.objects?.some((o: any) => o.type === 'malware') ? 1 : 0,
        has_actor: stixBundle.objects?.some((o: any) => o.type === 'threat-actor') ? 1 : 0,
        complexity_score: canonicalContent.length / 1000
      };

      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const host = request.headers.get('host');
      
      fetch(`${protocol}://${host}/api/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: report.id, features })
      }).catch(e => console.error('ML Prediction Trigger Failed:', e.message));
    } catch (mlErr) {
      console.error('ML Logic Error:', mlErr);
    }

    // 7. Register on Blockchain
    let blockchainResult = { success: false, txHash: null, blockNumber: 0, error: null };
    try {
      console.log('🔗 Initiating Blockchain Registration for hash:', hash);
      
      if (!ethereumService.isEnabled) {
        console.log('🔄 Re-initializing Ethereum Service...');
        ethereumService.initialize();
      }

      if (ethereumService.isEnabled) {
        blockchainResult = await ethereumService.registerReportHash(hash, report.id);
        console.log('📡 Blockchain Result:', JSON.stringify(blockchainResult));
        
        if (blockchainResult.success) {
          await supabase.from('blockchain_transactions').insert({
            report_id: report.id,
            report_hash: hash,
            tx_hash: blockchainResult.txHash,
            block_number: blockchainResult.blockNumber,
            gas_used: blockchainResult.gasUsed,
            status: 'confirmed',
            confirmation_time: blockchainResult.timestamp
          });

          await supabase.from('provenance_records').insert({
            report_id: report.id,
            action_type: 'verified',
            actor: 'System',
            metadata: { txHash: blockchainResult.txHash, source: 'live-sepolia' }
          });
        }
      } else {
        console.warn('⚠️ Ethereum Service not enabled - skipping live registration');
      }
    } catch (bcErr: any) {
      console.error('❌ Blockchain Registration Exception:', bcErr.message);
      blockchainResult.error = bcErr.message;
    }

    // 8. Trigger RAG Indexing (Index the canonical text)
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
      blockchain: blockchainResult
    })
  } catch (error: any) {
    console.error('STIX Convert Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
