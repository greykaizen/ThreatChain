/**
 * Trust Event Emitter - Event system for async trust updates
 */

const EventEmitter = require('events');

class TrustEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupErrorHandling();
  }

  /**
   * Setup error handling for event listeners
   */
  setupErrorHandling() {
    this.on('error', (error) => {
      console.error('Trust Event Error:', error.message);
    });
  }

  /**
   * Emit report uploaded event
   */
  emitReportUploaded(reportId, organizationId, reportData = {}) {
    try {
      this.emit('report:uploaded', {
        reportId,
        organizationId,
        reportData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit report:uploaded event:', error.message);
    }
  }

  /**
   * Emit blockchain confirmed event
   */
  emitBlockchainConfirmed(reportId, txHash, blockNumber = null) {
    try {
      this.emit('blockchain:confirmed', {
        reportId,
        txHash,
        blockNumber,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit blockchain:confirmed event:', error.message);
    }
  }

  /**
   * Emit provenance recorded event
   */
  emitProvenanceRecorded(reportId, organizationId, actionType, metadata = {}) {
    try {
      this.emit('provenance:recorded', {
        reportId,
        organizationId,
        actionType,
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit provenance:recorded event:', error.message);
    }
  }

  /**
   * Emit report verified event
   */
  emitReportVerified(reportId, verifiedBy, verificationData = {}) {
    try {
      this.emit('report:verified', {
        reportId,
        verifiedBy,
        verificationData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit report:verified event:', error.message);
    }
  }

  /**
   * Emit duplicate detected event
   */
  emitDuplicateDetected(reportId, organizationId, duplicateOf) {
    try {
      this.emit('duplicate:detected', {
        reportId,
        organizationId,
        duplicateOf,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit duplicate:detected event:', error.message);
    }
  }

  /**
   * Emit organization activity event
   */
  emitOrganizationActivity(organizationId, activityType, details = {}) {
    try {
      this.emit('organization:activity', {
        organizationId,
        activityType,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit organization:activity event:', error.message);
    }
  }

  /**
   * Emit trust score updated event
   */
  emitTrustScoreUpdated(entityType, entityId, oldScore, newScore) {
    try {
      this.emit('trust:updated', {
        entityType,
        entityId,
        oldScore,
        newScore,
        change: newScore - oldScore,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit trust:updated event:', error.message);
    }
  }

  /**
   * Emit trust alert event (for significant changes)
   */
  emitTrustAlert(entityType, entityId, alertType, message, severity = 'medium') {
    try {
      this.emit('trust:alert', {
        entityType,
        entityId,
        alertType,
        message,
        severity,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to emit trust:alert event:', error.message);
    }
  }
}

module.exports = TrustEventEmitter;
