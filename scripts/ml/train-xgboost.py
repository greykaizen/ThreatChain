import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import json
import os
import sys
from datetime import datetime
import traceback

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class XGBoostTrainer:
    def __init__(self):
        self.models = {}
        self.preprocessors = {}
        self.feature_importances = {}
        self.scaler = None
        self.label_encoders = {}
        self.data_path = './data/ml/'
        self.model_path = './models/'
        self.report_path = './reports/'
        
        # Create directories if they don't exist
        os.makedirs(self.model_path, exist_ok=True)
        os.makedirs(self.report_path, exist_ok=True)
        
        # Model configurations
        self.model_configs = {
            'abuse_score': {
                'target': 'target_abuse_score',
                'model_type': 'regression',
                'objective': 'reg:squarederror',
                'params': {
                    'n_estimators': 200,
                    'max_depth': 6,
                    'learning_rate': 0.05,
                    'subsample': 0.8,
                    'colsample_bytree': 0.8,
                    'min_child_weight': 3,
                    'gamma': 0.1,
                    'reg_alpha': 0.1,
                    'reg_lambda': 1.0,
                    'random_state': 42
                }
            },
            'auto_block': {
                'target': 'target_auto_blocked',
                'model_type': 'classification',
                'objective': 'binary:logistic',
                'params': {
                    'n_estimators': 150,
                    'max_depth': 5,
                    'learning_rate': 0.1,
                    'subsample': 0.8,
                    'colsample_bytree': 0.8,
                    'scale_pos_weight': 1.0,
                    'random_state': 42
                }
            },
            'confidence': {
                'target': 'target_confidence',
                'model_type': 'regression',
                'objective': 'reg:squarederror',
                'params': {
                    'n_estimators': 250,
                    'max_depth': 7,
                    'learning_rate': 0.03,
                    'subsample': 0.9,
                    'colsample_bytree': 0.9,
                    'random_state': 42
                }
            }
        }
    
    def load_data(self):
        """Load training data from CSV files"""
        print("🔍 Loading training data...")
        
        try:
            # Load the training data
            train_df = pd.read_csv(os.path.join(self.data_path, 'train.csv'))
            validation_df = pd.read_csv(os.path.join(self.data_path, 'validation.csv'))
            test_df = pd.read_csv(os.path.join(self.data_path, 'test.csv'))
            
            print(f"📊 Train set shape: {train_df.shape}")
            print(f"📊 Validation set shape: {validation_df.shape}")
            print(f"📊 Test set shape: {test_df.shape}")
            
            # Identify feature columns (excluding target columns and ID)
            feature_columns = [col for col in train_df.columns 
                              if not col.startswith('target_') and col != 'id']
            
            # Separate features and targets
            X_train = train_df[feature_columns]
            X_val = validation_df[feature_columns]
            X_test = test_df[feature_columns]
            
            y_train = {
                'abuse_score': train_df['target_abuse_score'],
                'auto_block': train_df['target_auto_blocked'],
                'confidence': train_df['target_confidence']
            }
            
            y_val = {
                'abuse_score': validation_df['target_abuse_score'],
                'auto_block': validation_df['target_auto_blocked'],
                'confidence': validation_df['target_confidence']
            }
            
            y_test = {
                'abuse_score': test_df['target_abuse_score'],
                'auto_block': test_df['target_auto_blocked'],
                'confidence': test_df['target_confidence']
            }
            
            print("✅ Data loaded successfully!")
            return X_train, X_val, X_test, y_train, y_val, y_test, feature_columns
            
        except Exception as e:
            print(f"❌ Error loading data: {str(e)}")
            print(traceback.format_exc())
            raise e
    
    def preprocess_data(self, X_train, X_val, X_test):
        """Preprocess data for training"""
        print("⚙️  Preprocessing data...")
        
        try:
            # Identify numerical and categorical columns
            numerical_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = X_train.select_dtypes(include=['object']).columns.tolist()
            
            print(f"📊 Numerical columns: {len(numerical_cols)}")
            print(f"📊 Categorical columns: {len(categorical_cols)}")
            
            # Handle categorical columns by encoding them
            X_train_processed = X_train.copy()
            X_val_processed = X_val.copy()
            X_test_processed = X_test.copy()
            
            for col in categorical_cols:
                le = LabelEncoder()
                
                # Fit on training data and transform all sets
                all_values = pd.concat([X_train[col], X_val[col], X_test[col]]).astype(str)
                le.fit(all_values)
                
                X_train_processed[col] = le.transform(X_train[col].astype(str))
                X_val_processed[col] = le.transform(X_val[col].astype(str))
                X_test_processed[col] = le.transform(X_test[col].astype(str))
                
                self.label_encoders[col] = le
            
            # Scale numerical features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train_processed)
            X_val_scaled = self.scaler.transform(X_val_processed)
            X_test_scaled = self.scaler.transform(X_test_processed)
            
            # Convert back to DataFrames to maintain column names
            X_train_final = pd.DataFrame(X_train_scaled, columns=X_train_processed.columns)
            X_val_final = pd.DataFrame(X_val_scaled, columns=X_val_processed.columns)
            X_test_final = pd.DataFrame(X_test_scaled, columns=X_test_processed.columns)
            
            print("✅ Data preprocessing completed!")
            return X_train_final, X_val_final, X_test_final
            
        except Exception as e:
            print(f"❌ Error preprocessing data: {str(e)}")
            print(traceback.format_exc())
            raise e
    
    def train_model(self, X_train, y_train, model_config, model_name):
        """Train a single XGBoost model"""
        print(f"🎯 Training {model_name} model...")
        
        try:
            if model_config['model_type'] == 'regression':
                model = xgb.XGBRegressor(**model_config['params'])
            else:  # classification
                model = xgb.XGBClassifier(**model_config['params'])
            
            # Train the model
            model.fit(X_train, y_train)
            
            print(f"✅ {model_name} model trained successfully!")
            return model
            
        except Exception as e:
            print(f"❌ Error training {model_name} model: {str(e)}")
            print(traceback.format_exc())
            return None
    
    def evaluate_model(self, model, X_test, y_test, model_name, model_type):
        """Evaluate model performance"""
        print(f"📊 Evaluating {model_name} model...")
        
        try:
            y_pred = model.predict(X_test)
            
            metrics = {}
            
            if model_type == 'regression':
                # Regression metrics
                metrics['mse'] = float(mean_squared_error(y_test, y_pred))
                metrics['rmse'] = float(np.sqrt(metrics['mse']))
                metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
                metrics['r2'] = float(r2_score(y_test, y_pred))
                metrics['mape'] = float(np.mean(np.abs((y_test - y_pred) / y_test)) * 100) if not (y_test == 0).any() else float('inf')
                
                print(f"   MSE: {metrics['mse']:.4f}")
                print(f"   RMSE: {metrics['rmse']:.4f}")
                print(f"   MAE: {metrics['mae']:.4f}")
                print(f"   R²: {metrics['r2']:.4f}")
                
            else:  # classification
                # Classification metrics
                metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
                metrics['precision'] = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                metrics['recall'] = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                metrics['f1'] = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                
                # For binary classification, also compute ROC-AUC if possible
                try:
                    y_pred_proba = model.predict_proba(X_test)
                    if y_pred_proba.shape[1] == 2:  # Binary classification
                        metrics['roc_auc'] = float(roc_auc_score(y_test, y_pred_proba[:, 1]))
                    else:  # Multi-class
                        metrics['roc_auc'] = float(roc_auc_score(y_test, y_pred_proba, multi_class='ovr'))
                except:
                    metrics['roc_auc'] = 0.0  # Default if ROC-AUC computation fails
                
                print(f"   Accuracy: {metrics['accuracy']:.4f}")
                print(f"   Precision: {metrics['precision']:.4f}")
                print(f"   Recall: {metrics['recall']:.4f}")
                print(f"   F1-Score: {metrics['f1']:.4f}")
                print(f"   ROC-AUC: {metrics['roc_auc']:.4f}")
            
            return metrics, y_pred
            
        except Exception as e:
            print(f"❌ Error evaluating {model_name} model: {str(e)}")
            print(traceback.format_exc())
            return {}, y_test  # Return empty metrics and original values as fallback
    
    def save_model(self, model, model_name):
        """Save trained model to disk"""
        print(f"💾 Saving {model_name} model...")
        
        try:
            model_filename = os.path.join(self.model_path, f'xgboost_{model_name}.pkl')
            joblib.dump(model, model_filename)
            print(f"✅ {model_name} model saved to {model_filename}")
            
            return model_filename
        except Exception as e:
            print(f"❌ Error saving {model_name} model: {str(e)}")
            print(traceback.format_exc())
            return None
    
    def save_feature_importance(self, model, feature_names, model_name):
        """Save feature importance to disk"""
        print(f"📊 Saving feature importance for {model_name}...")
        
        try:
            if hasattr(model, 'feature_importances_'):
                importance_df = pd.DataFrame({
                    'feature': feature_names,
                    'importance': model.feature_importances_
                }).sort_values('importance', ascending=False)
                
                importance_filename = os.path.join(self.model_path, f'feature_importance_{model_name}.json')
                
                importance_dict = dict(zip(importance_df['feature'], importance_df['importance'].round(4)))
                
                with open(importance_filename, 'w') as f:
                    json.dump(importance_dict, f, indent=2)
                
                print(f"✅ Feature importance for {model_name} saved to {importance_filename}")
                
                self.feature_importances[model_name] = importance_dict
                return importance_filename
            else:
                print(f"⚠️  {model_name} model does not support feature importance")
                return None
                
        except Exception as e:
            print(f"❌ Error saving feature importance for {model_name}: {str(e)}")
            print(traceback.format_exc())
            return None
    
    def run_training(self):
        """Run the complete training pipeline"""
        print("🚀 Starting XGBoost model training pipeline...")
        
        try:
            # Load data
            X_train, X_val, X_test, y_train, y_val, y_test, feature_columns = self.load_data()
            
            # Preprocess data
            X_train_proc, X_val_proc, X_test_proc = self.preprocess_data(X_train, X_val, X_test)
            
            # Train and evaluate models
            training_results = {}
            
            for model_name, config in self.model_configs.items():
                target_col = config['target']
                model_type = config['model_type']
                
                print(f"\n{'='*50}")
                print(f"Training {model_name.upper()} Model")
                print(f"Target: {target_col}")
                print(f"Type: {model_type}")
                print(f"{'='*50}")
                
                # Train model
                model = self.train_model(X_train_proc, y_train[model_name], config, model_name)
                
                if model is not None:
                    # Evaluate model
                    metrics, y_pred = self.evaluate_model(model, X_test_proc, y_test[model_name], model_name, model_type)
                    
                    # Save model
                    model_path = self.save_model(model, model_name)
                    
                    # Save feature importance
                    importance_path = self.save_feature_importance(model, X_train_proc.columns.tolist(), model_name)
                    
                    # Store results
                    training_results[model_name] = {
                        'model_path': model_path,
                        'importance_path': importance_path,
                        'metrics': metrics,
                        'config': config
                    }
                    
                    self.models[model_name] = model
                else:
                    print(f"❌ Failed to train {model_name} model")
            
            # Save preprocessing components
            if self.scaler is not None:
                scaler_path = os.path.join(self.model_path, 'scaler.pkl')
                joblib.dump(self.scaler, scaler_path)
                print(f"✅ Scaler saved to {scaler_path}")
            
            if self.label_encoders:
                encoders_path = os.path.join(self.model_path, 'encoders.pkl')
                joblib.dump(self.label_encoders, encoders_path)
                print(f"✅ Label encoders saved to {encoders_path}")
            
            # Generate training report
            self.generate_training_report(training_results)
            
            print("\n🎉 Training pipeline completed successfully!")
            return training_results
            
        except Exception as e:
            print(f"❌ Training pipeline failed: {str(e)}")
            print(traceback.format_exc())
            raise e
    
    def generate_training_report(self, training_results):
        """Generate a comprehensive training report"""
        print("📝 Generating training report...")
        
        try:
            report = {
                'generated_at': datetime.now().isoformat(),
                'model_configs': {name: config['config'] for name, config in training_results.items()},
                'performance_metrics': {name: result['metrics'] for name, result in training_results.items()},
                'model_paths': {name: result['model_path'] for name, result in training_results.items()},
                'importance_paths': {name: result['importance_path'] for name, result in training_results.items()},
                'summary': {
                    'total_models_trained': len(training_results),
                    'models_with_good_performance': 0,  # Will calculate based on thresholds
                }
            }
            
            # Calculate summary metrics
            good_perf_count = 0
            for model_name, result in training_results.items():
                metrics = result['metrics']
                if result['config']['model_type'] == 'regression':
                    # For regression, consider R² > 0.5 as good performance
                    if 'r2' in metrics and metrics['r2'] > 0.5:
                        good_perf_count += 1
                else:  # classification
                    # For classification, consider accuracy > 0.7 as good performance
                    if 'accuracy' in metrics and metrics['accuracy'] > 0.7:
                        good_perf_count += 1
            
            report['summary']['models_with_good_performance'] = good_perf_count
            
            # Save report
            report_path = os.path.join(self.report_path, 'training_report.json')
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            print(f"✅ Training report saved to {report_path}")
            
            # Print summary
            print(f"\n📊 Training Summary:")
            print(f"   Total models trained: {report['summary']['total_models_trained']}")
            print(f"   Models with good performance: {report['summary']['models_with_good_performance']}")
            
            for model_name, result in training_results.items():
                print(f"   {model_name.upper()}:")
                for metric_name, metric_value in result['metrics'].items():
                    print(f"     {metric_name}: {metric_value:.4f}")
            
            return report_path
            
        except Exception as e:
            print(f"❌ Error generating training report: {str(e)}")
            print(traceback.format_exc())
            return None

if __name__ == "__main__":
    trainer = XGBoostTrainer()
    results = trainer.run_training()