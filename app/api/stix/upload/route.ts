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

    // 1. Generate Hash - MATCHING TEAM'S ORIGINAL LOGIC
    const reportHash = crypto.createHash('sha256').update(JSON.stringify(stixBundle)).digest('hex')

    // 2. Check for duplicate
    const { data: existing } = await supabase
      .from('stix_reports')
      .select('id, title, created_at')
      .eq('hash', reportHash)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Duplicate report detected',
        message: `A report with identical content already exists. Original: "${existing.title}"` 
      }, { status: 409 })
    }

    // 3. Generate Unique ID
    const reportId = crypto.randomUUID()

    // 4. Save to Database - EXACT TEAM STRUCTURE
    const { data: report, error: dbError } = await supabase
      .from('stix_reports')
      .insert({
        id: reportId,
        title: title || file.name,
        description: description || 'Uploaded STIX report',
        content: stixBundle, // Supabase handles JSON object
        file_name: file.name,
        file_size: file.size,
        hash: reportHash,
        stix_version: stixBundle.spec_version || '2.1',
        report_type: stixBundle.type || 'bundle',
        indicators_count: stixBundle.objects?.filter((obj: any) => obj.type === 'indicator').length || 0
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 5. Intelligent Analysis (Rule-Based & ML)
    const calculator = new SupabaseTrustCalculator()
    await calculator.calculate('report', reportId)

    // ML Trigger
    const features = {
      indicator_count: report.indicators_count,
      has_malware: stixBundle.objects?.some((o: any) => o.type === 'malware') ? 1 : 0,
      has_actor: stixBundle.objects?.some((o: any) => o.type === 'threat-actor') ? 1 : 0,
      complexity_score: content.length / 1000
    };
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = request.headers.get('host');
    fetch(`${protocol}://${host}/api/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: reportId, features })
    }).catch(() => {});

    // 6. Blockchain Registration
    let blockchainResult = { success: false, txHash: null };
    try {
      if (!ethereumService.isEnabled) ethereumService.initialize();
      if (ethereumService.isEnabled) {
        blockchainResult = await ethereumService.registerReportHash(reportHash, reportId);
        
        if (blockchainResult.success) {
          await supabase.from('blockchain_transactions').insert({
            report_id: reportId,
            report_hash: reportHash,
            tx_hash: blockchainResult.txHash,
            block_number: blockchainResult.blockNumber,
            status: 'confirmed',
            confirmation_time: blockchainResult.timestamp
          });

          await supabase.from('provenance_records').insert({
            report_id: reportId,
            action_type: 'verified',
            actor: 'System',
            metadata: { txHash: blockchainResult.txHash }
          });
        }
      }
    } catch (bcErr) {
      console.error('Blockchain error:', bcErr);
    }

    // 7. Storage Archival (Silent Background Task)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    supabaseAdmin.storage.from('reports').upload(`${reportHash}-${safeFileName}`, file, { upsert: true }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        reportId: reportId,
        reportHash: reportHash,
        blockchain: blockchainResult
      }
    })

  } catch (error: any) {
    console.error('STIX Upload Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
