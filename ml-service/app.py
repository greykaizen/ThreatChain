from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
import traceback
from datetime import datetime
import sys

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)

# Global model variables
abuse_score_model = None
auto_block_model = None
confidence_model = None
scaler = None
label_encoders = {}

def load_models():
    """Load trained models and preprocessing components"""
    global abuse_score_model, auto_block_model, confidence_model, scaler, label_encoders
    
    print("Loading models...")
    
    try:
        # Load models
        # First try relative to current directory, then relative to parent directory
        model_base_paths = ['./models/', '../models/', '../../models/', os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models/')]
        
        abuse_score_model_path = None
        auto_block_model_path = None
        confidence_model_path = None
        scaler_path = None
        
        for base_path in model_base_paths:
            candidate_abuse = os.path.join(base_path, 'xgboost_abuse_score.pkl')
            candidate_auto = os.path.join(base_path, 'xgboost_auto_block.pkl')
            candidate_conf = os.path.join(base_path, 'xgboost_confidence.pkl')
            candidate_scaler = os.path.join(base_path, 'scaler.pkl')
            
            if os.path.exists(candidate_abuse):
                abuse_score_model_path = candidate_abuse
            if os.path.exists(candidate_auto):
                auto_block_model_path = candidate_auto
            if os.path.exists(candidate_conf):
                confidence_model_path = candidate_conf
            if os.path.exists(candidate_scaler):
                scaler_path = candidate_scaler
                
        # If still not found, use default path
        if abuse_score_model_path is None:
            abuse_score_model_path = './models/xgboost_abuse_score.pkl'
        if auto_block_model_path is None:
            auto_block_model_path = './models/xgboost_auto_block.pkl'
        if confidence_model_path is None:
            confidence_model_path = './models/xgboost_confidence.pkl'
        if scaler_path is None:
            scaler_path = './models/scaler.pkl'
        
        if os.path.exists(abuse_score_model_path):
            abuse_score_model = joblib.load(abuse_score_model_path)
            print("✅ Loaded abuse score model")
        else:
            print("⚠️  Abuse score model not found")
        
        if os.path.exists(auto_block_model_path):
            auto_block_model = joblib.load(auto_block_model_path)
            print("✅ Loaded auto-block model")
        else:
            print("⚠️  Auto-block model not found")
            
        if os.path.exists(confidence_model_path):
            confidence_model = joblib.load(confidence_model_path)
            print("✅ Loaded confidence model")
        else:
            print("⚠️  Confidence model not found")
        
        # Load scaler if it exists
        scaler_path = './models/scaler.pkl'
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print("✅ Loaded scaler")
        else:
            print("⚠️  Scaler not found")
        
        print("✅ All models loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error loading models: {str(e)}")
        print(traceback.format_exc())

def preprocess_features(features_dict):
    """Preprocess features for model prediction"""
    try:
        # Convert to DataFrame
        df = pd.DataFrame([features_dict])
        
        # Handle categorical variables
        categorical_columns = ['usage_type', 'country_code', 'threat_category', 'infrastructure_type']
        
        for col in categorical_columns:
            if col in df.columns:
                # Fill NaN values with 'unknown'
                df[col] = df[col].fillna('unknown')
                
                # Encode categorical variables
                if col in label_encoders:
                    # Use existing encoder
                    le = label_encoders[col]
                    df[col] = le.transform(df[col].astype(str))
                else:
                    # Create new encoder
                    from sklearn.preprocessing import LabelEncoder
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    label_encoders[col] = le
        
        # Handle missing numerical values
        numerical_columns = [
            'total_reports', 'vt_detections', 'abuse_score', 'confidence',
            'threatfox_iocs', 'mitre_confidence', 'asshole_score', 'classification_confidence',
            'reports_to_vt_ratio'
        ]
        
        for col in numerical_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                df[col] = df[col].fillna(df[col].median())
        
        # Handle boolean columns
        boolean_columns = [
            'suspicious_isp', 'young_domain', 'residential_proxy', 'verified_identity',
            'published_ip_ranges', 'signal_abuse_reports', 'signal_vt_detections',
            'signal_threatfox', 'signal_suspicious_infra', 'signal_behavioral',
            'has_ssl_data', 'ssl_port_open'
        ]
        
        for col in boolean_columns:
            if col in df.columns:
                df[col] = df[col].astype(int)
        
        # Apply scaling if scaler exists
        if scaler is not None:
            feature_names = df.columns.tolist()
            df_scaled = scaler.transform(df)
            df = pd.DataFrame(df_scaled, columns=feature_names)
        
        return df
        
    except Exception as e:
        print(f"❌ Error preprocessing features: {str(e)}")
        print(traceback.format_exc())
        return None

@app.route('/ml/predict/trust-score', methods=['POST'])
def predict_trust_score():
    """Main prediction endpoint"""
    start_time = datetime.now()
    
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Extract features
        features = data.get('features', {})
        entity_type = data.get('entity_type', 'unknown')
        entity_id = data.get('entity_id', 'unknown')
        
        if not features:
            return jsonify({
                'success': False,
                'error': 'No features provided'
            }), 400
        
        # Preprocess features
        processed_features = preprocess_features(features)
        if processed_features is None:
            return jsonify({
                'success': False,
                'error': 'Error preprocessing features'
            }), 500
        
        # Prepare response
        predictions = {}
        
        # Predict abuse score if model exists
        if abuse_score_model is not None:
            try:
                abuse_pred = abuse_score_model.predict(processed_features)[0]
                # Clamp to 0-100 scale
                predictions['abuse_score'] = float(np.clip(abuse_pred, 0, 100))
            except Exception as e:
                print(f"⚠️  Error predicting abuse score: {str(e)}")
                predictions['abuse_score'] = 0.0
        else:
            predictions['abuse_score'] = 0.0
        
        # Predict auto-block if model exists
        if auto_block_model is not None:
            try:
                auto_block_pred = auto_block_model.predict(processed_features)[0]
                auto_block_prob = auto_block_model.predict_proba(processed_features)[0]
                predictions['auto_blocked'] = bool(auto_block_pred)
                # Probability is already 0-1; ensure clamped
                predictions['auto_blocked_probability'] = float(np.clip(max(auto_block_prob), 0.0, 1.0))
            except Exception as e:
                print(f"⚠️  Error predicting auto-block: {str(e)}")
                predictions['auto_blocked'] = False
                predictions['auto_blocked_probability'] = 0.0
        else:
            predictions['auto_blocked'] = False
            predictions['auto_blocked_probability'] = 0.0
        
        # Predict confidence if model exists
        if confidence_model is not None:
            try:
                confidence_pred = confidence_model.predict(processed_features)[0]
                # Clamp to 0-100 scale
                predictions['confidence'] = float(np.clip(confidence_pred, 0, 100))
            except Exception as e:
                print(f"⚠️  Error predicting confidence: {str(e)}")
                predictions['confidence'] = 50.0
        else:
            predictions['confidence'] = 50.0
        
        # Calculate inference time
        inference_time = (datetime.now() - start_time).total_seconds() * 1000  # milliseconds
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'feature_importance': {},  # Will be populated if models support it
            'model_version': '1.0.0',
            'inference_time_ms': inference_time,
            'calculated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error in prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Prediction failed'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ML Trust Score Service',
        'models_loaded': {
            'abuse_score': abuse_score_model is not None,
            'auto_block': auto_block_model is not None,
            'confidence': confidence_model is not None
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/ml/status', methods=['GET'])
def ml_status():
    """Detailed ML service status with model info"""
    return jsonify({
        'status': 'online',
        'service': 'ML Trust Score Service',
        'models': {
            'abuse_score':  {'loaded': abuse_score_model  is not None, 'file': 'xgboost_abuse_score.pkl'},
            'auto_block':   {'loaded': auto_block_model   is not None, 'file': 'xgboost_auto_block.pkl'},
            'confidence':   {'loaded': confidence_model   is not None, 'file': 'xgboost_confidence.pkl'},
            'scaler':       {'loaded': scaler             is not None, 'file': 'scaler.pkl'},
        },
        'endpoints': [
            'GET  /health',
            'GET  /ml/status',
            'POST /ml/predict/trust-score',
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/ml/train', methods=['POST'])
def train_model():
    """Training endpoint (placeholder for future implementation)"""
    return jsonify({
        'success': False,
        'message': 'Training endpoint not implemented in this version',
        'note': 'Models should be trained separately and loaded'
    }), 501

if __name__ == '__main__':
    # Load models when starting the service
    load_models()
    
    # Run the Flask app
    port = int(os.environ.get('ML_SERVICE_PORT', 5001))
    print(f"🚀 Starting ML service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)