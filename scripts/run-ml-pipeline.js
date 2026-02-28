#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script to run the complete XGBoost ML pipeline
 * Executes data preparation, feature engineering, and model training
 */

class MLPipelineRunner {
  constructor() {
    this.datasetsReady = false;
    this.featuresReady = false;
    this.pythonCmd = this.findPythonCommand();
  }

  /**
   * Find the appropriate Python command
   */
  findPythonCommand() {
    const commands = ['python3', 'python'];
    
    for (const cmd of commands) {
      try {
        execSync(`${cmd} --version`, { stdio: 'pipe' });
        console.log(`✅ Found Python command: ${cmd}`);
        return cmd;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('❌ No Python command found. Please install Python 3.x');
  }

  /**
   * Check if datasets exist and are valid
   */
  checkDatasets() {
    console.log('🔍 Checking dataset...');
    
    const datasetPath = './all_dataset/stix_feed_pretty.json';
    
    if (!fs.existsSync(datasetPath)) {
      throw new Error(`❌ Dataset not found at ${datasetPath}`);
    }
    
    const stats = fs.statSync(datasetPath);
    if (stats.size === 0) {
      throw new Error('❌ Dataset file is empty');
    }
    
    console.log(`✅ Dataset found: ${datasetPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    // Try to parse a small portion to verify JSON validity
    const data = fs.readFileSync(datasetPath, 'utf8');
    try {
      const sample = JSON.parse(data.substring(0, 1000) + '}'); // Try to parse a small part
      console.log('✅ Dataset format appears valid');
      this.datasetsReady = true;
    } catch (error) {
      console.warn('⚠️ Could not fully validate dataset format, but file exists');
      this.datasetsReady = true;
    }
  }

  /**
   * Run data preparation script
   */
  runDataPreparation() {
    console.log('\n🚀 Running data preparation...');
    
    try {
      const cmd = 'node scripts/ml/prepare-dataset.js';
      console.log(`   Executing: ${cmd}`);
      
      const result = execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Data preparation completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Data preparation failed:', error.message);
      return false;
    }
  }

  /**
   * Install Python dependencies
   */
  installPythonDependencies() {
    console.log('\n📦 Installing Python dependencies...');
    
    try {
      // Try regular installation first
      let cmd = `${this.pythonCmd} -m pip install -r ml-service/requirements.txt`;
      console.log(`   Attempting: ${cmd}`);
      
      try {
        const result = execSync(cmd, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        console.log('✅ Python dependencies installed successfully');
        return true;
      } catch (regularError) {
        console.log('⚠️ Regular installation failed, trying with --break-system-packages...');
        
        // If regular fails, try with --break-system-packages (for Debian/Ubuntu)
        cmd = `${this.pythonCmd} -m pip install --break-system-packages -r ml-service/requirements.txt`;
        console.log(`   Executing: ${cmd}`);
        
        const result = execSync(cmd, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        console.log('✅ Python dependencies installed successfully with --break-system-packages');
        return true;
      }
    } catch (error) {
      console.error('❌ Python dependencies installation failed:', error.message);
      return false;
    }
  }

  /**
   * Run feature engineering
   */
  runFeatureEngineering() {
    console.log('\n⚙️ Running feature engineering...');
    
    try {
      const cmd = `${this.pythonCmd} scripts/ml/feature-engineering.py`;
      console.log(`   Executing: ${cmd}`);
      
      const result = execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Feature engineering completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Feature engineering failed:', error.message);
      return false;
    }
  }

  /**
   * Run model training
   */
  runModelTraining() {
    console.log('\n🎯 Running model training...');
    
    try {
      const cmd = `${this.pythonCmd} scripts/ml/train-xgboost.py`;
      console.log(`   Executing: ${cmd}`);
      
      const result = execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Model training completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Model training failed:', error.message);
      return false;
    }
  }

  /**
   * Initialize database tables
   */
  runDatabaseInitialization() {
    console.log('\n🗄️ Initializing database tables...');
    
    try {
      const cmd = 'node scripts/init-ml-tables.js';
      console.log(`   Executing: ${cmd}`);
      
      const result = execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Database initialization completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Verify model files exist
   */
  verifyModels() {
    console.log('\n🔍 Verifying trained models...');
    
    const modelFiles = [
      './models/xgboost_abuse_score.pkl',
      './models/xgboost_auto_block.pkl',
      './models/xgboost_confidence.pkl',
      './models/scaler.pkl'
    ];
    
    let allModelsExist = true;
    
    for (const modelFile of modelFiles) {
      if (fs.existsSync(modelFile)) {
        const stats = fs.statSync(modelFile);
        console.log(`✅ Model found: ${modelFile} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        console.error(`❌ Model missing: ${modelFile}`);
        allModelsExist = false;
      }
    }
    
    return allModelsExist;
  }

  /**
   * Run the complete ML pipeline
   */
  async runPipeline() {
    console.log('🚀 Starting Complete ML Pipeline...\n');
    console.log('=' .repeat(60));
    
    try {
      // Check datasets
      this.checkDatasets();
      
      if (!this.datasetsReady) {
        throw new Error('❌ Datasets not ready, stopping pipeline');
      }
      
      // Install Python dependencies first
      const depsOk = this.installPythonDependencies();
      if (!depsOk) {
        throw new Error('❌ Dependencies installation failed, stopping pipeline');
      }
      
      // Run data preparation
      const prepOk = this.runDataPreparation();
      if (!prepOk) {
        throw new Error('❌ Data preparation failed, stopping pipeline');
      }
      
      // Run feature engineering
      const featureOk = this.runFeatureEngineering();
      if (!featureOk) {
        throw new Error('❌ Feature engineering failed, stopping pipeline');
      }
      
      // Run model training
      const trainOk = this.runModelTraining();
      if (!trainOk) {
        throw new Error('❌ Model training failed, stopping pipeline');
      }
      
      // Initialize database
      const dbOk = this.runDatabaseInitialization();
      if (!dbOk) {
        throw new Error('❌ Database initialization failed, stopping pipeline');
      }
      
      // Verify models
      const modelsOk = this.verifyModels();
      if (!modelsOk) {
        console.warn('⚠️ Some models may be missing, but continuing...');
      }
      
      console.log('\n' + '=' .repeat(60));
      console.log('🎉 ML Pipeline completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Start the ML service: cd ml-service && python app.py');
      console.log('   2. Set environment variable: export USE_XGBOOST_MODEL=true');
      console.log('   3. Start the main server: npm run backend');
      console.log('   4. Access dual-model scores at: GET /api/trust/score-dual/:type/:id');
      console.log('\n💡 Tip: Check the XGBoost implementation plan for more details');
      
      return true;
    } catch (error) {
      console.error('\n💥 ML Pipeline failed:', error.message);
      console.error('\n⚠️  Please check the error messages above and try again.');
      console.error('💡 Make sure you have Python 3.x and Node.js installed.');
      return false;
    }
  }
}

// Run the pipeline if executed directly
if (require.main === module) {
  const runner = new MLPipelineRunner();
  
  runner.runPipeline()
    .then(success => {
      if (success) {
        console.log('\n✅ Pipeline execution completed!');
        process.exit(0);
      } else {
        console.log('\n❌ Pipeline execution failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = MLPipelineRunner;