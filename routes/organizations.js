const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

// Get all organizations with statistics
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Fetch all organizations
    const organizations = await db.query(`
      SELECT 
        o.id,
        o.org_name,
        o.admin_first_name,
        o.admin_last_name,
        o.email,
        o.phone,
        o.address,
        o.status,
        o.created_at,
        COUNT(DISTINCT sr.id) as reports_shared,
        MAX(sr.created_at) as last_activity
      FROM organizations o
      LEFT JOIN stix_reports sr ON o.id = sr.organization_id
      WHERE o.id != 'system-legacy'
      GROUP BY o.id
      ORDER BY reports_shared DESC
    `);

    // Calculate trust scores based on activity
    const orgsWithStats = organizations.map(org => {
      const daysSinceJoin = Math.floor((Date.now() - new Date(org.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const reportsShared = org.reports_shared || 0;
      
      // Simple trust score calculation
      let trustScore = 50; // Base score
      trustScore += Math.min(reportsShared * 2, 30); // Up to 30 points for reports
      trustScore += Math.min(daysSinceJoin / 10, 20); // Up to 20 points for longevity
      trustScore = Math.min(Math.round(trustScore), 100);

      // Calculate last activity
      let lastActivity = 'Never';
      if (org.last_activity) {
        const hoursSince = Math.floor((Date.now() - new Date(org.last_activity).getTime()) / (1000 * 60 * 60));
        if (hoursSince < 1) lastActivity = 'Just now';
        else if (hoursSince < 24) lastActivity = `${hoursSince} hours ago`;
        else if (hoursSince < 48) lastActivity = '1 day ago';
        else lastActivity = `${Math.floor(hoursSince / 24)} days ago`;
      }

      return {
        id: org.id,
        name: org.org_name,
        type: 'Private', // Default type, can be enhanced
        country: org.address || 'Unknown',
        status: org.status === 'active' ? 'Active' : org.status === 'inactive' ? 'Inactive' : 'Pending',
        joinDate: org.created_at,
        lastActivity: lastActivity,
        trustScore: trustScore,
        reportsShared: reportsShared,
        reportsReceived: 0, // Can be calculated if needed
        specialization: ['Threat Intelligence', 'STIX Reports'],
        contactPerson: `${org.admin_first_name} ${org.admin_last_name}`,
        email: org.email,
        phone: org.phone
      };
    });

    res.json({
      success: true,
      data: {
        organizations: orgsWithStats,
        total: orgsWithStats.length,
        active: orgsWithStats.filter(o => o.status === 'Active').length,
        pending: orgsWithStats.filter(o => o.status === 'Pending').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch organizations',
      message: error.message
    });
  }
});

// Get organization statistics
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const stats = await db.findOne(`
      SELECT 
        COUNT(DISTINCT o.id) as total_organizations,
        COUNT(DISTINCT CASE WHEN o.status = 'active' THEN o.id END) as active_organizations,
        COUNT(DISTINCT sr.id) as total_reports,
        SUM(sr.indicators_count) as total_indicators
      FROM organizations o
      LEFT JOIN stix_reports sr ON o.id = sr.organization_id
      WHERE o.id != 'system-legacy'
    `);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Get recent activity
router.get('/activity', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const activities = await db.query(`
      SELECT 
        pr.id,
        pr.action_type,
        pr.actor,
        pr.timestamp,
        sr.title as report_title,
        sr.indicators_count,
        o.org_name as organization
      FROM provenance_records pr
      JOIN stix_reports sr ON pr.report_id = sr.id
      LEFT JOIN organizations o ON sr.organization_id = o.id
      WHERE o.id IS NOT NULL AND o.id != 'system-legacy'
      ORDER BY pr.timestamp DESC
      LIMIT ${limit}
    `);

    const formattedActivities = activities.map(act => ({
      id: act.id,
      organization: act.organization || act.actor,
      action: act.action_type === 'created' ? 'Shared Report' : 
              act.action_type === 'updated' ? 'Updated Report' :
              act.action_type === 'verified' ? 'Verified Report' : 'Shared Report',
      reportTitle: act.report_title,
      timestamp: new Date(act.timestamp).toLocaleString(),
      indicators: act.indicators_count || 0,
      trustImpact: act.action_type === 'created' ? 2 : act.action_type === 'verified' ? 1 : 0
    }));

    res.json({
      success: true,
      data: {
        activities: formattedActivities
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
      message: error.message
    });
  }
});

module.exports = router;
