/**
 * Blockchain Metrics Calculator
 * Provides utility functions for calculating derived metrics
 */

class MetricsCalculator {
  /**
   * Calculate transactions per second
   * @param {number} transactionCount - Number of transactions
   * @param {number} timeWindowSeconds - Time window in seconds
   * @returns {number} TPS
   */
  calculateTPS(transactionCount, timeWindowSeconds) {
    if (timeWindowSeconds === 0) return 0;
    return (transactionCount / timeWindowSeconds).toFixed(2);
  }

  /**
   * Calculate success rate percentage
   * @param {number} successfulTransactions - Number of successful transactions
   * @param {number} totalTransactions - Total number of transactions
   * @returns {number} Success rate percentage
   */
  calculateSuccessRate(successfulTransactions, totalTransactions) {
    if (totalTransactions === 0) return 100;
    return ((successfulTransactions / totalTransactions) * 100).toFixed(2);
  }

  /**
   * Calculate failure rate percentage
   * @param {number} failedTransactions - Number of failed transactions
   * @param {number} totalTransactions - Total number of transactions
   * @returns {number} Failure rate percentage
   */
  calculateFailureRate(failedTransactions, totalTransactions) {
    if (totalTransactions === 0) return 0;
    return ((failedTransactions / totalTransactions) * 100).toFixed(2);
  }

  /**
   * Calculate blockchain utilization
   * @param {number} currentTransactions - Current number of transactions in block
   * @param {number} maxTransactions - Maximum transactions per block
   * @returns {number} Utilization percentage
   */
  calculateUtilization(currentTransactions, maxTransactions) {
    if (maxTransactions === 0) return 0;
    return Math.min(((currentTransactions / maxTransactions) * 100), 100).toFixed(2);
  }

  /**
   * Calculate average latency
   * @param {Array} transactions - Array of transaction objects with timestamps
   * @returns {number} Average latency in milliseconds
   */
  calculateAverageLatency(transactions) {
    if (!transactions || transactions.length === 0) return 0;

    const latencies = transactions.map(tx => {
      const submitted = new Date(tx.timestamp);
      const confirmed = new Date(tx.updated_at || tx.timestamp);
      return confirmed - submitted;
    });

    const sum = latencies.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / latencies.length);
  }

  /**
   * Calculate throughput (records per second)
   * @param {number} recordCount - Number of records processed
   * @param {number} timeWindowSeconds - Time window in seconds
   * @returns {number} Throughput
   */
  calculateThroughput(recordCount, timeWindowSeconds) {
    if (timeWindowSeconds === 0) return 0;
    return (recordCount / timeWindowSeconds).toFixed(2);
  }

  /**
   * Convert Wei to Gwei
   * @param {string|BigInt} wei - Amount in Wei
   * @returns {string} Amount in Gwei
   */
  weiToGwei(wei) {
    const weiValue = BigInt(wei);
    return (Number(weiValue) / 1e9).toFixed(2);
  }

  /**
   * Convert Wei to ETH
   * @param {string|BigInt} wei - Amount in Wei
   * @returns {string} Amount in ETH
   */
  weiToEth(wei) {
    const weiValue = BigInt(wei);
    return (Number(weiValue) / 1e18).toFixed(6);
  }

  /**
   * Calculate average gas consumption
   * @param {Array} transactions - Array of transaction objects with gas_used
   * @returns {number} Average gas used
   */
  calculateAverageGas(transactions) {
    if (!transactions || transactions.length === 0) return 0;

    const gasValues = transactions
      .filter(tx => tx.gas_used)
      .map(tx => parseInt(tx.gas_used));

    if (gasValues.length === 0) return 0;

    const sum = gasValues.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / gasValues.length);
  }

  /**
   * Determine alert status based on threshold
   * @param {number} value - Current value
   * @param {number} threshold - Threshold value
   * @param {string} comparison - Comparison type ('greater' or 'less')
   * @returns {Object} Alert status
   */
  checkThreshold(value, threshold, comparison = 'greater') {
    const isAlert = comparison === 'greater' 
      ? value > threshold 
      : value < threshold;

    return {
      alert: isAlert,
      severity: isAlert ? this.calculateSeverity(value, threshold, comparison) : 'normal'
    };
  }

  /**
   * Calculate alert severity
   * @param {number} value - Current value
   * @param {number} threshold - Threshold value
   * @param {string} comparison - Comparison type
   * @returns {string} Severity level
   */
  calculateSeverity(value, threshold, comparison) {
    const diff = comparison === 'greater' 
      ? ((value - threshold) / threshold) * 100
      : ((threshold - value) / threshold) * 100;

    if (diff > 50) return 'critical';
    if (diff > 20) return 'warning';
    return 'info';
  }

  /**
   * Calculate trend direction
   * @param {Array} values - Array of historical values
   * @returns {string} Trend direction ('up', 'down', 'stable')
   */
  calculateTrend(values) {
    if (!values || values.length < 2) return 'stable';

    const recent = values.slice(-5); // Last 5 values
    const avg = recent.reduce((acc, val) => acc + val, 0) / recent.length;
    const latest = recent[recent.length - 1];

    const diff = ((latest - avg) / avg) * 100;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  /**
   * Format bytes to human-readable size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calculate percentage change
   * @param {number} oldValue - Previous value
   * @param {number} newValue - Current value
   * @returns {number} Percentage change
   */
  calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return 0;
    return (((newValue - oldValue) / oldValue) * 100).toFixed(2);
  }

  /**
   * Aggregate metrics over time period
   * @param {Array} dataPoints - Array of metric data points
   * @param {string} aggregation - Aggregation type ('avg', 'sum', 'min', 'max')
   * @returns {number} Aggregated value
   */
  aggregateMetrics(dataPoints, aggregation = 'avg') {
    if (!dataPoints || dataPoints.length === 0) return 0;

    switch (aggregation) {
      case 'sum':
        return dataPoints.reduce((acc, val) => acc + val, 0);
      case 'min':
        return Math.min(...dataPoints);
      case 'max':
        return Math.max(...dataPoints);
      case 'avg':
      default:
        return dataPoints.reduce((acc, val) => acc + val, 0) / dataPoints.length;
    }
  }
}

// Export singleton instance
module.exports = new MetricsCalculator();
