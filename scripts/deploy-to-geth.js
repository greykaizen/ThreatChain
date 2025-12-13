const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('🚀 Deploying ThreatIntelRegistry to Geth');
  console.log('=========================================');
  console.log('');

  try {
    // Connect to Geth
    console.log('1️⃣  Connecting to Geth...');
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Test connection
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network.chainId.toString());
    
    // Get block number
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Current block:', blockNumber);
    console.log('');

    // Create wallet
    console.log('2️⃣  Setting up wallet...');
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ETHEREUM_PRIVATE_KEY not found in .env');
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('✅ Wallet address:', wallet.address);
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    console.log('✅ Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance === 0n) {
      throw new Error('Wallet has no ETH. Check genesis.json allocation.');
    }
    console.log('');

    // Read compiled contract
    console.log('3️⃣  Loading contract...');
    const contractPath = path.join(__dirname, '../artifacts/contracts/ThreatIntelRegistry.sol/ThreatIntelRegistry.json');
    
    if (!fs.existsSync(contractPath)) {
      throw new Error('Contract not compiled. Run: npx hardhat compile');
    }
    
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    console.log('✅ Contract loaded');
    console.log('');

    // Deploy contract
    console.log('4️⃣  Deploying contract...');
    const factory = new ethers.ContractFactory(
      contractJson.abi,
      contractJson.bytecode,
      wallet
    );
    
    console.log('   Sending deployment transaction...');
    const contract = await factory.deploy();
    
    console.log('   Waiting for deployment...');
    console.log('   Transaction hash:', contract.deploymentTransaction().hash);
    
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log('✅ Contract deployed!');
    console.log('');

    // Verify deployment
    console.log('5️⃣  Verifying deployment...');
    const code = await provider.getCode(address);
    if (code === '0x') {
      throw new Error('Contract deployment failed - no code at address');
    }
    console.log('✅ Contract code verified');
    console.log('');

    // Test contract
    console.log('6️⃣  Testing contract...');
    const totalReports = await contract.getTotalReports();
    console.log('✅ Contract is functional');
    console.log('   Total reports:', totalReports.toString());
    console.log('');

    // Update .env file
    console.log('7️⃣  Updating .env file...');
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add contract address
    if (envContent.includes('ETHEREUM_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /ETHEREUM_CONTRACT_ADDRESS=.*/,
        `ETHEREUM_CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nETHEREUM_CONTRACT_ADDRESS=${address}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env updated');
    console.log('');

    // Save deployment info
    console.log('8️⃣  Saving deployment info...');
    const deploymentInfo = {
      network: 'geth-private',
      chainId: network.chainId.toString(),
      contractAddress: address,
      deployerAddress: wallet.address,
      blockNumber: await provider.getBlockNumber(),
      timestamp: new Date().toISOString(),
      transactionHash: contract.deploymentTransaction().hash
    };
    
    const deploymentPath = path.join(__dirname, '../geth-deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('✅ Deployment info saved to geth-deployment.json');
    console.log('');

    // Summary
    console.log('=========================================');
    console.log('✅ Deployment Complete!');
    console.log('=========================================');
    console.log('');
    console.log('📋 Deployment Summary:');
    console.log('   Contract Address:', address);
    console.log('   Network: Geth Private (Chain ID: 1337)');
    console.log('   Deployer:', wallet.address);
    console.log('   Transaction:', contract.deploymentTransaction().hash);
    console.log('   Block:', await provider.getBlockNumber());
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Restart backend: npm run backend');
    console.log('   2. Test upload: Upload a STIX report');
    console.log('   3. Verify on blockchain: node scripts/test-ethereum.js');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Deployment failed:');
    console.error('   Error:', error.message);
    console.error('');
    
    if (error.message.includes('could not detect network')) {
      console.error('💡 Troubleshooting:');
      console.error('   - Make sure Geth is running: ./start-geth.sh');
      console.error('   - Check if port 8545 is accessible');
      console.error('   - Wait a few seconds after starting Geth');
    } else if (error.message.includes('insufficient funds')) {
      console.error('💡 Troubleshooting:');
      console.error('   - Check genesis.json has your address with balance');
      console.error('   - Reinitialize Geth: ./setup-geth.sh');
    }
    
    console.error('');
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
