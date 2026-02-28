import pandas as pd
import numpy as np
import joblib
import json
import os
import sys
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from datetime import datetime
import traceback

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class ModelValidator:
    def __init__(self, model_path='./models/', data_path='./data/ml/', report_path='./reports/'):
        self.model_path = model_path
        self.data_path = data_path
        self.report_path = report_path
        self.models = {}
        
        # Create report directory if it doesn't exist
        os.makedirs(report_path, exist_ok=True)
    
    def load_models(self):
        """Load trained models"""
        print("🔍 Loading trained models...")
        
        model_files = {
            'abuse_score': 'xgboost_abuse_score.pkl',
            'auto_block': 'xgboost_auto_block.pkl',
            'confidence': 'xgboost_confidence.pkl'
        }
        
        for model_name, filename in model_files.items():
            filepath = os.path.join(self.model_path, filename)
            if os.path.exists(filepath):
                try:
                    self.models[model_name] = joblib.load(filepath)
                    print(f"✅ Loaded {model_name} model")
                except Exception as e:
                    print(f"❌ Error loading {model_name} model: {str(e)}")
            else:
                print(f"⚠️ {filename} not found")
    
    def load_test_data(self):
        """Load test dataset"""
        print("🔍 Loading test dataset...")
        
        try:
            test_file = os.path.join(self.data_path, 'test.csv')
            if not os.path.exists(test_file):
                raise FileNotFoundError(f"Test file not found: {test_file}")
            
            df = pd.read_csv(test_file)
            print(f"📊 Loaded test set with {len(df)} samples")
            
            # Identify feature columns (exclude target columns and ID)
            feature_cols = [col for col in df.columns 
                           if not col.startswith('target_') and col != 'id']
            
            X_test = df[feature_cols]
            y_test = {
                'abuse_score': df['target_abuse_score'],
                'auto_block': df['target_auto_blocked'],
                'confidence': df['target_confidence']
            }
            
            print(f"📊 Feature columns: {len(feature_cols)}")
            return X_test, y_test, df
            
        except Exception as e:
            print(f"❌ Error loading test data: {str(e)}")
            print(traceback.format_exc())
            raise e
    
    def validate_regression_model(self, model, X_test, y_test, model_name):
        """Validate regression model"""
        print(f"📊 Validating {model_name} regression model...")
        
        try:
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Calculate MAPE (avoid division by zero)
            mape = np.mean(np.abs((y_test - y_pred) / np.where(y_test != 0, y_test, 1))) * 100
            
            metrics = {
                'mse': float(mse),
                'rmse': float(rmse),
                'mae': float(mae),
                'r2_score': float(r2),
                'mape': float(mape),
                'count': len(y_test)
            }
            
            print(f"   MSE: {mse:.4f}")
            print(f"   RMSE: {rmse:.4f}")
            print(f"   MAE: {mae:.4f}")
            print(f"   R²: {r2:.4f}")
            print(f"   MAPE: {mape:.4f}%")
            
            # Create visualization
            self.plot_regression_results(y_test, y_pred, model_name)
            
            return metrics, y_pred
            
        except Exception as e:
            print(f"❌ Error validating {model_name} model: {str(e)}")
            print(traceback.format_exc())
            return {}, y_test  # Return empty metrics and original values as fallback
    
    def validate_classification_model(self, model, X_test, y_test, model_name):
        """Validate classification model"""
        print(f"📊 Validating {model_name} classification model...")
        
        try:
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            
            # Calculate ROC-AUC if possible
            try:
                y_pred_proba = model.predict_proba(X_test)
                if y_pred_proba.shape[1] == 2:  # Binary classification
                    roc_auc = roc_auc_score(y_test, y_pred_proba[:, 1])
                else:  # Multi-class
                    roc_auc = roc_auc_score(y_test, y_pred_proba, multi_class='ovr')
            except:
                roc_auc = 0.0  # Default if ROC-AUC computation fails
            
            metrics = {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'roc_auc': float(roc_auc),
                'count': len(y_test)
            }
            
            print(f"   Accuracy: {accuracy:.4f}")
            print(f"   Precision: {precision:.4f}")
            print(f"   Recall: {recall:.4f}")
            print(f"   F1-Score: {f1:.4f}")
            print(f"   ROC-AUC: {roc_auc:.4f}")
            
            # Create visualization
            self.plot_classification_results(y_test, y_pred, model_name)
            
            return metrics, y_pred
            
        except Exception as e:
            print(f"❌ Error validating {model_name} model: {str(e)}")
            print(traceback.format_exc())
            return {}, y_test  # Return empty metrics and original values as fallback
    
    def plot_regression_results(self, y_true, y_pred, model_name):
        """Plot regression validation results"""
        try:
            fig, axes = plt.subplots(2, 2, figsize=(12, 10))
            fig.suptitle(f'Regression Model Validation - {model_name}', fontsize=16)
            
            # Scatter plot: Predicted vs Actual
            axes[0, 0].scatter(y_true, y_pred, alpha=0.6)
            axes[0, 0].plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--', lw=2)
            axes[0, 0].set_xlabel('Actual Values')
            axes[0, 0].set_ylabel('Predicted Values')
            axes[0, 0].set_title('Predicted vs Actual')
            
            # Residual plot
            residuals = y_true - y_pred
            axes[0, 1].scatter(y_pred, residuals, alpha=0.6)
            axes[0, 1].axhline(y=0, color='r', linestyle='--')
            axes[0, 1].set_xlabel('Predicted Values')
            axes[0, 1].set_ylabel('Residuals')
            axes[0, 1].set_title('Residual Plot')
            
            # Histogram of residuals
            axes[1, 0].hist(residuals, bins=30, edgecolor='black', alpha=0.7)
            axes[1, 0].set_xlabel('Residuals')
            axes[1, 0].set_ylabel('Frequency')
            axes[1, 0].set_title('Distribution of Residuals')
            
            # Q-Q plot (simplified)
            from scipy import stats
            stats.probplot(residuals, dist="norm", plot=axes[1, 1])
            axes[1, 1].set_title('Q-Q Plot of Residuals')
            
            plt.tight_layout()
            
            # Save plot
            plot_path = os.path.join(self.report_path, f'validation_plot_{model_name}.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            print(f"   📊 Validation plot saved to {plot_path}")
            
        except Exception as e:
            print(f"   ❌ Error creating validation plot for {model_name}: {str(e)}")
    
    def plot_classification_results(self, y_true, y_pred, model_name):
        """Plot classification validation results"""
        try:
            fig, axes = plt.subplots(1, 2, figsize=(12, 5))
            fig.suptitle(f'Classification Model Validation - {model_name}', fontsize=16)
            
            # Confusion matrix heatmap
            from sklearn.metrics import confusion_matrix
            cm = confusion_matrix(y_true, y_pred)
            sns.heatmap(cm, annot=True, fmt='d', ax=axes[0], cmap='Blues')
            axes[0].set_title('Confusion Matrix')
            axes[0].set_xlabel('Predicted')
            axes[0].set_ylabel('Actual')
            
            # Class distribution
            unique, counts = np.unique(y_true, return_counts=True)
            axes[1].bar(unique, counts, alpha=0.7, label='Actual', color='blue')
            unique_pred, counts_pred = np.unique(y_pred, return_counts=True)
            axes[1].bar(unique_pred, counts_pred, alpha=0.5, label='Predicted', color='red')
            axes[1].set_title('Class Distribution')
            axes[1].set_xlabel('Class')
            axes[1].set_ylabel('Count')
            axes[1].legend()
            
            plt.tight_layout()
            
            # Save plot
            plot_path = os.path.join(self.report_path, f'validation_plot_{model_name}.png')
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            print(f"   📊 Validation plot saved to {plot_path}")
            
        except Exception as e:
            print(f"   ❌ Error creating validation plot for {model_name}: {str(e)}")
    
    def generate_validation_report(self, validation_results):
        """Generate comprehensive validation report"""
        print("📝 Generating validation report...")
        
        try:
            report = {
                'generated_at': datetime.now().isoformat(),
                'validation_results': validation_results,
                'summary': {
                    'total_models_validated': len(validation_results),
                    'models_with_good_performance': 0,
                    'average_accuracy': 0,
                    'average_r2_score': 0
                }
            }
            
            # Calculate summary metrics
            total_accuracy = 0
            total_r2 = 0
            good_perf_count = 0
            
            for model_name, result in validation_results.items():
                metrics = result['metrics']
                
                if 'accuracy' in metrics:
                    total_accuracy += metrics['accuracy']
                    if metrics['accuracy'] > 0.7:  # Good performance threshold
                        good_perf_count += 1
                elif 'r2_score' in metrics:
                    total_r2 += metrics['r2_score']
                    if metrics['r2_score'] > 0.5:  # Good performance threshold
                        good_perf_count += 1
            
            if len([m for m in validation_results.values() if 'accuracy' in m['metrics']]) > 0:
                report['summary']['average_accuracy'] = total_accuracy / len([m for m in validation_results.values() if 'accuracy' in m['metrics']])
            
            if len([m for m in validation_results.values() if 'r2_score' in m['metrics']]) > 0:
                report['summary']['average_r2_score'] = total_r2 / len([m for m in validation_results.values() if 'r2_score' in m['metrics']])
            
            report['summary']['models_with_good_performance'] = good_perf_count
            
            # Save report
            report_path = os.path.join(self.report_path, 'validation_report.json')
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            print(f"✅ Validation report saved to {report_path}")
            
            # Print summary
            print(f"\n📊 Validation Summary:")
            print(f"   Total models validated: {report['summary']['total_models_validated']}")
            print(f"   Models with good performance: {report['summary']['models_with_good_performance']}")
            if report['summary']['average_accuracy'] > 0:
                print(f"   Average accuracy: {report['summary']['average_accuracy']:.4f}")
            if report['summary']['average_r2_score'] > 0:
                print(f"   Average R² score: {report['summary']['average_r2_score']:.4f}")
            
            return report_path
            
        except Exception as e:
            print(f"❌ Error generating validation report: {str(e)}")
            print(traceback.format_exc())
            return None
    
    def run_validation(self):
        """Run the complete validation pipeline"""
        print("🚀 Starting model validation pipeline...")
        
        try:
            # Load models
            self.load_models()
            
            if not self.models:
                print("❌ No models loaded, skipping validation")
                return {}
            
            # Load test data
            X_test, y_test, raw_test_df = self.load_test_data()
            
            # Validate each model
            validation_results = {}
            
            for model_name, model in self.models.items():
                print(f"\n{'='*50}")
                print(f"Validating {model_name.upper()} Model")
                print(f"{'='*50}")
                
                # Determine if it's a regression or classification model
                target_data = y_test.get(model_name)
                if target_data is not None:
                    if len(np.unique(target_data)) <= 2:  # Binary classification
                        metrics, y_pred = self.validate_classification_model(model, X_test, target_data, model_name)
                    else:  # Assume regression for continuous values
                        metrics, y_pred = self.validate_regression_model(model, X_test, target_data, model_name)
                    
                    validation_results[model_name] = {
                        'metrics': metrics,
                        'predictions': y_pred.tolist()[:10]  # Include first 10 predictions as sample
                    }
                else:
                    print(f"⚠️ Target data not found for {model_name}")
            
            # Generate validation report
            report_path = self.generate_validation_report(validation_results)
            
            print("\n🎉 Model validation completed successfully!")
            return validation_results
            
        except Exception as e:
            print(f"❌ Model validation failed: {str(e)}")
            print(traceback.format_exc())
            raise e

if __name__ == "__main__":
    validator = ModelValidator()
    results = validator.run_validation()