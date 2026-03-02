/**
 * Trust History - Historical trust tracking and analysis
 */

const db = require('../../config/database');

class TrustHistory {
  /**
   * Get trust score history for an entity
   */
  async getHistory(entityType, entityId, limit = 30) {
    try {
      const events = await db.query(`
        SELECT 
          id,
          event_type,
          impact,
          reason,
          previous_score,
          new_score,
          timestamp
        FROM trust_events
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `, [entityType, entityId, limit]);

      return events;
    } catch (error) {
      console.error('Failed to fetch trust history:', error.message);
      return [];
    }
  }

  /**
   * Get trust score timeline (for charts)
   */
  async getScoreTimeline(entityType, entityId, days = 30) {
    try {
      const timeline = await db.query(`
        SELECT 
          DATE(timestamp) as date,
          AVG(new_score) as avg_score,
          MIN(new_score) as min_score,
          MAX(new_score) as max_score,
          COUNT(*) as events_count
        FROM trust_events
        WHERE entity_type = ? 
        AND entity_id = ?
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND new_score IS NOT NULL
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `, [entityType, entityId, days]);

      return timeline;
    } catch (error) {
      console.error('Failed to fetch score timeline:', error.message);
      return [];
    }
  }

  /**
   * Get trust events by type
   */
  async getEventsByType(entityType, entityId, eventType = null) {
    try {
      let query = `
        SELECT 
          event_type,
          COUNT(*) as count,
          SUM(impact) as total_impact,
          AVG(impact) as avg_impact
        FROM trust_events
        WHERE entity_type = ? AND entity_id = ?
      `;
      const params = [entityType, entityId];

      if (eventType) {
        query += ' AND event_type = ?';
        params.push(eventType);
      }

      query += ' GROUP BY event_type ORDER BY count DESC';

      const events = await db.query(query, params);
      return events;
    } catch (error) {
      console.error('Failed to fetch events by type:', error.message);
      return [];
    }
  }

  /**
   * Get recent trust changes (positive and negative)
   */
  async getRecentChanges(limit = 20) {
    try {
      const changes = await db.query(`
        SELECT 
          te.*,
          CASE 
            WHEN te.entity_type = 'organization' THEN o.org_name
            WHEN te.entity_type = 'report' THEN sr.title
            ELSE te.entity_id
          END as entity_name
        FROM trust_events te
        LEFT JOIN organizations o ON te.entity_type = 'organization' AND te.entity_id = o.id
        LEFT JOIN stix_reports sr ON te.entity_type = 'report' AND te.entity_id = sr.id
        WHERE te.impact != 0
        ORDER BY te.timestamp DESC
        LIMIT ?
      `, [limit]);

      return changes;
    } catch (error) {
      console.error('Failed to fetch recent changes:', error.message);
      return [];
    }
  }

  /**
   * Get trust trend (improving, declining, stable)
   */
  async getTrustTrend(entityType, entityId, days = 7) {
    try {
      const events = await db.query(`
        SELECT new_score, timestamp
        FROM trust_events
        WHERE entity_type = ? 
        AND entity_id = ?
        AND new_score IS NOT NULL
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ORDER BY timestamp ASC
      `, [entityType, entityId, days]);

      if (events.length < 2) {
        return { trend: 'stable', change: 0, confidence: 'low' };
      }

      const firstScore = events[0].new_score;
      const lastScore = events[events.length - 1].new_score;
      const change = lastScore - firstScore;

      let trend = 'stable';
      if (change > 5) {
        trend = 'improving';
      } else if (change < -5) {
        trend = 'declining';
      }

      return {
        trend,
        change: Math.round(change * 100) / 100,
        confidence: events.length > 5 ? 'high' : 'medium',
        dataPoints: events.length
      };
    } catch (error) {
      console.error('Failed to calculate trust trend:', error.message);
      return { trend: 'unknown', change: 0, confidence: 'low' };
    }
  }

  /**
   * Get trust volatility (how stable the trust score is)
   */
  async getTrustVolatility(entityType, entityId, days = 30) {
    try {
      const stats = await db.findOne(`
        SELECT 
          STDDEV(new_score) as std_dev,
          AVG(new_score) as avg_score,
          MAX(new_score) - MIN(new_score) as range_score,
          COUNT(*) as data_points
        FROM trust_events
        WHERE entity_type = ? 
        AND entity_id = ?
        AND new_score IS NOT NULL
        AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [entityType, entityId, days]);

      if (!stats || stats.data_points < 2) {
        return { volatility: 'unknown', level: 0, stability: 'insufficient_data' };
      }

      const volatility = stats.std_dev || 0;
      let level = 'low';
      let stability = 'stable';

      if (volatility > 15) {
        level = 'high';
        stability = 'volatile';
      } else if (volatility > 8) {
        level = 'medium';
        stability = 'moderate';
      }

      return {
        volatility: level,
        level: Math.round(volatility * 100) / 100,
        stability,
        range: Math.round(stats.range_score * 100) / 100,
        dataPoints: stats.data_points
      };
    } catch (error) {
      console.error('Failed to calculate trust volatility:', error.message);
      return { volatility: 'unknown', level: 0, stability: 'error' };
    }
  }

  /**
   * Compare trust scores between entities
   */
  async compareEntities(entities) {
    try {
      const comparisons = [];

      for (const entity of entities) {
        const score = await db.findOne(
          'SELECT * FROM trust_scores WHERE entity_type = ? AND entity_id = ?',
          [entity.type, entity.id]
        );

        const trend = await this.getTrustTrend(entity.type, entity.id, 7);

        comparisons.push({
          entityType: entity.type,
          entityId: entity.id,
          score: score || null,
          trend: trend
        });
      }

      return comparisons;
    } catch (error) {
      console.error('Failed to compare entities:', error.message);
      return [];
    }
  }

  /**
   * Get trust milestones (significant events)
   */
  async getMilestones(entityType, entityId) {
    try {
      const milestones = await db.query(`
        SELECT *
        FROM trust_events
        WHERE entity_type = ? 
        AND entity_id = ?
        AND (
          ABS(impact) >= 10
          OR event_type IN ('score_calculated', 'blockchain_verified', 'major_update')
        )
        ORDER BY timestamp DESC
        LIMIT 10
      `, [entityType, entityId]);

      return milestones;
    } catch (error) {
      console.error('Failed to fetch milestones:', error.message);
      return [];
    }
  }

  /**
   * Export trust history to CSV format
   */
  async exportHistory(entityType, entityId) {
    try {
      const events = await this.getHistory(entityType, entityId, 1000);
      
      const csv = [
        'Timestamp,Event Type,Impact,Previous Score,New Score,Reason',
        ...events.map(e => 
          `${e.timestamp},${e.event_type},${e.impact},${e.previous_score || 'N/A'},${e.new_score || 'N/A'},"${e.reason || ''}"`
        )
      ].join('\n');

      return csv;
    } catch (error) {
      console.error('Failed to export history:', error.message);
      return '';
    }
  }
}

module.exports = TrustHistory;
