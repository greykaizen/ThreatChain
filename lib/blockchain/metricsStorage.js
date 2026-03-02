const db = require('../../config/database');

/**
 * Blockchain Metrics Storage
 * Manages storage and retrieval of historical metrics data
 */
class MetricsStorage {
  constructor() {
    this.inMemoryCache = [];
    this.maxCacheSize = 1440; // 24 hours at 1-minute intervals
    this.initializeDatabase();
  }

  /**
   * Initialize database table for metrics storage
   */
  async initializeDatabase() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS blockchain_metrics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          gas_price_wei VARCHAR(255),
          gas_price_gwei VARCHAR(50),
          gas_price_eth VARCHAR(50),
          total_transactions INT,
          transactions_per_second DECIMAL(10,2),
          avg_gas_consumption INT,
          current_utilization DECIMAL(10,2),
          throughput DECIMAL(10,2),
          avg_latency INT,
          cpu_usage INT,
          consensus_protocol VARCHAR(100),
          success_rate DECIMAL(10,2),
          failure_rate DECIMAL(10,2),
          provenance_records INT,
          cross_verifications INT,
          challenge_records INT,
          latest_block INT,
          block_size DECIMAL(10,2),
          connected_nodes INT,
          ethereum_block INT,
          INDEX idx_timestamp (timestamp)
        )
      `);
      console.log('✅ Metrics storage table initialized');
    } catch (error) {
      console.error('Error initializing metrics storage:', error.message);
    }
  }

  /**
   * Store metrics snapshot
   * @param {Object} metrics - Metrics object to store
   */
  async storeMetrics(metrics) {
    try {
      // Store in database
      await db.query(`
        INSERT INTO blockchain_metrics (
          gas_price_wei, gas_price_gwei, gas_price_eth,
          total_transactions, transactions_per_second, avg_gas_consumption,
          current_utilization, throughput, avg_latency, cpu_usage,
          consensus_protocol, success_rate, failure_rate,
          provenance_records, cross_verifications, challenge_records,
          latest_block, block_size, connected_nodes, ethereum_block
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        metrics.transaction.gasPrice.wei,
        metrics.transaction.gasPrice.gwei,
        metrics.transaction.gasPrice.eth,
        metrics.transaction.totalTransactions,
        metrics.transaction.transactionsPerSecond,
        metrics.transaction.avgGasConsumption,
        metrics.performance.currentUtilization,
        metrics.performance.throughput,
        metrics.performance.avgLatency,
        metrics.performance.cpuUsage,
        metrics.consensus.protocol,
        metrics.consensus.successRate,
        metrics.consensus.failureRate,
        metrics.integrity.provenanceRecords,
        metrics.integrity.crossVerifications,
        metrics.integrity.challengeRecords,
        metrics.block.latestBlock,
        metrics.block.blockSize,
        metrics.block.connectedNodes,
        metrics.block.ethereumBlock
      ]);

      // Store in memory cache
      this.inMemoryCache.push({
        timestamp: new Date(metrics.timestamp),
        ...metrics
      });

      // Trim cache if too large
      if (this.inMemoryCache.length > this.maxCacheSize) {
        this.inMemoryCache.shift();
      }

      // Clean old database records (keep last 30 days)
      await this.cleanOldRecords(30);

    } catch (error) {
      console.error('Error storing metrics:', error.message);
    }
  }

  /**
   * Get historical metrics for a time range
   * @param {string} timeRange - Time range ('1h', '24h', '7d', '30d')
   * @returns {Array} Historical metrics
   */
  async getHistoricalMetrics(timeRange = '24h') {
    try {
      const timeMap = {
        '1h': 60,
        '24h': 1440,
        '7d': 10080,
        '30d': 43200
      };

      const minutes = timeMap[timeRange] || 1440;

      const metrics = await db.query(`
        SELECT 
          timestamp,
          gas_price_gwei as gasFee,
          transactions_per_second as tps,
          success_rate as successRate,
          avg_latency as latency,
          current_utilization as utilization,
          throughput
        FROM blockchain_metrics
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)
        ORDER BY timestamp ASC
      `);

      return metrics || [];
    } catch (error) {
      console.error('Error getting historical metrics:', error.message);
      return [];
    }
  }

  /**
   * Get metrics from in-memory cache
   * @param {number} minutes - Number of minutes to retrieve
   * @returns {Array} Cached metrics
   */
  getFromCache(minutes = 60) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.inMemoryCache.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get latest metrics snapshot
   * @returns {Object} Latest metrics
   */
  async getLatestMetrics() {
    try {
      const latest = await db.findOne(`
        SELECT * FROM blockchain_metrics
        ORDER BY timestamp DESC
        LIMIT 1
      `);

      if (!latest) return null;

      return {
        transaction: {
          gasPrice: {
            wei: latest.gas_price_wei,
            gwei: latest.gas_price_gwei,
            eth: latest.gas_price_eth
          },
          totalTransactions: latest.total_transactions,
          transactionsPerSecond: latest.transactions_per_second,
          avgGasConsumption: latest.avg_gas_consumption
        },
        performance: {
          currentUtilization: latest.current_utilization,
          throughput: latest.throughput,
          avgLatency: latest.avg_latency,
          cpuUsage: latest.cpu_usage
        },
        consensus: {
          protocol: latest.consensus_protocol,
          successRate: latest.success_rate,
          failureRate: latest.failure_rate,
          faultTolerance: 'High',
          transactionSecurity: 'Enabled'
        },
        integrity: {
          provenanceRecords: latest.provenance_records,
          crossVerifications: latest.cross_verifications,
          challengeRecords: latest.challenge_records
        },
        block: {
          latestBlock: latest.latest_block,
          blockSize: latest.block_size,
          blockUtilization: latest.current_utilization,
          connectedNodes: latest.connected_nodes,
          ethereumBlock: latest.ethereum_block
        },
        timestamp: latest.timestamp
      };
    } catch (error) {
      console.error('Error getting latest metrics:', error.message);
      return null;
    }
  }

  /**
   * Clean old records from database
   * @param {number} days - Number of days to keep
   */
  async cleanOldRecords(days = 30) {
    try {
      await db.query(`
        DELETE FROM blockchain_metrics
        WHERE timestamp < DATE_SUB(NOW(), INTERVAL ${days} DAY)
      `);
    } catch (error) {
      console.error('Error cleaning old records:', error.message);
    }
  }

  /**
   * Get aggregated statistics for a time period
   * @param {string} timeRange - Time range
   * @returns {Object} Aggregated statistics
   */
  async getAggregatedStats(timeRange = '24h') {
    try {
      const timeMap = {
        '1h': 60,
        '24h': 1440,
        '7d': 10080,
        '30d': 43200
      };

      const minutes = timeMap[timeRange] || 1440;

      const stats = await db.findOne(`
        SELECT 
          AVG(transactions_per_second) as avg_tps,
          MAX(transactions_per_second) as max_tps,
          MIN(transactions_per_second) as min_tps,
          AVG(success_rate) as avg_success_rate,
          AVG(avg_latency) as avg_latency,
          AVG(current_utilization) as avg_utilization,
          COUNT(*) as data_points
        FROM blockchain_metrics
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)
      `);

      return stats || {};
    } catch (error) {
      console.error('Error getting aggregated stats:', error.message);
      return {};
    }
  }

  /**
   * Export metrics to JSON
   * @param {string} timeRange - Time range to export
   * @returns {Object} Exported metrics
   */
  async exportMetrics(timeRange = '24h') {
    try {
      const historical = await this.getHistoricalMetrics(timeRange);
      const latest = await this.getLatestMetrics();
      const stats = await this.getAggregatedStats(timeRange);

      return {
        exportedAt: new Date().toISOString(),
        timeRange: timeRange,
        latestMetrics: latest,
        historicalData: historical,
        aggregatedStats: stats,
        dataPoints: historical.length
      };
    } catch (error) {
      console.error('Error exporting metrics:', error.message);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new MetricsStorage();
