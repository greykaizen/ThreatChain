/**
 * Rule Engine - Evaluates trust rules and applies scoring
 */

const db = require('../../config/database');

class RuleEngine {
  constructor() {
    this.rulesCache = null;
    this.cacheExpiry = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all active rules
   */
  async getActiveRules(ruleType = null) {
    try {
      // Check cache
      if (this.rulesCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        return ruleType 
          ? this.rulesCache.filter(r => r.rule_type === ruleType)
          : this.rulesCache;
      }

      // Fetch from database
      let query = 'SELECT * FROM trust_rules WHERE is_active = TRUE ORDER BY priority DESC';
      const rules = await db.query(query);

      // Update cache
      this.rulesCache = rules;
      this.cacheExpiry = Date.now() + this.cacheDuration;

      return ruleType 
        ? rules.filter(r => r.rule_type === ruleType)
        : rules;
    } catch (error) {
      console.error('Failed to fetch rules:', error.message);
      return [];
    }
  }

  /**
   * Evaluate rules for an entity
   */
  async evaluateRules(entityType, entityId, entityData) {
    try {
      const rules = await this.getActiveRules();
      const results = [];

      for (const rule of rules) {
        const evaluation = await this.evaluateRule(rule, entityType, entityId, entityData);
        if (evaluation.applies) {
          results.push(evaluation);
        }
      }

      return results;
    } catch (error) {
      console.error('Rule evaluation failed:', error.message);
      return [];
    }
  }

  /**
   * Evaluate a single rule
   */
  async evaluateRule(rule, entityType, entityId, entityData) {
    try {
      const condition = this.parseCondition(rule);
      const applies = await this.checkCondition(condition, entityType, entityId, entityData);

      return {
        ruleId: rule.id,
        ruleName: rule.rule_name,
        ruleType: rule.rule_type,
        applies: applies,
        impact: applies ? rule.impact : 0,
        weight: rule.weight,
        description: rule.description
      };
    } catch (error) {
      console.error(`Failed to evaluate rule ${rule.rule_name}:`, error.message);
      return {
        ruleId: rule.id,
        ruleName: rule.rule_name,
        applies: false,
        impact: 0,
        weight: 1.0
      };
    }
  }

  /**
   * Parse rule condition
   */
  parseCondition(rule) {
    return {
      field: rule.condition_field,
      operator: rule.condition_operator,
      value: rule.condition_value
    };
  }

  /**
   * Check if condition is met
   */
  async checkCondition(condition, entityType, entityId, entityData) {
    try {
      // Get field value
      const fieldValue = await this.getFieldValue(condition.field, entityType, entityId, entityData);
      
      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }

      // Evaluate condition
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    } catch (error) {
      console.error('Condition check failed:', error.message);
      return false;
    }
  }

  /**
   * Get field value for condition evaluation
   */
  async getFieldValue(field, entityType, entityId, entityData) {
    // Direct entity data fields
    if (entityData && entityData[field] !== undefined) {
      return entityData[field];
    }

    // Calculated fields
    switch (field) {
      case 'days_since_join':
        if (entityData.created_at) {
          return Math.floor((Date.now() - new Date(entityData.created_at).getTime()) / (1000 * 60 * 60 * 24));
        }
        break;

      case 'days_since_update':
        if (entityData.updated_at) {
          return Math.floor((Date.now() - new Date(entityData.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        }
        break;

      case 'days_since_last_activity':
        if (entityType === 'organization') {
          const lastReport = await db.findOne(`
            SELECT MAX(created_at) as last_activity
            FROM stix_reports
            WHERE organization_id = ?
          `, [entityId]);
          
          if (lastReport?.last_activity) {
            return Math.floor((Date.now() - new Date(lastReport.last_activity).getTime()) / (1000 * 60 * 60 * 24));
          }
        }
        break;

      case 'reports_per_month':
        if (entityType === 'organization') {
          const reportsCount = await db.findOne(`
            SELECT COUNT(*) as count
            FROM stix_reports
            WHERE organization_id = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
          `, [entityId]);
          return reportsCount?.count || 0;
        }
        break;

      case 'blockchain_status':
        if (entityType === 'report') {
          const tx = await db.findOne(`
            SELECT status
            FROM blockchain_transactions
            WHERE report_id = ?
          `, [entityId]);
          return tx?.status || 'none';
        }
        break;

      case 'duplicate_detected':
        if (entityType === 'report' && entityData.hash) {
          const duplicate = await db.findOne(`
            SELECT COUNT(*) as count
            FROM stix_reports
            WHERE hash = ? AND id != ? AND created_at < ?
          `, [entityData.hash, entityId, entityData.created_at]);
          return (duplicate?.count || 0) > 0;
        }
        break;

      case 'metadata_completeness':
        if (entityType === 'report') {
          const fields = ['title', 'description', 'report_type', 'severity', 'stix_version'];
          const completed = fields.filter(f => entityData[f] && entityData[f].length > 0).length;
          return (completed / fields.length) * 100;
        }
        break;

      case 'verification_hours':
        if (entityType === 'report') {
          const tx = await db.findOne(`
            SELECT confirmation_time
            FROM blockchain_transactions
            WHERE report_id = ? AND status = 'confirmed'
          `, [entityId]);
          
          if (tx?.confirmation_time && entityData.created_at) {
            return Math.floor(
              (new Date(tx.confirmation_time).getTime() - new Date(entityData.created_at).getTime()) / (1000 * 60 * 60)
            );
          }
        }
        break;

      default:
        return null;
    }

    return null;
  }

  /**
   * Evaluate condition based on operator
   */
  evaluateCondition(fieldValue, operator, conditionValue) {
    // Convert values to appropriate types
    const numericValue = parseFloat(fieldValue);
    const numericCondition = parseFloat(conditionValue);

    switch (operator) {
      case '>':
        return numericValue > numericCondition;
      
      case '<':
        return numericValue < numericCondition;
      
      case '>=':
        return numericValue >= numericCondition;
      
      case '<=':
        return numericValue <= numericCondition;
      
      case '=':
        return String(fieldValue).toLowerCase() === String(conditionValue).toLowerCase();
      
      case '!=':
        return String(fieldValue).toLowerCase() !== String(conditionValue).toLowerCase();
      
      case 'BETWEEN':
        const [min, max] = conditionValue.split(',').map(v => parseFloat(v.trim()));
        return numericValue >= min && numericValue <= max;
      
      case 'IN':
        const values = conditionValue.split(',').map(v => v.trim().toLowerCase());
        return values.includes(String(fieldValue).toLowerCase());
      
      default:
        return false;
    }
  }

  /**
   * Create a new rule
   */
  async createRule(ruleData) {
    try {
      const { v4: uuidv4 } = require('uuid');
      const ruleId = uuidv4();

      await db.query(`
        INSERT INTO trust_rules (
          id, rule_name, rule_type, category,
          condition_field, condition_operator, condition_value,
          impact, weight, threshold, description, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ruleId,
        ruleData.rule_name,
        ruleData.rule_type,
        ruleData.category || null,
        ruleData.condition_field,
        ruleData.condition_operator,
        ruleData.condition_value,
        ruleData.impact,
        ruleData.weight || 1.0,
        ruleData.threshold || null,
        ruleData.description || null,
        ruleData.priority || 0
      ]);

      // Clear cache
      this.rulesCache = null;

      return { success: true, ruleId };
    } catch (error) {
      console.error('Failed to create rule:', error.message);
      throw error;
    }
  }

  /**
   * Update a rule
   */
  async updateRule(ruleId, updates) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updates).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });

      if (fields.length === 0) {
        return { success: false, message: 'No fields to update' };
      }

      values.push(ruleId);

      await db.query(`
        UPDATE trust_rules
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = ?
      `, values);

      // Clear cache
      this.rulesCache = null;

      return { success: true };
    } catch (error) {
      console.error('Failed to update rule:', error.message);
      throw error;
    }
  }

  /**
   * Deactivate a rule
   */
  async deactivateRule(ruleId) {
    try {
      await db.query(
        'UPDATE trust_rules SET is_active = FALSE WHERE id = ?',
        [ruleId]
      );

      // Clear cache
      this.rulesCache = null;

      return { success: true };
    } catch (error) {
      console.error('Failed to deactivate rule:', error.message);
      throw error;
    }
  }

  /**
   * Clear rules cache
   */
  clearCache() {
    this.rulesCache = null;
    this.cacheExpiry = null;
  }
}

module.exports = RuleEngine;
