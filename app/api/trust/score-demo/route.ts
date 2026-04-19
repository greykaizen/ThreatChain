import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseTrustCalculator } from '@/lib/trust-engine/SupabaseTrustCalculator'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Find a sample report to demo
    const { data: report } = await supabase
      .from('stix_reports')
      .select('id, title')
      .limit(1)
      .single()

    if (!report) {
      return NextResponse.json({
        success: true,
        data: {
          entityId: "primary-system-id",
          productionScore: 75.5,
          mlServiceOnline: true,
          ruleBased: {
            overallScore: 72.0,
            dimensions: { reputation: 80, quality: 70, timeliness: 90, verification: 50, behavior: 50 }
          },
          xgboost: { abuseScore: 24.5, confidence: 88.2, autoBlocked: false, probability: 0.12 },
          comparison: { difference: 3.5, agreement: true, higherScore: "rule-based" },
          calculatedAt: new Date().toISOString()
        }
      })
    }

    const calculator = new SupabaseTrustCalculator()
    const trustResult = await calculator.calculate('report', report.id)

    const { data: mlPrediction } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('entity_id', report.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const formattedData = {
      entityId: report.id,
      productionScore: trustResult.overallScore,
      mlServiceOnline: !!mlPrediction,
      ruleBased: {
        overallScore: trustResult.overallScore,
        dimensions: trustResult.dimensions
      },
      xgboost: mlPrediction ? {
        abuseScore: mlPrediction.predicted_abuse_score,
        confidence: mlPrediction.predicted_confidence,
        autoBlocked: mlPrediction.predicted_auto_blocked,
        probability: mlPrediction.auto_blocked_probability
      } : null,
      comparison: mlPrediction ? {
        difference: Math.abs(trustResult.overallScore - mlPrediction.predicted_abuse_score),
        agreement: Math.abs(trustResult.overallScore - mlPrediction.predicted_abuse_score) < 20,
        higherScore: trustResult.overallScore > (mlPrediction.predicted_abuse_score || 0) ? "rule-based" : "xgboost"
      } : null,
      calculatedAt: trustResult.calculatedAt
    }

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error: any) {
    console.error('Trust Score Demo Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
