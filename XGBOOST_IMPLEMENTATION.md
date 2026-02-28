# XGBoost Trust Scoring Implementation

This document describes the implementation of the XGBoost-based machine learning model working alongside the existing rule-based trust scoring system.

## Overview

The implementation creates a **dual-model trust evaluation system** where:
- Rule-based model continues to serve production traffic (primary)
- XGBoost model runs in parallel for comparison (secondary)
- Dashboard displays both scores with statistical analysis
- Data-driven insights guide future improvements
- Gradual transition possible based on performance metrics

## Directory Structure

```
ThreatChain/
├── lib/trust-engine/           # Trust engine implementation
│   ├── TrustCalculator.js      # Enhanced with dual-model support
│   └── XGBoostPredictor.js     # ML service integration layer
├── ml-service/                 # Python ML microservice
│   ├── app.py                  # Flask server
│   ├── requirements.txt        # Python dependencies
│   └── models/                 # Trained model files (created during training)
├── scripts/
│   ├── ml/
│   │   ├── prepare-dataset.js     # Extract features from STIX JSON
│   │   ├── feature-engineering.py # Create engineered features
│   │   ├── train-xgboost.py       # Train XGBoost models
│   │   ├── validate-model.py      # Model validation
│   │   └── run-ml-pipeline.js     # Complete pipeline runner
│   └── init-ml-tables.js          # Database migration
├── data/ml/                    # ML-ready datasets
│   ├── training_data.csv       # Full dataset
│   ├── train.csv               # Training set (70%)
│   ├── validation.csv          # Validation set (15%)
│   ├── test.csv                # Test set (15%)
│   └── feature_metadata.json   # Feature descriptions
├── models/                     # Trained XGBoost models
├── reports/                    # Training and validation reports
└── routes/trust.js            # Enhanced API routes
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- Python 3.7+
- MySQL database
- Git

### 2. Clone and Install Dependencies

```bash
# Clone the repository (already done)
git clone https://github.com/greykaizen/ThreatChain.git
cd ThreatChain

# Install Node.js dependencies
npm install

# Python dependencies will be installed during ML pipeline
```

### 3. Run the Complete ML Pipeline

Execute the automated pipeline that handles all steps:

```bash
node scripts/run-ml-pipeline.js
```

This will:
1. Extract and prepare dataset from `all_dataset/stix_feed_pretty.json`
2. Perform feature engineering
3. Train XGBoost models (abuse score, auto-block, confidence)
4. Initialize database tables
5. Validate models

### 4. Alternative: Manual Steps

If you prefer to run each step manually:

#### 4.1 Prepare Dataset
```bash
node scripts/ml/prepare-dataset.js
```

#### 4.2 Install Python Dependencies
```bash
pip3 install -r ml-service/requirements.txt
```

#### 4.3 Feature Engineering
```bash
python3 scripts/ml/feature-engineering.py
```

#### 4.4 Train Models
```bash
python3 scripts/ml/train-xgboost.py
```

#### 4.5 Initialize Database Tables
```bash
node scripts/init-ml-tables.js
```

#### 4.6 Validate Models
```bash
python3 scripts/ml/validate-model.py
```

## Running the Services

### 1. Start the ML Service

```bash
./start-ml-service.sh
```

Or manually:
```bash
cd ml-service
python3 app.py
```

### 2. Configure Environment

Ensure your `.env` file has the correct settings:

```env
USE_XGBOOST_MODEL=true
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=5000
```

### 3. Start the Main Server

```bash
npm run backend
# or
node server.js
```

## API Endpoints

### Dual-Model Trust Score
```
GET /api/trust/score-dual/:entityType/:entityId
```

Response:
```json
{
  "success": true,
  "data": {
    "entityType": "report",
    "entityId": "uuid",
    "productionScore": 85.5,
    "ruleBased": {
      "overallScore": 85.5,
      "dimensions": { "reputation": 80, "quality": 90, ... }
    },
    "xgboost": {
      "abuseScore": 88.2,
      "confidence": 92.1,
      "autoBlocked": true,
      "probability": 0.95
    },
    "comparison": {
      "difference": 2.7,
      "percentDifference": 3.16,
      "agreement": true,
      "higherScore": "xgboost"
    }
  }
}
```

### Single Trust Score (Rule-Based Only)
```
GET /api/trust/score/:entityType/:entityId
```

### Model Comparison Statistics
```
GET /api/trust/comparison/stats
```

### Model Performance Metrics
```
GET /api/trust/models/performance
```

### Feature Importance
```
GET /api/trust/ml/feature-importance
```

## Database Tables Added

### `ml_predictions`
Stores XGBoost model predictions with metadata.

### `model_comparison`
Stores comparison between rule-based and XGBoost scores.

### `model_performance_metrics`
Stores model performance metrics over time.

## Key Features

1. **Fallback Mechanism**: If ML service is unavailable, system gracefully falls back to rule-based scoring only
2. **Real-time Comparison**: Both models run in parallel with comparison metrics
3. **Production Safe**: Rule-based model remains primary; XGBoost is secondary for comparison
4. **Extensible Architecture**: Easy to add new ML models or modify existing ones
5. **Comprehensive Monitoring**: Tracks agreement rates, performance metrics, and system health

## Model Types Trained

1. **Abuse Score Regression**: Predicts abuse score (0-100)
2. **Auto-Block Classification**: Predicts whether entity should be auto-blocked
3. **Confidence Score Regression**: Predicts confidence level

## Security Considerations

- All external API calls have timeouts and error handling
- ML service runs on separate port (5001) for isolation
- Input validation on all feature extraction
- Secure environment variable configuration

## Performance Targets

- XGBoost R² score > 0.7
- Agreement rate with rule-based > 70%
- Inference time < 100ms (p95)
- ML service uptime > 99%

## Future Enhancements

- Ensemble model combining rule-based and XGBoost predictions
- Active learning for flagging uncertain cases
- Automated model retraining when performance degrades
- A/B testing framework for new models