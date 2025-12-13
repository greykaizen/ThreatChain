const express = require('express');
const router = express.Router();
const axios = require('axios');

// TAXII source configurations
const TAXII_SOURCES = {
  'mitre-attack': {
    name: 'MITRE ATT&CK',
    discoveryUrl: 'https://cti-taxii.mitre.org/taxii/',
    apiRoot: 'https://cti-taxii.mitre.org/stix/collections/',
    collectionId: '95ecc380-afe9-11e4-9b6c-751b66dd541e', // enterprise-attack
    description: 'MITRE ATT&CK Enterprise Framework'
  },
  'circl-lu': {
    name: 'CIRCL.LU',
    discoveryUrl: 'https://www.circl.lu/taxii/',
    apiRoot: 'https://www.circl.lu/taxii/collections/',
    collectionId: null, // Will discover
    description: 'CIRCL Luxembourg Threat Intelligence'
  },
  'anomali-limo': {
    name: 'Anomali Limo',
    discoveryUrl: 'https://limo.anomali.com/api/v1/taxii2/taxii/',
    apiRoot: 'https://limo.anomali.com/api/v1/taxii2/feeds/collections/',
    collectionId: null, // Will discover
    description: 'Anomali Limo Free Threat Feed'
  }
};

// Fetch STIX reports from external TAXII server
router.post('/fetch', async (req, res) => {
  try {
    const { source } = req.body;

    if (!source || !TAXII_SOURCES[source]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source. Must be one of: mitre-attack, circl-lu, anomali-limo'
      });
    }

    const config = TAXII_SOURCES[source];
    console.log(`Fetching from ${config.name}...`);

    let reports = [];

    // Fetch from MITRE ATT&CK
    if (source === 'mitre-attack') {
      try {
        const objectsUrl = `${config.apiRoot}${config.collectionId}/objects/`;
        const response = await axios.get(objectsUrl, {
          headers: {
            'Accept': 'application/taxii+json;version=2.1'
          },
          timeout: 30000
        });

        const objects = response.data.objects || [];
        
        // Filter for reports and bundles
        const stixReports = objects.filter(obj => 
          obj.type === 'report' || 
          obj.type === 'bundle' ||
          obj.type === 'attack-pattern' ||
          obj.type === 'malware' ||
          obj.type === 'tool'
        );

        reports = stixReports.map(obj => ({
          id: obj.id,
          type: obj.type,
          name: obj.name || obj.title || 'Untitled',
          description: obj.description || 'No description available',
          created: obj.created || new Date().toISOString(),
          modified: obj.modified || obj.created || new Date().toISOString(),
          indicators_count: obj.object_refs?.length || 0,
          source: config.name,
          raw: obj
        }));

        console.log(`Fetched ${reports.length} objects from MITRE ATT&CK`);
      } catch (error) {
        console.error('MITRE ATT&CK fetch error:', error.message);
        return res.status(500).json({
          success: false,
          error: `Failed to fetch from MITRE ATT&CK: ${error.message}`
        });
      }
    }

    // Fetch from CIRCL.LU
    else if (source === 'circl-lu') {
      try {
        // First discover collections
        const discoveryResponse = await axios.get(config.discoveryUrl, {
          headers: {
            'Accept': 'application/taxii+json;version=2.1'
          },
          timeout: 30000
        });

        // Try to fetch from first available collection
        if (discoveryResponse.data.api_roots && discoveryResponse.data.api_roots.length > 0) {
          const apiRoot = discoveryResponse.data.api_roots[0];
          const collectionsUrl = `${apiRoot}collections/`;
          
          const collectionsResponse = await axios.get(collectionsUrl, {
            headers: {
              'Accept': 'application/taxii+json;version=2.1'
            },
            timeout: 30000
          });

          if (collectionsResponse.data.collections && collectionsResponse.data.collections.length > 0) {
            const firstCollection = collectionsResponse.data.collections[0];
            const objectsUrl = `${apiRoot}collections/${firstCollection.id}/objects/`;
            
            const objectsResponse = await axios.get(objectsUrl, {
              headers: {
                'Accept': 'application/taxii+json;version=2.1'
              },
              timeout: 30000
            });

            const objects = objectsResponse.data.objects || [];
            reports = objects.filter(obj => obj.type === 'report' || obj.type === 'bundle').map(obj => ({
              id: obj.id,
              type: obj.type,
              name: obj.name || obj.title || 'Untitled',
              description: obj.description || 'No description available',
              created: obj.created || new Date().toISOString(),
              modified: obj.modified || obj.created || new Date().toISOString(),
              indicators_count: obj.object_refs?.length || 0,
              source: config.name,
              raw: obj
            }));
          }
        }

        console.log(`Fetched ${reports.length} reports from CIRCL.LU`);
      } catch (error) {
        console.error('CIRCL.LU fetch error:', error.message);
        return res.status(500).json({
          success: false,
          error: `Failed to fetch from CIRCL.LU: ${error.message}. This source may require authentication or be temporarily unavailable.`
        });
      }
    }

    // Fetch from Anomali Limo
    else if (source === 'anomali-limo') {
      try {
        const discoveryResponse = await axios.get(config.discoveryUrl, {
          headers: {
            'Accept': 'application/taxii+json;version=2.1'
          },
          timeout: 30000
        });

        if (discoveryResponse.data.api_roots && discoveryResponse.data.api_roots.length > 0) {
          const apiRoot = discoveryResponse.data.api_roots[0];
          const collectionsUrl = `${apiRoot}collections/`;
          
          const collectionsResponse = await axios.get(collectionsUrl, {
            headers: {
              'Accept': 'application/taxii+json;version=2.1'
            },
            timeout: 30000
          });

          if (collectionsResponse.data.collections && collectionsResponse.data.collections.length > 0) {
            const firstCollection = collectionsResponse.data.collections[0];
            const objectsUrl = `${apiRoot}collections/${firstCollection.id}/objects/`;
            
            const objectsResponse = await axios.get(objectsUrl, {
              headers: {
                'Accept': 'application/taxii+json;version=2.1'
              },
              timeout: 30000
            });

            const objects = objectsResponse.data.objects || [];
            reports = objects.filter(obj => obj.type === 'report' || obj.type === 'indicator').map(obj => ({
              id: obj.id,
              type: obj.type,
              name: obj.name || obj.title || 'Untitled',
              description: obj.description || 'No description available',
              created: obj.created || new Date().toISOString(),
              modified: obj.modified || obj.created || new Date().toISOString(),
              indicators_count: obj.object_refs?.length || obj.pattern ? 1 : 0,
              source: config.name,
              raw: obj
            }));
          }
        }

        console.log(`Fetched ${reports.length} reports from Anomali Limo`);
      } catch (error) {
        console.error('Anomali Limo fetch error:', error.message);
        return res.status(500).json({
          success: false,
          error: `Failed to fetch from Anomali Limo: ${error.message}. This source may require authentication or be temporarily unavailable.`
        });
      }
    }

    res.json({
      success: true,
      source: config.name,
      count: reports.length,
      reports: reports
    });

  } catch (error) {
    console.error('Feed extractor error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
