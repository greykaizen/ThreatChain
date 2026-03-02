/**
 * Trust Calculator - Core calculation engine
 * Calculates multi-dimensional trust scores
 */

const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

class TrustCalculator {
  constructor() {
    // Default weights for trust dimensions
    this.weights = {
      reputation: 0.30,
      quality: 0.25,
      timeliness: 0.20,
      verification: 0.15,
      behavior: 0.10
    };
  }

  /**
   * Calculate overall trust score for an entity
   */
  async calculate(entityType, entityId) {
    try {
      // Get entity data
      const entityData = await this.getEntityData(entityType, entityId);
      if (!entityData) {
        throw new Error(`Entity not found: ${entityType}:${entityId}`);
      }

      // Calculate dimension scores
      const scores = {
        reputation: await this.calculateReputationScore(entityType, entityId, entityData),
        quality: await this.calculateQualityScore(entityType, entityId, entityData),
        timeliness: await this.calculateTimelinessScore(entityType, entityId, entityData),
        verification: await this.calculateVerificationScore(entityType, entityId, entityData),
        behavior: await this.calculateBehaviorScore(entityType, entityId, entityData)
      };

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(scores);

      // Save trust score
      await this.saveTrustScore(entityType, entityId, overallScore, scores);

      return {
        entityType,
        entityId,
        overallScore: Math.round(overallScore * 100) / 100,
        dimensions: scores,
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('Trust calculation error:', error.message);
      throw error;
    }
  }

  /**
   * Get entity data based on type
   */
  async getEntityData(entityType, entityId) {
    switch (entityType) {
      case 'organization':
        return await db.findOne(
          'SELECT * FROM organizations WHERE id = ?',
          [entityId]
        );
      case 'report':
        return await db.findOne(
          'SELECT * FROM stix_reports WHERE id = ?',
          [entityId]
        );
      default:
        return null;
    }
  }

  /**
   * Calculate reputation score (30%)
   */
  async calculateReputationScore(entityType, entityId, entityData) {
    let score = 50; // Base score

    if (entityType === 'organization') {
      // Reports shared bonus
      const reportsCount = await db.findOne(
        'SELECT COUNT(*) as count FROM stix_reports WHERE organization_id = ?',
        [entityId]
      );
      score += Math.min((reportsCount?.count || 0) * 2, 30);

      // Longevity bonus
      const daysSinceJoin = Math.floor(
        (Date.now() - new Date(entityData.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(daysSinceJoin / 10, 20);

      // Penalty for new organizations
      if (daysSinceJoin < 30) {
        score -= 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate quality score (25%)
   */
  async calculateQualityScore(entityType, entityId, entityData) {
    let score = 50; // Base score

    if (entityType === 'report') {
      // Indicators count bonus
      const indicatorsCount = entityData.indicators_count || 0;
      if (indicatorsCount > 10) {
        score += 10;
      } else if (indicatorsCount > 5) {
        score += 5;
      }

      // STIX version bonus
      if (entityData.stix_version === '2.1') {
        score += 5;
      }

      // Metadata completeness
      const hasTitle = entityData.title && entityData.title.length > 0;
      const hasDescription = entityData.description && entityData.description.length > 0;
      const hasType = entityData.report_type && entityData.report_type.length > 0;
      const hasSeverity = entityData.severity && entityData.severity.length > 0;
      
      const completeness = [hasTitle, hasDescription, hasType, hasSeverity].filter(Boolean).length;
      score += completeness * 5;
    } else if (entityType === 'organization') {
      // Average quality of reports
      const avgQuality = await db.findOne(`
        SELECT AVG(indicators_count) as avg_indicators
        FROM stix_reports
        WHERE organization_id = ?
      `, [entityId]);
      
      if (avgQuality?.avg_indicators > 10) {
        score += 15;
      } else if (avgQuality?.avg_indicators > 5) {
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate timeliness score (20%)
   */
  async calculateTimelinessScore(entityType, entityId, entityData) {
    let score = 50; // Base score

    if (entityType === 'report') {
      // Report freshness
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(entityData.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation < 7) {
        score += 20; // Very fresh
      } else if (daysSinceCreation < 30) {
        score += 10; // Recent
      } else if (daysSinceCreation > 90) {
        score -= 10; // Stale
      }

      // Update frequency
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(entityData.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > 90) {
        score -= 5;
      }
    } else if (entityType === 'organization') {
      // Last activity
      const lastReport = await db.findOne(`
        SELECT MAX(created_at) as last_activity
        FROM stix_reports
        WHERE organization_id = ?
      `, [entityId]);

      if (lastReport?.last_activity) {
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(lastReport.last_activity).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceActivity < 7) {
          score += 20;
        } else if (daysSinceActivity < 30) {
          score += 10;
        } else if (daysSinceActivity > 60) {
          score -= 10;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate verification score (15%)
   */
  async calculateVerificationScore(entityType, entityId, entityData) {
    let score = 50; // Base score

    if (entityType === 'report') {
      // Check blockchain verification
      const blockchainTx = await db.findOne(`
        SELECT status, confirmation_time
        FROM blockchain_transactions
        WHERE report_id = ?
      `, [entityId]);

      if (blockchainTx) {
        if (blockchainTx.status === 'confirmed') {
          score += 30;

          // Quick verification bonus
          if (blockchainTx.confirmation_time) {
            const verificationHours = Math.floor(
              (new Date(blockchainTx.confirmation_time).getTime() - 
               new Date(entityData.created_at).getTime()) / (1000 * 60 * 60)
            );

            if (verificationHours < 24) {
              score += 10;
            }
          }
        } else if (blockchainTx.status === 'pending') {
          score += 10;
        }
      }

      // Check provenance records
      const provenanceCount = await db.findOne(`
        SELECT COUNT(*) as count
        FROM provenance_records
        WHERE report_id = ?
      `, [entityId]);

      if ((provenanceCount?.count || 0) > 0) {
        score += 10;
      }
    } else if (entityType === 'organization') {
      // Verification rate
      const verificationStats = await db.findOne(`
        SELECT 
          COUNT(DISTINCT sr.id) as total_reports,
          COUNT(DISTINCT CASE WHEN bt.status = 'confirmed' THEN sr.id END) as verified_reports
        FROM stix_reports sr
        LEFT JOIN blockchain_transactions bt ON sr.id = bt.report_id
        WHERE sr.organization_id = ?
      `, [entityId]);

      if (verificationStats && verificationStats.total_reports > 0) {
        const verificationRate = (verificationStats.verified_reports / verificationStats.total_reports) * 100;
        score += Math.min(verificationRate / 2, 30);
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate behavior score (10%)
   */
  async calculateBehaviorScore(entityType, entityId, entityData) {
    let score = 50; // Base score

    if (entityType === 'organization') {
      // Consistency of contributions
      const monthlyReports = await db.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count
        FROM stix_reports
        WHERE organization_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month
      `, [entityId]);

      if (monthlyReports.length >= 3) {
        score += 15; // Consistent contributor
      }

      // Check for duplicates (penalty)
      const duplicates = await db.findOne(`
        SELECT COUNT(*) as count
        FROM stix_reports sr1
        WHERE sr1.organization_id = ?
        AND EXISTS (
          SELECT 1 FROM stix_reports sr2
          WHERE sr2.hash = sr1.hash
          AND sr2.id != sr1.id
          AND sr2.created_at < sr1.created_at
        )
      `, [entityId]);

      if ((duplicates?.count || 0) > 0) {
        score -= (duplicates.count * 8);
      }

      // Collaboration bonus
      const collaborations = await db.findOne(`
        SELECT COUNT(DISTINCT target_entity_id) as count
        FROM trust_relationships
        WHERE source_entity_type = 'organization'
        AND source_entity_id = ?
        AND relationship_type = 'collaboration'
      `, [entityId]);

      if ((collaborations?.count || 0) > 0) {
        score += Math.min(collaborations.count * 5, 20);
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate weighted overall score
   */
  calculateWeightedScore(scores) {
    return (
      scores.reputation * this.weights.reputation +
      scores.quality * this.weights.quality +
      scores.timeliness * this.weights.timeliness +
      scores.verification * this.weights.verification +
      scores.behavior * this.weights.behavior
    );
  }

  /**
   * Save trust score to database
   */
  async saveTrustScore(entityType, entityId, overallScore, scores) {
    try {
      const trustScoreId = uuidv4();
      
      // Check if trust score exists
      const existing = await db.findOne(
        'SELECT id FROM trust_scores WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
      );

      const metadata = JSON.stringify({
        weights: this.weights,
        calculatedBy: 'TrustCalculator',
        version: '1.0'
      });

      if (existing) {
        // Update existing
        await db.query(`
          UPDATE trust_scores
          SET overall_score = ?,
              reputation_score = ?,
              quality_score = ?,
              timeliness_score = ?,
              verification_score = ?,
              behavior_score = ?,
              calculated_at = NOW(),
              metadata = ?
          WHERE entity_type = ? AND entity_id = ?
        `, [
          overallScore,
          scores.reputation,
          scores.quality,
          scores.timeliness,
          scores.verification,
          scores.behavior,
          metadata,
          entityType,
          entityId
        ]);
      } else {
        // Insert new
        await db.query(`
          INSERT INTO trust_scores (
            id, entity_type, entity_id,
            overall_score, reputation_score, quality_score,
            timeliness_score, verification_score, behavior_score,
            metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          trustScoreId,
          entityType,
          entityId,
          overallScore,
          scores.reputation,
          scores.quality,
          scores.timeliness,
          scores.verification,
          scores.behavior,
          metadata
        ]);
      }

      // Record trust event
      await this.recordTrustEvent(entityType, entityId, 'score_calculated', overallScore);
    } catch (error) {
      console.error('Failed to save trust score:', error.message);
      throw error;
    }
  }

  /**
   * Record trust event
   */
  async recordTrustEvent(entityType, entityId, eventType, newScore) {
    try {
      const eventId = uuidv4();
      
      // Get previous score
      const previous = await db.findOne(
        'SELECT overall_score FROM trust_scores WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
      );

      await db.query(`
        INSERT INTO trust_events (
          id, entity_type, entity_id, event_type,
          impact, previous_score, new_score, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        eventId,
        entityType,
        entityId,
        eventType,
        newScore - (previous?.overall_score || 50),
        previous?.overall_score || null,
        newScore,
        'Automated trust calculation'
      ]);
    } catch (error) {
      console.error('Failed to record trust event:', error.message);
    }
  }
}

module.exports = TrustCalculator;
