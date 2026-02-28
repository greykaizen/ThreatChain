# XGBoost Trust Scoring - Implementation Plan

## Executive Summary

This plan outlines the implementation of an **XGBoost-based machine learning model** to work **alongside** the existing rule-based trust scoring system. Both models will run in parallel, allowing for comparative analysis and statistical evaluation without replacing the proven rule-based approach.

## Vision

Create a **dual-model trust evaluation system** where:
- Rule-based model continues to serve production traffic
- XGBoost model runs in parallel for comparison
- Dashboard displays both scores with statistical analysis
- Data-driven insights guide future improvements
- Gradual transition possible based on performance metrics

---

## Current State Analysis

### Existing Rule-Based Model
**Location**: `lib/trust-engine/TrustCalculator.js`

**Dimensions** (Weighted):
- Reputation: 30%
- Quality: 25%
- Timeliness: 20%
- Verification: 15%
- Behavior: 10%

**Scoring Logic**: Hardcoded rules with base score (50) + bonuses/penalties

### Available Dataset
**Location**: `all_dataset/stix_feed_pretty.json` (13MB)

**Statistics**:
- Total Indicators: ~2,152 threat intelligence records
- Format: STIX 2.1 (JSON)
- Source: DugganUSA LLC
- Type: Primarily malicious IPs

**Feature Richness**:
- Numerical: abuse_score (0-100), confidence (30-100), total_reports (5-5455), vt_detections (0-7)
- Categorical: indicator_types, labels, usage_type, country_code, threat_category
- Boolean: auto_blocked, suspicious_isp, young_domain, verified_identity
- Derived: ISP info, SSL/TLS enrichment, bot classification, MITRE ATT&CK mappings

**Data Quality**: ✅ Sufficient for XGBoost (2,152 samples with rich features)

---

## Architecture Overview

### Dual-Model System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Trust Evaluation Request                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Trust Engine Orchestrator    │
         └───────────┬───────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  Rule-Based  │          │   XGBoost    │
│    Model     │          │    Model     │
│  (Primary)   │          │ (Comparison) │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │                         │
       ▼                         ▼
┌──────────────────────────────────────┐
│      Score Comparison Engine         │
│  - Calculate differences             │
│  - Track accuracy metrics            │
│  - Generate insights                 │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│     Unified Response with Stats      │
│  - Rule-based score (production)     │
│  - XGBoost score (experimental)      │
│  - Difference analysis               │
│  - Confidence intervals              │
└──────────────────────────────────────┘
```

---

## Phase 1: Data Preparation & Feature Engineering

### 1.1 Dataset Extraction & Transformation


**Objective**: Convert STIX JSON data into ML-ready format

**Script**: `scripts/ml/prepare-dataset.js`

**Tasks**:
1. Parse `all_dataset/stix_feed_pretty.json`
2. Extract relevant features from each indicator
3. Create training dataset with labels
4. Split into train/validation/test sets (70/15/15)
5. Export to CSV format for Python processing

**Feature Extraction Mapping**:
```javascript
{
  // Target Variables (choose one or multiple)
  target_abuse_score: indicator.x_dugganusa_threat_intel.abuse_score,
  target_confidence: indicator.confidence,
  target_auto_blocked: indicator.x_dugganusa_threat_intel.auto_blocked,
  
  // Numerical Features
  total_reports: indicator.x_dugganusa_threat_intel.total_reports,
  vt_detections: indicator.x_dugganusa_threat_intel.vt_detections,
  threatfox_iocs: indicator.x_dugganusa_threat_intel.threatfox_iocs,
  mitre_confidence: indicator.x_dugganusa_threat_intel.mitre_confidence,
  asshole_score: indicator.x_dugganusa_threat_intel.asshole_score,
  classification_confidence: indicator.x_dugganusa_bot_classification.classification_confidence,
  
  // Categorical Features (to be encoded)
  usage_type: indicator.x_dugganusa_threat_intel.usage_type,
  country_code: indicator.x_dugganusa_discovery.geolocation.country_code,
  threat_category: indicator.x_dugganusa_bot_classification.threat_category,
  infrastructure_type: indicator.x_dugganusa_bot_classification.infrastructure_type,
  
  // Boolean Features (0/1)
  suspicious_isp: indicator.x_dugganusa_threat_intel.suspicious_isp,
  young_domain: indicator.x_dugganusa_threat_intel.young_domain,
  residential_proxy: indicator.x_dugganusa_bot_classification.residential_proxy,
  verified_identity: indicator.x_dugganusa_bot_classification.verified_identity,
  published_ip_ranges: indicator.x_dugganusa_bot_classification.published_ip_ranges,
  
  // Detection Signals (Boolean)
  signal_abuse_reports: indicator.x_dugganusa_bot_classification.detection_signals.abuse_reports,
  signal_vt_detections: indicator.x_dugganusa_bot_classification.detection_signals.virus_total_detections,
  signal_threatfox: indicator.x_dugganusa_bot_classification.detection_signals.threatfox_iocs,
  signal_suspicious_infra: indicator.x_dugganusa_bot_classification.detection_signals.suspicious_infrastructure,
  signal_behavioral: indicator.x_dugganusa_bot_classification.detection_signals.behavioral_analysis,
  
  // Derived Features
  reports_to_vt_ratio: total_reports / (vt_detections + 1),
  has_ssl_data: indicator.x_dugganusa_threat_intel.ssl_tls_enrichment !== null,
  ssl_port_open: indicator.x_dugganusa_threat_intel.ssl_tls_enrichment?.https_port_open
}
```

**Output Files**:
- `data/ml/training_data.csv` - Full dataset
- `data/ml/train.csv` - Training set (70%)
- `data/ml/validation.csv` - Validation set (15%)
- `data/ml/test.csv` - Test set (15%)
- `data/ml/feature_metadata.json` - Feature descriptions and types

### 1.2 Feature Engineering Strategy


**Script**: `scripts/ml/feature-engineering.py`

**Engineered Features**:
1. **Ratio Features**:
   - `vt_detection_rate = vt_detections / total_reports`
   - `threat_density = (abuse_score * total_reports) / 100`
   - `confidence_abuse_ratio = confidence / abuse_score`

2. **Interaction Features**:
   - `high_confidence_high_abuse = (confidence > 80) AND (abuse_score > 80)`
   - `verified_but_suspicious = verified_identity AND suspicious_isp`
   - `detection_signal_count = sum(all boolean detection signals)`

3. **Categorical Encoding**:
   - One-Hot Encoding: `usage_type`, `threat_category`, `infrastructure_type`
   - Label Encoding: `country_code` (if many unique values)
   - Target Encoding: For high-cardinality categoricals

4. **Missing Value Handling**:
   - Numerical: Fill with median or -1 (to indicate missing)
   - Categorical: Create "UNKNOWN" category
   - Boolean: Fill with False (conservative approach)

**Output**: `data/ml/engineered_features.csv`

---

## Phase 2: XGBoost Model Development

### 2.1 Model Training Pipeline

**Script**: `scripts/ml/train-xgboost.py`

**Model Configurations** (Test Multiple):

**Configuration 1: Abuse Score Regression**
```python
target = 'abuse_score'
model_type = 'regression'
objective = 'reg:squarederror'

params = {
    'n_estimators': 200,
    'max_depth': 6,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 3,
    'gamma': 0.1,
    'reg_alpha': 0.1,  # L1 regularization
    'reg_lambda': 1.0,  # L2 regularization
}
```

**Configuration 2: Auto-Block Classification**
```python
target = 'auto_blocked'
model_type = 'classification'
objective = 'binary:logistic'

params = {
    'n_estimators': 150,
    'max_depth': 5,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'scale_pos_weight': 1.0,  # Adjust for class imbalance
}
```

**Configuration 3: Confidence Score Regression**
```python
target = 'confidence'
model_type = 'regression'
objective = 'reg:squarederror'

params = {
    'n_estimators': 250,
    'max_depth': 7,
    'learning_rate': 0.03,
    'subsample': 0.9,
    'colsample_bytree': 0.9,
}
```

### 2.2 Training Process


**Steps**:
1. Load preprocessed data
2. Split features (X) and target (y)
3. Train XGBoost model with cross-validation (5-fold)
4. Hyperparameter tuning using GridSearchCV or RandomizedSearchCV
5. Evaluate on validation set
6. Final evaluation on test set
7. Save trained model

**Evaluation Metrics**:

For Regression (abuse_score, confidence):
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- R² Score
- Mean Absolute Percentage Error (MAPE)

For Classification (auto_blocked):
- Accuracy
- Precision, Recall, F1-Score
- ROC-AUC
- Confusion Matrix

**Output Files**:
- `models/xgboost_abuse_score.pkl` - Trained model
- `models/xgboost_auto_block.pkl` - Classification model
- `models/xgboost_confidence.pkl` - Confidence model
- `models/feature_importance.json` - Feature importance rankings
- `models/scaler.pkl` - Feature scaler (if used)
- `models/encoder.pkl` - Categorical encoder
- `reports/training_report.json` - Training metrics and stats

### 2.3 Model Validation & Testing

**Script**: `scripts/ml/validate-model.py`

**Validation Tasks**:
1. Load test set (unseen data)
2. Generate predictions
3. Compare with actual values
4. Calculate error distributions
5. Identify edge cases and outliers
6. Generate validation report

**Statistical Analysis**:
- Prediction vs Actual scatter plots
- Residual analysis
- Error distribution histograms
- Feature importance visualization
- SHAP values for interpretability

**Output**: `reports/validation_report.pdf`

---

## Phase 3: Backend Integration (Dual-Model System)

### 3.1 Python ML Service (Microservice)

**Location**: `ml-service/`

**Structure**:
```
ml-service/
├── app.py                    # Flask/FastAPI server
├── model_loader.py           # Load trained models
├── predictor.py              # Prediction logic
├── feature_extractor.py      # Extract features from entity data
├── requirements.txt          # Python dependencies
└── models/                   # Trained model files
    ├── xgboost_abuse_score.pkl
    ├── xgboost_auto_block.pkl
    └── feature_importance.json
```

**API Endpoints**:
```python
POST /ml/predict/trust-score
{
  "entity_type": "report",
  "entity_id": "uuid",
  "features": {
    "total_reports": 38,
    "vt_detections": 3,
    "abuse_score": 100,
    // ... all features
  }
}

Response:
{
  "success": true,
  "predictions": {
    "abuse_score": 98.5,
    "confidence": 95.2,
    "auto_blocked": true,
    "auto_blocked_probability": 0.97
  },
  "feature_importance": {
    "total_reports": 0.25,
    "vt_detections": 0.18,
    // ...
  },
  "model_version": "1.0.0",
  "inference_time_ms": 12
}
```

**Technology Stack**:
- Framework: Flask or FastAPI
- ML Library: XGBoost, scikit-learn, pandas
- Deployment: Standalone process or Docker container
- Port: 5001 (separate from main backend)

### 3.2 Node.js Integration Layer


**Location**: `lib/trust-engine/XGBoostPredictor.js`

**Purpose**: Bridge between Node.js backend and Python ML service

**Implementation**:
```javascript
class XGBoostPredictor {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.enabled = process.env.USE_XGBOOST_MODEL === 'true';
    this.timeout = 5000; // 5 second timeout
  }

  async predict(entityType, entityId, features) {
    if (!this.enabled) return null;
    
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/ml/predict/trust-score`,
        { entity_type: entityType, entity_id: entityId, features },
        { timeout: this.timeout }
      );
      return response.data;
    } catch (error) {
      console.error('XGBoost prediction failed:', error.message);
      return null; // Graceful degradation
    }
  }

  async extractFeatures(entityType, entityId, entityData) {
    // Convert entity data to ML features
    // Map database fields to feature format expected by ML model
  }
}
```

### 3.3 Enhanced Trust Calculator (Dual-Model)

**Location**: `lib/trust-engine/TrustCalculator.js` (Modified)

**New Method**: `calculateDualScore()`

```javascript
async calculateDualScore(entityType, entityId) {
  const entityData = await this.getEntityData(entityType, entityId);
  
  // 1. Calculate Rule-Based Score (existing logic)
  const ruleBasedScore = await this.calculateRuleBasedScore(
    entityType, entityId, entityData
  );
  
  // 2. Calculate XGBoost Score (new)
  let xgboostScore = null;
  if (this.xgboostPredictor && this.xgboostPredictor.enabled) {
    const features = await this.xgboostPredictor.extractFeatures(
      entityType, entityId, entityData
    );
    xgboostScore = await this.xgboostPredictor.predict(
      entityType, entityId, features
    );
  }
  
  // 3. Compare and Analyze
  const comparison = this.compareScores(ruleBasedScore, xgboostScore);
  
  // 4. Save both scores
  await this.saveDualScore(entityType, entityId, {
    ruleBased: ruleBasedScore,
    xgboost: xgboostScore,
    comparison: comparison
  });
  
  return {
    entityType,
    entityId,
    ruleBased: ruleBasedScore,
    xgboost: xgboostScore,
    comparison: comparison,
    productionScore: ruleBasedScore.overallScore, // Rule-based is primary
    calculatedAt: new Date()
  };
}

compareScores(ruleBasedScore, xgboostScore) {
  if (!xgboostScore) return null;
  
  return {
    difference: Math.abs(
      ruleBasedScore.overallScore - xgboostScore.predictions.abuse_score
    ),
    percentDifference: (
      (ruleBasedScore.overallScore - xgboostScore.predictions.abuse_score) / 
      ruleBasedScore.overallScore * 100
    ),
    agreement: Math.abs(
      ruleBasedScore.overallScore - xgboostScore.predictions.abuse_score
    ) < 10, // Within 10 points
    higherScore: ruleBasedScore.overallScore > xgboostScore.predictions.abuse_score 
      ? 'rule-based' : 'xgboost'
  };
}
```

---

## Phase 4: Database Schema Extensions

### 4.1 New Tables

**Table: `ml_predictions`**
```sql
CREATE TABLE ml_predictions (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  
  -- XGBoost Predictions
  predicted_abuse_score DECIMAL(5,2),
  predicted_confidence DECIMAL(5,2),
  predicted_auto_blocked BOOLEAN,
  auto_blocked_probability DECIMAL(5,4),
  
  -- Model Metadata
  model_version VARCHAR(20),
  inference_time_ms INT,
  feature_importance JSON,
  
  -- Timestamps
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_predicted_at (predicted_at)
);
```

**Table: `model_comparison`**
```sql
CREATE TABLE model_comparison (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  
  -- Rule-Based Scores
  rb_overall_score DECIMAL(5,2),
  rb_reputation DECIMAL(5,2),
  rb_quality DECIMAL(5,2),
  rb_timeliness DECIMAL(5,2),
  rb_verification DECIMAL(5,2),
  rb_behavior DECIMAL(5,2),
  
  -- XGBoost Scores
  xgb_abuse_score DECIMAL(5,2),
  xgb_confidence DECIMAL(5,2),
  xgb_auto_blocked BOOLEAN,
  
  -- Comparison Metrics
  score_difference DECIMAL(5,2),
  percent_difference DECIMAL(5,2),
  models_agree BOOLEAN,
  higher_score_model VARCHAR(20),
  
  -- Timestamps
  compared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_compared_at (compared_at),
  INDEX idx_agreement (models_agree)
);
```

**Table: `model_performance_metrics`**
```sql
CREATE TABLE model_performance_metrics (
  id VARCHAR(36) PRIMARY KEY,
  model_type VARCHAR(50) NOT NULL, -- 'rule-based' or 'xgboost'
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4),
  
  -- Context
  entity_type VARCHAR(50),
  sample_size INT,
  date_range_start DATE,
  date_range_end DATE,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  
  INDEX idx_model_metric (model_type, metric_name),
  INDEX idx_calculated_at (calculated_at)
);
```

### 4.2 Database Migration Script

**Script**: `scripts/init-ml-tables.js`

**Tasks**:
1. Create new tables
2. Add indexes for performance
3. Seed initial data (if needed)
4. Verify table creation
5. Run test queries

---

## Phase 5: API Endpoints (Dual-Model Support)

### 5.1 Enhanced Trust API Routes

**Location**: `routes/trust.js` (Extended)

**New Endpoints**:

```javascript
// Get dual-model trust score
GET /api/trust/score-dual/:entityType/:entityId
Response: {
  success: true,
  data: {
    entityType: "report",
    entityId: "uuid",
    productionScore: 85.5,  // Rule-based (primary)
    ruleBased: {
      overallScore: 85.5,
      dimensions: { reputation: 80, quality: 90, ... }
    },
    xgboost: {
      abuseScore: 88.2,
      confidence: 92.1,
      autoBlocked: true,
      probability: 0.95
    },
    comparison: {
      difference: 2.7,
      percentDifference: 3.16,
      agreement: true,
      higherScore: "xgboost"
    }
  }
}

// Get model comparison statistics
GET /api/trust/comparison/stats
Query params: ?entityType=report&days=30
Response: {
  success: true,
  data: {
    totalComparisons: 1523,
    agreementRate: 78.5,  // % within 10 points
    avgDifference: 5.2,
    ruleBasedHigher: 45.2,  // % of time
    xgboostHigher: 54.8,
    correlationCoefficient: 0.85
  }
}

// Get model performance metrics
GET /api/trust/models/performance
Response: {
  success: true,
  data: {
    ruleBased: {
      avgScore: 72.3,
      stdDev: 15.2,
      calculationTime: 45  // ms
    },
    xgboost: {
      avgScore: 75.8,
      stdDev: 12.1,
      inferenceTime: 12,  // ms
      modelVersion: "1.0.0"
    }
  }
}

// Get feature importance
GET /api/trust/ml/feature-importance
Response: {
  success: true,
  data: {
    features: [
      { name: "total_reports", importance: 0.25 },
      { name: "vt_detections", importance: 0.18 },
      { name: "abuse_score", importance: 0.15 },
      // ...
    ]
  }
}
```

---

## Phase 6: Frontend Dashboard (Comparison UI)


### 6.1 Model Comparison Dashboard

**Location**: `components/pages/model-comparison-dashboard.tsx`

**Features**:

1. **Side-by-Side Score Display**
   - Rule-Based score (left panel)
   - XGBoost score (right panel)
   - Difference indicator (center)
   - Agreement status badge

2. **Score Distribution Charts**
   - Histogram: Rule-based score distribution
   - Histogram: XGBoost score distribution
   - Scatter plot: Rule-based vs XGBoost (correlation)
   - Box plot: Score differences by entity type

3. **Agreement Analysis**
   - Agreement rate gauge (% within threshold)
   - Disagreement cases table (largest differences)
   - Trend line: Agreement over time

4. **Performance Metrics**
   - Average calculation/inference time
   - Model accuracy metrics (if ground truth available)
   - Feature importance bar chart
   - Model confidence indicators

5. **Statistical Summary**
   - Mean, median, std dev for both models
   - Correlation coefficient
   - Mean Absolute Error between models
   - Percentage of cases where each model scores higher

### 6.2 Enhanced Trust Score Card

**Location**: `components/trust-score-card.tsx`

**Display Format**:
```
┌─────────────────────────────────────────────┐
│  Trust Score Comparison                     │
├─────────────────────────────────────────────┤
│                                             │
│  Production Score (Rule-Based): 85.5  ⭐    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  ML Prediction (XGBoost): 88.2  🤖          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  Difference: 2.7 points (3.2%)  ✓ Agree    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Rule-Based Breakdown:               │   │
│  │ • Reputation:    80 ━━━━━━━━━━━━━━ │   │
│  │ • Quality:       90 ━━━━━━━━━━━━━━ │   │
│  │ • Timeliness:    85 ━━━━━━━━━━━━━━ │   │
│  │ • Verification:  88 ━━━━━━━━━━━━━━ │   │
│  │ • Behavior:      82 ━━━━━━━━━━━━━━ │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ XGBoost Insights:                   │   │
│  │ • Abuse Score:   88.2               │   │
│  │ • Confidence:    92.1               │   │
│  │ • Auto-Block:    Yes (97% prob)     │   │
│  │ • Top Features:                     │   │
│  │   1. total_reports (25%)            │   │
│  │   2. vt_detections (18%)            │   │
│  │   3. abuse_score (15%)              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 6.3 Model Performance Page

**Location**: `app/model-performance/page.tsx`

**Sections**:

1. **Overview Cards**
   - Total predictions made
   - Agreement rate
   - Average difference
   - Model uptime

2. **Time Series Charts**
   - Score trends over time (both models)
   - Agreement rate trend
   - Inference time trend

3. **Detailed Comparison Table**
   - Entity ID | Rule-Based | XGBoost | Diff | Agree
   - Sortable and filterable
   - Export to CSV

4. **Statistical Tests**
   - Paired t-test results
   - Correlation analysis
   - Distribution comparison (KS test)

---

## Phase 7: Statistical Analysis & Reporting

### 7.1 Automated Comparison Reports

**Script**: `scripts/ml/generate-comparison-report.py`

**Report Contents**:

1. **Executive Summary**
   - Total entities evaluated
   - Overall agreement rate
   - Key findings and recommendations

2. **Score Distribution Analysis**
   - Mean, median, mode for both models
   - Standard deviation and variance
   - Quartile analysis
   - Outlier detection

3. **Agreement Analysis**
   - Agreement rate by entity type
   - Agreement rate by score range
   - Cases of high disagreement (>20 points)
   - Patterns in disagreements

4. **Performance Comparison**
   - Calculation/inference time comparison
   - Resource usage (CPU, memory)
   - Scalability metrics

5. **Feature Importance Analysis**
   - Top 10 most important features
   - Feature correlation with scores
   - Feature stability over time

6. **Recommendations**
   - When to trust rule-based model
   - When to trust XGBoost model
   - Potential improvements for both models

**Output**: `reports/model_comparison_YYYY-MM-DD.pdf`

### 7.2 Real-Time Monitoring Dashboard

**Script**: `scripts/ml/monitor-models.js`

**Metrics Tracked**:
- Prediction count (per hour/day)
- Average score difference
- Agreement rate (rolling window)
- Model availability/uptime
- Inference latency (p50, p95, p99)
- Error rate

**Alerts**:
- Agreement rate drops below 70%
- Average difference exceeds 15 points
- ML service unavailable
- Inference time exceeds 1 second

---

## Phase 8: Deployment & Operations

### 8.1 ML Service Deployment

**Option 1: Standalone Process**
```bash
# Start ML service
cd ml-service
python app.py --port 5001
```

**Option 2: Docker Container**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app.py"]
```

**Docker Compose Integration**:
```yaml
services:
  ml-service:
    build: ./ml-service
    ports:
      - "5001:5001"
    environment:
      - MODEL_PATH=/app/models
    volumes:
      - ./models:/app/models
    restart: unless-stopped
```

### 8.2 Environment Configuration

**`.env` additions**:
```env
# XGBoost ML Model Configuration
USE_XGBOOST_MODEL=true
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=5000
ML_FALLBACK_ENABLED=true

# Model Comparison Settings
ENABLE_MODEL_COMPARISON=true
COMPARISON_AGREEMENT_THRESHOLD=10
COMPARISON_LOG_LEVEL=info

# Performance Monitoring
TRACK_MODEL_METRICS=true
METRICS_RETENTION_DAYS=90
```

### 8.3 Startup Sequence

**Modified `server.js`**:
```javascript
// 1. Initialize Rule-Based Trust Engine
const trustEngine = require('./lib/trust-engine');
await trustEngine.initialize();

// 2. Initialize XGBoost Predictor (optional)
if (process.env.USE_XGBOOST_MODEL === 'true') {
  try {
    const xgboostPredictor = require('./lib/trust-engine/XGBoostPredictor');
    await xgboostPredictor.initialize();
    trustEngine.setXGBoostPredictor(xgboostPredictor);
    console.log('✅ XGBoost model integration enabled');
  } catch (error) {
    console.warn('⚠️ XGBoost model unavailable, using rule-based only');
  }
}

// 3. Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Trust Engine: ${trustEngine.isReady() ? 'Active' : 'Disabled'}`);
  console.log(`XGBoost Model: ${xgboostPredictor?.isReady() ? 'Active' : 'Disabled'}`);
});
```

---

## Phase 9: Testing & Validation

### 9.1 Unit Tests

**Test Files**:
- `tests/ml/test-feature-extraction.js` - Feature extraction logic
- `tests/ml/test-xgboost-predictor.js` - ML service integration
- `tests/ml/test-dual-calculator.js` - Dual-model calculation
- `tests/ml/test-comparison-engine.js` - Score comparison logic

### 9.2 Integration Tests

**Scenarios**:
1. Calculate dual score for existing report
2. Handle ML service unavailable gracefully
3. Compare scores for 100 random entities
4. Verify database storage of both scores
5. Test API endpoints return correct format

### 9.3 Performance Tests

**Benchmarks**:
- Rule-based calculation time: Target <50ms
- XGBoost inference time: Target <100ms
- Total dual-score calculation: Target <150ms
- API response time: Target <200ms
- Concurrent requests: Test 100 simultaneous

### 9.4 Validation Criteria

**Before Production**:
- ✅ XGBoost model achieves R² > 0.7 on test set
- ✅ Agreement rate with rule-based > 70%
- ✅ ML service uptime > 99%
- ✅ No performance degradation in main app
- ✅ Graceful fallback works when ML service down
- ✅ All API endpoints return expected format
- ✅ Dashboard displays both scores correctly

---

## Phase 10: Analysis & Insights

### 10.1 Comparative Analysis Questions

**To Answer**:
1. Which model scores higher on average?
2. For which entity types do models agree most?
3. What features cause the biggest disagreements?
4. Are there systematic biases in either model?
5. Which model is more conservative/aggressive?
6. How do scores correlate with actual threat outcomes?
7. Which model better predicts blockchain verification?
8. How stable are scores over time for each model?

### 10.2 Decision Framework

**When to Trust Rule-Based**:
- Established entities with long history
- Clear rule violations (duplicates, stale data)
- Behavioral patterns are primary concern
- Explainability is critical

**When to Trust XGBoost**:
- New entities with limited history
- Complex feature interactions
- Pattern recognition needed
- Numerical optimization important

**When Models Disagree (>15 points)**:
- Flag for manual review
- Use average of both scores
- Apply conservative approach (lower score)
- Investigate root cause of disagreement

### 10.3 Continuous Improvement

**Monthly Review Process**:
1. Generate comparison report
2. Analyze disagreement cases
3. Identify model weaknesses
4. Retrain XGBoost with new data
5. Update rule-based logic if needed
6. A/B test improvements
7. Document findings

---

## Implementation Timeline

### Week 1: Data Preparation & Model Training
- Day 1-2: Extract and prepare dataset
- Day 3-4: Feature engineering
- Day 5-7: Train and validate XGBoost models

### Week 2: Backend Integration
- Day 1-2: Build Python ML service
- Day 3-4: Create Node.js integration layer
- Day 5: Database schema and migrations
- Day 6-7: API endpoint development

### Week 3: Frontend & Testing
- Day 1-3: Build comparison dashboard
- Day 4-5: Integration testing
- Day 6-7: Performance testing and optimization

### Week 4: Deployment & Analysis
- Day 1-2: Deploy ML service
- Day 3-4: Production testing
- Day 5-6: Generate initial comparison reports
- Day 7: Documentation and handoff

**Total Estimated Time**: 4 weeks (160 hours)

---

## File Structure (New Files Only)

```
threadchain-dashboard/
├── ml-service/                          # Python ML microservice
│   ├── app.py
│   ├── model_loader.py
│   ├── predictor.py
│   ├── feature_extractor.py
│   ├── requirements.txt
│   └── models/
│       ├── xgboost_abuse_score.pkl
│       ├── xgboost_auto_block.pkl
│       └── feature_importance.json
│
├── scripts/
│   ├── ml/
│   │   ├── prepare-dataset.js          # Extract features from STIX JSON
│   │   ├── feature-engineering.py      # Create engineered features
│   │   ├── train-xgboost.py           # Train XGBoost models
│   │   ├── validate-model.py          # Model validation
│   │   ├── generate-comparison-report.py
│   │   └── monitor-models.js
│   └── init-ml-tables.js               # Database migration
│
├── lib/
│   └── trust-engine/
│       ├── XGBoostPredictor.js         # ML service client
│       └── TrustCalculator.js          # Modified for dual-model
│
├── routes/
│   └── trust.js                        # Extended with ML endpoints
│
├── components/
│   ├── pages/
│   │   └── model-comparison-dashboard.tsx
│   ├── trust-score-card.tsx            # Enhanced with dual scores
│   └── model-performance-chart.tsx
│
├── app/
│   └── model-performance/
│       └── page.tsx
│
├── data/
│   └── ml/
│       ├── training_data.csv
│       ├── train.csv
│       ├── validation.csv
│       ├── test.csv
│       └── feature_metadata.json
│
├── reports/
│   ├── training_report.json
│   ├── validation_report.pdf
│   └── model_comparison_YYYY-MM-DD.pdf
│
└── tests/
    └── ml/
        ├── test-feature-extraction.js
        ├── test-xgboost-predictor.js
        ├── test-dual-calculator.js
        └── test-comparison-engine.js
```

---

## Risk Mitigation

### Technical Risks

**Risk 1: ML Service Unavailable**
- Mitigation: Graceful fallback to rule-based only
- Timeout: 5 seconds max
- Retry logic: 3 attempts with exponential backoff
- Health check: Ping ML service every 60 seconds

**Risk 2: Model Performance Degradation**
- Mitigation: Monitor agreement rate continuously
- Alert: If agreement drops below 70%
- Action: Disable XGBoost, investigate, retrain

**Risk 3: Inference Latency**
- Mitigation: Async prediction with caching
- Cache: Store predictions for 1 hour
- Batch processing: For bulk evaluations

**Risk 4: Data Drift**
- Mitigation: Monthly model retraining
- Monitoring: Track feature distributions
- Validation: Compare new data vs training data

### Operational Risks

**Risk 1: Increased Complexity**
- Mitigation: Comprehensive documentation
- Training: Team walkthrough sessions
- Monitoring: Centralized logging and alerts

**Risk 2: Resource Usage**
- Mitigation: Separate ML service (isolated resources)
- Scaling: Horizontal scaling if needed
- Optimization: Model quantization for speed

---

## Success Metrics

### Technical Metrics
- ✅ XGBoost R² score > 0.7
- ✅ Agreement rate > 70%
- ✅ Inference time < 100ms (p95)
- ✅ ML service uptime > 99%
- ✅ Zero impact on main app performance

### Business Metrics
- ✅ Improved threat detection accuracy
- ✅ Reduced false positives
- ✅ Better trust score calibration
- ✅ Data-driven insights for model improvement

### Operational Metrics
- ✅ Successful dual-model deployment
- ✅ Comprehensive comparison reports generated
- ✅ Team trained on new system
- ✅ Documentation complete

---

## Future Enhancements (Post-Implementation)

### Phase 11: Advanced ML Features
1. **Ensemble Model**: Combine rule-based and XGBoost predictions
2. **Deep Learning**: LSTM for temporal patterns
3. **Anomaly Detection**: Isolation Forest for outliers
4. **Active Learning**: Flag uncertain cases for manual review
5. **Explainable AI**: SHAP/LIME for prediction explanations

### Phase 12: Automated Model Management
1. **Auto-Retraining**: Trigger retraining when performance drops
2. **A/B Testing**: Test new models against production
3. **Model Versioning**: Track and rollback model versions
4. **Feature Store**: Centralized feature management
5. **MLOps Pipeline**: CI/CD for model deployment

---

## Conclusion

This plan provides a comprehensive roadmap for implementing XGBoost alongside the existing rule-based trust scoring system. The dual-model approach allows for:

1. **Risk-Free Experimentation**: Rule-based remains primary, XGBoost runs in parallel
2. **Data-Driven Insights**: Statistical comparison reveals strengths/weaknesses
3. **Gradual Transition**: Can shift to XGBoost if it proves superior
4. **Best of Both Worlds**: Leverage rule-based explainability and ML accuracy

The implementation is designed to be **non-intrusive**, **reversible**, and **production-safe**, ensuring zero disruption to existing functionality while enabling advanced ML capabilities.

**Next Step**: Review and approve this plan, then proceed with Phase 1 (Data Preparation).
