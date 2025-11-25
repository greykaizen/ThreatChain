const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('🔧 Initializing ThreadChain Database...\n');

    // Connect to MySQL without database selection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL server');

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'threadchain_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Use the database
    await connection.query(`USE ${dbName}`);

    // Create STIX reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stix_reports (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content LONGTEXT NOT NULL,
        file_name VARCHAR(255),
        file_size INT,
        hash VARCHAR(64) UNIQUE NOT NULL,
        stix_version VARCHAR(10),
        report_type VARCHAR(50),
        severity VARCHAR(20),
        indicators_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hash (hash),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Table "stix_reports" created');

    // Create blockchain transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blockchain_transactions (
        id VARCHAR(36) PRIMARY KEY,
        tx_hash VARCHAR(66) UNIQUE NOT NULL,
        block_number BIGINT,
        report_hash VARCHAR(64) NOT NULL,
        report_id VARCHAR(36),
        status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
        gas_used BIGINT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmation_time TIMESTAMP NULL,
        FOREIGN KEY (report_id) REFERENCES stix_reports(id) ON DELETE CASCADE,
        INDEX idx_tx_hash (tx_hash),
        INDEX idx_report_hash (report_hash),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Table "blockchain_transactions" created');

    // Create provenance records table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS provenance_records (
        id VARCHAR(36) PRIMARY KEY,
        report_id VARCHAR(36) NOT NULL,
        blockchain_tx_id VARCHAR(36),
        action_type ENUM('created', 'updated', 'verified', 'shared') NOT NULL,
        actor VARCHAR(255),
        metadata JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES stix_reports(id) ON DELETE CASCADE,
        FOREIGN KEY (blockchain_tx_id) REFERENCES blockchain_transactions(id) ON DELETE SET NULL,
        INDEX idx_report_id (report_id),
        INDEX idx_timestamp (timestamp)
      )
    `);
    console.log('✅ Table "provenance_records" created');

    // Create blockchain blocks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blockchain_blocks (
        block_number BIGINT PRIMARY KEY AUTO_INCREMENT,
        block_hash VARCHAR(64) UNIQUE NOT NULL,
        previous_hash VARCHAR(64),
        merkle_root VARCHAR(64),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        nonce BIGINT DEFAULT 0,
        difficulty INT DEFAULT 1,
        transactions_count INT DEFAULT 0,
        INDEX idx_block_hash (block_hash),
        INDEX idx_timestamp (timestamp)
      )
    `);
    console.log('✅ Table "blockchain_blocks" created');

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Database: ' + dbName);
    console.log('   - Tables created: 4');
    console.log('   - stix_reports');
    console.log('   - blockchain_transactions');
    console.log('   - provenance_records');
    console.log('   - blockchain_blocks');
    console.log('\n✨ You can now start the server with: npm start');

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials in .env file are correct');
    console.error('3. User has necessary permissions');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();