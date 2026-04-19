import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function seedMetrics() {
  console.log('📊 Seeding Blockchain Telemetry...')

  // 1. Backfill Transactions for existing reports
  const { data: reports } = await supabase.from('stix_reports').select('id, hash')
  
  if (reports && reports.length > 0) {
    console.log(`🔗 Linking ${reports.length} reports to blockchain history...`)
    for (const report of reports) {
      await supabase.from('blockchain_transactions').upsert({
        report_id: report.id,
        report_hash: report.hash,
        tx_hash: '0x' + crypto.randomBytes(32).toString('hex'),
        block_number: 10690000 + Math.floor(Math.random() * 1000),
        status: 'confirmed',
        gas_used: 21000 + Math.floor(Math.random() * 5000),
        gas_price: 1500000000, // 1.5 Gwei
        gas_fee: 31500000000000,
        confirmation_time: new Date().toISOString()
      }, { onConflict: 'tx_hash' })
    }
  }

  // 2. Generate 24 hours of Metric History
  console.log('📈 Generating 24h historic trend data...')
  const history = []
  const now = new Date()
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    history.push({
      timestamp: timestamp.toISOString(),
      gas_fee: 1.2 + Math.random() * 0.8,
      tps: 0.5 + Math.random() * 1.5,
      success_rate: 98 + Math.random() * 2,
      latency: 100 + Math.floor(Math.random() * 50),
      utilization: 5 + Math.random() * 10,
      throughput: 0.1 + Math.random() * 0.2,
      latest_block: 10690000 + (24 - i) * 10
    })
  }

  const { error } = await supabase.from('blockchain_metrics_history').insert(history)
  if (error) console.error('❌ Seeding failed:', error.message)
  else console.log('✅ Telemetry seeding successful!')
}

seedMetrics()
