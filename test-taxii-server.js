const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/taxii';

async function testTAXIIServer() {
  console.log('🧪 Testing TAXII 2.1 Server\n');

  try {
    // Test 1: Discovery Endpoint
    console.log('1️⃣  Testing Discovery Endpoint...');
    const discovery = await axios.get(`${BASE_URL}/`);
    console.log('✅ Discovery:', discovery.data.title);
    console.log('   API Roots:', discovery.data.api_roots.length);

    // Test 2: API Root
    console.log('\n2️⃣  Testing API Root...');
    const apiRoot = await axios.get(`${BASE_URL}/threatchain/`);
    console.log('✅ API Root:', apiRoot.data.title);
    console.log('   Max Content Length:', apiRoot.data.max_content_length);

    // Test 3: Collections List
    console.log('\n3️⃣  Testing Collections List...');
    const collections = await axios.get(`${BASE_URL}/threatchain/collections/`);
    console.log('✅ Collections Found:', collections.data.collections.length);
    collections.data.collections.forEach(col => {
      console.log(`   - ${col.title}: ${col.objects_count} objects`);
    });

    // Test 4: Individual Collection
    console.log('\n4️⃣  Testing Individual Collection...');
    const collection = await axios.get(`${BASE_URL}/threatchain/collections/all-threats/`);
    console.log('✅ Collection:', collection.data.title);
    console.log('   Objects:', collection.data.objects_count);
    console.log('   Can Read:', collection.data.can_read);

    // Test 5: Get Objects from Collection
    console.log('\n5️⃣  Testing Objects Retrieval...');
    const objects = await axios.get(`${BASE_URL}/threatchain/collections/all-threats/objects/?limit=5`);
    console.log('✅ Objects Retrieved:', objects.data.objects.length);
    console.log('   More Available:', objects.data.more);
    
    if (objects.data.objects.length > 0) {
      const firstObj = objects.data.objects[0];
      console.log('   First Object Type:', firstObj.type);
      console.log('   Blockchain Verified:', firstObj.x_threatchain_blockchain?.verified);
      
      // Test 6: Get Individual Object
      if (firstObj.id) {
        console.log('\n6️⃣  Testing Individual Object Retrieval...');
        const singleObj = await axios.get(`${BASE_URL}/threatchain/collections/all-threats/objects/${firstObj.id}/`);
        console.log('✅ Object Retrieved:', singleObj.data.type);
        console.log('   Object ID:', singleObj.data.id);
        console.log('   Blockchain TX:', singleObj.data.x_threatchain_blockchain?.tx_hash || 'N/A');
      }
    }

    // Test 7: Pagination
    console.log('\n7️⃣  Testing Pagination...');
    const page1 = await axios.get(`${BASE_URL}/threatchain/collections/all-threats/objects/?limit=2`);
    console.log('✅ Page 1:', page1.data.objects.length, 'objects');
    if (page1.data.next) {
      const page2 = await axios.get(`${BASE_URL}/threatchain/collections/all-threats/objects/?limit=2&next=${page1.data.next}`);
      console.log('✅ Page 2:', page2.data.objects.length, 'objects');
    }

    // Test 8: Filter by Collection Type
    console.log('\n8️⃣  Testing Collection Filtering...');
    const malware = await axios.get(`${BASE_URL}/threatchain/collections/malware-reports/objects/?limit=3`);
    console.log('✅ Malware Reports:', malware.data.objects.length, 'objects');
    
    const indicators = await axios.get(`${BASE_URL}/threatchain/collections/indicators/objects/?limit=3`);
    console.log('✅ Indicators:', indicators.data.objects.length, 'objects');

    // Test 9: Status Endpoint
    console.log('\n9️⃣  Testing Status Endpoint...');
    const status = await axios.get(`${BASE_URL}/status`);
    console.log('✅ Server Status:', status.data.status);
    console.log('   Total Reports:', status.data.statistics.total_reports);
    console.log('   Blockchain Verified:', status.data.statistics.blockchain_verified);

    console.log('\n✅ All TAXII 2.1 tests passed!\n');
    console.log('📋 TAXII Server Endpoints:');
    console.log('   Discovery:    GET /api/taxii/');
    console.log('   API Root:     GET /api/taxii/threatchain/');
    console.log('   Collections:  GET /api/taxii/threatchain/collections/');
    console.log('   Objects:      GET /api/taxii/threatchain/collections/{id}/objects/');
    console.log('   Status:       GET /api/taxii/status');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the backend server is running: node server.js');
    }
  }
}

// Run tests
testTAXIIServer();
