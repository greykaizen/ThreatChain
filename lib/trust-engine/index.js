/**
 * Trust Engine - Main Entry Point
 * Provides safe initialization with error handling and fallback mechanisms
 */

const TrustCalculator = require('./TrustCalculator');
const RuleEngine = require('./RuleEngine');
const TrustMetrics = require('./TrustMetrics');
const TrustHistory = require('./TrustHistory');
const TrustEventEmitter = require('./TrustEventEmitter');

class TrustEngine {
  constructor() {
    this.enabled = process.env.USE_TRUST_ENGINE === 'true';
    this.initialized = false;
    this.calculator = null;
    this.ruleEngine = null;
    this.metrics = null;
    this.history = null;
    this.eventEmitter = null;
  }

  /**
   * Initialize trust engine with error handling
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('🔧 Initializing Trust Engine...');

      // Initialize components
      this.calculator = new TrustCalculator();
      this.ruleEngine = new RuleEngine();
      this.metrics = new TrustMetrics();
      this.history = new TrustHistory();
      this.eventEmitter = new TrustEventEmitter();

      // Setup event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ Trust Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Trust Engine initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Setup event listeners for async trust updates
   */
  setupEventListeners() {
    // Listen for report uploads
    this.eventEmitter.on('report:uploaded', async (data) => {
      try {
        await this.evaluateReportTrust(data.reportId, data.organizationId);
      } catch (error) {
        console.error('Trust evaluation failed for report upload:', error.message);
      }
    });

    // Listen for blockchain confirmations
    this.eventEmitter.on('blockchain:confirmed', async (data) => {
      try {
        await this.updateVerificationScore(data.reportId, data.txHash);
      } catch (error) {
        console.error('Trust update failed for blockchain confirmation:', error.message);
      }
    });

    // Listen for provenance records
    this.eventEmitter.on('provenance:recorded', async (data) => {
      try {
        await this.updateBehaviorScore(data.organizationId, data.actionType);
      } catch (error) {
        console.error('Trust update failed for provenance record:', error.message);
      }
    });
  }

  /**
   * Calculate trust score for an entity
   */
  async calculateTrustScore(entityType, entityId) {
    if (!this.enabled || !this.initialized) {
      return null;
    }

    try {
      return await this.calculator.calculate(entityType, entityId);
    } catch (error) {
      console.error(`Trust calculation failed for ${entityType}:${entityId}:`, error.message);
      return null;
    }
  }

  /**
   * Evaluate report trust on upload
   */
  async evaluateReportTrust(reportId, organizationId) {
    if (!this.enabled || !this.initialized) {
      return;
    }

    try {
      // Calculate report quality score
      await this.calculator.calculate('report', reportId);
      
      // Update organization trust
      await this.calculator.calculate('organization', organizationId);
    } catch (error) {
      console.error('Report trust evaluation failed:', error.message);
    }
  }

  /**
   * Update verification score after blockchain confirmation
   */
  async updateVerificationScore(reportId, txHash) {
    if (!this.enabled || !this.initialized) {
      return;
    }

    try {
      await this.metrics.updateVerificationScore(reportId, txHash);
    } catch (error) {
      console.error('Verification score update failed:', error.message);
    }
  }

  /**
   * Update behavior score based on actions
   */
  async updateBehaviorScore(organizationId, actionType) {
    if (!this.enabled || !this.initialized) {
      return;
    }

    try {
      await this.metrics.updateBehaviorScore(organizationId, actionType);
    } catch (error) {
      console.error('Behavior score update failed:', error.message);
    }
  }

  /**
   * Get trust score history
   */
  async getTrustHistory(entityType, entityId, limit = 30) {
    if (!this.enabled || !this.initialized) {
      return [];
    }

    try {
      return await this.history.getHistory(entityType, entityId, limit);
    } catch (error) {
      console.error('Failed to fetch trust history:', error.message);
      return [];
    }
  }

  /**
   * Get all active rules
   */
  async getRules() {
    if (!this.enabled || !this.initialized) {
      return [];
    }

    try {
      return await this.ruleEngine.getActiveRules();
    } catch (error) {
      console.error('Failed to fetch rules:', error.message);
      return [];
    }
  }

  /**
   * Emit event for async processing
   */
  emit(eventName, data) {
    if (this.eventEmitter) {
      this.eventEmitter.emit(eventName, data);
    }
  }

  /**
   * Check if trust engine is enabled and ready
   */
  isReady() {
    return this.enabled && this.initialized;
  }
}

// Export singleton instance
const trustEngine = new TrustEngine();

module.exports = trustEngine;
