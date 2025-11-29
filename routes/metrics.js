const express = require('express');
const router = express.Router();
const metricsCollector = require('../lib/blockchain/metricsCollector');
const metricsStorage = require('../lib/blockchain/metricsStorage');

/**
 * GET /api/blockchain/metrics
 * Get current blockchain metrics
 */
router.get('/', async (req, res) => {
  try {
    const metrics = await metricsCollector.collectMetrics();
    
    // Store metrics for historical tracking
    await metricsStorage.storeMetrics(metrics);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect blockchain metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/blockchain/metrics/history
 * Get historical metrics data
 */
router.get('/history', async (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    
    // Validate time range
    const validRanges = ['1h', '24h', '7d', '30d'];
    if (!validRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range',
        message: 'Valid ranges are: 1h, 24h, 7d, 30d'
      });
    }

    const historical = await metricsStorage.getHistoricalMetrics(timeRange);
    const stats = await metricsStorage.getAggregatedStats(timeRange);

    res.json({
      success: true,
      data: {
        timeRange: timeRange,
        dataPoints: historical.length,
        metrics: historical,
        aggregated: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting historical metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get historical metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/blockchain/metrics/latest
 * Get latest stored metrics (faster than collecting new ones)
 */
router.get('/latest', async (req, res) => {
  try {
    const latest = await metricsStorage.getLatestMetrics();
    
    if (!latest) {
      // No stored metrics, collect new ones
      const metrics = await metricsCollector.collectMetrics();
      await metricsStorage.storeMetrics(metrics);
      
      return res.json({
        success: true,
        data: metrics,
        source: 'fresh',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: latest,
      source: 'cached',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting latest metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/blockchain/metrics/export
 * Export metrics data
 */
router.get('/export', async (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    const format = req.query.format || 'json';

    const exportData = await metricsStorage.exportMetrics(timeRange);

    if (!exportData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to export metrics'
      });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData.historicalData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=blockchain-metrics-${timeRange}-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=blockchain-metrics-${timeRange}-${Date.now()}.json`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export metrics',
      message: error.message
    });
  }
});

/**
 * Helper function to convert JSON to CSV
 */
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

module.exports = router;
