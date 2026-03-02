const { ethers } = require('ethers');
const db = require('../../config/database');
const ethereumService = require('../../blockchain/EthereumService');
const systemMetrics = require('./systemMetrics');

/**
 * Blockchain Metrics Collector
 * Collects real-time metrics from Ethereum blockchain and local database
 */
class MetricsCollector {
  constructor() {
    this.provider = ethereumService.provider;
    this.wallet = ethereumService.wallet;
    this.contract = ethereumService.contract;
    this.isEnabled = ethereumService.isEnabled;
    
    // Cache for metrics (5 second TTL)
    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5000 // 5 seconds
    };
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid() {
    if (!this.cache.data || !this.cache.timestamp) {
      return false;
    }
    return (Date.now() - this.cache.timestamp) < this.cache.ttl;
  }

  /**
   * Get average gas price from recent transactions
   */
  async getGasPrice() {
    try {
      // Get average gas price from recent transactions
      const result = await db.findOne(
        `SELECT AVG(gas_price) as avg_price, AVG(gas_fee) as avg_fee
         FROM blockchain_transactions 
         WHERE gas_price > 0 
         AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
      );
      
      if (result && result.avg_price > 0) {
        const avgPriceGwei = parseFloat(result.avg_price);
        const avgFeeEth = parseFloat(result.avg_fee);
        
        return {
          wei: (avgPriceGwei * 1e9).toString(),
          gwei: avgPriceGwei.toFixed(2),
          eth: avgFeeEth.toFixed(9)
        };
      }
      
      // Fallback: try to get from Ethereum network
      if (this.isEnabled && this.provider) {
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice || BigInt(0);
        
        return {
          wei: gasPrice.toString(),
          gwei: ethers.formatUnits(gasPrice, 'gwei'),
          eth: ethers.formatEther(gasPrice)
        };
      }
      
      return { wei: '0', gwei: '0', eth: '0' };
    } catch (error) {
      console.error('Error getting gas price:', error.message);
      return { wei: '0', gwei: '0', eth: '0' };
    }
  }

  /**
   * Get total transaction count from database
   */
  async getTotalTransactions() {
    try {
      const result = await db.findOne(
        'SELECT COUNT(*) as count FROM blockchain_transactions'
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting total transactions:', error.message);
      return 0;
    }
  }

  /**
   * Get transaction count for a specific time period
   */
  async getTransactionCount(minutes = 1) {
    try {
      const result = await db.findOne(
        `SELECT COUNT(*) as count 
         FROM blockchain_transactions 
         WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ${minutes} MINUTE)`
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting transaction count:', error.message);
      return 0;
    }
  }

  /**
   * Get success rate of transactions
   */
  async getSuccessRate() {
    try {
      const total = await db.findOne(
        'SELECT COUNT(*) as count FROM blockchain_transactions'
      );
      const successful = await db.findOne(
        "SELECT COUNT(*) as count FROM blockchain_transactions WHERE status = 'confirmed'"
      );
      
      if (!total || total.count === 0) {
        return 100; // No transactions = 100% success rate
      }
      
      return ((successful.count / total.count) * 100).toFixed(2);
    } catch (error) {
      console.error('Error calculating success rate:', error.message);
      return 0;
    }
  }

  /**
   * Get average gas consumption from recent transactions
   */
  async getAverageGasConsumption() {
    try {
      const result = await db.findOne(
        `SELECT AVG(CAST(gas_used as UNSIGNED)) as avg_gas 
         FROM blockchain_transactions 
         WHERE gas_used IS NOT NULL 
         AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
      );
      return result && result.avg_gas ? Math.round(result.avg_gas) : 0;
    } catch (error) {
      console.error('Error calculating average gas:', error.message);
      return 0;
    }
  }

  /**
   * Get latest block information
   */
  async getLatestBlock() {
    try {
      const block = await db.findOne(
        'SELECT * FROM blockchain_blocks ORDER BY block_number DESC LIMIT 1'
      );
      return block || null;
    } catch (error) {
      console.error('Error getting latest block:', error.message);
      return null;
    }
  }

  /**
   * Get blockchain utilization (percentage of blocks filled)
   */
  async getBlockchainUtilization() {
    try {
      const latestBlock = await this.getLatestBlock();
      if (!latestBlock) return 0;

      // Calculate based on transactions per block
      // Assuming max 100 transactions per block (configurable)
      const maxTransactionsPerBlock = 100;
      const utilization = (latestBlock.transactions_count / maxTransactionsPerBlock) * 100;
      
      return Math.min(utilization, 100).toFixed(2);
    } catch (error) {
      console.error('Error calculating utilization:', error.message);
      return 0;
    }
  }

  /**
   * Get average transaction latency (time from submission to confirmation)
   */
  async getAverageLatency() {
    try {
      // Calculate real latency from confirmation_time - timestamp
      // MySQL uses MICROSECOND, then divide by 1000 to get milliseconds
      const result = await db.findOne(
        `SELECT AVG(TIMESTAMPDIFF(MICROSECOND, timestamp, confirmation_time) / 1000) as avg_latency
         FROM blockchain_transactions 
         WHERE status = 'confirmed' 
         AND confirmation_time IS NOT NULL
         AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
      );
      
      if (result && result.avg_latency !== null) {
        return Math.round(result.avg_latency);
      }
      
      // Fallback: estimate based on block mining time (in seconds, convert to ms)
      const avgBlockTime = await db.findOne(
        `SELECT AVG(TIMESTAMPDIFF(SECOND, prev_time, timestamp)) as avg_time
         FROM (
           SELECT 
             block_number,
             timestamp,
             LAG(timestamp) OVER (ORDER BY block_number) as prev_time
           FROM blockchain_blocks
           WHERE block_number > 0
           ORDER BY block_number DESC
           LIMIT 10
         ) as recent_blocks
         WHERE prev_time IS NOT NULL`
      );
      
      return avgBlockTime && avgBlockTime.avg_time ? Math.round(avgBlockTime.avg_time * 1000) : 250;
    } catch (error) {
      console.error('Error calculating latency:', error.message);
      // Return reasonable default
      return 250;
    }
  }

  /**
   * Get provenance records count
   */
  async getProvenanceRecords() {
    try {
      const result = await db.findOne(
        'SELECT COUNT(*) as count FROM blockchain_transactions WHERE status = "confirmed"'
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting provenance records:', error.message);
      return 0;
    }
  }

  /**
   * Get cross-verification count (transactions verified on Ethereum)
   */
  async getCrossVerifications() {
    try {
      // Check if column exists first, if not return 0
      const result = await db.findOne(
        `SELECT COUNT(*) as count FROM blockchain_transactions 
         WHERE tx_hash IS NOT NULL AND status = 'confirmed'`
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting cross verifications:', error.message);
      return 0;
    }
  }

  /**
   * Get challenge records count (failed or pending transactions)
   */
  async getChallengeRecords() {
    try {
      const result = await db.findOne(
        'SELECT COUNT(*) as count FROM blockchain_transactions WHERE status IN ("pending", "failed")'
      );
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting challenge records:', error.message);
      return 0;
    }
  }

  /**
   * Get Ethereum network block number
   */
  async getEthereumBlockNumber() {
    if (!this.isEnabled || !this.provider) {
      return 0;
    }

    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error getting Ethereum block number:', error.message);
      return 0;
    }
  }

  /**
   * Get connected nodes count (for local blockchain)
   */
  async getConnectedNodes() {
    try {
      const result = await db.findOne(
        "SELECT COUNT(*) as count FROM network_peers WHERE status = 'connected'"
      );
      
      // Add Ethereum node if connected
      const ethereumConnected = this.isEnabled ? 1 : 0;
      
      return (result ? result.count : 1) + ethereumConnected;
    } catch (error) {
      console.error('Error getting connected nodes:', error.message);
      return this.isEnabled ? 2 : 1;
    }
  }

  /**
   * Collect all metrics
   */
  async collectMetrics() {
    // Return cached data if still valid
    if (this.isCacheValid()) {
      return this.cache.data;
    }

    try {
      // Collect all metrics in parallel for better performance
      const [
        gasPrice,
        totalTransactions,
        recentTransactions,
        successRate,
        avgGasConsumption,
        latestBlock,
        utilization,
        avgLatency,
        provenanceRecords,
        crossVerifications,
        challengeRecords,
        ethereumBlockNumber,
        connectedNodes
      ] = await Promise.all([
        this.getGasPrice(),
        this.getTotalTransactions(),
        this.getTransactionCount(1), // Last 1 minute
        this.getSuccessRate(),
        this.getAverageGasConsumption(),
        this.getLatestBlock(),
        this.getBlockchainUtilization(),
        this.getAverageLatency(),
        this.getProvenanceRecords(),
        this.getCrossVerifications(),
        this.getChallengeRecords(),
        this.getEthereumBlockNumber(),
        this.getConnectedNodes()
      ]);

      // Calculate TPS (transactions per second)
      const tps = (recentTransactions / 60).toFixed(2);

      // Calculate throughput (records per second)
      const throughput = tps;

      // Calculate failure rate
      const failureRate = (100 - parseFloat(successRate)).toFixed(2);

      // Get real CPU usage from system metrics
      const systemStats = await systemMetrics.getLatestMetrics();
      const cpuUsage = systemStats.cpuUsage;

      const metrics = {
        transaction: {
          gasPrice: gasPrice,
          totalTransactions: totalTransactions,
          transactionsPerSecond: parseFloat(tps),
          avgGasConsumption: avgGasConsumption
        },
        performance: {
          currentUtilization: parseFloat(utilization),
          throughput: parseFloat(throughput),
          avgLatency: avgLatency,
          cpuUsage: cpuUsage
        },
        consensus: {
          protocol: 'Proof of Authority',
          successRate: parseFloat(successRate),
          failureRate: parseFloat(failureRate),
          faultTolerance: 'High',
          transactionSecurity: 'Enabled'
        },
        integrity: {
          provenanceRecords: provenanceRecords,
          crossVerifications: crossVerifications,
          challengeRecords: challengeRecords
        },
        block: {
          latestBlock: latestBlock ? latestBlock.block_number : 0,
          blockSize: latestBlock ? (JSON.stringify(latestBlock).length / 1024).toFixed(2) : 0,
          blockUtilization: parseFloat(utilization),
          connectedNodes: connectedNodes,
          ethereumBlock: ethereumBlockNumber
        },
        timestamp: new Date().toISOString()
      };

      // Update cache
      this.cache.data = metrics;
      this.cache.timestamp = Date.now();

      return metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new MetricsCollector();
