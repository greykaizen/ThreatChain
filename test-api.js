// Simple API test script
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing ThreadChain Backend API\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health:', health.data.status);
    console.log('');

    // 2. Blockchain Stats
    console.log('2️⃣ Testing Blockchain Stats...');
    const blockchainStats = await axios.get(`${API_BASE}/blockchain/stats`);
    console.log('✅ Blockchain Stats:', blockchainStats.data.data);
    console.log('');

    // 3. Upload STIX Report (if sample file exists)
    if (fs.existsSync('sample-stix-2.1.json')) {
      console.log('3️⃣ Testing STIX Upload...');
      const formData = new FormData();
      formData.append('file', fs.createReadStream('sample-stix-2.1.json'));
      formData.append('title', 'Test STIX Report');
      formData.append('description', 'Automated test upload');

      const upload = await axios.post(`${API_BASE}/stix/upload`, formData, {
        headers: formData.getHeaders()
      });
      console.log('✅ Upload Success:', {
        reportId: upload.data.data.reportId,
        hash: upload.data.data.reportHash,
        blockchain: upload.data.data.blockchain.txHash
      });
      console.log('');

      const reportId = upload.data.data.reportId;

      // 4. Get Report Details
      console.log('4️⃣ Testing Get Report...');
      const report = await axios.get(`${API_BASE}/stix/reports/${reportId}`);
      console.log('✅ Report Retrieved:', report.data.data.report.title);
      console.log('');

      // 5. Verify Report
      console.log('5️⃣ Testing Report Verification...');
      const verify = await axios.post(`${API_BASE}/stix/verify/${reportId}`);
      console.log('✅ Verification:', verify.data.data.verified ? 'PASSED' : 'FAILED');
      console.log('');

      // 6. Get Provenance
      console.log('6️⃣ Testing Provenance Chain...');
      const provenance = await axios.get(`${API_BASE}/provenance/chain/${reportId}`);
      console.log('✅ Provenance Chain:', provenance.data.data.totalSteps, 'steps');
      console.log('');
    } else {
      console.log('⚠️  sample-stix-2.1.json not found, skipping upload tests');
      console.log('');
    }

    // 7. Get All Reports
    console.log('7️⃣ Testing Get All Reports...');
    const allReports = await axios.get(`${API_BASE}/stix/reports`);
    console.log('✅ Total Reports:', allReports.data.data.reports.length);
    console.log('');

    // 8. Get Blockchain Blocks
    console.log('8️⃣ Testing Get Blocks...');
    const blocks = await axios.get(`${API_BASE}/blockchain/blocks`);
    console.log('✅ Total Blocks:', blocks.data.data.blocks.length);
    console.log('');

    // 9. Get Transactions
    console.log('9️⃣ Testing Get Transactions...');
    const transactions = await axios.get(`${API_BASE}/blockchain/transactions`);
    console.log('✅ Total Transactions:', transactions.data.data.transactions.length);
    console.log('');

    // 10. STIX Stats
    console.log('🔟 Testing STIX Statistics...');
    const stixStats = await axios.get(`${API_BASE}/stix/stats`);
    console.log('✅ STIX Stats:', stixStats.data.data.overview);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests
console.log('Make sure the server is running on http://localhost:3001\n');
testAPI();