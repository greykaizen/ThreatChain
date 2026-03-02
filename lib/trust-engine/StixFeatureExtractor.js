/**
 * STIX Feature Extractor
 * Extracts ML model features from STIX 2.1 bundles
 */

class StixFeatureExtractor {
  constructor() {
    this.defaultFeatures = this._getDefaultFeatures();
  }

  /**
   * Extract features from STIX bundle
   * @param {Object} stixBundle - STIX 2.1 bundle object
   * @returns {Object} Feature set for ML model
   */
  extractFromBundle(stixBundle) {
    if (!stixBundle || typeof stixBundle !== 'object') {
      console.warn('Invalid STIX bundle provided');
      return this.defaultFeatures;
    }

    // Check if x_ml_features exists (enhanced STIX files)
    if (stixBundle.x_ml_features) {
      return this._extractMLFeatures(stixBundle.x_ml_features);
    }

    // Fallback: calculate from STIX objects
    if (stixBundle.objects && Array.isArray(stixBundle.objects)) {
      return this._calculateFromObjects(stixBundle.objects);
    }

    console.warn('No extractable features found in STIX bundle');
    return this.defaultFeatures;
  }

  /**
   * Extract features from x_ml_features field
   * @param {Object} mlFeatures - x_ml_features object
   * @returns {Object} Flattened feature set in correct order
   */
  _extractMLFeatures(mlFeatures) {
    // Start with defaults to ensure correct order
    const features = this._getDefaultFeatures();

    // Override with numerical features
    if (mlFeatures.numerical) {
      Object.keys(mlFeatures.numerical).forEach(key => {
        if (features.hasOwnProperty(key)) {
          features[key] = mlFeatures.numerical[key];
        }
      });
    }

    // Override with categorical features
    if (mlFeatures.categorical) {
      Object.keys(mlFeatures.categorical).forEach(key => {
        if (features.hasOwnProperty(key)) {
          features[key] = mlFeatures.categorical[key];
        }
      });
    }

    // Override with boolean features
    if (mlFeatures.boolean) {
      Object.keys(mlFeatures.boolean).forEach(key => {
        if (features.hasOwnProperty(key)) {
          features[key] = mlFeatures.boolean[key];
        }
      });
    }

    return features;
  }

  /**
   * Calculate features from STIX objects (fallback method)
   * @param {Array} objects - Array of STIX objects
   * @returns {Object} Calculated feature set in correct order
   */
  _calculateFromObjects(objects) {
    // Start with defaults to ensure correct order
    const features = this._getDefaultFeatures();

    // Count indicators
    const indicators = objects.filter(obj => obj.type === 'indicator');
    features.total_reports = indicators.length;

    // Estimate VT detections (30% of indicators)
    features.vt_detections = Math.floor(indicators.length * 0.3);

    // Calculate average confidence from indicators
    const confidenceValues = indicators
      .map(ind => ind.confidence)
      .filter(conf => conf !== undefined);
    
    if (confidenceValues.length > 0) {
      const avgConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
      features.confidence = Math.round(avgConfidence);
    }

    // Determine threat category from object types
    const hasMalware = objects.some(obj => obj.type === 'malware');
    const hasRansomware = objects.some(obj => 
      obj.malware_types && obj.malware_types.includes('ransomware')
    );
    const hasThreatActor = objects.some(obj => obj.type === 'threat-actor');
    const hasCampaign = objects.some(obj => obj.type === 'campaign');

    if (hasRansomware) {
      features.threat_category = 'ransomware';
      features.abuse_score = 85;
    } else if (hasThreatActor) {
      features.threat_category = 'apt';
      features.abuse_score = 70;
    } else if (hasMalware) {
      features.threat_category = 'malware';
      features.abuse_score = 75;
    } else if (hasCampaign) {
      features.threat_category = 'campaign';
      features.abuse_score = 60;
    }

    // Estimate other numerical features
    features.threatfox_iocs = Math.floor(indicators.length * 0.2);
    features.mitre_confidence = features.confidence * 0.8;
    features.asshole_score = features.abuse_score * 0.6;
    features.classification_confidence = features.confidence;
    features.reports_to_vt_ratio = features.vt_detections > 0 
      ? Math.max(1, features.total_reports / features.vt_detections)
      : 1;

    // Set boolean features based on severity
    const isHighSeverity = features.abuse_score >= 70;
    features.suspicious_isp = isHighSeverity ? 1 : 0;
    features.signal_abuse_reports = indicators.length > 5 ? 1 : 0;
    features.signal_vt_detections = indicators.length > 3 ? 1 : 0;
    features.signal_threatfox = indicators.length > 2 ? 1 : 0;
    features.signal_suspicious_infra = isHighSeverity ? 1 : 0;
    features.signal_behavioral = indicators.length > 10 ? 1 : 0;

    return features;
  }

  /**
   * Merge extracted features with database fields
   * @param {Object} extractedFeatures - Features from STIX content
   * @param {Object} calculatedFeatures - Calculated features (unused, for compatibility)
   * @param {Object} dbFields - Database fields (severity, indicators_count, report_type)
   * @returns {Object} Merged feature set in correct order
   */
  mergeFeatures(extractedFeatures, calculatedFeatures, dbFields) {
    // Start with extracted features (already in correct order)
    const merged = { ...extractedFeatures };

    // Override with DB fields if they provide better information
    if (dbFields) {
      // Map severity to abuse_score if not already set meaningfully
      if (dbFields.severity && extractedFeatures.abuse_score === 50) {
        const severityMap = {
          'critical': 90,
          'high': 75,
          'medium': 50,
          'low': 30,
          'info': 20
        };
        const severityLower = dbFields.severity.toLowerCase();
        merged.abuse_score = severityMap[severityLower] || 50;
      }

      // Use indicators_count if available and higher
      if (dbFields.indicators_count !== undefined) {
        merged.total_reports = Math.max(merged.total_reports || 0, dbFields.indicators_count);
      }

      // Use report_type as threat_category if not set
      if (dbFields.report_type && extractedFeatures.threat_category === 'unknown') {
        merged.threat_category = dbFields.report_type;
      }
    }

    return merged;
  }

  /**
   * Fill missing features with intelligent defaults
   * @param {Object} features - Partial feature set
   * @returns {Object} Complete feature set
   */
  _fillMissingFeatures(features) {
    const defaults = this._getDefaultFeatures();
    return { ...defaults, ...features };
  }

  /**
   * Get default feature values in the EXACT order expected by ML model
   * @returns {Object} Default feature set
   */
  _getDefaultFeatures() {
    // CRITICAL: Order must match the training data exactly
    const features = {};
    
    // Numerical features (in exact order)
    features.total_reports = 0;
    features.vt_detections = 0;
    features.abuse_score = 50;
    features.confidence = 50;
    features.threatfox_iocs = 0;
    features.mitre_confidence = 40;
    features.asshole_score = 30;
    features.classification_confidence = 50;
    features.reports_to_vt_ratio = 1;
    
    // Categorical features
    features.usage_type = 'Data Center/Web Hosting/Transit';
    features.country_code = 'US';
    features.threat_category = 'unknown';
    features.infrastructure_type = 'datacenter';
    
    // Boolean features
    features.suspicious_isp = 0;
    features.young_domain = 0;
    features.residential_proxy = 0;
    features.verified_identity = 1;
    features.published_ip_ranges = 1;
    features.signal_abuse_reports = 0;
    features.signal_vt_detections = 0;
    features.signal_threatfox = 0;
    features.signal_suspicious_infra = 0;
    features.signal_behavioral = 0;
    features.has_ssl_data = 1;
    features.ssl_port_open = 1;
    
    return features;
  }
}

module.exports = StixFeatureExtractor;
