const { ethers } = require('ethers');

async function manualVerifyHash() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // The hash we're looking for (without 0x)
  const targetHash = '4cb3d2c62ff01c42c248057445a29489fa11b01971277473e985703c2908591b';
  
  console.log('🔍 Manually searching for hash in blockchain...');
  console.log('Target Hash:', targetHash);
  console.log('');
  
  // Get current block number
  const currentBlock = await provider.getBlockNumber();
  console.log('Current Block:', currentBlock);
  console.log('Searching through all blocks...');
  console.log('');
  
  let found = false;
  let foundInBlock = null;
  let foundInTx = null;
  
  // Search through all blocks
  for (let i = 0; i <= currentBlock; i++) {
    const block = await provider.getBlock(i); // Get block with transaction hashes
    
    if (block && block.transactions && block.transactions.length > 0) {
      // Get full transaction details for each transaction in the block
      for (const txHash of block.transactions) {
        const tx = await provider.getTransaction(txHash);
        
        // Check if transaction data contains our hash
        if (tx && tx.data && tx.data.toLowerCase().includes(targetHash.toLowerCase())) {
          found = true;
          foundInBlock = i;
          foundInTx = tx;
          
          console.log('✅ HASH FOUND!');
          console.log('');
          console.log('Block Number:', i);
          console.log('Block Hash:', block.hash);
          console.log('Block Timestamp:', new Date(block.timestamp * 1000).toLocaleString());
          console.log('');
          console.log('Transaction Hash:', tx.hash);
          console.log('From:', tx.from);
          console.log('To:', tx.to);
          console.log('');
          console.log('Transaction Data:');
          console.log(tx.data);
          console.log('');
          
          // Decode the data
          console.log('📊 Decoded Information:');
          
          // Function selector (first 4 bytes / 8 hex chars after 0x)
          const functionSelector = tx.data.substring(0, 10);
          console.log('Function Selector:', functionSelector);
          
          // The hash (next 32 bytes / 64 hex chars)
          const extractedHash = tx.data.substring(10, 74);
          console.log('Extracted Hash:', extractedHash);
          
          // Check if it matches
          if (extractedHash.toLowerCase() === targetHash.toLowerCase()) {
            console.log('✅ Hash matches perfectly!');
          }
          
          console.log('');
          console.log('🎯 VERIFICATION RESULT: Hash exists on blockchain!');
          console.log('The hash was registered in block', i, 'at', new Date(block.timestamp * 1000).toLocaleString());
          
          break;
        }
      }
      
      if (found) break;
    }
    
    // Progress indicator
    if (i % 100 === 0) {
      process.stdout.write(`\rSearched ${i}/${currentBlock} blocks...`);
    }
  }
  
  if (!found) {
    console.log('');
    console.log('❌ Hash NOT found in any block');
    console.log('This means the hash was never registered on the blockchain');
  }
}

manualVerifyHash().catch(console.error);
