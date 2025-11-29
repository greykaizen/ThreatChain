const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'threadchain_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables
async function initializeTables() {
  try {
    const connection = await pool.getConnection();
    
    // Create STIX reports table
    await connection.execute(`
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

    // Create blockchain transactions table
    await connection.execute(`
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

    // Create provenance records table
    await connection.execute(`
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

    // Create blockchain blocks table (for local blockchain simulation)
    await connection.execute(`
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

    // Create blockchain metrics history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blockchain_metrics_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gas_fee DECIMAL(10,2) DEFAULT 0,
        tps DECIMAL(10,2) DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 100,
        latency INT DEFAULT 0,
        utilization DECIMAL(5,2) DEFAULT 0,
        throughput DECIMAL(10,2) DEFAULT 0,
        cpu_usage DECIMAL(5,2) DEFAULT 0,
        total_transactions INT DEFAULT 0,
        confirmed_transactions INT DEFAULT 0,
        failed_transactions INT DEFAULT 0,
        latest_block BIGINT DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      )
    `);

    // Create system metrics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cpu_usage DECIMAL(5,2) DEFAULT 0,
        memory_usage DECIMAL(5,2) DEFAULT 0,
        disk_usage DECIMAL(5,2) DEFAULT 0,
        network_in BIGINT DEFAULT 0,
        network_out BIGINT DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      )
    `);

    // Create network peers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS network_peers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        peer_id VARCHAR(255) UNIQUE NOT NULL,
        peer_address VARCHAR(255) NOT NULL,
        peer_type ENUM('local', 'ethereum', 'external') DEFAULT 'local',
        status ENUM('connected', 'disconnected') DEFAULT 'connected',
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_peer_type (peer_type)
      )
    `);

    // Add confirmation_time column if it doesn't exist
    await connection.execute(`
      ALTER TABLE blockchain_transactions 
      ADD COLUMN IF NOT EXISTS confirmation_time TIMESTAMP NULL AFTER timestamp
    `).catch(() => {}); // Ignore if column already exists

    // Insert local peer if not exists
    await connection.execute(`
      INSERT IGNORE INTO network_peers (peer_id, peer_address, peer_type, status)
      VALUES ('local-node-1', 'localhost:3001', 'local', 'connected')
    `);

    connection.release();
    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

// Database helper functions
const db = {
  // Execute query with parameters
  async query(sql, params = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Get single record
  async findOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  },

  // Insert record and return ID
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    return result.insertId;
  },

  // Update record
  async update(table, data, where, whereParams = []) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await this.query(sql, [...values, ...whereParams]);
    return result.affectedRows;
  },

  // Delete record
  async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.query(sql, whereParams);
    return result.affectedRows;
  },

  // Get connection pool
  getPool() {
    return pool;
  }
};

// Initialize on module load
(async () => {
  await testConnection();
  await initializeTables();
})();

module.exports = db;