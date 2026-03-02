/**
 * Example TAXII 2.1 Client for ThreatChain
 * This demonstrates how external organizations can consume the TAXII feed
 */

const axios = require('axios');

class ThreatChainTAXIIClient {
  constructor(baseUrl = 'http://localhost:3001/api/taxii') {
    this.baseUrl = baseUrl;
    this.apiRoot = `${baseUrl}/threatchain`;
  }

  // Discover available API roots
  async discover() {
    const response = await axios.get(this.baseUrl);
    return response.data;
  }

  // Get API root information
  async getApiRoot() {
    const response = await axios.get(`${this.apiRoot}/`);
    return response.data;
  }

  // List all available collections
  async getCollections() {
    const response = await axios.get(`${this.apiRoot}/collections/`);
    return response.data.collections;
  }

  // Get specific collection details
  async getCollection(collectionId) {
    const response = await axios.get(`${this.apiRoot}/collections/${collectionId}/`);
    return response.data;
  }

  // Get objects from a collection with filtering
  async getObjects(collectionId, options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit);
    if (options.addedAfter) params.append('added_after', options.addedAfter);
    if (options.next) params.append('next', options.next);
    if (options.matchType) {
      options.matchType.forEach(type => params.append('match[type][]', type));
    }
    if (options.matchId) {
      options.matchId.forEach(id => params.append('match[id][]', id));
    }

    const url = `${this.apiRoot}/collections/${collectionId}/objects/?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  }

  // Get all objects with automatic pagination
  async getAllObjects(collectionId, options = {}) {
    const allObjects = [];
    let nextCursor = null;

    do {
      const data = await this.getObjects(collectionId, {
        ...options,
        next: nextCursor
      });

      allObjects.push(...data.objects);
      nextCursor = data.more ? data.next : null;
    } while (nextCursor);

    return allObjects;
  }

  // Get a specific object by ID
  async getObject(collectionId, objectId) {
    const response = await axios.get(`${this.apiRoot}/collections/${collectionId}/objects/${objectId}/`);
    return response.data;
  }

  // Get only blockchain-verified objects
  async getVerifiedObjects(collectionId, options = {}) {
    const data = await this.getObjects(collectionId, options);
    return {
      ...data,
      objects: data.objects.filter(obj => obj.x_threatchain_blockchain?.verified === true)
    };
  }

  // Get objects by STIX type
  async getObjectsByType(collectionId, types, options = {}) {
    return await this.getObjects(collectionId, {
      ...options,
      matchType: Array.isArray(types) ? types : [types]
    });
  }

  // Get recent threats (last 24 hours)
  async getRecentThreats(collectionId = 'all-threats') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return await this.getObjects(collectionId, {
      addedAfter: yesterday.toISOString(),
      limit: 100
    });
  }

  // Get server status
  async getStatus() {
    const response = await axios.get(`${this.baseUrl}/status`);
    return response.data;
  }
}

// Example usage
async function exampleUsage() {
  const client = new ThreatChainTAXIIClient();

  try {
    console.log('🔍 Discovering TAXII server...');
    const discovery = await client.discover();
    console.log('Server:', discovery.title);

    console.log('\n📚 Fetching collections...');
    const collections = await client.getCollections();
    collections.forEach(col => {
      console.log(`  - ${col.title}: ${col.objects_count} objects`);
    });

    console.log('\n📥 Fetching malware reports...');
    const malware = await client.getObjects('malware-reports', { limit: 5 });
    console.log(`Retrieved ${malware.objects.length} malware reports`);

    console.log('\n🔐 Fetching verified threats...');
    const verified = await client.getVerifiedObjects('all-threats', { limit: 10 });
    console.log(`Found ${verified.objects.length} blockchain-verified threats`);

    console.log('\n🎯 Fetching indicators only...');
    const indicators = await client.getObjectsByType('indicators', ['indicator', 'observable'], { limit: 5 });
    console.log(`Retrieved ${indicators.objects.length} indicators`);

    console.log('\n⏰ Fetching recent threats (24h)...');
    const recent = await client.getRecentThreats();
    console.log(`Found ${recent.objects.length} recent threats`);

    console.log('\n✅ TAXII client example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Export for use in other modules
module.exports = ThreatChainTAXIIClient;

// Run example if executed directly
if (require.main === module) {
  exampleUsage();
}
