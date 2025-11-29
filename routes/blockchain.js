const express = require('express');
const router = express.Router();
const blockchain = require('../blockchain/SimpleBlockchain');
const db = require('../config/database');

// Get blockchain statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await blockchain.getBlockchainStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting blockchain stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blockchain statistics',
      message: error.message
    });
  }
});

// Get all blocks
router.get('/blocks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const blocks = await db.query(
      `SELECT 
        block_number,
        block_hash,
        previous_hash,
        timestamp,
        transactions_count,
        nonce,
        difficulty
      FROM blockchain_blocks 
      ORDER BY block_number DESC 
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const totalBlocks = await db.findOne('SELECT COUNT(*) as count FROM blockchain_blocks');

    res.json({
      success: true,
      data: {
        blocks: blocks,
        pagination: {
          page: page,
          limit: limit,
          total: totalBlocks.count,
          pages: Math.ceil(totalBlocks.count / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting blocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get blocks',
      message: error.message
    });
  }
});

// Get specific block by number
router.get('/blocks/:blockNumber', async (req, res) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber);
    
    const block = await db.findOne(
      'SELECT * FROM blockchain_blocks WHERE block_number = ?',
      [blockNumber]
    );

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Block not found'
      });
    }

    // Get transactions in this block
    const transactions = await db.query(
      'SELECT * FROM blockchain_transactions WHERE block_number = ?',
      [blockNumber]
    );

    res.json({
      success: true,
      data: {
        block: block,
        transactions: transactions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get block',
      message: error.message
    });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const transactions = await db.query(
      `SELECT 
        bt.*,
        sr.title as report_title,
        sr.report_type
      FROM blockchain_transactions bt
      LEFT JOIN stix_reports sr ON bt.report_id = sr.id
      ${whereClause}
      ORDER BY bt.timestamp DESC 
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalQuery = `SELECT COUNT(*) as count FROM blockchain_transactions ${whereClause}`;
    const totalTransactions = await db.findOne(totalQuery, params);

    res.json({
      success: true,
      data: {
        transactions: transactions,
        pagination: {
          page: page,
          limit: limit,
          total: totalTransactions.count,
          pages: Math.ceil(totalTransactions.count / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions',
      message: error.message
    });
  }
});

// Get specific transaction by hash
router.get('/transactions/:txHash', async (req, res) => {
  try {
    const txHash = req.params.txHash;
    
    const transaction = await db.findOne(
      `SELECT 
        bt.*,
        sr.title as report_title,
        sr.description as report_description,
        sr.report_type,
        sr.severity
      FROM blockchain_transactions bt
      LEFT JOIN stix_reports sr ON bt.report_id = sr.id
      WHERE bt.tx_hash = ?`,
      [txHash]
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction',
      message: error.message
    });
  }
});

// Submit hash to blockchain
router.post('/submit', async (req, res) => {
  try {
    const { reportHash, reportId, metadata } = req.body;

    if (!reportHash || !reportId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportHash and reportId'
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

    // Add transaction to blockchain
    const result = await blockchain.addSTIXTransaction(reportHash, reportId, metadata);

    res.json({
      success: true,
      data: result,
      message: 'Hash successfully submitted to blockchain',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error submitting to blockchain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit to blockchain',
      message: error.message
    });
  }
});

// Verify hash on blockchain
router.post('/verify', async (req, res) => {
  try {
    const { reportHash } = req.body;

    if (!reportHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reportHash'
      });
    }

    // Find transaction with this hash
    const transaction = await db.findOne(
      `SELECT 
        bt.*,
        sr.title as report_title,
        sr.hash as current_hash
      FROM blockchain_transactions bt
      LEFT JOIN stix_reports sr ON bt.report_id = sr.id
      WHERE bt.report_hash = ?`,
      [reportHash]
    );

    if (!transaction) {
      return res.json({
        success: true,
        data: {
          verified: false,
          message: 'Hash not found on blockchain'
        }
      });
    }

    // Verify hash matches current report hash
    const hashMatches = transaction.current_hash === reportHash;

    res.json({
      success: true,
      data: {
        verified: hashMatches && transaction.status === 'confirmed',
        transaction: transaction,
        hashMatches: hashMatches,
        message: hashMatches ? 'Hash verified on blockchain' : 'Hash mismatch - report may have been modified'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying hash:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify hash',
      message: error.message
    });
  }
});

// Get blockchain health
router.get('/health', async (req, res) => {
  try {
    const isValid = blockchain.isChainValid();
    const stats = await blockchain.getBlockchainStats();

    res.json({
      success: true,
      data: {
        chainValid: isValid,
        status: isValid ? 'healthy' : 'corrupted',
        ...stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking blockchain health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check blockchain health',
      message: error.message
    });
  }
});

// ============ ETHEREUM ROUTES ============

const ethereumService = require('../blockchain/EthereumService');

// Get Ethereum status
router.get('/ethereum/status', async (req, res) => {
  try {
    const status = ethereumService.getStatus();
    const balance = await ethereumService.getBalance();
    const totalReports = await ethereumService.getTotalReports();

    res.json({
      success: true,
      data: {
        ...status,
        balance: balance,
        totalReports: totalReports
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Ethereum status',
      message: error.message
    });
  }
});

// Register hash on Ethereum
router.post('/ethereum/register', async (req, res) => {
  try {
    const { reportHash, reportId } = req.body;

    if (!reportHash || !reportId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportHash and reportId'
      });
    }

    if (!ethereumService.isEnabled) {
      return res.status(503).json({
        success: false,
        error: 'Ethereum integration not enabled'
      });
    }

    const result = await ethereumService.registerReportHash(reportHash, reportId);

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to register on Ethereum',
      message: error.message
    });
  }
});

// Verify hash on Ethereum
router.get('/ethereum/verify/:reportHash', async (req, res) => {
  try {
    const reportHash = req.params.reportHash;

    if (!ethereumService.isEnabled) {
      return res.status(503).json({
        success: false,
        error: 'Ethereum integration not enabled'
      });
    }

    const result = await ethereumService.verifyReportHash(reportHash);

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify on Ethereum',
      message: error.message
    });
  }
});

module.exports = router;