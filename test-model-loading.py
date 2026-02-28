import os
import sys

print("=" * 60)
print("MODEL LOADING DEBUG")
print("=" * 60)

# Check current directory
print(f"\n1. Current working directory: {os.getcwd()}")

# Check if we're in ml-service
if os.path.basename(os.getcwd()) == 'ml-service':
    print("   ✅ Running from ml-service directory")
else:
    print(f"   ⚠️  Running from: {os.path.basename(os.getcwd())}")

# Check model paths
model_base_paths = [
    './models/',
    '../models/',
    '../../models/',
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models/')
]

print("\n2. Checking model paths:")
for i, base_path in enumerate(model_base_paths, 1):
    abs_path = os.path.abspath(base_path)
    exists = os.path.exists(abs_path)
    print(f"   Path {i}: {abs_path}")
    print(f"           Exists: {exists}")
    if exists:
        files = os.listdir(abs_path)
        pkl_files = [f for f in files if f.endswith('.pkl')]
        print(f"           .pkl files: {len(pkl_files)}")
        for pkl in pkl_files:
            print(f"             - {pkl}")

# Try to load a model
print("\n3. Attempting to load models:")
try:
    import joblib
    
    # Find the correct path
    model_path = None
    for base_path in model_base_paths:
        candidate = os.path.join(base_path, 'xgboost_abuse_score.pkl')
        if os.path.exists(candidate):
            model_path = candidate
            break
    
    if model_path:
        print(f"   Found model at: {model_path}")
        model = joblib.load(model_path)
        print(f"   ✅ Successfully loaded model!")
        print(f"   Model type: {type(model)}")
    else:
        print("   ❌ Could not find xgboost_abuse_score.pkl in any path")
        
except Exception as e:
    print(f"   ❌ Error loading model: {e}")

print("\n" + "=" * 60)
