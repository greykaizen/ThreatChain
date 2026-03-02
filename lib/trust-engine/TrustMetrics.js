/**
 * Trust Metrics - Metric definitions and specific score updates
 */

const db = require('../../config/database');

class TrustMetrics {
  /**
   * Update verification score after blockchain confirmation
   */
  async updateVerificationScore(reportId, txHash) {
    try {
      // Get current trust score
      const currentScore = await db.findOne(
        'SELECT * FROM trust_scores WHERE entity_type = ? AND entity_id = ?',
        ['report', reportId]
      );

      if (!currentScore) {
        console.log('No trust score found for report, will be calculated on next evaluation');
        return;
      }

      // Boost verification score
      const newVerificationScore = Math.min(currentScore.verification_score + 15, 100);
      
      // Recalculate overall score
      const newOverallScore = this.calculateOverallScore({
        reputation: currentScore.reputation_score,
        quality: currentScore.quality_score,
        timeliness: currentScore.timeliness_score,
        verification: newVerificationScore,
        behavior: currentScore.behavior_score
      });

      // Update scores
      await db.query(`
        UPDATE trust_scores
        SET verification_score = ?,
            overall_score = ?,
            calculated_at = NOW()
        WHERE entity_type = ? AND entity_id = ?
      `, [newVerificationScore, newOverallScore, 'report', reportId]);

      // Record event
      await this.recordTrustEvent(
        'report',
        reportId,
        'blockchain_verified',
        15,
        `Blockchain verification confirmed: ${txHash}`
      );

      console.log(`✅ Verification score updated for report ${reportId}`);
    } catch (error) {
      console.error('Failed to update verification score:', error.message);
    }
  }

  /**
   * Update behavior score based on actions
   */
  async updateBehaviorScore(organizationId, actionType) {
    try {
      // Get current trust score
      const currentScore = await db.findOne(
        'SELECT * FROM trust_scores WHERE entity_type = ? AND entity_id = ?',
        ['organization', organizationId]
      );

      if (!currentScore) {
        console.log('No trust score found for organization, will be calculated on next evaluation');
        return;
      }

      // Determine impact based on action type
      let impact = 0;
      let reason = '';

      switch (actionType) {
        case 'created':
          impact = 2;
          reason = 'Report created and shared';
          break;
        case 'verified':
          impact = 3;
          reason = 'Report verified';
          break;
        case 'updated':
          impact = 1;
          reason = 'Report updated';
          break;
        case 'shared':
          impact = 2;
          reason = 'Report shared with network';
          break;
        default:
          impact = 0;
      }

      if (impact === 0) {
        return;
      }

      // Update behavior score
      const newBehaviorScore = Math.min(currentScore.behavior_score + impact, 100);
      
      // Recalculate overall score
      const newOverallScore = this.calculateOverallScore({
        reputation: currentScore.reputation_score,
        quality: currentScore.quality_score,
        timeliness: currentScore.timeliness_score,
        verification: currentScore.verification_score,
        behavior: newBehaviorScore
      });

      // Update scores
      await db.query(`
        UPDATE trust_scores
        SET behavior_score = ?,
            overall_score = ?,
            calculated_at = NOW()
        WHERE entity_type = ? AND entity_id = ?
      `, [newBehaviorScore, newOverallScore, 'organization', organizationId]);

      // Record event
      await this.recordTrustEvent(
        'organization',
        organizationId,
        `behavior_${actionType}`,
        impact,
        reason
      );

      console.log(`✅ Behavior score updated for organization ${organizationId}`);
    } catch (error) {
      console.error('Failed to update behavior score:', error.message);
    }
  }

  /**
   * Calculate overall score from dimensions
   */
  calculateOverallScore(scores) {
    const weights = {
      reputation: 0.30,
      quality: 0.25,
      timeliness: 0.20,
      verification: 0.15,
      behavior: 0.10
    };

    return (
      scores.reputation * weights.reputation +
      scores.quality * weights.quality +
      scores.timeliness * weights.timeliness +
      scores.verification * weights.verification +
      scores.behavior * weights.behavior
    );
  }

  /**
   * Record trust event
   */
  async recordTrustEvent(entityType, entityId, eventType, impact, reason) {
    try {
      const { v4: uuidv4 } = require('uuid');
      const eventId = uuidv4();

      // Get current score
      const currentScore = await db.findOne(
        'SELECT overall_score FROM trust_scores WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
      );

      await db.query(`
        INSERT INTO trust_events (
          id, entity_type, entity_id, event_type,
          impact, reason, new_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        eventId,
        entityType,
        entityId,
        eventType,
        impact,
        reason,
        currentScore?.overall_score || null
      ]);
    } catch (error) {
      console.error('Failed to record trust event:', error.message);
    }
  }

  /**
   * Get trust metrics summary
   */
  async getMetricsSummary() {
    try {
      const summary = await db.findOne(`
        SELECT 
          COUNT(*) as total_entities,
          AVG(overall_score) as avg_score,
          MAX(overall_score) as max_score,
          MIN(overall_score) as min_score,
          COUNT(CASE WHEN overall_score >= 85 THEN 1 END) as high_trust,
          COUNT(CASE WHEN overall_score >= 70 AND overall_score < 85 THEN 1 END) as medium_trust,
          COUNT(CASE WHEN overall_score < 70 THEN 1 END) as low_trust
        FROM trust_scores
      `);

      return summary || {
        total_entities: 0,
        avg_score: 0,
        max_score: 0,
        min_score: 0,
        high_trust: 0,
        medium_trust: 0,
        low_trust: 0
      };
    } catch (error) {
      console.error('Failed to get metrics summary:', error.message);
      return null;
    }
  }

  /**
   * Get trust distribution by type
   */
  async getTrustDistribution() {
    try {
      const distribution = await db.query(`
        SELECT 
          entity_type,
          COUNT(*) as count,
          AVG(overall_score) as avg_score,
          AVG(reputation_score) as avg_reputation,
          AVG(quality_score) as avg_quality,
          AVG(timeliness_score) as avg_timeliness,
          AVG(verification_score) as avg_verification,
          AVG(behavior_score) as avg_behavior
        FROM trust_scores
        GROUP BY entity_type
      `);

      return distribution;
    } catch (error) {
      console.error('Failed to get trust distribution:', error.message);
      return [];
    }
  }

  /**
   * Get top trusted entities
   */
  async getTopTrustedEntities(entityType, limit = 10) {
    try {
      const entities = await db.query(`
        SELECT 
          ts.*,
          CASE 
            WHEN ts.entity_type = 'organization' THEN o.org_name
            WHEN ts.entity_type = 'report' THEN sr.title
            ELSE ts.entity_id
          END as entity_name
        FROM trust_scores ts
        LEFT JOIN organizations o ON ts.entity_type = 'organization' AND ts.entity_id = o.id
        LEFT JOIN stix_reports sr ON ts.entity_type = 'report' AND ts.entity_id = sr.id
        WHERE ts.entity_type = ?
        ORDER BY ts.overall_score DESC
        LIMIT ?
      `, [entityType, parseInt(limit, 10)]);

      return entities;
    } catch (error) {
      console.error('Failed to get top trusted entities:', error.message);
      return [];
    }
  }

  /**
   * Get trust badge for score
   */
  getTrustBadge(score) {
    if (score >= 95) {
      return { level: 'Platinum', icon: '🥇', color: '#E5E4E2' };
    } else if (score >= 85) {
      return { level: 'Gold', icon: '🥈', color: '#FFD700' };
    } else if (score >= 70) {
      return { level: 'Silver', icon: '🥉', color: '#C0C0C0' };
    } else if (score >= 50) {
      return { level: 'Bronze', icon: '⚪', color: '#CD7F32' };
    } else {
      return { level: 'Caution', icon: '⚠️', color: '#FFA500' };
    }
  }
}

module.exports = TrustMetrics;
