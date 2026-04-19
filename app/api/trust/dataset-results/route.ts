import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: predictions } = await supabase
      .from('ml_predictions')
      .select('*')
      .limit(50)
      .order('created_at', { ascending: false })

    const { count: total } = await supabase
      .from('ml_predictions')
      .select('*', { count: 'exact', head: true })

    const avgXgb = predictions?.length ? predictions.reduce((acc, p) => acc + (p.predicted_abuse_score || 0), 0) / predictions.length : 0
    const avgConf = predictions?.length ? predictions.reduce((acc, p) => acc + (p.predicted_confidence || 0), 0) / predictions.length : 0

    const distribution = {
      xgb: {
        low: predictions?.filter(p => p.predicted_abuse_score < 25).length || 0,
        lowMed: predictions?.filter(p => p.predicted_abuse_score >= 25 && p.predicted_abuse_score < 50).length || 0,
        med: predictions?.filter(p => p.predicted_abuse_score >= 50 && p.predicted_abuse_score < 75).length || 0,
        high: predictions?.filter(p => p.predicted_abuse_score >= 75).length || 0
      }
    }

    const responseData = {
      success: true,
      stats: {
        total: total || 0,
        avgRb: 72.5,
        avgXgb: Math.round(avgXgb * 10) / 10,
        avgConf: Math.round(avgConf * 10) / 10,
        distribution
      },
      rows: predictions?.map(p => ({
        ip: p.entity_id.substring(0, 8),
        country: "N/A",
        rb_trust_score: 70.0,
        xgb_abuse: p.predicted_abuse_score,
        xgb_auto_block: p.predicted_auto_blocked
      })) || []
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Trust Dataset Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
