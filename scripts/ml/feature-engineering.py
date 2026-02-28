import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
import json
import os
import sys

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class FeatureEngineering:
    def __init__(self, input_dir='./data/ml/', output_dir='./data/ml/'):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.scaler = StandardScaler()
        self.encoders = {}
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
    
    def load_data(self, filename='training_data.csv'):
        """Load the raw training data"""
        print(f"🔍 Loading data from {os.path.join(self.input_dir, filename)}...")
        
        try:
            df = pd.read_csv(os.path.join(self.input_dir, filename))
            print(f"📊 Loaded {df.shape[0]} rows and {df.shape[1]} columns")
            return df
        except Exception as e:
            print(f"❌ Error loading data: {str(e)}")
            raise e
    
    def create_engineered_features(self, df):
        """Create engineered features based on the strategy in the plan"""
        print("⚙️ Creating engineered features...")
        
        df_engineered = df.copy()
        
        # 1. Ratio Features
        print("   Creating ratio features...")
        
        # VT detection rate: vt_detections / total_reports
        df_engineered['vt_detection_rate'] = df['total_reports'].apply(
            lambda x: df.loc[df['total_reports'] == x, 'vt_detections'].iloc[0] / (x + 1) 
            if x in df['total_reports'].values else 0
        )
        df_engineered['vt_detection_rate'] = df['vt_detections'] / (df['total_reports'] + 1)
        
        # Threat density: (abuse_score * total_reports) / 100
        df_engineered['threat_density'] = (df['abuse_score'] * df['total_reports']) / 100
        
        # Confidence abuse ratio: confidence / abuse_score
        df_engineered['confidence_abuse_ratio'] = df['confidence'] / (df['abuse_score'] + 1)
        
        # 2. Interaction Features
        print("   Creating interaction features...")
        
        # High confidence high abuse: (confidence > 80) AND (abuse_score > 80)
        df_engineered['high_confidence_high_abuse'] = (
            (df['confidence'] > 80) & (df['abuse_score'] > 80)
        ).astype(int)
        
        # Verified but suspicious: verified_identity AND suspicious_isp
        df_engineered['verified_but_suspicious'] = (
            (df['verified_identity'] == 1) & (df['suspicious_isp'] == 1)
        ).astype(int)
        
        # Detection signal count: sum of all boolean detection signals
        detection_signals = [
            'signal_abuse_reports', 'signal_vt_detections', 'signal_threatfox', 
            'signal_suspicious_infra', 'signal_behavioral'
        ]
        
        df_engineered['detection_signal_count'] = df[detection_signals].sum(axis=1)
        
        # 3. Polynomial features for important numerical features
        print("   Creating polynomial features...")
        
        # Square of important features
        df_engineered['total_reports_squared'] = df['total_reports'] ** 2
        df_engineered['vt_detections_squared'] = df['vt_detections'] ** 2
        df_engineered['abuse_score_squared'] = df['abuse_score'] ** 2
        
        # Log transformations (with offset to handle zeros)
        df_engineered['total_reports_log'] = np.log(df['total_reports'] + 1)
        df_engineered['vt_detections_log'] = np.log(df['vt_detections'] + 1)
        df_engineered['abuse_score_log'] = np.log(df['abuse_score'] + 1)
        
        # 4. Binning features
        print("   Creating binned features...")
        
        # Total reports bins
        df_engineered['total_reports_bin'] = pd.cut(
            df['total_reports'], 
            bins=[-1, 10, 50, 100, 500, float('inf')], 
            labels=['very_low', 'low', 'medium', 'high', 'very_high']
        ).astype(str)
        
        # VT detections bins
        df_engineered['vt_detections_bin'] = pd.cut(
            df['vt_detections'], 
            bins=[-1, 1, 3, 5, 10, float('inf')], 
            labels=['very_low', 'low', 'medium', 'high', 'very_high']
        ).astype(str)
        
        # 5. Statistical aggregations (grouped by categorical features)
        print("   Creating statistical features...")
        
        # Calculate mean values by categorical features
        categorical_features = ['usage_type', 'country_code', 'threat_category', 'infrastructure_type']
        
        for cat_feature in categorical_features:
            if cat_feature in df.columns:
                # Mean of important numerical features by category
                means = df.groupby(cat_feature)['abuse_score'].mean()
                df_engineered[f'{cat_feature}_avg_abuse_score'] = df[cat_feature].map(means).fillna(df['abuse_score'].mean())
                
                means = df.groupby(cat_feature)['confidence'].mean()
                df_engineered[f'{cat_feature}_avg_confidence'] = df[cat_feature].map(means).fillna(df['confidence'].mean())
        
        print(f"✅ Created {df_engineered.shape[1] - df.shape[1]} new engineered features")
        print(f"📊 Total features now: {df_engineered.shape[1]}")
        
        return df_engineered
    
    def handle_missing_values(self, df):
        """Handle missing values in the dataset"""
        print("🔧 Handling missing values...")
        
        # Separate numerical and categorical columns
        numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        print(f"   Numerical columns: {len(numerical_cols)}")
        print(f"   Categorical columns: {len(categorical_cols)}")
        
        df_cleaned = df.copy()
        
        # Handle numerical columns
        for col in numerical_cols:
            if df_cleaned[col].isna().any():
                # Fill with median (more robust than mean)
                median_val = df_cleaned[col].median()
                df_cleaned[col].fillna(median_val, inplace=True)
                print(f"      Filled {df_cleaned[col].isna().sum()} missing values in {col} with median ({median_val})")
        
        # Handle categorical columns
        for col in categorical_cols:
            if df_cleaned[col].isna().any():
                # Fill with 'unknown' category
                df_cleaned[col].fillna('unknown', inplace=True)
                print(f"      Filled {df_cleaned[col].isna().sum()} missing values in {col} with 'unknown'")
        
        return df_cleaned
    
    def encode_categorical_features(self, df):
        """Encode categorical features using appropriate methods"""
        print("🏷️ Encoding categorical features...")
        
        df_encoded = df.copy()
        
        # Identify categorical columns
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        for col in categorical_cols:
            if col.startswith('target_') or col == 'id':  # Skip target and ID columns
                continue
                
            unique_vals = df[col].nunique()
            total_vals = len(df[col])
            
            print(f"   Processing {col}: {unique_vals} unique values out of {total_vals}")
            
            if unique_vals <= 10:  # Use label encoding for low cardinality
                print(f"      Using label encoding for {col}")
                le = LabelEncoder()
                
                # Handle unknown categories in test data
                le.fit(df[col].astype(str))
                df_encoded[col] = le.transform(df[col].astype(str))
                
                self.encoders[col] = {
                    'type': 'label',
                    'encoder': le
                }
            else:  # Use target encoding for high cardinality (simplified version)
                print(f"      Using simple frequency encoding for {col} (high cardinality)")
                # Simple frequency encoding as a substitute for target encoding
                freq_map = df[col].value_counts().to_dict()
                df_encoded[col] = df[col].map(freq_map).fillna(0)
                
                self.encoders[col] = {
                    'type': 'frequency',
                    'mapping': freq_map
                }
        
        return df_encoded
    
    def scale_features(self, df, fit_scaler=True):
        """Scale numerical features"""
        print("⚖️ Scaling numerical features...")
        
        # Identify numerical columns (excluding target columns and ID)
        numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        exclude_cols = [col for col in numerical_cols if col.startswith('target_')]
        if 'id' in numerical_cols:
            exclude_cols.append('id')
        
        scale_cols = [col for col in numerical_cols if col not in exclude_cols]
        
        print(f"   Scaling {len(scale_cols)} numerical columns")
        
        df_scaled = df.copy()
        
        if fit_scaler:
            # Fit and transform for training data
            scaled_values = self.scaler.fit_transform(df[scale_cols])
        else:
            # Transform only for test data
            scaled_values = self.scaler.transform(df[scale_cols])
        
        # Put scaled values back into dataframe
        df_scaled[scale_cols] = scaled_values
        
        return df_scaled
    
    def save_encoders_and_scaler(self):
        """Save encoders and scaler for later use"""
        print("💾 Saving encoders and scaler...")
        
        # Save encoders
        encoders_dict = {}
        for col, enc_info in self.encoders.items():
            if enc_info['type'] == 'label':
                encoders_dict[col] = {
                    'type': 'label',
                    'classes': enc_info['encoder'].classes_.tolist()
                }
            else:  # frequency encoding
                encoders_dict[col] = {
                    'type': 'frequency',
                    'mapping': enc_info['mapping']
                }
        
        encoders_path = os.path.join(self.output_dir, 'feature_encoders.json')
        with open(encoders_path, 'w') as f:
            json.dump(encoders_dict, f, indent=2, default=str)
        print(f"   Encoders saved to {encoders_path}")
        
        # Save scaler info
        scaler_info = {
            'feature_names': self.scaler.feature_names_in_.tolist() if hasattr(self.scaler, 'feature_names_in_') else [],
            'mean': self.scaler.mean_.tolist() if hasattr(self.scaler, 'mean_') else [],
            'scale': self.scaler.scale_.tolist() if hasattr(self.scaler, 'scale_') else []
        }
        
        scaler_path = os.path.join(self.output_dir, 'feature_scaler.json')
        with open(scaler_path, 'w') as f:
            json.dump(scaler_info, f, indent=2)
        print(f"   Scaler info saved to {scaler_path}")
    
    def run_feature_engineering(self, input_filename='training_data.csv', output_filename='engineered_features.csv'):
        """Run the complete feature engineering pipeline"""
        print("🚀 Starting feature engineering pipeline...")
        
        try:
            # Load data
            df = self.load_data(input_filename)
            
            # Handle missing values first
            df = self.handle_missing_values(df)
            
            # Create engineered features
            df = self.create_engineered_features(df)
            
            # Encode categorical features
            df = self.encode_categorical_features(df)
            
            # Scale features
            df = self.scale_features(df, fit_scaler=True)
            
            # Save the engineered dataset
            output_path = os.path.join(self.output_dir, output_filename)
            df.to_csv(output_path, index=False)
            print(f"✅ Engineered features saved to {output_path}")
            
            # Save encoders and scaler
            self.save_encoders_and_scaler()
            
            # Print summary
            print(f"\n📊 Feature Engineering Summary:")
            print(f"   Original features: {df.shape[1]}")
            print(f"   Total samples: {df.shape[0]}")
            
            # Count different types of features
            numerical_features = df.select_dtypes(include=[np.number]).shape[1]
            print(f"   Numerical features: {numerical_features}")
            
            print("\n✅ Feature engineering pipeline completed successfully!")
            
            return df
            
        except Exception as e:
            print(f"❌ Feature engineering pipeline failed: {str(e)}")
            raise e

if __name__ == "__main__":
    fe = FeatureEngineering()
    engineered_df = fe.run_feature_engineering()