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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const content = await file.text()
    let stixBundle
    try {
      stixBundle = JSON.parse(content)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON content' }, { status: 400 })
    }

    // 1. Generate Hash from canonical content
    const canonicalContent = JSON.stringify(canonicalize(stixBundle))
    const hash = crypto.createHash('sha256').update(canonicalContent).digest('hex')

    // 2. Check for duplicate
    const { data: existing } = await supabase
      .from('stix_reports')
      .select('id')
      .eq('hash', hash)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'This report already exists in the database' 
      }, { status: 409 })
    }

    // 3. Archive to Supabase Storage (Safe Naming)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `${hash}-${safeFileName}`;
    try {
      await supabaseAdmin.storage.from('reports').upload(storagePath, file, {
        upsert: true,
        contentType: file.type || 'application/json'
      })
    } catch (sErr) {
      console.error('Storage archival failed (continuing anyway):', sErr)
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('reports').getPublicUrl(storagePath)
    const publicUrl = publicUrlData?.publicUrl || null

    // 4. Save to Supabase DB (The UI depends on this)
    const { data: report, error } = await supabase
      .from('stix_reports')
      .insert({
        title: title || file.name,
        description: description || 'STIX 2.1 Threat Intelligence Report',
        content: canonicalize(stixBundle),
        hash,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrl,
        stix_version: '2.1',
        indicators_count: stixBundle.objects?.filter((obj: any) => obj.type === 'indicator').length || 0
      })
      .select()
      .single()

    if (error) throw error

    // 5. Rule-Based Trust & ML (Internal Triggers)
    const calculator = new SupabaseTrustCalculator()
    await calculator.calculate('report', report.id)

    // 6. Blockchain Registration (Improved Robustness)
    let blockchainResult = { success: false, txHash: null, blockNumber: 0 };
    
    // Create the transaction record IMMEDIATELY in Supabase (Guarantees Dashboard Updates)
    const { data: dbTx } = await supabase.from('blockchain_transactions').insert({
      report_id: report.id,
      report_hash: hash,
      status: 'pending',
      tx_hash: 'pending-' + hash.substring(0, 10)
    }).select().single();

    try {
      if (!ethereumService.isEnabled) ethereumService.initialize();
      
      if (ethereumService.isEnabled) {
        blockchainResult = await ethereumService.registerReportHash(hash, report.id);
        
        if (blockchainResult.success) {
          // Update the pending record with the REAL txHash
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
      // We keep the 'pending' record so the user still sees it in their history
    }

    // 7. Neural Indexing
    try {
      const rag = new SupabaseRAG()
      await rag.indexReport(report.id, canonicalContent)
    } catch (ragErr) {
      console.error('RAG Indexing Error:', ragErr);
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      hash,
      blockchain: blockchainResult.success ? blockchainResult : { status: 'recorded-locally', txHash: dbTx.tx_hash }
    })

  } catch (error: any) {
    console.error('STIX Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
