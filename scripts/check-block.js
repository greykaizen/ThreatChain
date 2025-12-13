const { ethers } = require('ethers');

async function checkBlock() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Get block 1381 where your hash was registered
  const block = await provider.getBlock(1381);
  
  console.log('Block 120:');
  console.log('Hash:', block.hash);
  console.log('Timestamp:', new Date(block.timestamp * 1000).toLocaleString());
  console.log('Transactions:', block.transactions.length);
  console.log('');
  
  // Get the transaction
  const tx = await provider.getTransaction('0x34a64ab6e4cb1f6f10067f337af18bc46a2e1dd9a73bcaa51ae94f068656bc03');
  
  console.log('Transaction:');
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Data:', tx.data);
}

checkBlock();
