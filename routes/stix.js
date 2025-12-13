const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const blockchain = require('../blockchain/SimpleBlockchain');
const ethereumService = require('../blockchain/EthereumService');
const multer = require('multer');
const path = require('path');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'stix-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Helper function to generate hash
function generateHash(content) {
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

// Upload and process STIX report
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    let stixContent;

    try {
      stixContent = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format'
      });
    }

    // Extract STIX metadata
    const stixVersion = stixContent.spec_version || '2.1';
    const reportType = stixContent.type || 'bundle';
    const objectsCount = stixContent.objects ? stixContent.objects.length : 0;

    // Generate hash
    const reportHash = generateHash(stixContent);

    // Generate unique ID
    const reportId = crypto.randomUUID();

    // Check if report with this hash already exists
    const existing = await db.findOne(
      'SELECT id, title, created_at FROM stix_reports WHERE hash = ?',
      [reportHash]
    );

    if (existing) {
      // Clean up the uploaded file since it's a duplicate
      fs.unlinkSync(req.file.path);
      
      return res.status(409).json({
        success: false,
        error: 'Duplicate report detected',
        message: `A report with identical content already exists in the database. Original report "${existing.title}" was uploaded on ${new Date(existing.created_at).toLocaleString()}.`,
        existingReport: {
          id: existing.id,
          title: existing.title,
          uploadedAt: existing.created_at
        }
      });
    }

    // Get user/organization info from token
    const organizationId = req.user.type === 'organization' ? req.user.id : null;
    const userId = req.user.type === 'user' ? req.user.id : null;

    // Save to database with duplicate handling
    try {
      await db.query(
        `INSERT INTO stix_reports 
         (id, title, description, content, file_name, file_size, hash, stix_version, report_type, indicators_count, organization_id, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reportId,
          req.body.title || `STIX Report ${Date.now()}`,
          req.body.description || 'Uploaded STIX report',
          JSON.stringify(stixContent),
          req.file.originalname,
          req.file.size,
          reportHash,
          stixVersion,
          reportType,
          objectsCount,
          organizationId,
          userId
        ]
      );
    } catch (dbError) {
      // Handle race condition where duplicate was inserted between check and insert
      if (dbError.code === 'ER_DUP_ENTRY') {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        
        // Fetch the existing report details
        const existing = await db.findOne(
          'SELECT id, title, created_at FROM stix_reports WHERE hash = ?',
          [reportHash]
        );
        
        return res.status(409).json({
          success: false,
          error: 'Duplicate report detected',
          message: `A report with identical content already exists in the database. Original report "${existing?.title || 'Unknown'}" was uploaded on ${existing ? new Date(existing.created_at).toLocaleString() : 'unknown date'}.`,
          existingReport: existing ? {
            id: existing.id,
            title: existing.title,
            uploadedAt: existing.created_at
          } : null
        });
      }
      throw dbError; // Re-throw if it's not a duplicate error
    }

    // Submit to Ethereum first (if enabled) to get real gas data
    let ethereumResult = null;
    let gasUsed = 0;
    let gasPrice = 0;
    let gasFee = 0;

    if (ethereumService.isEnabled) {
      ethereumResult = await ethereumService.registerReportHash(reportHash, reportId);
      
      // Extract real gas data from Ethereum transaction
      if (ethereumResult.success && ethereumResult.gasUsed) {
        gasUsed = parseInt(ethereumResult.gasUsed);
        // Get gas price from Ethereum (will be 0 on private network)
        gasPrice = ethereumResult.gasPrice || 0;
        gasFee = ethereumResult.gasFee || 0;
      }
    }

    // Submit to local blockchain with gas data
    const blockchainResult = await blockchain.addSTIXTransaction(reportHash, reportId, {
      fileName: req.file.originalname,
      stixVersion: stixVersion,
      objectsCount: objectsCount,
      gasUsed: gasUsed,
      gasPrice: gasPrice,
      gasFee: gasFee
    });

    // Create provenance record with actor info
    const actorInfo = req.user.type === 'organization' 
      ? req.user.orgName 
      : `${req.user.email}`;

    await db.query(
      `INSERT INTO provenance_records 
       (id, report_id, blockchain_tx_id, action_type, actor, metadata) 
       VALUES (?, ?, ?, 'created', ?, ?)`,
      [
        crypto.randomUUID(),
        reportId,
        blockchainResult.transactionId,
        actorInfo,
        JSON.stringify({ 
          uploadedAt: new Date().toISOString(),
          ethereumTx: ethereumResult?.txHash || null,
          uploadedBy: req.user.type,
          uploaderId: req.user.id
        })
      ]
    );

    res.json({
      success: true,
      data: {
        reportId: reportId,
        reportHash: reportHash,
        stixVersion: stixVersion,
        objectsCount: objectsCount,
        fileSize: req.file.size,
        blockchain: blockchainResult,
        ethereum: ethereumResult
      },
      message: 'STIX report uploaded and recorded on blockchain',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading STIX report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload STIX report',
      message: error.message
    });
  }
});

// Get all STIX reports
router.get('/reports', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Show all reports to everyone (threat intelligence sharing)
    const reports = await db.query(
      `SELECT 
        id,
        title,
        description,
        file_name,
        file_size,
        hash,
        stix_version,
        report_type,
        severity,
        indicators_count,
        organization_id,
        user_id,
        created_at,
        updated_at
      FROM stix_reports 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}`
    );

    const totalReports = await db.findOne(
      `SELECT COUNT(*) as count FROM stix_reports`
    );

    res.json({
      success: true,
      data: {
        reports: reports,
        pagination: {
          page: page,
          limit: limit,
          total: totalReports.count,
          pages: Math.ceil(totalReports.count / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
      message: error.message
    });
  }
});

// Get specific STIX report
router.get('/reports/:id', optionalAuth, async (req, res) => {
  try {
    const reportId = req.params.id;

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

    // Allow everyone to view all reports (threat intelligence sharing)

    // Get blockchain transactions for this report
    const transactions = await blockchain.getTransactionsByReportId(reportId);

    // Get provenance records
    const provenance = await db.query(
      'SELECT * FROM provenance_records WHERE report_id = ? ORDER BY timestamp DESC',
      [reportId]
    );

    res.json({
      success: true,
      data: {
        report: report,
        blockchain: transactions,
        provenance: provenance
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report',
      message: error.message
    });
  }
});

// Verify STIX report integrity
router.post('/verify/:id', async (req, res) => {
  try {
    const reportId = req.params.id;

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

    // Recalculate hash
    const currentHash = generateHash(JSON.parse(report.content));
    const originalHash = report.hash;

    // Check blockchain
    const transaction = await db.findOne(
      'SELECT * FROM blockchain_transactions WHERE report_id = ? AND status = "confirmed" ORDER BY timestamp DESC LIMIT 1',
      [reportId]
    );

    const verified = currentHash === originalHash && transaction !== null;

    res.json({
      success: true,
      data: {
        verified: verified,
        currentHash: currentHash,
        originalHash: originalHash,
        hashMatch: currentHash === originalHash,
        blockchainRecorded: transaction !== null,
        transaction: transaction,
        message: verified ? 'Report integrity verified' : 'Report integrity check failed'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify report',
      message: error.message
    });
  }
});

// Delete STIX report
router.delete('/reports/:id', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;

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

    // Check ownership
    const hasAccess = 
      (req.user.type === 'organization' && report.organization_id === req.user.id) ||
      (req.user.type === 'user' && report.user_id === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to delete this report'
      });
    }

    // Delete report (cascade will delete related records)
    await db.delete('stix_reports', 'id = ?', [reportId]);

    res.json({
      success: true,
      message: 'Report deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      message: error.message
    });
  }
});

// Convert knowledge graph to STIX
router.post('/convert', optionalAuth, async (req, res) => {
  try {
    const { stixBundle, knowledgeGraph, sourceData } = req.body;

    if (!stixBundle || !knowledgeGraph) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data'
      });
    }

    // Generate hash for the bundle
    const reportHash = generateHash(stixBundle);
    const reportId = crypto.randomUUID();

    // Get user/organization info from token (if authenticated)
    const organizationId = req.user && req.user.type === 'organization' ? req.user.id : 'system-legacy';
    const userId = req.user && req.user.type === 'user' ? req.user.id : null;

    // Save to database
    await db.query(
      `INSERT INTO stix_reports 
       (id, title, description, content, file_name, file_size, hash, stix_version, report_type, indicators_count, organization_id, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        `Knowledge Graph Export - ${new Date().toLocaleDateString()}`,
        `Generated from knowledge graph with ${knowledgeGraph.nodes.length} nodes and ${knowledgeGraph.relationships.length} relationships`,
        JSON.stringify(stixBundle),
        sourceData.fileName || 'knowledge-graph-export.json',
        JSON.stringify(stixBundle).length,
        reportHash,
        stixBundle.spec_version || '2.1',
        'bundle',
        stixBundle.objects ? stixBundle.objects.length : 0,
        organizationId,
        userId
      ]
    );

    // Submit to Ethereum first (if enabled) to get real gas data
    let ethereumResult = null;
    let gasUsed = 0;
    let gasPrice = 0;
    let gasFee = 0;

    if (ethereumService.isEnabled) {
      ethereumResult = await ethereumService.registerReportHash(reportHash, reportId);
      
      // Extract real gas data from Ethereum transaction
      if (ethereumResult.success && ethereumResult.gasUsed) {
        gasUsed = parseInt(ethereumResult.gasUsed);
        gasPrice = ethereumResult.gasPrice || 0;
        gasFee = ethereumResult.gasFee || 0;
      }
    }

    // Submit to local blockchain with gas data
    const blockchainResult = await blockchain.addSTIXTransaction(reportHash, reportId, {
      fileName: sourceData.fileName,
      knowledgeGraph: {
        nodes: knowledgeGraph.nodes.length,
        edges: knowledgeGraph.edges.length,
        relationships: knowledgeGraph.relationships.length
      },
      sourceRows: sourceData.rowCount,
      gasUsed: gasUsed,
      gasPrice: gasPrice,
      gasFee: gasFee
    });

    // Create provenance record with actor info
    const actorInfo = req.user.type === 'organization' 
      ? req.user.orgName 
      : `${req.user.email}`;

    await db.query(
      `INSERT INTO provenance_records 
       (id, report_id, blockchain_tx_id, action_type, actor, metadata) 
       VALUES (?, ?, ?, 'created', ?, ?)`,
      [
        crypto.randomUUID(),
        reportId,
        blockchainResult.transactionId,
        actorInfo,
        JSON.stringify({ 
          convertedAt: new Date().toISOString(),
          knowledgeGraph: knowledgeGraph,
          ethereumTx: ethereumResult?.txHash || null,
          convertedBy: req.user.type,
          converterId: req.user.id
        })
      ]
    );

    res.json({
      success: true,
      data: {
        reportId: reportId,
        reportHash: reportHash,
        stixVersion: stixBundle.spec_version || '2.1',
        objectsCount: stixBundle.objects ? stixBundle.objects.length : 0,
        knowledgeGraph: {
          nodes: knowledgeGraph.nodes.length,
          edges: knowledgeGraph.edges.length,
          relationships: knowledgeGraph.relationships.length
        },
        blockchain: blockchainResult,
        ethereum: ethereumResult
      },
      message: 'Knowledge graph converted to STIX and recorded on blockchain',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error converting to STIX:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert to STIX',
      message: error.message
    });
  }
});

// Get STIX statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.findOne(`
      SELECT 
        COUNT(*) as total_reports,
        SUM(indicators_count) as total_indicators,
        COUNT(DISTINCT stix_version) as stix_versions,
        AVG(file_size) as avg_file_size
      FROM stix_reports
    `);

    const typeStats = await db.query(`
      SELECT 
        report_type,
        COUNT(*) as count
      FROM stix_reports
      GROUP BY report_type
    `);

    const severityStats = await db.query(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM stix_reports
      WHERE severity IS NOT NULL
      GROUP BY severity
    `);

    res.json({
      success: true,
      data: {
        overview: stats,
        byType: typeStats,
        bySeverity: severityStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting STIX stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get STIX statistics',
      message: error.message
    });
  }
});

module.exports = router;