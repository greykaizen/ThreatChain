const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ABI = [
  "function verifyReport(bytes32 _reportHash) public view returns (bool exists, uint256 timestamp, address uploader, string memory reportId)"
];

async function checkHash() {
  try {
    // Connect to Geth
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Connect to contract
    const contract = new ethers.Contract(
      process.env.ETHEREUM_CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    // The hash you want to check
    const hashToCheck = '0x4cb3d2c62ff01c42c248057445a29489fa11b01971277473e985703c2908591b';

    console.log('🔍 Checking hash on Geth blockchain...');
    console.log('Hash:', hashToCheck);
    console.log('Contract:', process.env.ETHEREUM_CONTRACT_ADDRESS);
    console.log('');

    // Query the contract
    const result = await contract.verifyReport(hashToCheck);

    console.log('📊 Result from Geth:');
    console.log('Exists:', result[0]);
    console.log('Timestamp:', result[1].toString());
    console.log('Uploader:', result[2]);
    console.log('Report ID:', result[3]);
    console.log('');

    if (result[0]) {
      console.log('✅ Hash FOUND on blockchain!');
      const date = new Date(Number(result[1]) * 1000);
      console.log('Registered at:', date.toLocaleString());
    } else {
      console.log('❌ Hash NOT FOUND on blockchain!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('1. Geth is not running');
    console.error('2. Contract address is wrong');
    console.error('3. Contract not deployed');
  }
}

checkHash();
