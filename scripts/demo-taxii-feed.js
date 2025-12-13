/**
 * TAXII Feed Demo Script
 * Demonstrates how external organizations can pull threat intelligence
 */

const ThreatChainTAXIIClient = require('../lib/taxii-client-example');

async function demonstrateTAXIIFeed() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ThreatChain TAXII 2.1 Feed Demonstration');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new ThreatChainTAXIIClient('http://localhost:3001/api/taxii');

  try {
    // 1. Server Discovery
    console.log('🔍 Step 1: Discovering TAXII Server');
    console.log('─────────────────────────────────────');
    const discovery = await client.discover();
    console.log(`Server: ${discovery.title}`);
    console.log(`Description: ${discovery.description}`);
    console.log(`API Roots: ${discovery.api_roots.length}`);

    // 2. List Collections
    console.log('\n📚 Step 2: Available Threat Collections');
    console.log('─────────────────────────────────────');
    const collections = await client.getCollections();
    collections.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.title}`);
      console.log(`   ID: ${col.id}`);
      console.log(`   Objects: ${col.objects_count}`);
      console.log(`   Description: ${col.description}`);
    });

    // 3. Pull All Threats
    console.log('\n🌐 Step 3: Pulling All Threat Intelligence');
    console.log('─────────────────────────────────────');
    const allThreats = await client.getObjects('all-threats', { limit: 10 });
    console.log(`Retrieved: ${allThreats.objects.length} threat objects`);
    console.log(`More available: ${allThreats.more ? 'Yes' : 'No'}`);
    
    if (allThreats.objects.length > 0) {
      console.log('\nSample Objects:');
      allThreats.objects.slice(0, 3).forEach((obj, idx) => {
        console.log(`  ${idx + 1}. Type: ${obj.type}`);
        console.log(`     ID: ${obj.id}`);
        console.log(`     Blockchain Verified: ${obj.x_threatchain_blockchain?.verified ? '✅' : '❌'}`);
        if (obj.x_threatchain_blockchain?.tx_hash) {
          console.log(`     TX Hash: ${obj.x_threatchain_blockchain.tx_hash.substring(0, 20)}...`);
        }
      });
    }

    // 4. Pull Malware Reports
    console.log('\n🦠 Step 4: Pulling Malware Reports');
    console.log('─────────────────────────────────────');
    const malware = await client.getObjects('malware-reports', { limit: 5 });
    console.log(`Retrieved: ${malware.objects.length} malware-related objects`);
    
    const verifiedMalware = malware.objects.filter(obj => obj.x_threatchain_blockchain?.verified);
    console.log(`Blockchain Verified: ${verifiedMalware.length}/${malware.objects.length}`);

    // 5. Pull APT Campaigns
    console.log('\n🎯 Step 5: Pulling APT Campaigns');
    console.log('─────────────────────────────────────');
    const apt = await client.getObjects('apt-campaigns', { limit: 5 });
    console.log(`Retrieved: ${apt.objects.length} APT-related objects`);

    // 6. Pull Indicators
    console.log('\n🔍 Step 6: Pulling Threat Indicators');
    console.log('─────────────────────────────────────');
    const indicators = await client.getObjects('indicators', { limit: 5 });
    console.log(`Retrieved: ${indicators.objects.length} indicator objects`);

    // 7. Filter by STIX Type
    console.log('\n🎨 Step 7: Filtering by STIX Type');
    console.log('─────────────────────────────────────');
    const indicatorTypes = await client.getObjectsByType('all-threats', ['indicator'], { limit: 5 });
    console.log(`Indicators only: ${indicatorTypes.objects.length} objects`);

    // 8. Get Only Verified Objects
    console.log('\n🔐 Step 8: Blockchain-Verified Objects Only');
    console.log('─────────────────────────────────────');
    const verified = await client.getVerifiedObjects('all-threats', { limit: 10 });
    console.log(`Verified objects: ${verified.objects.length}`);
    
    if (verified.objects.length > 0) {
      const sample = verified.objects[0];
      console.log('\nSample Verified Object:');
      console.log(`  Type: ${sample.type}`);
      console.log(`  Block Number: ${sample.x_threatchain_blockchain.block_number}`);
      console.log(`  TX Hash: ${sample.x_threatchain_blockchain.tx_hash}`);
      console.log(`  Timestamp: ${sample.x_threatchain_blockchain.timestamp}`);
    }

    // 9. Pagination Example
    console.log('\n📄 Step 9: Pagination Example');
    console.log('─────────────────────────────────────');
    let page = 1;
    let nextCursor = null;
    let totalFetched = 0;

    do {
      const pageData = await client.getObjects('all-threats', {
        limit: 5,
        next: nextCursor
      });
      
      totalFetched += pageData.objects.length;
      console.log(`Page ${page}: ${pageData.objects.length} objects`);
      
      nextCursor = pageData.more ? pageData.next : null;
      page++;
      
      if (page > 3) break; // Limit demo to 3 pages
    } while (nextCursor);

    console.log(`Total fetched across pages: ${totalFetched}`);

    // 10. Server Status
    console.log('\n📊 Step 10: Server Status');
    console.log('─────────────────────────────────────');
    const status = await client.getStatus();
    console.log(`Status: ${status.status}`);
    console.log(`Version: ${status.version}`);
    console.log(`Total Reports: ${status.statistics.total_reports}`);
    console.log(`Blockchain Verified: ${status.statistics.blockchain_verified}`);
    console.log(`Collections: ${status.statistics.collections}`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ TAXII Feed Demonstration Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 Integration Guide for External Organizations:');
    console.log('1. Install TAXII client library or use HTTP requests');
    console.log('2. Connect to: http://your-server:3001/api/taxii');
    console.log('3. Discover collections: GET /api/taxii/threatchain/collections/');
    console.log('4. Pull objects: GET /api/taxii/threatchain/collections/{id}/objects/');
    console.log('5. Verify blockchain metadata in x_threatchain_blockchain field');
    console.log('6. Use pagination for large datasets (next parameter)');
    console.log('7. Filter by STIX type using match[type] parameter');
    console.log('8. Filter by date using added_after parameter\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   node server.js');
    }
  }
}

// Run demonstration
demonstrateTAXIIFeed();
