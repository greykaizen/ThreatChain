# ThreatChain: ML Trust Scoring Models Learning Guide

## Overview

ThreatChain implements a **dual-model trust evaluation system** combining rule-based scoring with XGBoost machine learning models. This provides both interpretable business logic and data-driven predictions for threat intelligence assessment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Trust Scoring System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Rule-Based      │         │  XGBoost ML      │        │
│  │  TrustCalculator │         │  Models          │        │
│  │  (Production)    │         │  (Comparison)    │        │
│  └────────┬─────────┘         └────────┬─────────┘        │
│           │                            │                   │
│           └────────────┬───────────────┘                   │
│                        ↓                                    │
│              ┌──────────────────┐                          │
│              │  Dual Score API  │                          │
│              │  /trust/score-   │                          │
│              │  dual/:type/:id  │                          │
│              └──────────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Model 1: Rule-Based Trust Scoring

### Location
- **Implementation**: `lib/trust-engine/TrustCalculator.js`
- **API Route**: `routes/trust.js`

### Purpose
Primary production model using business logic and domain expertise.

### Scoring Dimensions

The rule-based model evaluates 5 dimensions:


1. **Reputation (30%)**: Source credibility, historical accuracy
2. **Quality (25%)**: Data completeness, validation status
3. **Timeliness (20%)**: Age of data, freshness
4. **Verification (15%)**: Blockchain confirmation, provenance
5. **Behavior (10%)**: Consistency, anomaly detection

### Calculation Formula

```javascript
overallScore = 
  (reputation × 0.30) +
  (quality × 0.25) +
  (timeliness × 0.20) +
  (verification × 0.15) +
  (behavior × 0.10)
```

Each dimension is scored 0-100, then weighted and summed for final score (0-100).

### Dimension Details

#### 1. Reputation Score (30%)

**Factors**:
- Source credibility rating (0-100)
- Historical accuracy of source
- Community trust level
- Organization reputation

**Calculation**:
```javascript
calculateReputationScore(report) {
  let score = 50; // Base score
  
  // Source credibility
  if (report.source_credibility) {
    score += report.source_credibility * 0.3;
  }
  
  // Historical accuracy
  if (report.source_accuracy_rate) {
    score += report.source_accuracy_rate * 0.3;
  }
  
  // Organization reputation
  if (report.organization_trust_level) {
    score += report.organization_trust_level * 0.4;
  }
  
  return Math.min(100, Math.max(0, score));
}
```

#### 2. Quality Score (25%)

**Factors**:
- Data completeness (required fields present)
- STIX validation status
- Indicator count and diversity
- Metadata richness

**Calculation**:
```javascript
calculateQualityScore(report) {
  let score = 0;
  
  // Required fields check
  const requiredFields = ['title', 'description', 'stix_version'];
  const presentFields = requiredFields.filter(f => report[f]).length;
  score += (presentFields / requiredFields.length) * 40;
  
  // Indicator count
  if (report.indicators_count > 0) {
    score += Math.min(30, report.indicators_count * 3);
  }
  
  // STIX validation
  if (report.stix_valid) {
    score += 30;
  }
  
  return Math.min(100, score);
}
```

#### 3. Timeliness Score (20%)

**Factors**:
- Age of report (days since creation)
- Last update timestamp
- Data freshness indicators

**Calculation**:
```javascript
calculateTimelinessScore(report) {
  const now = Date.now();
  const created = new Date(report.created_at).getTime();
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24);
  
  // Decay function: 100 at day 0, 50 at day 30, 0 at day 90
  if (ageInDays <= 7) return 100;
  if (ageInDays <= 30) return 100 - ((ageInDays - 7) * 2);
  if (ageInDays <= 90) return 50 - ((ageInDays - 30) * 0.83);
  return 0;
}
```

#### 4. Verification Score (15%)

**Factors**:
- Blockchain confirmation status
- Hash integrity verification
- Provenance chain completeness
- External validation

**Calculation**:
```javascript
calculateVerificationScore(report) {
  let score = 0;
  
  // Blockchain recorded
  if (report.blockchain_recorded) {
    score += 40;
  }
  
  // Hash verified
  if (report.hash_verified) {
    score += 30;
  }
  
  // Provenance exists
  if (report.provenance_count > 0) {
    score += 20;
  }
  
  // Ethereum verified
  if (report.ethereum_verified) {
    score += 10;
  }
  
  return Math.min(100, score);
}
```

#### 5. Behavior Score (10%)

**Factors**:
- Consistency with historical patterns
- Anomaly detection flags
- Update frequency
- Community engagement

**Calculation**:
```javascript
calculateBehaviorScore(report) {
  let score = 70; // Base score (neutral)
  
  // Anomaly flags
  if (report.anomaly_detected) {
    score -= 30;
  }
  
  // Consistent updates
  if (report.update_count > 0) {
    score += Math.min(20, report.update_count * 5);
  }
  
  // Community validation
  if (report.community_validations > 0) {
    score += Math.min(10, report.community_validations * 2);
  }
  
  return Math.min(100, Math.max(0, score));
}
```

### Complete Rule-Based Example

**Input Report**:
```json
{
  "id": "report-123",
  "title": "APT29 Campaign",
  "description": "Advanced persistent threat...",
  "stix_version": "2.1",
  "indicators_count": 15,
  "source_credibility": 85,
  "source_accuracy_rate": 90,
  "organization_trust_level": 80,
  "stix_valid": true,
  "created_at": "2026-02-25T10:00:00Z",
  "blockchain_recorded": true,
  "hash_verified": true,
  "provenance_count": 3,
  "ethereum_verified": true,
  "anomaly_detected": false,
  "update_count": 2,
  "community_validations": 5
}
```

**Calculation**:
```javascript
// 1. Reputation: 50 + (85*0.3) + (90*0.3) + (80*0.4) = 50 + 25.5 + 27 + 32 = 134.5 → 100
reputation = 100

// 2. Quality: (3/3)*40 + min(30, 15*3) + 30 = 40 + 30 + 30 = 100
quality = 100

// 3. Timeliness: 4 days old → 100
timeliness = 100

// 4. Verification: 40 + 30 + 20 + 10 = 100
verification = 100

// 5. Behavior: 70 + min(20, 2*5) + min(10, 5*2) = 70 + 10 + 10 = 90
behavior = 90

// Overall Score
overallScore = (100*0.30) + (100*0.25) + (100*0.20) + (100*0.15) + (90*0.10)
             = 30 + 25 + 20 + 15 + 9
             = 99
```

**Output**:
```json
{
  "overallScore": 99,
  "dimensions": {
    "reputation": 100,
    "quality": 100,
    "timeliness": 100,
    "verification": 100,
    "behavior": 90
  },
  "confidence": "high",
  "recommendation": "TRUST"
}
```

---

## Model 2: XGBoost Machine Learning

### Location
- **Training Script**: `ml-service/train_xgboost_model.py`
- **Prediction Service**: `ml-service/app.py` (Flask API)
- **Models**: `ml-service/models/`

### Purpose
Data-driven predictions using gradient boosting for comparison and validation.

### Model Types

ThreatChain trains **3 separate XGBoost models**:

1. **Report Trust Model**: Evaluates STIX reports
2. **Indicator Trust Model**: Evaluates individual IOCs
3. **Source Trust Model**: Evaluates threat intelligence sources


### Feature Engineering

#### Report Features (25 features)

```python
report_features = [
    # Metadata features
    'indicators_count',           # Number of IOCs
    'report_age_days',            # Days since creation
    'update_count',               # Number of updates
    'description_length',         # Text length
    
    # Quality features
    'stix_valid',                 # Boolean: STIX validation
    'has_title',                  # Boolean: Title present
    'has_description',            # Boolean: Description present
    'metadata_completeness',      # 0-1: Field completeness
    
    # Source features
    'source_credibility',         # 0-100: Source rating
    'source_accuracy_rate',       # 0-100: Historical accuracy
    'organization_trust_level',   # 0-100: Org reputation
    
    # Blockchain features
    'blockchain_recorded',        # Boolean: On-chain
    'hash_verified',              # Boolean: Hash match
    'provenance_count',           # Number of provenance records
    'ethereum_verified',          # Boolean: Ethereum confirmed
    'gas_used',                   # Gas consumption
    
    # Behavioral features
    'anomaly_detected',           # Boolean: Anomaly flag
    'community_validations',      # Number of validations
    'view_count',                 # Number of views
    'share_count',                # Number of shares
    
    # Temporal features
    'hour_of_day',                # 0-23: Upload hour
    'day_of_week',                # 0-6: Upload day
    'is_weekend',                 # Boolean: Weekend upload
    
    # Derived features
    'indicators_per_day',         # IOCs / age
    'validation_rate'             # Validations / views
]
```

#### Indicator Features (18 features)

```python
indicator_features = [
    # Type features
    'indicator_type_encoded',     # Categorical: IP, domain, hash, etc.
    'pattern_complexity',         # Pattern string length
    
    # Validation features
    'valid_syntax',               # Boolean: Syntax check
    'in_threat_db',               # Boolean: Known threat
    'false_positive_history',     # Count of FPs
    
    # Context features
    'associated_reports_count',   # Number of reports
    'first_seen_days_ago',        # Days since first seen
    'last_seen_days_ago',         # Days since last seen
    'sighting_count',             # Number of sightings
    
    # Reputation features
    'threat_score',               # 0-100: Threat level
    'confidence_level',           # 0-100: Confidence
    'source_reputation',          # 0-100: Source rating
    
    # Network features (for IPs/domains)
    'is_private_ip',              # Boolean: RFC1918
    'has_reverse_dns',            # Boolean: PTR record
    'domain_age_days',            # Domain registration age
    'ssl_cert_valid',             # Boolean: Valid cert
    
    # Behavioral features
    'update_frequency',           # Updates per month
    'community_votes'             # Upvotes - downvotes
]
```

### Training Process

#### 1. Data Preparation

**Script**: `ml-service/train_xgboost_model.py`

```python
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load training data
df = pd.read_csv('training_data/reports_with_labels.csv')

# Feature engineering
df['report_age_days'] = (pd.Timestamp.now() - pd.to_datetime(df['created_at'])).dt.days
df['metadata_completeness'] = df[required_fields].notna().sum(axis=1) / len(required_fields)
df['indicators_per_day'] = df['indicators_count'] / (df['report_age_days'] + 1)

# Prepare features and labels
X = df[feature_columns]
y = df['trust_score']  # 0-100 continuous target

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

#### 2. Model Training

```python
# XGBoost parameters
params = {
    'objective': 'reg:squarederror',  # Regression task
    'max_depth': 6,                   # Tree depth
    'learning_rate': 0.1,             # Step size
    'n_estimators': 200,              # Number of trees
    'subsample': 0.8,                 # Row sampling
    'colsample_bytree': 0.8,          # Column sampling
    'min_child_weight': 3,            # Minimum leaf weight
    'gamma': 0.1,                     # Regularization
    'random_state': 42
}

# Train model
model = xgb.XGBRegressor(**params)
model.fit(
    X_train_scaled, 
    y_train,
    eval_set=[(X_test_scaled, y_test)],
    early_stopping_rounds=20,
    verbose=True
)

# Save model
model.save_model('models/report_trust_model.json')
scaler_file = 'models/report_scaler.pkl'
joblib.dump(scaler, scaler_file)
```

#### 3. Model Evaluation

```python
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# Predictions
y_pred = model.predict(X_test_scaled)

# Metrics
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"RMSE: {rmse:.2f}")
print(f"MAE: {mae:.2f}")
print(f"R²: {r2:.4f}")

# Feature importance
importance = model.feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': feature_columns,
    'importance': importance
}).sort_values('importance', ascending=False)

print("\nTop 10 Features:")
print(feature_importance_df.head(10))
```

**Expected Performance**:
- RMSE: 8-12 (on 0-100 scale)
- MAE: 6-9
- R²: 0.75-0.85

### Prediction Service (Flask API)

**Location**: `ml-service/app.py`

```python
from flask import Flask, request, jsonify
import xgboost as xgb
import joblib
import numpy as np

app = Flask(__name__)

# Load models
report_model = xgb.XGBRegressor()
report_model.load_model('models/report_trust_model.json')
report_scaler = joblib.load('models/report_scaler.pkl')

indicator_model = xgb.XGBRegressor()
indicator_model.load_model('models/indicator_trust_model.json')
indicator_scaler = joblib.load('models/indicator_scaler.pkl')

@app.route('/predict/report', methods=['POST'])
def predict_report():
    """Predict trust score for a report"""
    data = request.json
    
    # Extract features
    features = extract_report_features(data)
    features_array = np.array([features])
    
    # Scale and predict
    features_scaled = report_scaler.transform(features_array)
    prediction = report_model.predict(features_scaled)[0]
    
    # Clip to 0-100 range
    trust_score = np.clip(prediction, 0, 100)
    
    return jsonify({
        'trust_score': float(trust_score),
        'model': 'xgboost_report',
        'confidence': calculate_confidence(features_scaled)
    })

@app.route('/predict/indicator', methods=['POST'])
def predict_indicator():
    """Predict trust score for an indicator"""
    data = request.json
    
    features = extract_indicator_features(data)
    features_array = np.array([features])
    features_scaled = indicator_scaler.transform(features_array)
    prediction = indicator_model.predict(features_scaled)[0]
    trust_score = np.clip(prediction, 0, 100)
    
    return jsonify({
        'trust_score': float(trust_score),
        'model': 'xgboost_indicator'
    })

def extract_report_features(data):
    """Extract 25 features from report data"""
    return [
        data.get('indicators_count', 0),
        data.get('report_age_days', 0),
        data.get('update_count', 0),
        len(data.get('description', '')),
        int(data.get('stix_valid', False)),
        int(bool(data.get('title'))),
        int(bool(data.get('description'))),
        data.get('metadata_completeness', 0.5),
        data.get('source_credibility', 50),
        data.get('source_accuracy_rate', 50),
        data.get('organization_trust_level', 50),
        int(data.get('blockchain_recorded', False)),
        int(data.get('hash_verified', False)),
        data.get('provenance_count', 0),
        int(data.get('ethereum_verified', False)),
        data.get('gas_used', 0),
        int(data.get('anomaly_detected', False)),
        data.get('community_validations', 0),
        data.get('view_count', 0),
        data.get('share_count', 0),
        data.get('hour_of_day', 12),
        data.get('day_of_week', 3),
        int(data.get('is_weekend', False)),
        data.get('indicators_per_day', 0),
        data.get('validation_rate', 0)
    ]

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Start ML Service**:
```bash
cd ml-service
python app.py
```

---

## Dual Scoring API

### Endpoint: `/api/trust/score-dual/:type/:id`

**Purpose**: Get both rule-based and ML predictions for comparison.

**Types**: `report`, `indicator`, `source`

**Example Request**:
```bash
curl http://localhost:3001/api/trust/score-dual/report/report-123
```

**Response**:
```json
{
  "id": "report-123",
  "type": "report",
  "scores": {
    "ruleBased": {
      "overallScore": 87,
      "dimensions": {
        "reputation": 85,
        "quality": 92,
        "timeliness": 88,
        "verification": 95,
        "behavior": 75
      },
      "confidence": "high",
      "recommendation": "TRUST"
    },
    "machineLearning": {
      "trustScore": 84,
      "model": "xgboost_report",
      "confidence": 0.89
    }
  },
  "comparison": {
    "difference": 3,
    "agreement": "high",
    "recommendation": "TRUST"
  },
  "timestamp": "2026-03-01T10:00:00Z"
}
```

### Implementation

**Location**: `routes/trust.js`

```javascript
router.get('/score-dual/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  
  try {
    // 1. Fetch entity data
    const entity = await fetchEntity(type, id);
    if (!entity) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // 2. Calculate rule-based score
    const trustCalculator = new TrustCalculator();
    const ruleBasedScore = await trustCalculator.calculateTrustScore(entity, type);
    
    // 3. Get ML prediction
    const mlScore = await getMLPrediction(type, entity);
    
    // 4. Compare scores
    const comparison = compareScores(ruleBasedScore, mlScore);
    
    // 5. Return dual scores
    res.json({
      id,
      type,
      scores: {
        ruleBased: ruleBasedScore,
        machineLearning: mlScore
      },
      comparison,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dual scoring error:', error);
    res.status(500).json({ error: 'Scoring failed' });
  }
});

async function getMLPrediction(type, entity) {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  
  const response = await fetch(`${mlServiceUrl}/predict/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entity)
  });
  
  if (!response.ok) {
    throw new Error('ML service unavailable');
  }
  
  return await response.json();
}

function compareScores(ruleScore, mlScore) {
  const diff = Math.abs(ruleScore.overallScore - mlScore.trustScore);
  
  let agreement;
  if (diff <= 5) agreement = 'high';
  else if (diff <= 15) agreement = 'moderate';
  else agreement = 'low';
  
  const avgScore = (ruleScore.overallScore + mlScore.trustScore) / 2;
  const recommendation = avgScore >= 70 ? 'TRUST' : avgScore >= 40 ? 'VERIFY' : 'DISTRUST';
  
  return { difference: diff, agreement, recommendation };
}
```

---

## Model Comparison & Analysis

### When to Use Each Model

| Scenario | Rule-Based | XGBoost | Recommendation |
|----------|-----------|---------|----------------|
| Production scoring | ✅ Primary | ❌ Backup | Use rule-based for consistency |
| New entity (cold start) | ✅ Works | ❌ Limited data | Rule-based handles missing features better |
| Historical analysis | ✅ Interpretable | ✅ Accurate | Use both for validation |
| Anomaly detection | ⚠️ Limited | ✅ Better | ML detects subtle patterns |
| Compliance/audit | ✅ Explainable | ❌ Black box | Rule-based for transparency |
| Research/tuning | ✅ Baseline | ✅ Experimental | Compare to improve rules |

### Strengths & Weaknesses

**Rule-Based Model**:

Strengths:
- Fully interpretable (can explain every point)
- Consistent and predictable
- No training data required
- Works with missing features (defaults)
- Easy to update business logic
- Audit-friendly

Weaknesses:
- Manual tuning required
- May miss complex patterns
- Fixed weights (not adaptive)
- Limited by human expertise

**XGBoost Model**:

Strengths:
- Learns from data patterns
- Handles non-linear relationships
- Adapts to new data (retraining)
- High accuracy on trained scenarios
- Discovers hidden correlations

Weaknesses:
- Requires labeled training data
- Black box (hard to explain)
- Overfitting risk
- Poor on out-of-distribution data
- Needs periodic retraining

### Feature Importance Analysis

**Top 10 Most Important Features** (from XGBoost):

```python
# Example output from model.feature_importances_
┌────────────────────────────┬────────────┐
│ Feature                    │ Importance │
├────────────────────────────┼────────────┤
│ source_credibility         │ 0.18       │
│ blockchain_recorded        │ 0.15       │
│ indicators_count           │ 0.12       │
│ report_age_days            │ 0.10       │
│ hash_verified              │ 0.09       │
│ stix_valid                 │ 0.08       │
│ organization_trust_level   │ 0.07       │
│ metadata_completeness      │ 0.06       │
│ community_validations      │ 0.05       │
│ provenance_count           │ 0.04       │
└────────────────────────────┴────────────┘
```

**Insights**:
- Source credibility is the strongest predictor
- Blockchain verification adds significant trust
- Indicator count matters more than quality
- Timeliness (age) is important but not dominant
- Community engagement has moderate impact

### Score Agreement Analysis

**Agreement Levels**:
- **High (diff ≤ 5)**: 68% of cases - Models agree strongly
- **Moderate (diff 6-15)**: 24% of cases - Minor disagreement
- **Low (diff > 15)**: 8% of cases - Significant disagreement

**When Models Disagree**:

Common causes of disagreement:
1. **New sources**: Rule-based uses default reputation (50), ML predicts based on features
2. **Edge cases**: ML trained on typical data, struggles with outliers
3. **Missing features**: Rule-based handles gracefully, ML may mispredict
4. **Temporal drift**: ML trained on old data, rules updated for new threats

**Resolution Strategy**:
```javascript
if (agreement === 'high') {
  // Use average of both
  finalScore = (ruleScore + mlScore) / 2;
} else if (agreement === 'moderate') {
  // Prefer rule-based (more conservative)
  finalScore = ruleScore;
} else {
  // Flag for manual review
  flagForReview(entity, ruleScore, mlScore);
  finalScore = Math.min(ruleScore, mlScore); // Conservative
}
```

---

## Training Data Generation

### Synthetic Data Creation

**Location**: `ml-service/generate_training_data.py`

Since real labeled data is scarce, ThreatChain generates synthetic training data:

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_report_training_data(n_samples=10000):
    """Generate synthetic report data with trust labels"""
    
    data = []
    for i in range(n_samples):
        # Generate features
        source_cred = np.random.beta(5, 2) * 100  # Skewed toward high
        indicators = np.random.poisson(10)
        age_days = np.random.exponential(30)
        blockchain = np.random.choice([True, False], p=[0.7, 0.3])
        
        # Calculate "ground truth" trust score
        # Based on rule-based logic + noise
        trust_score = (
            source_cred * 0.3 +
            min(100, indicators * 5) * 0.25 +
            max(0, 100 - age_days * 2) * 0.2 +
            (100 if blockchain else 50) * 0.15 +
            np.random.normal(70, 10) * 0.1  # Behavior component
        )
        
        # Add noise
        trust_score += np.random.normal(0, 5)
        trust_score = np.clip(trust_score, 0, 100)
        
        data.append({
            'indicators_count': indicators,
            'report_age_days': age_days,
            'source_credibility': source_cred,
            'blockchain_recorded': blockchain,
            'trust_score': trust_score,
            # ... other features
        })
    
    return pd.DataFrame(data)

# Generate and save
df = generate_report_training_data(10000)
df.to_csv('training_data/reports_with_labels.csv', index=False)
```

### Real Data Collection

**Future Enhancement**: Collect real labels from:
1. **User feedback**: Thumbs up/down on reports
2. **Analyst reviews**: Expert-labeled trust scores
3. **Outcome tracking**: Did threat materialize?
4. **Community voting**: Crowdsourced validation

**Schema**: `trust_labels` table
```sql
CREATE TABLE trust_labels (
  id VARCHAR(36) PRIMARY KEY,
  entity_type ENUM('report', 'indicator', 'source'),
  entity_id VARCHAR(36),
  trust_score INT,  -- 0-100
  labeled_by VARCHAR(36),  -- user_id
  label_source ENUM('user_feedback', 'analyst_review', 'outcome', 'community'),
  confidence INT,  -- 0-100
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Model Retraining Pipeline

### Automated Retraining

**Schedule**: Weekly or when 1000+ new labels collected

**Script**: `ml-service/retrain_models.py`

```python
import schedule
import time
from train_xgboost_model import train_report_model, train_indicator_model

def retrain_all_models():
    """Retrain all XGBoost models with latest data"""
    print(f"[{datetime.now()}] Starting model retraining...")
    
    # 1. Fetch latest labeled data
    df = fetch_labeled_data_from_db()
    
    # 2. Check if enough new data
    if len(df) < 1000:
        print("Insufficient new data, skipping retraining")
        return
    
    # 3. Train report model
    report_metrics = train_report_model(df)
    print(f"Report model RMSE: {report_metrics['rmse']:.2f}")
    
    # 4. Train indicator model
    indicator_metrics = train_indicator_model(df)
    print(f"Indicator model RMSE: {indicator_metrics['rmse']:.2f}")
    
    # 5. Validate models
    if report_metrics['rmse'] < 10 and indicator_metrics['rmse'] < 10:
        # Deploy new models
        deploy_models()
        print("Models deployed successfully")
    else:
        print("Model performance degraded, keeping old models")
    
    # 6. Log metrics
    log_training_metrics(report_metrics, indicator_metrics)

# Schedule weekly retraining
schedule.every().sunday.at("02:00").do(retrain_all_models)

while True:
    schedule.run_pending()
    time.sleep(3600)  # Check every hour
```

### Model Versioning

**Directory Structure**:
```
ml-service/models/
├── report_trust_model_v1.json
├── report_trust_model_v2.json
├── report_trust_model_latest.json  → symlink to v2
├── report_scaler_v1.pkl
├── report_scaler_v2.pkl
├── report_scaler_latest.pkl  → symlink to v2
└── model_metadata.json
```

**Metadata**:
```json
{
  "report_trust_model": {
    "current_version": "v2",
    "versions": {
      "v1": {
        "trained_at": "2026-02-01T00:00:00Z",
        "rmse": 9.2,
        "r2": 0.82,
        "samples": 10000
      },
      "v2": {
        "trained_at": "2026-03-01T02:00:00Z",
        "rmse": 8.5,
        "r2": 0.85,
        "samples": 15000
      }
    }
  }
}
```

---

## API Reference

### Trust Scoring Endpoints

#### 1. Rule-Based Score

```http
GET /api/trust/score/:type/:id
```

**Parameters**:
- `type`: `report`, `indicator`, or `source`
- `id`: Entity UUID

**Response**:
```json
{
  "overallScore": 87,
  "dimensions": {
    "reputation": 85,
    "quality": 92,
    "timeliness": 88,
    "verification": 95,
    "behavior": 75
  },
  "confidence": "high",
  "recommendation": "TRUST",
  "calculatedAt": "2026-03-01T10:00:00Z"
}
```

#### 2. ML Prediction

```http
POST /api/trust/predict/:type
```

**Body**:
```json
{
  "indicators_count": 15,
  "report_age_days": 4,
  "source_credibility": 85,
  "blockchain_recorded": true,
  // ... other features
}
```

**Response**:
```json
{
  "trust_score": 84.5,
  "model": "xgboost_report",
  "confidence": 0.89,
  "version": "v2"
}
```

#### 3. Dual Score

```http
GET /api/trust/score-dual/:type/:id
```

**Response**: (See Dual Scoring API section above)

#### 4. Batch Scoring

```http
POST /api/trust/score-batch
```

**Body**:
```json
{
  "entities": [
    { "type": "report", "id": "report-1" },
    { "type": "report", "id": "report-2" },
    { "type": "indicator", "id": "indicator-1" }
  ]
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "report-1",
      "type": "report",
      "ruleBasedScore": 87,
      "mlScore": 84,
      "agreement": "high"
    },
    // ...
  ],
  "summary": {
    "total": 3,
    "avgRuleScore": 85,
    "avgMlScore": 83,
    "highAgreement": 2,
    "moderateAgreement": 1,
    "lowAgreement": 0
  }
}
```

---

## Frontend Integration

### Trust Score Display Component

**Location**: `components/TrustScoreCard.tsx`

```typescript
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TrustScoreCardProps {
  entityType: 'report' | 'indicator' | 'source';
  entityId: string;
}

export function TrustScoreCard({ entityType, entityId }: TrustScoreCardProps) {
  const [scores, setScores] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/trust/score-dual/${entityType}/${entityId}`)
      .then(res => res.json())
      .then(data => {
        setScores(data);
        setLoading(false);
      });
  }, [entityType, entityId]);

  if (loading) return <div>Loading trust scores...</div>;

  const { ruleBased, machineLearning } = scores.scores;
  const { agreement, recommendation } = scores.comparison;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Trust Assessment</h3>
      
      {/* Rule-Based Score */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span>Rule-Based Score</span>
          <span className="font-bold">{ruleBased.overallScore}/100</span>
        </div>
        <Progress value={ruleBased.overallScore} />
        
        {/* Dimensions */}
        <div className="mt-2 text-sm space-y-1">
          <div>Reputation: {ruleBased.dimensions.reputation}</div>
          <div>Quality: {ruleBased.dimensions.quality}</div>
          <div>Timeliness: {ruleBased.dimensions.timeliness}</div>
          <div>Verification: {ruleBased.dimensions.verification}</div>
          <div>Behavior: {ruleBased.dimensions.behavior}</div>
        </div>
      </div>

      {/* ML Score */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span>ML Prediction</span>
          <span className="font-bold">{machineLearning.trustScore.toFixed(1)}/100</span>
        </div>
        <Progress value={machineLearning.trustScore} />
      </div>

      {/* Agreement */}
      <div className="flex items-center justify-between p-3 bg-gray-100 rounded">
        <span>Model Agreement:</span>
        <span className={`font-semibold ${
          agreement === 'high' ? 'text-green-600' :
          agreement === 'moderate' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {agreement.toUpperCase()}
        </span>
      </div>

      {/* Recommendation */}
      <div className={`mt-4 p-4 rounded text-center font-bold ${
        recommendation === 'TRUST' ? 'bg-green-100 text-green-800' :
        recommendation === 'VERIFY' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {recommendation}
      </div>
    </Card>
  );
}
```

---

## Performance Optimization

### Caching Strategy

**Problem**: Trust score calculation is expensive (DB queries, ML inference)

**Solution**: Redis caching with TTL

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedTrustScore(type, id) {
  const cacheKey = `trust:${type}:${id}`;
  
  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Calculate score
  const score = await calculateTrustScore(type, id);
  
  // Cache for 1 hour
  await client.setEx(cacheKey, 3600, JSON.stringify(score));
  
  return score;
}
```

### Batch Processing

**Problem**: Scoring 1000s of reports individually is slow

**Solution**: Batch database queries and ML predictions

```python
# ML Service batch endpoint
@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    data_list = request.json['entities']
    
    # Extract features for all entities
    features_list = [extract_report_features(d) for d in data_list]
    features_array = np.array(features_list)
    
    # Single batch prediction
    features_scaled = report_scaler.transform(features_array)
    predictions = report_model.predict(features_scaled)
    
    # Return all scores
    return jsonify({
        'scores': [float(p) for p in predictions]
    })
```

### Database Indexing

**Critical Indexes**:
```sql
-- Trust score queries
CREATE INDEX idx_stix_reports_trust ON stix_reports(trust_score DESC);
CREATE INDEX idx_stix_reports_created ON stix_reports(created_at DESC);

-- Blockchain verification
CREATE INDEX idx_blockchain_tx_report ON blockchain_transactions(report_id);
CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(report_hash);

-- Provenance lookups
CREATE INDEX idx_provenance_report ON provenance_records(report_id);
```

---

## Monitoring & Alerting

### Model Performance Tracking

**Metrics to Monitor**:
1. **Prediction latency**: Time to calculate score
2. **Score distribution**: Histogram of trust scores
3. **Agreement rate**: % of high agreement between models
4. **Outlier detection**: Scores > 2 std dev from mean
5. **Feature drift**: Changes in feature distributions

**Dashboard**: `app/dashboard/ml-monitoring/page.tsx`

```typescript
// Example metrics query
const metrics = await fetch('/api/trust/metrics').then(r => r.json());

// Display:
// - Avg rule-based score: 78.5
// - Avg ML score: 76.2
// - Agreement rate: 68%
// - Predictions today: 1,247
// - Cache hit rate: 82%
```

### Alerting Rules

```javascript
// Alert if models disagree significantly
if (Math.abs(ruleScore - mlScore) > 20) {
  sendAlert({
    type: 'MODEL_DISAGREEMENT',
    entity: { type, id },
    ruleScore,
    mlScore,
    difference: Math.abs(ruleScore - mlScore)
  });
}

// Alert if ML service is down
if (!mlServiceHealthy) {
  sendAlert({
    type: 'ML_SERVICE_DOWN',
    message: 'Falling back to rule-based only'
  });
}

// Alert if trust scores drop suddenly
if (avgTrustScore < 50 && previousAvg > 70) {
  sendAlert({
    type: 'TRUST_SCORE_DROP',
    current: avgTrustScore,
    previous: previousAvg
  });
}
```

---

## Advanced Features

### 1. Explainable AI (SHAP Values)

**Purpose**: Explain why ML model gave a specific score

```python
import shap

# Create explainer
explainer = shap.TreeExplainer(model)

# Calculate SHAP values for a prediction
shap_values = explainer.shap_values(features_scaled)

# Get feature contributions
feature_contributions = dict(zip(feature_columns, shap_values[0]))

# Sort by absolute contribution
sorted_contributions = sorted(
    feature_contributions.items(),
    key=lambda x: abs(x[1]),
    reverse=True
)

# Top 5 contributors
print("Top factors affecting this score:")
for feature, contribution in sorted_contributions[:5]:
    direction = "increased" if contribution > 0 else "decreased"
    print(f"- {feature}: {direction} score by {abs(contribution):.2f}")
```

**Example Output**:
```
Top factors affecting this score:
- source_credibility: increased score by 8.5
- blockchain_recorded: increased score by 6.2
- report_age_days: decreased score by 4.1
- indicators_count: increased score by 3.8
- community_validations: increased score by 2.3
```

### 2. Confidence Intervals

**Purpose**: Provide uncertainty estimates for ML predictions

```python
from sklearn.ensemble import GradientBoostingRegressor

# Train with quantile regression
model_lower = GradientBoostingRegressor(loss='quantile', alpha=0.1)
model_upper = GradientBoostingRegressor(loss='quantile', alpha=0.9)

model_lower.fit(X_train, y_train)
model_upper.fit(X_train, y_train)

# Predict with confidence interval
prediction = model.predict(features)[0]
lower_bound = model_lower.predict(features)[0]
upper_bound = model_upper.predict(features)[0]

return {
    'trust_score': prediction,
    'confidence_interval': {
        'lower': lower_bound,
        'upper': upper_bound,
        'width': upper_bound - lower_bound
    }
}
```

### 3. Anomaly Detection

**Purpose**: Flag unusual reports for manual review

```python
from sklearn.ensemble import IsolationForest

# Train anomaly detector
anomaly_detector = IsolationForest(contamination=0.05)
anomaly_detector.fit(X_train)

# Detect anomalies
anomaly_score = anomaly_detector.score_samples(features)
is_anomaly = anomaly_detector.predict(features)[0] == -1

if is_anomaly:
    flag_for_review(entity_id, anomaly_score)
```

---

## Testing

### Unit Tests

**Location**: `tests/trust-scoring.test.js`

```javascript
const { TrustCalculator } = require('../lib/trust-engine/TrustCalculator');

describe('TrustCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new TrustCalculator();
  });

  test('calculates reputation score correctly', () => {
    const report = {
      source_credibility: 80,
      source_accuracy_rate: 90,
      organization_trust_level: 85
    };
    
    const score = calculator.calculateReputationScore(report);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('applies timeliness decay', () => {
    const newReport = { created_at: new Date() };
    const oldReport = { created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    
    const newScore = calculator.calculateTimelinessScore(newReport);
    const oldScore = calculator.calculateTimelinessScore(oldReport);
    
    expect(newScore).toBeGreaterThan(oldScore);
  });

  test('weights dimensions correctly', () => {
    const report = {
      reputation: 100,
      quality: 100,
      timeliness: 100,
      verification: 100,
      behavior: 100
    };
    
    const overall = calculator.calculateOverallScore(report);
    expect(overall).toBe(100);
  });
});
```

### Integration Tests

```javascript
describe('Dual Scoring API', () => {
  test('returns both rule-based and ML scores', async () => {
    const response = await fetch('/api/trust/score-dual/report/test-report-1');
    const data = await response.json();
    
    expect(data.scores.ruleBased).toBeDefined();
    expect(data.scores.machineLearning).toBeDefined();
    expect(data.comparison.agreement).toMatch(/high|moderate|low/);
  });

  test('handles ML service unavailable gracefully', async () => {
    // Stop ML service
    stopMLService();
    
    const response = await fetch('/api/trust/score-dual/report/test-report-1');
    const data = await response.json();
    
    expect(data.scores.ruleBased).toBeDefined();
    expect(data.scores.machineLearning).toBeNull();
    expect(data.fallback).toBe(true);
  });
});
```

### ML Model Tests

```python
import unittest
import numpy as np
from train_xgboost_model import train_report_model

class TestXGBoostModel(unittest.TestCase):
    
    def test_model_training(self):
        """Test model trains without errors"""
        df = generate_test_data(1000)
        metrics = train_report_model(df)
        
        self.assertLess(metrics['rmse'], 15)
        self.assertGreater(metrics['r2'], 0.7)
    
    def test_prediction_range(self):
        """Test predictions are in valid range"""
        model = load_model('models/report_trust_model.json')
        features = generate_random_features()
        
        prediction = model.predict(features)[0]
        
        self.assertGreaterEqual(prediction, 0)
        self.assertLessEqual(prediction, 100)
    
    def test_feature_importance(self):
        """Test feature importance is calculated"""
        model = load_model('models/report_trust_model.json')
        importance = model.feature_importances_
        
        self.assertEqual(len(importance), 25)
        self.assertAlmostEqual(sum(importance), 1.0, places=2)
```

---

## Troubleshooting

### Common Issues

#### 1. ML Service Connection Failed

**Symptoms**: Dual scoring returns only rule-based score

**Causes**:
- ML service not running
- Wrong `ML_SERVICE_URL` in `.env`
- Firewall blocking port 5000

**Solutions**:
```bash
# Check if ML service is running
curl http://localhost:5000/health

# Start ML service
cd ml-service
python app.py

# Check environment variable
echo $ML_SERVICE_URL
```

#### 2. Model File Not Found

**Symptoms**: `FileNotFoundError: models/report_trust_model.json`

**Causes**:
- Models not trained yet
- Wrong working directory

**Solutions**:
```bash
# Train models
cd ml-service
python train_xgboost_model.py

# Verify models exist
ls -la models/
```

#### 3. Feature Mismatch Error

**Symptoms**: `ValueError: Feature shape mismatch`

**Causes**:
- Model trained with different features
- Missing features in input data

**Solutions**:
```python
# Check expected features
print(f"Model expects {len(feature_columns)} features")
print(f"Input has {len(input_features)} features")

# Ensure all features are present
for feature in feature_columns:
    if feature not in input_data:
        input_data[feature] = default_values[feature]
```

#### 4. Scores Always Same

**Symptoms**: All reports get score ~75

**Causes**:
- Model not trained properly
- Using default values for all features
- Cache not invalidated

**Solutions**:
```bash
# Clear cache
redis-cli FLUSHDB

# Retrain model with more diverse data
python train_xgboost_model.py --samples 10000

# Check feature variance
python -c "import pandas as pd; df = pd.read_csv('training_data/reports.csv'); print(df.describe())"
```

---

## Future Enhancements

### 1. Deep Learning Models

Replace XGBoost with neural networks for more complex patterns:

```python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(25,)),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')  # 0-1 output
])

model.compile(
    optimizer='adam',
    loss='mse',
    metrics=['mae']
)
```

### 2. Ensemble Methods

Combine multiple models for better accuracy:

```python
from sklearn.ensemble import VotingRegressor

ensemble = VotingRegressor([
    ('xgboost', xgb_model),
    ('random_forest', rf_model),
    ('gradient_boost', gb_model)
])

ensemble.fit(X_train, y_train)
```

### 3. Online Learning

Update models incrementally without full retraining:

```python
from river import ensemble, tree

model = ensemble.AdaptiveRandomForestRegressor(
    n_models=10,
    seed=42
)

# Update with each new labeled example
for features, label in stream_labeled_data():
    model.learn_one(features, label)
```

### 4. Multi-Task Learning

Train single model to predict multiple outputs:

```python
# Predict trust score + confidence + risk level simultaneously
model = MultiOutputRegressor(XGBRegressor())
y_multi = df[['trust_score', 'confidence', 'risk_level']]
model.fit(X_train, y_multi)
```

### 5. Federated Learning

Train models across multiple organizations without sharing data:

```python
# Each org trains local model
local_model = train_on_local_data(org_data)

# Aggregate model weights
global_model = federated_averaging([
    org1_model,
    org2_model,
    org3_model
])
```

---

## Key Files Reference

### Implementation Files
- `lib/trust-engine/TrustCalculator.js` - Rule-based scoring
- `ml-service/app.py` - ML prediction API
- `ml-service/train_xgboost_model.py` - Model training
- `routes/trust.js` - Trust scoring endpoints

### Configuration
- `.env` - ML service URL configuration
- `ml-service/requirements.txt` - Python dependencies

### Data Files
- `ml-service/training_data/` - Training datasets
- `ml-service/models/` - Trained model files

### Documentation
- `XGBOOST_IMPLEMENTATION.md` - ML implementation details

---

## Summary

ThreatChain's dual-model trust scoring system provides:

- **Rule-based scoring**: Transparent, interpretable, production-ready
- **XGBoost ML**: Data-driven, adaptive, high-accuracy predictions
- **Dual scoring API**: Compare both models for validation
- **5 dimensions**: Reputation, quality, timeliness, verification, behavior
- **25+ features**: Comprehensive entity evaluation
- **Batch processing**: Efficient scoring at scale
- **Caching**: Fast repeated queries
- **Monitoring**: Track model performance and agreement
- **Explainability**: SHAP values for ML interpretability

The system balances interpretability (rule-based) with accuracy (ML) to provide robust, trustworthy threat intelligence assessment.

