const { ethers } = require('ethers');
const axios = require('axios');

async function verifyGeth() {
  console.log('🔍 Verifying Geth Ethereum Node');
  console.log('================================');
  console.log('');

  let allGood = true;

  // Test 1: Check if Geth is responding
  console.log('1️⃣  Testing Geth RPC connection...');
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const network = await provider.getNetwork();
    console.log('   ✅ Geth is responding');
    console.log('   Network ID:', network.chainId.toString());
  } catch (error) {
    console.log('   ❌ Geth is not responding');
    console.log('   Error:', error.message);
    allGood = false;
  }
  console.log('');

  // Test 2: Get Geth version
  console.log('2️⃣  Getting Geth version...');
  try {
    const response = await axios.post('http://localhost:8545', {
      jsonrpc: '2.0',
      method: 'web3_clientVersion',
      params: [],
      id: 1
    });
    console.log('   ✅ Version:', response.data.result);
  } catch (error) {
    console.log('   ❌ Could not get version');
    allGood = false;
  }
  console.log('');

  // Test 3: Check block number
  console.log('3️⃣  Checking current block...');
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const blockNumber = await provider.getBlockNumber();
    console.log('   ✅ Current block:', blockNumber);
    
    if (blockNumber > 0) {
      console.log('   ✅ Blockchain is active');
    }
  } catch (error) {
    console.log('   ❌ Could not get block number');
    allGood = false;
  }
  console.log('');

  // Test 4: Check accounts
  console.log('4️⃣  Checking accounts...');
  try {
    const response = await axios.post('http://localhost:8545', {
      jsonrpc: '2.0',
      method: 'eth_accounts',
      params: [],
      id: 1
    });
    const accounts = response.data.result;
    console.log('   ✅ Found', accounts.length, 'account(s)');
    if (accounts.length > 0) {
      console.log('   Dev account:', accounts[0]);
    }
  } catch (error) {
    console.log('   ❌ Could not get accounts');
    allGood = false;
  }
  console.log('');

  // Test 5: Check your wallet balance
  console.log('5️⃣  Checking wallet balance...');
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const balance = await provider.getBalance(address);
    console.log('   ✅ Wallet:', address);
    console.log('   ✅ Balance:', ethers.formatEther(balance), 'ETH');
  } catch (error) {
    console.log('   ❌ Could not get balance');
    allGood = false;
  }
  console.log('');

  // Test 6: Check contract deployment
  console.log('6️⃣  Checking smart contract...');
  try {
    require('dotenv').config();
    const contractAddress = process.env.ETHEREUM_CONTRACT_ADDRESS;
    
    if (!contractAddress || contractAddress === '0x') {
      console.log('   ⚠️  Contract not deployed');
      console.log('   Run: node scripts/deploy-to-geth.js');
    } else {
      const provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const code = await provider.getCode(contractAddress);
      
      if (code === '0x') {
        console.log('   ❌ Contract address has no code');
        console.log('   Address:', contractAddress);
      } else {
        console.log('   ✅ Contract deployed at:', contractAddress);
        console.log('   ✅ Contract code size:', code.length, 'bytes');
      }
    }
  } catch (error) {
    console.log('   ❌ Could not check contract');
    console.log('   Error:', error.message);
  }
  console.log('');

  // Test 7: Check backend connection
  console.log('7️⃣  Checking backend Ethereum integration...');
  try {
    const response = await axios.get('http://localhost:3001/api/blockchain/ethereum/status');
    const data = response.data.data;
    
    console.log('   ✅ Backend connected to Ethereum');
    console.log('   Enabled:', data.enabled);
    console.log('   Connected:', data.connected);
    console.log('   Network ID:', data.networkId);
    console.log('   Total Reports:', data.totalReports);
  } catch (error) {
    console.log('   ⚠️  Backend not responding');
    console.log('   Make sure backend is running: npm run backend');
  }
  console.log('');

  // Summary
  console.log('================================');
  if (allGood) {
    console.log('✅ All checks passed!');
    console.log('✅ You are using Geth Ethereum node');
  } else {
    console.log('⚠️  Some checks failed');
    console.log('💡 Make sure Geth is running: ./start-geth.sh');
  }
  console.log('================================');
}

verifyGeth().catch(console.error);
