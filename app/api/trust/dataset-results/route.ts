import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Fetch ML Predictions
    const { data: predictions, error: pError } = await supabase
      .from('ml_predictions')
      .select('*')
      .limit(50)
      .order('created_at', { ascending: false })

    if (pError) {
      console.error('Predictions fetch error:', pError);
      throw pError;
    }

    // 2. Fetch Trust Scores (Rule-Based)
    const { data: trustScores } = await supabase
      .from('trust_scores')
      .select('entity_id, overall_score')

    const trustMap = new Map();
    if (trustScores) {
      trustScores.forEach(ts => {
        trustMap.set(ts.entity_id, Number(ts.overall_score));
      });
    }

    // 3. Get total count
    const { count, error: cError } = await supabase
      .from('ml_predictions')
      .select('*', { count: 'exact', head: true })
    
    const total = count || predictions?.length || 0;

    // 4. Calculate stats with safe numbers
    const safePredictions = predictions || [];
    const avgXgb = safePredictions.length ? safePredictions.reduce((acc, p) => acc + (Number(p.predicted_abuse_score) || 0), 0) / safePredictions.length : 0
    const avgRb = safePredictions.length ? safePredictions.reduce((acc, p) => acc + (trustMap.get(p.entity_id) || 72.5), 0) / safePredictions.length : 0
    const avgConf = safePredictions.length ? safePredictions.reduce((acc, p) => acc + (Number(p.predicted_confidence) || 0), 0) / safePredictions.length : 0

    const distribution = {
      xgb: {
        low: safePredictions.filter(p => (Number(p.predicted_abuse_score) || 0) < 25).length,
        lowMed: safePredictions.filter(p => (Number(p.predicted_abuse_score) || 0) >= 25 && (Number(p.predicted_abuse_score) || 0) < 50).length,
        med: safePredictions.filter(p => (Number(p.predicted_abuse_score) || 0) >= 50 && (Number(p.predicted_abuse_score) || 0) < 75).length,
        high: safePredictions.filter(p => (Number(p.predicted_abuse_score) || 0) >= 75).length
      }
    }

    const responseData = {
      success: true,
      stats: {
        total: total,
        avgRb: Math.round(avgRb * 10) / 10,
        avgXgb: Math.round(avgXgb * 10) / 10,
        avgConf: Math.round(avgConf * 10) / 10,
        distribution
      },
      rows: safePredictions.map((p: any) => ({
        ip: p.entity_id ? p.entity_id.substring(0, 8) : 'unknown',
        country: "N/A",
        rb_trust_score: trustMap.get(p.entity_id) || 70.0,
        xgb_abuse: Number(p.predicted_abuse_score || 0),
        xgb_auto_block: Boolean(p.predicted_auto_blocked)
      }))
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('Trust Dataset Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stats: { total: 0, avgRb: 0, avgXgb: 0, avgConf: 0, distribution: { xgb: { low: 0, lowMed: 0, med: 0, high: 0 } } },
      rows: []
    }, { status: 500 })
  }
}
