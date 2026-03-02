const os = require('os');
const db = require('../../config/database');

/**
 * System Metrics Collector
 * Collects real CPU, memory, and system metrics
 */
class SystemMetrics {
  constructor() {
    this.startTime = Date.now();
    this.previousNetworkStats = null;
  }

  /**
   * Get real CPU usage percentage
   * @returns {Promise<number>} CPU usage percentage (0-100)
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 100);
    });
  }

  /**
   * Helper function to calculate CPU average
   */
  cpuAverage() {
    const cpus = os.cpus();
    let idleMs = 0;
    let totalMs = 0;

    cpus.forEach((cpu) => {
      for (let type in cpu.times) {
        totalMs += cpu.times[type];
      }
      idleMs += cpu.times.idle;
    });

    return {
      idle: idleMs / cpus.length,
      total: totalMs / cpus.length
    };
  }

  /**
   * Get memory usage percentage
   * @returns {number} Memory usage percentage (0-100)
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return ((usedMemory / totalMemory) * 100).toFixed(2);
  }

  /**
   * Get system uptime in seconds
   * @returns {number} System uptime
   */
  getUptime() {
    return os.uptime();
  }

  /**
   * Get process uptime in seconds
   * @returns {number} Process uptime
   */
  getProcessUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get load average (1, 5, 15 minutes)
   * @returns {Array<number>} Load averages
   */
  getLoadAverage() {
    return os.loadavg();
  }

  /**
   * Get platform information
   * @returns {Object} Platform info
   */
  getPlatformInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };
  }

  /**
   * Get network statistics (simplified)
   * @returns {Object} Network stats
   */
  getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    let totalRx = 0;
    let totalTx = 0;

    // This is a simplified version
    // For real network stats, you'd need to read from /proc/net/dev on Linux
    return {
      rx: totalRx,
      tx: totalTx
    };
  }

  /**
   * Store system metrics in database
   */
  async storeMetrics() {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const networkStats = this.getNetworkStats();

      await db.query(
        `INSERT INTO system_metrics 
         (cpu_usage, memory_usage, network_in, network_out) 
         VALUES (?, ?, ?, ?)`,
        [cpuUsage, memoryUsage, networkStats.rx, networkStats.tx]
      );

      return {
        cpuUsage,
        memoryUsage,
        networkStats
      };
    } catch (error) {
      console.error('Error storing system metrics:', error.message);
      return null;
    }
  }

  /**
   * Get latest system metrics from database
   */
  async getLatestMetrics() {
    try {
      const metrics = await db.findOne(
        'SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT 1'
      );
      
      if (!metrics) {
        // If no metrics in DB, get current and store
        return await this.storeMetrics();
      }

      return {
        cpuUsage: parseFloat(metrics.cpu_usage),
        memoryUsage: parseFloat(metrics.memory_usage),
        networkStats: {
          rx: metrics.network_in,
          tx: metrics.network_out
        },
        timestamp: metrics.timestamp
      };
    } catch (error) {
      console.error('Error getting latest metrics:', error.message);
      // Fallback to real-time metrics
      const cpuUsage = await this.getCPUUsage();
      return {
        cpuUsage,
        memoryUsage: this.getMemoryUsage(),
        networkStats: this.getNetworkStats()
      };
    }
  }

  /**
   * Get average CPU usage over time period
   * @param {number} minutes - Time period in minutes
   */
  async getAverageCPU(minutes = 5) {
    try {
      const result = await db.findOne(
        `SELECT AVG(cpu_usage) as avg_cpu 
         FROM system_metrics 
         WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [minutes]
      );
      
      return result && result.avg_cpu ? parseFloat(result.avg_cpu) : await this.getCPUUsage();
    } catch (error) {
      console.error('Error getting average CPU:', error.message);
      return await this.getCPUUsage();
    }
  }

  /**
   * Clean old metrics (keep last 7 days)
   */
  async cleanOldMetrics() {
    try {
      await db.query(
        'DELETE FROM system_metrics WHERE timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );
    } catch (error) {
      console.error('Error cleaning old metrics:', error.message);
    }
  }
}

// Export singleton instance
module.exports = new SystemMetrics();
