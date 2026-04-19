import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseRAG } from '@/lib/ai/SupabaseRAG'
import { SupabaseTrustCalculator } from '@/lib/trust-engine/SupabaseTrustCalculator'
import crypto from 'crypto'

// Import Ethereum Service
const ethereumService = require('@/blockchain/EthereumService');

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    const body = await request.json()
    const { stixBundle, knowledgeGraph, sourceData } = body

    // 1. Generate Hash for the bundle
    const bundleString = JSON.stringify(stixBundle)
    const hash = crypto.createHash('sha256').update(bundleString).digest('hex')

    // 2. Extract basic info
    const title = sourceData?.fileName || `Report ${new Date().toISOString()}`
    const indicatorsCount = stixBundle.objects?.filter((obj: any) => obj.type === 'indicator').length || 0

    // 3. Save to Supabase Storage (Archival - Using Admin Client)
    const storagePath = `${hash}-converted.json`
    const { error: storageError } = await supabaseAdmin.storage.from('reports').upload(storagePath, bundleString, {
      contentType: 'application/json',
      upsert: true
    })

    if (storageError) {
      console.error('Supabase Storage Upload Error (Converted):', storageError.message)
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('reports').getPublicUrl(storagePath)
    const publicUrl = publicUrlData?.publicUrl || null

    // 4. Save to Supabase DB
    const { data: report, error } = await supabase
      .from('stix_reports')
      .upsert({
        title,
        content: stixBundle,
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

    // 6. ML Prediction Trigger (Internal API Call)
    try {
      const features = {
        indicator_count: indicatorsCount,
        has_malware: stixBundle.objects?.some((o: any) => o.type === 'malware') ? 1 : 0,
        has_actor: stixBundle.objects?.some((o: any) => o.type === 'threat-actor') ? 1 : 0,
        complexity_score: bundleString.length / 1000
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
    let blockchainResult = { success: false, txHash: null };
    try {
      blockchainResult = await ethereumService.registerReportHash(hash, report.id);
      
      if (blockchainResult.success) {
        // Save transaction to Supabase
        await supabase.from('blockchain_transactions').insert({
          report_id: report.id,
          report_hash: hash,
          tx_hash: blockchainResult.txHash,
          block_number: blockchainResult.blockNumber,
          gas_used: blockchainResult.gasUsed,
          status: 'confirmed',
          confirmation_time: blockchainResult.timestamp
        });

        // Add provenance record
        await supabase.from('provenance_records').insert({
          report_id: report.id,
          action_type: 'verified',
          actor: 'System',
          metadata: { txHash: blockchainResult.txHash }
        });
      }
    } catch (bcErr) {
      console.error('Blockchain Registration Error:', bcErr);
    }

    // 8. Trigger RAG Indexing
    try {
      const rag = new SupabaseRAG()
      await rag.indexReport(report.id, bundleString)
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
