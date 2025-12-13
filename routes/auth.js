const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'threadchain-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Helper function to generate API key
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Register Individual User
router.post('/register/individual', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if email already exists
    const existing = await db.findOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Create user
    await db.query(
      `INSERT INTO users (id, first_name, last_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'individual', 'active')`,
      [userId, firstName, lastName, email, phone || null, passwordHash]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email: email, 
        role: 'individual',
        type: 'user'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        userId: userId,
        email: email,
        role: 'individual',
        token: token
      },
      message: 'Individual account created successfully'
    });
  } catch (error) {
    console.error('Error registering individual:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register individual',
      message: error.message
    });
  }
});

// Register Organization
router.post('/register/organization', async (req, res) => {
  try {
    const { 
      orgName, 
      adminFirstName, 
      adminLastName, 
      email, 
      phone, 
      address, 
      password 
    } = req.body;

    if (!orgName || !adminFirstName || !adminLastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if email already exists
    const existing = await db.findOne(
      'SELECT id FROM organizations WHERE email = ?',
      [email]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const orgId = crypto.randomUUID();
    const apiKey = generateApiKey();

    // Create organization
    await db.query(
      `INSERT INTO organizations 
       (id, org_name, admin_first_name, admin_last_name, email, phone, address, password_hash, api_key, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [orgId, orgName, adminFirstName, adminLastName, email, phone || null, address || null, passwordHash, apiKey]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: orgId, 
        email: email, 
        orgName: orgName,
        type: 'organization'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        organizationId: orgId,
        orgName: orgName,
        email: email,
        apiKey: apiKey,
        token: token
      },
      message: 'Organization account created successfully'
    });
  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register organization',
      message: error.message
    });
  }
});

// Login Individual
router.post('/login/individual', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await db.findOne(
      'SELECT * FROM users WHERE email = ? AND role = "individual"',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        type: 'user'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        token: token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in individual:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: error.message
    });
  }
});

// Login Organization
router.post('/login/organization', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find organization
    const org = await db.findOne(
      'SELECT * FROM organizations WHERE email = ?',
      [email]
    );

    if (!org) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (org.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Organization account is inactive'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, org.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: org.id, 
        email: org.email, 
        orgName: org.org_name,
        type: 'organization'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        organizationId: org.id,
        orgName: org.org_name,
        email: org.email,
        apiKey: org.api_key,
        token: token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in organization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: error.message
    });
  }
});

// Get current user/organization info
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type === 'organization') {
      const org = await db.findOne(
        'SELECT id, org_name, admin_first_name, admin_last_name, email, phone, address, api_key, status, created_at FROM organizations WHERE id = ?',
        [decoded.id]
      );

      if (!org) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      res.json({
        success: true,
        data: {
          type: 'organization',
          ...org
        }
      });
    } else {
      const user = await db.findOne(
        'SELECT id, organization_id, first_name, last_name, email, phone, role, status, created_at FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          type: 'user',
          ...user
        }
      });
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      message: error.message
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
