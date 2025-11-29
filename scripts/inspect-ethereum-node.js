const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function inspectNode() {
  console.log('🔍 Ethereum Node Deep Inspection');
  console.log('=================================');
  console.log('');

  const provider = new ethers.JsonRpcProvider('http://localhost:8545');

  try {
    // 1. Node Information
    console.log('📡 NODE INFORMATION');
    console.log('-------------------');
    const network = await provider.getNetwork();
    console.log('Network Name:', network.name || 'unknown');
    console.log('Chain ID:', network.chainId.toString());
    console.log('RPC URL: http://localhost:8545');
    console.log('');

    // 2. Blockchain State
    console.log('⛓️  BLOCKCHAIN STATE');
    console.log('-------------------');
    const blockNumber = await provider.getBlockNumber();
    console.log('Current Block:', blockNumber);
    
    const latestBlock = await provider.getBlock('latest');
    console.log('Latest Block Hash:', latestBlock.hash);
    console.log('Block Timestamp:', new Date(latestBlock.timestamp * 1000).toLocaleString());
    console.log('Transactions in Block:', latestBlock.transactions.length);
    console.log('Gas Used:', latestBlock.gasUsed.toString());
    console.log('Gas Limit:', latestBlock.gasLimit.toString());
    console.log('');

    // 3. Accounts
    console.log('👤 ACCOUNTS');
    console.log('-----------');
    const accounts = await provider.send('eth_accounts', []);
    console.log('Total Accounts:', accounts.length);
    
    for (let i = 0; i < accounts.length; i++) {
      const balance = await provider.getBalance(accounts[i]);
      const txCount = await provider.getTransactionCount(accounts[i]);
      console.log(`\nAccount ${i + 1}:`);
      console.log('  Address:', accounts[i]);
      console.log('  Balance:', ethers.formatEther(balance), 'ETH');
      console.log('  Transactions:', txCount);
    }
    console.log('');

    // 4. Your Wallet
    console.log('💰 YOUR DEPLOYMENT WALLET');
    console.log('-------------------------');
    const yourAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const yourBalance = await provider.getBalance(yourAddress);
    const yourTxCount = await provider.getTransactionCount(yourAddress);
    console.log('Address:', yourAddress);
    console.log('Balance:', ethers.formatEther(yourBalance), 'ETH');
    console.log('Total Transactions:', yourTxCount);
    console.log('');

    // 5. Smart Contract
    console.log('📜 SMART CONTRACT');
    console.log('-----------------');
    require('dotenv').config();
    const contractAddress = process.env.ETHEREUM_CONTRACT_ADDRESS;
    
    if (contractAddress && contractAddress !== '0x') {
      console.log('Contract Address:', contractAddress);
      
      const code = await provider.getCode(contractAddress);
      console.log('Contract Code Size:', code.length, 'bytes');
      console.log('Contract Deployed: ✅');
      
      // Load contract ABI
      const contractPath = path.join(__dirname, '../artifacts/contracts/ThreatIntelRegistry.sol/ThreatIntelRegistry.json');
      if (fs.existsSync(contractPath)) {
        const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contract = new ethers.Contract(contractAddress, contractJson.abi, provider);
        
        try {
          const totalReports = await contract.getTotalReports();
          console.log('Total Reports Stored:', totalReports.toString());
          
          // Get recent reports
          if (totalReports > 0) {
            console.log('\n📋 Recent Reports:');
            const recentCount = Math.min(5, Number(totalReports));
            for (let i = 0; i < recentCount; i++) {
              const reportHash = await contract.getReportHash(i);
              const timestamp = await contract.getReportTimestamp(i);
              console.log(`\n  Report ${i}:`);
              console.log('    Hash:', reportHash);
              console.log('    Time:', new Date(Number(timestamp) * 1000).toLocaleString());
            }
          }
        } catch (error) {
          console.log('Could not read contract data:', error.message);
        }
      }
    } else {
      console.log('Contract: Not deployed');
    }
    console.log('');

    // 6. Recent Transactions
    console.log('📝 RECENT TRANSACTIONS');
    console.log('----------------------');
    const recentBlocks = Math.min(5, blockNumber);
    let totalTxs = 0;
    
    for (let i = blockNumber; i > blockNumber - recentBlocks && i >= 0; i--) {
      const block = await provider.getBlock(i);
      if (block.transactions.length > 0) {
        console.log(`\nBlock ${i} (${block.transactions.length} transactions):`);
        
        for (const txHash of block.transactions.slice(0, 3)) {
          const tx = await provider.getTransaction(txHash);
          const receipt = await provider.getTransactionReceipt(txHash);
          
          console.log(`  Transaction: ${txHash.substring(0, 10)}...`);
          console.log(`    From: ${tx.from}`);
          console.log(`    To: ${tx.to || 'Contract Creation'}`);
          console.log(`    Value: ${ethers.formatEther(tx.value)} ETH`);
          console.log(`    Gas Used: ${receipt.gasUsed.toString()}`);
          console.log(`    Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
          totalTxs++;
        }
      }
    }
    console.log(`\nTotal Transactions Found: ${totalTxs}`);
    console.log('');

    // 7. Gas Statistics
    console.log('⛽ GAS STATISTICS');
    console.log('----------------');
    const feeData = await provider.getFeeData();
    console.log('Current Gas Price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'Gwei');
    console.log('Max Fee Per Gas:', ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'), 'Gwei');
    console.log('Max Priority Fee:', ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei'), 'Gwei');
    console.log('');

    // 8. Storage Location
    console.log('💾 DATA STORAGE');
    console.log('---------------');
    console.log('Blockchain Data:', path.resolve('./geth-data'));
    
    // Check data size
    const { execSync } = require('child_process');
    try {
      const size = execSync('du -sh geth-data 2>/dev/null || echo "N/A"').toString().trim();
      console.log('Total Size:', size.split('\t')[0]);
    } catch (error) {
      console.log('Total Size: Unable to calculate');
    }
    
    console.log('\nData Structure:');
    console.log('  geth-data/geth/chaindata/  - Blockchain blocks & transactions');
    console.log('  geth-data/geth/triedb/     - State trie (accounts, storage)');
    console.log('  geth-data/geth/nodes/      - Network peer data');
    console.log('');

    // 9. What Data Goes to Ethereum
    console.log('📤 DATA FLOW TO ETHEREUM');
    console.log('------------------------');
    console.log('When you upload a threat report:');
    console.log('');
    console.log('1. Report uploaded to your app');
    console.log('   ↓');
    console.log('2. SHA-256 hash calculated');
    console.log('   Example: a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4...');
    console.log('   ↓');
    console.log('3. Transaction created:');
    console.log('   - Function: recordThreatReport(hash, reportId, metadata)');
    console.log('   - To: Contract Address (0x5FbDB...)');
    console.log('   - Gas: ~50,000 units');
    console.log('   ↓');
    console.log('4. Transaction sent to Geth');
    console.log('   ↓');
    console.log('5. Geth mines block (5 seconds)');
    console.log('   ↓');
    console.log('6. Data stored in blockchain:');
    console.log('   - Block number');
    console.log('   - Transaction hash');
    console.log('   - Report hash (in contract storage)');
    console.log('   - Timestamp');
    console.log('   - Gas used');
    console.log('   ↓');
    console.log('7. Immutable record created ✅');
    console.log('');

    console.log('=================================');
    console.log('✅ Inspection Complete');
    console.log('=================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectNode();
