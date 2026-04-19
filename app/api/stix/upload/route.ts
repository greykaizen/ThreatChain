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

    // 1. Generate Hash
    const hash = crypto.createHash('sha256').update(content).digest('hex')

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

    // 3. Upload to Supabase Storage (Using Admin Client to bypass RLS)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `${hash}-${safeFileName}`;
    
    const { error: storageError } = await supabaseAdmin.storage.from('reports').upload(storagePath, file, {
      upsert: true,
      contentType: file.type || 'application/json'
    })

    if (storageError) {
      console.error('Supabase Storage Upload Error:', storageError.message)
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('reports').getPublicUrl(storagePath)
    const publicUrl = publicUrlData?.publicUrl || null

    // 4. Save to Supabase DB
    const { data: report, error } = await supabase
      .from('stix_reports')
      .insert({
        title: title || file.name,
        description: description || 'STIX 2.1 Threat Intelligence Report',
        content: stixBundle,
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

    // 5. Rule-Based Trust Calculation
    const calculator = new SupabaseTrustCalculator()
    await calculator.calculate('report', report.id)

    // 6. ML Prediction Trigger (Internal API Call)
    try {
      // Mocking features from the STIX bundle for the XGBoost model
      const features = {
        indicator_count: report.indicators_count,
        has_malware: stixBundle.objects?.some((o: any) => o.type === 'malware') ? 1 : 0,
        has_actor: stixBundle.objects?.some((o: any) => o.type === 'threat-actor') ? 1 : 0,
        complexity_score: JSON.stringify(stixBundle).length / 1000
      };

      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const host = request.headers.get('host');
      
      // Fire and forget ML prediction
      fetch(`${protocol}://${host}/api/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: report.id, features })
      }).catch(e => console.error('ML Prediction Trigger Failed:', e.message));

    } catch (mlErr) {
      console.error('ML Logic Error:', mlErr);
    }

    // 7. Register on Blockchain
    let blockchainResult = { success: false, txHash: null, blockNumber: 0 };
    try {
      blockchainResult = await ethereumService.registerReportHash(hash, report.id);
      
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
          metadata: { txHash: blockchainResult.txHash }
        });
      }
    } catch (bcErr) {
      console.error('Blockchain Registration Error:', bcErr);
    }

    // 8. Index for RAG
    try {
      const rag = new SupabaseRAG()
      await rag.indexReport(report.id, content)
    } catch (ragErr) {
      console.error('RAG Indexing Error:', ragErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        reportId: report.id,
        reportHash: hash,
        blockchain: {
          transactionId: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber
        }
      }
    })

  } catch (error: any) {
    console.error('STIX Upload Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
