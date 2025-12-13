const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const blockchainRoutes = require('./routes/blockchain');
const stixRoutes = require('./routes/stix');
const provenanceRoutes = require('./routes/provenance');
const metricsRoutes = require('./routes/metrics');
const taxiiRoutes = require('./routes/taxii');
const organizationsRoutes = require('./routes/organizations');
const feedExtractorRoutes = require('./routes/feed-extractor');

// Import database
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.xml', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, XML, and CSV files are allowed.'));
    }
  }
});

// Make upload middleware available globally
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/stix', stixRoutes);
app.use('/api/provenance', provenanceRoutes);
app.use('/api/blockchain/metrics', metricsRoutes);
app.use('/api/taxii', taxiiRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/feed-extractor', feedExtractorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      blockchain: 'active',
      api: 'running'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ThreadChain Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Blockchain API: http://localhost:${PORT}/api/blockchain`);
  console.log(`📄 STIX API: http://localhost:${PORT}/api/stix`);
  console.log(`🔒 Provenance API: http://localhost:${PORT}/api/provenance`);
  console.log(`📈 Metrics API: http://localhost:${PORT}/api/blockchain/metrics`);
  console.log(`🌐 TAXII 2.1 Server: http://localhost:${PORT}/api/taxii`);
});

module.exports = app;