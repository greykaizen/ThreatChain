const db = require('../config/database');

/**
 * Initialize ML-related database tables
 */
class MLDatabaseInitializer {
  constructor() {
    this.tables = [
      this.createMLPredictionsTable(),
      this.createModelComparisonTable(),
      this.createModelPerformanceMetricsTable()
    ];
  }

  /**
   * Create ml_predictions table
   */
  createMLPredictionsTable() {
    return `
      CREATE TABLE IF NOT EXISTS ml_predictions (
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
      )
    `;
  }

  /**
   * Create model_comparison table
   */
  createModelComparisonTable() {
    return `
      CREATE TABLE IF NOT EXISTS model_comparison (
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
      )
    `;
  }

  /**
   * Create model_performance_metrics table
   */
  createModelPerformanceMetricsTable() {
    return `
      CREATE TABLE IF NOT EXISTS model_performance_metrics (
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
      )
    `;
  }

  /**
   * Execute all table creation queries
   */
  async initializeTables() {
    console.log('🔧 Initializing ML database tables...');
    
    try {
      for (let i = 0; i < this.tables.length; i++) {
        const tableQuery = this.tables[i];
        console.log(`   Creating table ${i + 1}/${this.tables.length}...`);
        
        try {
          await db.query(tableQuery);
          console.log(`   ✅ Table ${i + 1} created successfully`);
        } catch (error) {
          console.error(`   ❌ Error creating table ${i + 1}:`, error.message);
          throw error;
        }
      }
      
      console.log('✅ All ML database tables initialized successfully!');
      
      // Verify table creation
      await this.verifyTables();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing ML tables:', error.message);
      throw error;
    }
  }

  /**
   * Verify that tables were created properly
   */
  async verifyTables() {
    console.log('🔍 Verifying table creation...');
    
    const tableNames = ['ml_predictions', 'model_comparison', 'model_performance_metrics'];
    
    for (const tableName of tableNames) {
      try {
        const result = await db.query(`DESCRIBE ${tableName}`);
        console.log(`   ✅ ${tableName} has ${result.length} columns`);
      } catch (error) {
        console.error(`   ❌ Could not verify ${tableName}:`, error.message);
      }
    }
  }

  /**
   * Run test queries to ensure tables work properly
   */
  async runTestQueries() {
    console.log('🧪 Running test queries...');
    
    try {
      // Test inserting a dummy record into ml_predictions
      await db.query(`
        INSERT INTO ml_predictions 
        (id, entity_type, entity_id, predicted_abuse_score, predicted_confidence, model_version) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE predicted_abuse_score = VALUES(predicted_abuse_score)
      `, ['test_id_1', 'report', 'test_entity', 85.5, 90.2, '1.0.0']);
      
      console.log('   ✅ Test insert into ml_predictions successful');
      
      // Test inserting a dummy record into model_comparison
      await db.query(`
        INSERT INTO model_comparison 
        (id, entity_type, entity_id, rb_overall_score, xgb_abuse_score, models_agree) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE rb_overall_score = VALUES(rb_overall_score)
      `, ['test_comp_1', 'report', 'test_entity', 82.3, 85.5, true]);
      
      console.log('   ✅ Test insert into model_comparison successful');
      
      // Clean up test records
      await db.query('DELETE FROM ml_predictions WHERE id = ?', ['test_id_1']);
      await db.query('DELETE FROM model_comparison WHERE id = ?', ['test_comp_1']);
      
      console.log('   ✅ Test cleanup successful');
      
    } catch (error) {
      console.error('   ❌ Test queries failed:', error.message);
      throw error;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const initializer = new MLDatabaseInitializer();
  
  try {
    console.log('🚀 Starting ML database initialization...');
    
    // Initialize tables
    await initializer.initializeTables();
    
    // Run test queries
    await initializer.runTestQueries();
    
    console.log('\n🎉 ML database initialization completed successfully!');
    console.log('📊 Created tables: ml_predictions, model_comparison, model_performance_metrics');
    
    return true;
  } catch (error) {
    console.error('\n💥 ML database initialization failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = MLDatabaseInitializer;