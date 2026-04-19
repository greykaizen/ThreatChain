import os
import json
import joblib
import pandas as pd
from supabase import create_client, Client

# Initialize Supabase Client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SECRET_KEY") # We need secret key for background writes
supabase: Client = create_client(url, key)

# Load Models (cached in memory)
MODELS_DIR = os.path.join(os.getcwd(), "models")
models = {
    "abuse_score": joblib.load(os.path.join(MODELS_DIR, "xgboost_abuse_score.pkl")),
    "confidence": joblib.load(os.path.join(MODELS_DIR, "xgboost_confidence.pkl")),
    "auto_block": joblib.load(os.path.join(MODELS_DIR, "xgboost_auto_block.pkl")),
    "scaler": joblib.load(os.path.join(MODELS_DIR, "scaler.pkl")),
}

def handler(request):
    try:
        body = json.loads(request.body)
        features = body.get("features", {})
        entity_id = body.get("entity_id")
        entity_type = body.get("entity_type", "report")

        # 1. Preprocess Features
        df = pd.DataFrame([features])
        scaled_features = models["scaler"].transform(df)

        # 2. Run Predictions
        abuse_score = float(models["abuse_score"].predict(scaled_features)[0])
        confidence = float(models["confidence"].predict(scaled_features)[0])
        auto_block = bool(models["auto_block"].predict(scaled_features)[0])

        # 3. Save to Supabase
        prediction_data = {
            "entity_id": entity_id,
            "entity_type": entity_type,
            "predicted_abuse_score": abuse_score,
            "predicted_confidence": confidence,
            "predicted_auto_blocked": auto_block,
            "model_version": "1.0.0",
        }
        
        supabase.table("ml_predictions").insert(prediction_data).execute()

        return {
            "statusCode": 200,
            "body": json.dumps(prediction_data)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
