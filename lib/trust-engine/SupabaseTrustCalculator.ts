import { createClient } from '../supabase/server'
import { v4 as uuidv4 } from 'uuid'

export class SupabaseTrustCalculator {
  private weights = {
    reputation: 0.30,
    quality: 0.25,
    timeliness: 0.20,
    verification: 0.15,
    behavior: 0.10
  }

  /**
   * Calculate overall trust score for an entity and save to Supabase
   */
  async calculate(entityType: 'report' | 'organization', entityId: string) {
    const supabase = await createClient()

    try {
      // 1. Get entity data from Supabase
      const { data: entityData, error: entityError } = await supabase
        .from(entityType === 'report' ? 'stix_reports' : 'organizations')
        .select('*')
        .eq('id', entityId)
        .single()

      if (entityError || !entityData) {
        throw new Error(`Entity not found in Supabase: ${entityType}:${entityId}`)
      }

      // 2. Calculate dimension scores (Migrated logic)
      const scores = {
        reputation: await this.calculateReputationScore(entityType, entityId, entityData),
        quality: await this.calculateQualityScore(entityType, entityId, entityData),
        timeliness: await this.calculateTimelinessScore(entityType, entityId, entityData),
        verification: await this.calculateVerificationScore(entityType, entityId, entityData),
        behavior: await this.calculateBehaviorScore(entityType, entityId, entityData)
      }

      // 3. Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(scores)

      // 4. Save trust score to the new Supabase table
      const { error: saveError } = await supabase
        .from('trust_scores')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          overall_score: Math.round(overallScore * 100) / 100,
          reputation_score: scores.reputation,
          quality_score: scores.quality,
          timeliness_score: scores.timeliness,
          verification_score: scores.verification,
          behavior_score: scores.behavior,
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type,entity_id'
        })

      if (saveError) throw saveError

      return {
        entityType,
        entityId,
        overallScore: Math.round(overallScore * 100) / 100,
        dimensions: scores,
        calculatedAt: new Date()
      }
    } catch (error: any) {
      console.error('Supabase Trust calculation error:', error.message)
      throw error
    }
  }

  private async calculateReputationScore(entityType: string, entityId: string, entityData: any) {
    let score = 50
    const supabase = await createClient()

    if (entityType === 'organization') {
      const { count } = await supabase
        .from('stix_reports')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', entityId)
      
      score += Math.min((count || 0) * 2, 30)
      
      const daysSinceJoin = Math.floor(
        (Date.now() - new Date(entityData.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      score += Math.min(daysSinceJoin / 10, 20)
    }
    return Math.max(0, Math.min(100, score))
  }

  private async calculateQualityScore(entityType: string, entityId: string, entityData: any) {
    let score = 50
    if (entityType === 'report') {
      const indicatorsCount = entityData.indicators_count || 0
      score += (indicatorsCount > 10 ? 10 : (indicatorsCount > 5 ? 5 : 0))
      if (entityData.stix_version === '2.1') score += 5
      
      const completeness = [
        entityData.title, 
        entityData.description, 
        entityData.report_type, 
        entityData.severity
      ].filter(Boolean).length
      score += completeness * 5
    }
    return Math.max(0, Math.min(100, score))
  }

  private async calculateTimelinessScore(entityType: string, entityId: string, entityData: any) {
    let score = 50
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(entityData.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceCreation < 7) score += 20
    else if (daysSinceCreation < 30) score += 10
    else if (daysSinceCreation > 90) score -= 10
    
    return Math.max(0, Math.min(100, score))
  }

  private async calculateVerificationScore(entityType: string, entityId: string, entityData: any) {
    let score = 50
    const supabase = await createClient()
    
    const { data: tx } = await supabase
      .from('blockchain_transactions')
      .select('status')
      .eq('report_id', entityId)
      .single()

    if (tx?.status === 'confirmed') score += 30
    return Math.max(0, Math.min(100, score))
  }

  private async calculateBehaviorScore(entityType: string, entityId: string, entityData: any) {
    return 50 // Base score for behavior in v1 migration
  }

  private calculateWeightedScore(scores: any) {
    return (
      scores.reputation * this.weights.reputation +
      scores.quality * this.weights.quality +
      scores.timeliness * this.weights.timeliness +
      scores.verification * this.weights.verification +
      scores.behavior * this.weights.behavior
    )
  }
}
