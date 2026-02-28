const express = require('express');
const router = express.Router();
const axios = require('axios');
const trustEngine = require('../lib/trust-engine/TrustCalculator');

/**
 * Enhanced Trust API Routes
 * Implements dual-model support as specified in the XGBoost plan
 */

// ─── Helper: call ML service directly ───────────────────────────────────────
async function callMLService(features, entityType = 'report', entityId = 'demo') {
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
  const timeout = parseInt(process.env.ML_SERVICE_TIMEOUT) || 5000;

  try {
    const response = await axios.post(
      `${mlUrl}/ml/predict/trust-score`,
      { entity_type: entityType, entity_id: entityId, features },
      { timeout, headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    console.warn(`⚠️  ML service unavailable: ${err.message}`);
    return null;
  }
}

// ─── Helper: build rule-based score from scratch (no DB needed) ─────────────
function buildDefaultRuleBasedScore(seed = Math.random()) {
  // Deterministic-ish demo values based on a seed so they don't change every
  // request, but differ per entity.
  const r = (base, jitter) => Math.min(100, Math.max(0, Math.round(base + jitter * seed * 100) / 1));
  const dimensions = {
    reputation: r(75, 0.15),
    quality: r(80, 0.10),
    timeliness: r(90, 0.08),
    verification: r(60, 0.20),
    behavior: r(70, 0.12),
  };
  const overallScore =
    dimensions.reputation * 0.30 +
    dimensions.quality * 0.25 +
    dimensions.timeliness * 0.20 +
    dimensions.verification * 0.15 +
    dimensions.behavior * 0.10;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    dimensions,
    method: 'rule-based',
    calculatedAt: new Date(),
  };
}

// ─── Helper: normalize raw ML prediction values to 0-100 ────────────────────
function normalizeMLPredictions(predictions) {
  if (!predictions) return null;

  // abuse_score: model outputs 0-100 already, clamp just in case
  const abuseScore = Math.min(100, Math.max(0, parseFloat(predictions.abuse_score) || 0));

  // confidence: model outputs 0-100
  const confidence = Math.min(100, Math.max(0, parseFloat(predictions.confidence) || 50));

  return {
    abuseScore: Math.round(abuseScore * 10) / 10,
    confidence: Math.round(confidence * 10) / 10,
    autoBlocked: Boolean(predictions.auto_blocked),
    probability: Math.round((parseFloat(predictions.auto_blocked_probability) || 0) * 1000) / 1000,
  };
}

// ─── /api/trust/dataset-results — stats from CSV ───────────────────────────
router.get('/dataset-results', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const csvPath = path.join(process.cwd(), 'trust_score_results.csv');

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, error: 'Dataset results not found. Please run the test script first.' });
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, i) => {
        let val = values[i];
        if (val === 'True') val = true;
        else if (val === 'False') val = false;
        else if (!isNaN(val)) val = parseFloat(val);
        obj[header] = val;
      });
      return obj;
    });

    // Calculate Stats
    const total = data.length;
    const avgRb = data.reduce((acc, r) => acc + r.rb_trust_score, 0) / total;
    const avgXgb = data.reduce((acc, r) => acc + r.xgb_abuse, 0) / total;
    const avgConf = data.reduce((acc, r) => acc + r.xgb_confidence, 0) / total;
    const autoBlocked = data.filter(r => r.xgb_auto_block).length;

    const distribution = {
      rb: { high: 0, medHigh: 0, med: 0, low: 0 },
      xgb: { high: 0, med: 0, lowMed: 0, low: 0 }
    };

    data.forEach(r => {
      if (r.rb_trust_score < 25) distribution.rb.high++;
      else if (r.rb_trust_score < 50) distribution.rb.medHigh++;
      else if (r.rb_trust_score < 75) distribution.rb.med++;
      else distribution.rb.low++;

      if (r.xgb_abuse >= 75) distribution.xgb.high++;
      else if (r.xgb_abuse >= 50) distribution.xgb.med++;
      else if (r.xgb_abuse >= 25) distribution.xgb.lowMed++;
      else distribution.xgb.low++;
    });

    res.json({
      success: true,
      stats: {
        total,
        avgRb: Math.round(avgRb * 10) / 10,
        avgXgb: Math.round(avgXgb * 10) / 10,
        avgConf: Math.round(avgConf * 10) / 10,
        autoBlocked,
        distribution
      },
      rows: data.slice(0, 100) // First 100 for the table
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── /score-demo — Picking a real entry from the dataset if available ──────
router.get('/score-demo', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const csvPath = path.join(process.cwd(), 'trust_score_results.csv');

    // If dataset exists, use a random real entry for demo
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length > 1) {
        const randomIdx = Math.floor(Math.random() * (lines.length - 1)) + 1;
        const values = lines[randomIdx].split(',');
        const headers = lines[0].split(',');
        const entry = {};
        headers.forEach((h, i) => entry[h] = values[i]);

        return res.json({
          success: true,
          data: {
            entityType: 'report',
            entityId: entry.ip,
            productionScore: parseFloat(entry.rb_trust_score),
            ruleBased: {
              overallScore: parseFloat(entry.rb_trust_score),
              dimensions: buildDefaultRuleBasedScore(0.42).dimensions // Keep existing mock dimensions for UI
            },
            xgboost: {
              abuseScore: parseFloat(entry.xgb_abuse),
              confidence: parseFloat(entry.xgb_confidence),
              autoBlocked: entry.xgb_auto_block === 'True',
              probability: parseFloat(entry.xgb_block_prob) / 100
            },
            comparison: {
              difference: Math.abs(parseFloat(entry.rb_trust_score) - parseFloat(entry.xgb_abuse)),
              agreement: Math.abs(parseFloat(entry.rb_trust_score) - parseFloat(entry.xgb_abuse)) < 15,
              higherScore: parseFloat(entry.rb_trust_score) < parseFloat(entry.xgb_abuse) ? 'xgboost' : 'rule-based'
            },
            mlServiceOnline: true,
            calculatedAt: new Date().toISOString()
          }
        });
      }
    }
    // Representative demo features that produce interesting ML outputs
    const demoFeatures = {
      total_reports: 42,
      vt_detections: 7,
      abuse_score: 65,
      confidence: 72,
      threatfox_iocs: 3,
      mitre_confidence: 55,
      asshole_score: 40,
      classification_confidence: 68,
      usage_type: 'Data Center/Web Hosting/Transit',
      country_code: 'US',
      threat_category: 'botnet',
      infrastructure_type: 'datacenter',
      suspicious_isp: 1,
      young_domain: 0,
      residential_proxy: 0,
      verified_identity: 1,
      published_ip_ranges: 1,
      signal_abuse_reports: 1,
      signal_vt_detections: 1,
      signal_threatfox: 1,
      signal_suspicious_infra: 0,
      signal_behavioral: 0,
      reports_to_vt_ratio: 6,
      has_ssl_data: 1,
      ssl_port_open: 1,
    };

    // Rule-based score (deterministic demo)
    const ruleBasedScore = buildDefaultRuleBasedScore(0.42);

    // Call real ML service
    const mlResult = await callMLService(demoFeatures, 'report', 'demo-entity');
    const xgboostNorm = mlResult && mlResult.success
      ? normalizeMLPredictions(mlResult.predictions)
      : null;

    // Comparison
    let comparison = null;
    if (xgboostNorm) {
      const diff = Math.abs(ruleBasedScore.overallScore - xgboostNorm.abuseScore);
      comparison = {
        difference: Math.round(diff * 100) / 100,
        percentDifference: ruleBasedScore.overallScore !== 0
          ? Math.round((diff / ruleBasedScore.overallScore) * 10000) / 100
          : 0,
        agreement: diff < 10,
        higherScore: ruleBasedScore.overallScore > xgboostNorm.abuseScore
          ? 'rule-based' : 'xgboost',
      };
    }

    return res.json({
      success: true,
      data: {
        entityType: 'report',
        entityId: 'demo',
        productionScore: ruleBasedScore.overallScore,
        ruleBased: {
          overallScore: ruleBasedScore.overallScore,
          dimensions: ruleBasedScore.dimensions,
        },
        xgboost: xgboostNorm,
        comparison,
        mlServiceOnline: !!(mlResult && mlResult.success),
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in /score-demo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── /score-dual/:entityType/:entityId — full DB-backed dual score ───────────
router.get('/score-dual/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'Missing entityType or entityId parameters',
      });
    }

    const validTypes = ['report', 'indicator', 'organization'];
    if (!validTypes.includes(entityType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid entity type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    const result = await trustEngine.calculateDualScore(entityType, entityId);

    // Normalize XGBoost predictions safely
    const xgboostNorm =
      result.xgboost && result.xgboost.success && result.xgboost.predictions
        ? normalizeMLPredictions(result.xgboost.predictions)
        : null;

    return res.json({
      success: true,
      data: {
        entityType: result.entityType,
        entityId: result.entityId,
        productionScore: result.productionScore,
        ruleBased: {
          overallScore: result.ruleBased.overallScore,
          dimensions: result.ruleBased.dimensions,
        },
        xgboost: xgboostNorm,
        comparison: result.comparison
          ? {
            difference: result.comparison.difference,
            percentDifference: result.comparison.percentDifference,
            agreement: result.comparison.agreement,
            higherScore: result.comparison.higherScore,
          }
          : null,
        calculatedAt: result.calculatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting dual trust score:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to calculate dual trust score',
    });
  }
});

// ─── /score/:entityType/:entityId — rule-based only ─────────────────────────
router.get('/score/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'Missing entityType or entityId parameters',
      });
    }

    const validTypes = ['report', 'indicator', 'organization'];
    if (!validTypes.includes(entityType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid entity type. Valid types: ${validTypes.join(', ')}`,
      });
    }

    const result = await trustEngine.calculateTrustScore(entityType, entityId);

    return res.json({
      success: true,
      data: {
        entityType: result.entityType,
        entityId: result.entityId,
        score: result.score,
        details: result.details,
        calculatedAt: result.calculatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting trust score:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to calculate trust score',
    });
  }
});

// ─── /comparison/stats ───────────────────────────────────────────────────────
router.get('/comparison/stats', async (req, res) => {
  try {
    const mockStats = {
      totalComparisons: 1523,
      agreementRate: 78.5,
      avgDifference: 5.2,
      ruleBasedHigher: 45.2,
      xgboostHigher: 54.8,
      correlationCoefficient: 0.85,
    };
    res.json({ success: true, data: mockStats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── /models/performance ─────────────────────────────────────────────────────
router.get('/models/performance', async (req, res) => {
  try {
    const mockPerformance = {
      ruleBased: { avgScore: 72.3, stdDev: 15.2, calculationTime: 45 },
      xgboost: { avgScore: 75.8, stdDev: 12.1, inferenceTime: 12, modelVersion: '1.0.0' },
    };
    res.json({ success: true, data: mockPerformance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── /ml/feature-importance ──────────────────────────────────────────────────
router.get('/ml/feature-importance', async (req, res) => {
  try {
    const mockFeatures = [
      { name: 'total_reports', importance: 0.25 },
      { name: 'vt_detections', importance: 0.18 },
      { name: 'abuse_score', importance: 0.15 },
      { name: 'confidence', importance: 0.12 },
      { name: 'signal_abuse_reports', importance: 0.08 },
      { name: 'suspicious_isp', importance: 0.07 },
      { name: 'threatfox_iocs', importance: 0.06 },
      { name: 'country_code', importance: 0.05 },
      { name: 'usage_type', importance: 0.03 },
      { name: 'young_domain', importance: 0.01 },
    ];
    res.json({ success: true, data: { features: mockFeatures } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── /health ─────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: trustEngine.isReady() ? 'ready' : 'not_ready',
    models: {
      ruleBased: true,
      xgboost: trustEngine.xgboostPredictor
        ? trustEngine.xgboostPredictor.isReady()
        : false,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;