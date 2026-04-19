import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SupabaseRAG } from '@/lib/ai/SupabaseRAG'
import { SupabaseTrustCalculator } from '@/lib/trust-engine/SupabaseTrustCalculator'
import crypto from 'crypto'

// Using require for the JS blockchain service
const ethereumService = require('@/blockchain/EthereumService');

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    const body = await request.json()
    const { stixBundle, knowledgeGraph, sourceData } = body

    // 1. Generate Hash - MATCHING TEAM'S ORIGINAL LOGIC
    const reportHash = crypto.createHash('sha256').update(JSON.stringify(stixBundle)).digest('hex')

    // 2. Extract basic info
    const title = sourceData?.fileName || `Report ${new Date().toISOString()}`
    const indicatorsCount = stixBundle.objects?.filter((obj: any) => obj.type === 'indicator').length || 0

    // 3. Save to Database - EXACT TEAM STRUCTURE
    const reportId = crypto.randomUUID()
    const { data: report, error: dbError } = await supabase
      .from('stix_reports')
      .upsert({
        id: reportId,
        title,
        content: stixBundle,
        hash: reportHash,
        file_name: sourceData.fileName || 'converted-report.json',
        file_size: JSON.stringify(stixBundle).length,
        stix_version: stixBundle.spec_version || '2.1',
        report_type: 'bundle',
        indicators_count: indicatorsCount
      }, {
        onConflict: 'hash'
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 4. Intelligent Analysis
    const calculator = new SupabaseTrustCalculator()
    await calculator.calculate('report', report.id)

    // 5. Blockchain Registration
    let blockchainResult = { success: false, txHash: null };
    try {
      if (!ethereumService.isEnabled) ethereumService.initialize();
      if (ethereumService.isEnabled) {
        blockchainResult = await ethereumService.registerReportHash(reportHash, report.id);
        
        if (blockchainResult.success) {
          await supabase.from('blockchain_transactions').insert({
            report_id: report.id,
            report_hash: reportHash,
            tx_hash: blockchainResult.txHash,
            block_number: blockchainResult.blockNumber,
            status: 'confirmed',
            confirmation_time: blockchainResult.timestamp
          });

          await supabase.from('provenance_records').insert({
            report_id: report.id,
            action_type: 'verified',
            actor: 'System',
            metadata: { txHash: blockchainResult.txHash }
          });
        }
      }
    } catch (bcErr) {
      console.error('Blockchain error:', bcErr);
    }

    // 6. Neural Indexing
    try {
      const rag = new SupabaseRAG()
      await rag.indexReport(report.id, JSON.stringify(stixBundle))
    } catch (ragErr) {
      console.error('RAG Indexing Error:', ragErr);
    }

    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      hash: reportHash,
      blockchain: blockchainResult
    })
  } catch (error: any) {
    console.error('STIX Convert Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
