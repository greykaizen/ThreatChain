const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');

// TAXII 2.1 Media Types
const TAXII_MEDIA_TYPE = 'application/taxii+json;version=2.1';
const STIX_MEDIA_TYPE = 'application/stix+json;version=2.1';

// Middleware to set TAXII headers
router.use((req, res, next) => {
  res.setHeader('X-TAXII-Date-Added-First', new Date().toISOString());
  res.setHeader('X-TAXII-Date-Added-Last', new Date().toISOString());
  next();
});

// Helper: Get collection metadata
async function getCollectionStats(collectionId) {
  let whereClause = '';
  
  if (collectionId === 'malware-reports') {
    whereClause = "WHERE content LIKE '%malware%' OR content LIKE '%trojan%' OR content LIKE '%ransomware%'";
  } else if (collectionId === 'apt-campaigns') {
    whereClause = "WHERE content LIKE '%campaign%' OR content LIKE '%apt%' OR content LIKE '%threat-actor%'";
  } else if (collectionId === 'indicators') {
    whereClause = "WHERE content LIKE '%indicator%' OR content LIKE '%observable%'";
  }
  
  const stats = await db.findOne(`
    SELECT 
      COUNT(*) as count,
      MIN(created_at) as first_added,
      MAX(updated_at) as last_added
    FROM stix_reports
    ${whereClause}
  `);
  
  return stats;
}

// Discovery Endpoint
router.get('/', (req, res) => {
  res.setHeader('Content-Type', TAXII_MEDIA_TYPE);
  res.json({
    title: 'ThreatChain TAXII 2.1 Server',
    description: 'Blockchain-verified threat intelligence sharing platform',
    contact: 'security@threatchain.io',
    default: 'https://threatchain.io/taxii2/threatchain/',
    api_roots: [
      'https://threatchain.io/taxii2/threatchain/'
    ]
  });
});

// API Root Endpoint
router.get('/threatchain/', async (req, res) => {
  try {
    res.setHeader('Content-Type', TAXII_MEDIA_TYPE);
    res.json({
      title: 'ThreatChain Intelligence Feed',
      description: 'Curated threat intelligence with blockchain verification',
      versions: ['application/taxii+json;version=2.1'],
      max_content_length: 10485760, // 10MB
      collections: [
        `${req.protocol}://${req.get('host')}/api/taxii/threatchain/collections/`
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Collections List Endpoint
router.get('/threatchain/collections/', async (req, res) => {
  try {
    const malwareStats = await getCollectionStats('malware-reports');
    const aptStats = await getCollectionStats('apt-campaigns');
    const indicatorStats = await getCollectionStats('indicators');
    const allStats = await db.findOne('SELECT COUNT(*) as count, MIN(created_at) as first_added, MAX(updated_at) as last_added FROM stix_reports');

    res.setHeader('Content-Type', TAXII_MEDIA_TYPE);
    res.json({
      collections: [
        {
          id: 'all-threats',
          title: 'All Threat Intelligence',
          description: 'Complete feed of all threat intelligence reports with blockchain verification',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: allStats.count || 0
        },
        {
          id: 'malware-reports',
          title: 'Malware Reports',
          description: 'Malware analysis, ransomware, trojans, and malicious software intelligence',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: malwareStats.count || 0
        },
        {
          id: 'apt-campaigns',
          title: 'APT Campaigns',
          description: 'Advanced Persistent Threats and campaign tracking',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: aptStats.count || 0
        },
        {
          id: 'indicators',
          title: 'Threat Indicators',
          description: 'Indicators of Compromise (IOCs) and observables',
          can_read: true,
          can_write: false,
          media_types: [STIX_MEDIA_TYPE],
          objects_count: indicatorStats.count || 0
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Collection by ID
router.get('/threatchain/collections/:collectionId/', async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    const collections = {
      'all-threats': {
        id: 'all-threats',
        title: 'All Threat Intelligence',
        description: 'Complete feed of all threat intelligence reports with blockchain verification',
        can_read: true,
        can_write: false,
        media_types: [STIX_MEDIA_TYPE]
      },
      'malware-reports': {
        id: 'malware-reports',
        title: 'Malware Reports',
        description: 'Malware analysis, ransomware, trojans, and malicious software intelligence',
        can_read: true,
        can_write: false,
        media_types: [STIX_MEDIA_TYPE]
      },
      'apt-campaigns': {
        id: 'apt-campaigns',
        title: 'APT Campaigns',
        description: 'Advanced Persistent Threats and campaign tracking',
        can_read: true,
        can_write: false,
        media_types: [STIX_MEDIA_TYPE]
      },
      'indicators': {
        id: 'indicators',
        title: 'Threat Indicators',
        description: 'Indicators of Compromise (IOCs) and observables',
        can_read: true,
        can_write: false,
        media_types: [STIX_MEDIA_TYPE]
      }
    };

    const collection = collections[collectionId];
    if (!collection) {
      return res.status(404).json({ 
        title: 'Not Found',
        description: 'Collection not found' 
      });
    }

    const stats = await getCollectionStats(collectionId);
    collection.objects_count = stats.count || 0;

    res.setHeader('Content-Type', TAXII_MEDIA_TYPE);
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Objects from Collection (Main TAXII endpoint)
router.get('/threatchain/collections/:collectionId/objects/', async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const addedAfter = req.query.added_after;
    const offset = req.query.next ? parseInt(req.query.next) : 0;

    // Validate collection
    const validCollections = ['all-threats', 'malware-reports', 'apt-campaigns', 'indicators'];
    if (!validCollections.includes(collectionId)) {
      return res.status(404).json({
        title: 'Not Found',
        description: 'Collection not found'
      });
    }

    // Fetch reports based on collection type (using template literals like original STIX endpoint)
    let reports = [];
    const fetchLimit = limit + 1;
    
    if (collectionId === 'all-threats') {
      if (addedAfter) {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE created_at > ? 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          [new Date(addedAfter)]
        );
      } else {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`
        );
      }
    } else if (collectionId === 'malware-reports') {
      if (addedAfter) {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE (content LIKE ? OR content LIKE ? OR content LIKE ?) AND created_at > ? 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          ['%malware%', '%trojan%', '%ransomware%', new Date(addedAfter)]
        );
      } else {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE (content LIKE ? OR content LIKE ? OR content LIKE ?) 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          ['%malware%', '%trojan%', '%ransomware%']
        );
      }
    } else if (collectionId === 'apt-campaigns') {
      if (addedAfter) {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE (content LIKE ? OR content LIKE ? OR content LIKE ?) AND created_at > ? 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          ['%campaign%', '%apt%', '%threat-actor%', new Date(addedAfter)]
        );
      } else {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE (content LIKE ? OR content LIKE ? OR content LIKE ?) 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          ['%campaign%', '%apt%', '%threat-actor%']
        );
      }
    } else if (collectionId === 'indicators') {
      if (addedAfter) {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE (content LIKE ? OR content LIKE ?) AND created_at > ? 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          ['%indicator%', '%observable%', new Date(addedAfter)]
        );
      } else {
        reports = await db.query(
          `SELECT id, content, hash, created_at, updated_at 
           FROM stix_reports 
           WHERE (content LIKE ? OR content LIKE ?) 
           ORDER BY created_at DESC 
           LIMIT ${fetchLimit} OFFSET ${offset}`,
          ['%indicator%', '%observable%']
        );
      }
    }

    // Check if there are more results
    const hasMore = reports.length > limit;
    const returnReports = hasMore ? reports.slice(0, limit) : reports;

    // Build STIX objects array with blockchain metadata
    const stixObjects = [];
    
    for (const report of returnReports) {
      const stixContent = JSON.parse(report.content);
      
      // Get blockchain verification data
      const blockchainTx = await db.findOne(
        'SELECT tx_hash, block_number, gas_used, timestamp, status FROM blockchain_transactions WHERE report_hash = ? AND status = ? ORDER BY timestamp DESC LIMIT 1',
        [report.hash, 'confirmed']
      );

      // Add blockchain metadata to each STIX object
      if (stixContent.objects && Array.isArray(stixContent.objects)) {
        for (const obj of stixContent.objects) {
          stixObjects.push({
            ...obj,
            x_threatchain_blockchain: {
              verified: !!blockchainTx,
              tx_hash: blockchainTx?.tx_hash || null,
              block_number: blockchainTx?.block_number || null,
              timestamp: blockchainTx?.timestamp || null,
              report_hash: report.hash
            }
          });
        }
      } else if (stixContent.type) {
        stixObjects.push({
          ...stixContent,
          x_threatchain_blockchain: {
            verified: !!blockchainTx,
            tx_hash: blockchainTx?.tx_hash || null,
            block_number: blockchainTx?.block_number || null,
            timestamp: blockchainTx?.timestamp || null,
            report_hash: report.hash
          }
        });
      }
    }

    // Build TAXII envelope
    const envelope = {
      more: hasMore,
      objects: stixObjects
    };

    if (hasMore) {
      envelope.next = (offset + limit).toString();
    }

    // Set TAXII headers
    res.setHeader('Content-Type', STIX_MEDIA_TYPE);
    if (returnReports.length > 0) {
      res.setHeader('X-TAXII-Date-Added-First', returnReports[returnReports.length - 1].created_at);
      res.setHeader('X-TAXII-Date-Added-Last', returnReports[0].created_at);
    }

    res.json(envelope);
  } catch (error) {
    console.error('TAXII objects error:', error);
    res.status(500).json({ 
      title: 'Internal Server Error',
      description: error.message 
    });
  }
});

// Get Individual Object by ID
router.get('/threatchain/collections/:collectionId/objects/:objectId/', async (req, res) => {
  try {
    const { collectionId, objectId } = req.params;

    // Validate collection
    const validCollections = ['all-threats', 'malware-reports', 'apt-campaigns', 'indicators'];
    if (!validCollections.includes(collectionId)) {
      return res.status(404).json({
        title: 'Not Found',
        description: 'Collection not found'
      });
    }

    // Fetch report based on collection type (simple static queries)
    let report = null;
    
    if (collectionId === 'all-threats') {
      report = await db.findOne(
        'SELECT id, content, hash, created_at FROM stix_reports WHERE content LIKE ? LIMIT 1',
        [`%"id":"${objectId}"%`]
      );
    } else if (collectionId === 'malware-reports') {
      report = await db.findOne(
        'SELECT id, content, hash, created_at FROM stix_reports WHERE content LIKE ? AND (content LIKE ? OR content LIKE ? OR content LIKE ?) LIMIT 1',
        [`%"id":"${objectId}"%`, '%malware%', '%trojan%', '%ransomware%']
      );
    } else if (collectionId === 'apt-campaigns') {
      report = await db.findOne(
        'SELECT id, content, hash, created_at FROM stix_reports WHERE content LIKE ? AND (content LIKE ? OR content LIKE ? OR content LIKE ?) LIMIT 1',
        [`%"id":"${objectId}"%`, '%campaign%', '%apt%', '%threat-actor%']
      );
    } else if (collectionId === 'indicators') {
      report = await db.findOne(
        'SELECT id, content, hash, created_at FROM stix_reports WHERE content LIKE ? AND (content LIKE ? OR content LIKE ?) LIMIT 1',
        [`%"id":"${objectId}"%`, '%indicator%', '%observable%']
      );
    }

    if (!report) {
      return res.status(404).json({
        title: 'Not Found',
        description: 'Object not found in collection'
      });
    }

    const stixContent = JSON.parse(report.content);
    
    // Find the specific object
    let targetObject = null;
    if (stixContent.objects && Array.isArray(stixContent.objects)) {
      targetObject = stixContent.objects.find(obj => obj.id === objectId);
    } else if (stixContent.id === objectId) {
      targetObject = stixContent;
    }

    if (!targetObject) {
      return res.status(404).json({
        title: 'Not Found',
        description: 'Object not found'
      });
    }

    // Get blockchain verification
    const blockchainTx = await db.findOne(
      'SELECT tx_hash, block_number, gas_used, timestamp, status FROM blockchain_transactions WHERE report_hash = ? AND status = ? ORDER BY timestamp DESC LIMIT 1',
      [report.hash, 'confirmed']
    );

    // Add blockchain metadata
    const enrichedObject = {
      ...targetObject,
      x_threatchain_blockchain: {
        verified: !!blockchainTx,
        tx_hash: blockchainTx?.tx_hash || null,
        block_number: blockchainTx?.block_number || null,
        timestamp: blockchainTx?.timestamp || null,
        report_hash: report.hash
      }
    };

    res.setHeader('Content-Type', STIX_MEDIA_TYPE);
    res.setHeader('X-TAXII-Date-Added-First', report.created_at);
    res.setHeader('X-TAXII-Date-Added-Last', report.created_at);
    
    res.json(enrichedObject);
  } catch (error) {
    console.error('TAXII object error:', error);
    res.status(500).json({
      title: 'Internal Server Error',
      description: error.message
    });
  }
});

// Status endpoint
router.get('/status', async (req, res) => {
  try {
    const totalReports = await db.findOne('SELECT COUNT(*) as count FROM stix_reports');
    const totalTransactions = await db.findOne('SELECT COUNT(*) as count FROM blockchain_transactions WHERE status = "confirmed"');
    
    res.setHeader('Content-Type', TAXII_MEDIA_TYPE);
    res.json({
      title: 'ThreatChain TAXII Server Status',
      status: 'operational',
      version: '2.1',
      statistics: {
        total_reports: totalReports.count,
        blockchain_verified: totalTransactions.count,
        collections: 4
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
