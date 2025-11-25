const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');

// Get provenance records for a report
router.get('/report/:reportId', async (req, res) => {
  try {
    const reportId = req.params.reportId;

    // Check if report exists
    const report = await db.findOne(
      'SELECT id, title, hash FROM stix_reports WHERE id = ?',
      [reportId]
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Get all provenance records
    const provenance = await db.query(
      `SELECT 
        pr.*,
        bt.tx_hash,
        bt.block_number,
        bt.status as blockchain_status
      FROM provenance_records pr
      LEFT JOIN blockchain_transactions bt ON pr.blockchain_tx_id = bt.id
      WHERE pr.report_id = ?
      ORDER BY pr.timestamp DESC`,
      [reportId]
    );

    res.json({
      success: true,
      data: {
        report: report,
        provenance: provenance,
        totalRecords: provenance.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting provenance records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provenance records',
      message: error.message
    });
  }
});

// Add provenance record
router.post('/record', async (req, res) => {
  try {
    const { reportId, actionType, actor, metadata } = req.body;

    if (!reportId || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportId and actionType'
      });
    }

    // Validate action type
    const validActions = ['created', 'updated', 'verified', 'shared'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action type. Must be one of: ${validActions.join(', ')}`
      });
    }

    // Check if report exists
    const report = await db.findOne(
      'SELECT id FROM stix_reports WHERE id = ?',
      [reportId]
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Get blockchain transaction if exists
    const blockchainTx = await db.findOne(
      'SELECT id FROM blockchain_transactions WHERE report_id = ? ORDER BY timestamp DESC LIMIT 1',
      [reportId]
    );

    // Create provenance record
    const provenanceId = crypto.randomUUID();
    await db.query(
      `INSERT INTO provenance_records 
       (id, report_id, blockchain_tx_id, action_type, actor, metadata) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        provenanceId,
        reportId,
        blockchainTx ? blockchainTx.id : null,
        actionType,
        actor || 'system',
        JSON.stringify(metadata || {})
      ]
    );

    const newRecord = await db.findOne(
      'SELECT * FROM provenance_records WHERE id = ?',
      [provenanceId]
    );

    res.json({
      success: true,
      data: newRecord,
      message: 'Provenance record created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating provenance record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create provenance record',
      message: error.message
    });
  }
});

// Get provenance chain (full history)
router.get('/chain/:reportId', async (req, res) => {
  try {
    const reportId = req.params.reportId;

    // Get report details
    const report = await db.findOne(
      `SELECT 
        id,
        title,
        hash,
        created_at,
        updated_at
      FROM stix_reports 
      WHERE id = ?`,
      [reportId]
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Get complete provenance chain
    const provenanceChain = await db.query(
      `SELECT 
        pr.id,
        pr.action_type,
        pr.actor,
        pr.metadata,
        pr.timestamp,
        bt.tx_hash,
        bt.block_number,
        bt.status as blockchain_status,
        bb.block_hash,
        bb.previous_hash
      FROM provenance_records pr
      LEFT JOIN blockchain_transactions bt ON pr.blockchain_tx_id = bt.id
      LEFT JOIN blockchain_blocks bb ON bt.block_number = bb.block_number
      WHERE pr.report_id = ?
      ORDER BY pr.timestamp ASC`,
      [reportId]
    );

    // Build chain visualization
    const chain = provenanceChain.map((record, index) => ({
      step: index + 1,
      action: record.action_type,
      actor: record.actor,
      timestamp: record.timestamp,
      blockchainRecorded: record.tx_hash !== null,
      blockNumber: record.block_number,
      txHash: record.tx_hash,
      blockHash: record.block_hash,
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    }));

    res.json({
      success: true,
      data: {
        report: report,
        chain: chain,
        totalSteps: chain.length,
        blockchainRecords: chain.filter(c => c.blockchainRecorded).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting provenance chain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provenance chain',
      message: error.message
    });
  }
});

// Verify provenance integrity
router.post('/verify/:reportId', async (req, res) => {
  try {
    const reportId = req.params.reportId;

    // Get report
    const report = await db.findOne(
      'SELECT * FROM stix_reports WHERE id = ?',
      [reportId]
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Get all blockchain transactions
    const transactions = await db.query(
      'SELECT * FROM blockchain_transactions WHERE report_id = ? AND status = "confirmed"',
      [reportId]
    );

    // Get all provenance records
    const provenanceRecords = await db.query(
      'SELECT * FROM provenance_records WHERE report_id = ?',
      [reportId]
    );

    // Verify hash integrity
    const currentHash = crypto
      .createHash('sha256')
      .update(report.content)
      .digest('hex');

    const hashMatch = currentHash === report.hash;

    // Check blockchain records
    const blockchainVerified = transactions.length > 0 && 
                               transactions.every(tx => tx.status === 'confirmed');

    // Check provenance completeness
    const hasCreationRecord = provenanceRecords.some(pr => pr.action_type === 'created');

    const verified = hashMatch && blockchainVerified && hasCreationRecord;

    res.json({
      success: true,
      data: {
        verified: verified,
        checks: {
          hashIntegrity: hashMatch,
          blockchainRecorded: blockchainVerified,
          provenanceComplete: hasCreationRecord
        },
        details: {
          currentHash: currentHash,
          originalHash: report.hash,
          blockchainTransactions: transactions.length,
          provenanceRecords: provenanceRecords.length
        },
        message: verified ? 'Provenance verified successfully' : 'Provenance verification failed'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying provenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify provenance',
      message: error.message
    });
  }
});

// Get provenance statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.findOne(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT report_id) as reports_tracked,
        COUNT(DISTINCT actor) as unique_actors
      FROM provenance_records
    `);

    const actionStats = await db.query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM provenance_records
      GROUP BY action_type
    `);

    const recentActivity = await db.query(`
      SELECT 
        pr.action_type,
        pr.actor,
        pr.timestamp,
        sr.title as report_title
      FROM provenance_records pr
      LEFT JOIN stix_reports sr ON pr.report_id = sr.id
      ORDER BY pr.timestamp DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        overview: stats,
        byAction: actionStats,
        recentActivity: recentActivity
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting provenance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provenance statistics',
      message: error.message
    });
  }
});

module.exports = router;