const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log('💰 Funding deployment account from dev account');
  console.log('==============================================');
  console.log('');

  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    // Get dev account (coinbase)
    const accounts = await provider.send('eth_accounts', []);
    const devAccount = accounts[0];
    
    console.log('Dev account:', devAccount);
    
    const devBalance = await provider.getBalance(devAccount);
    console.log('Dev balance:', ethers.formatEther(devBalance), 'ETH');
    console.log('');
    
    // Get target account
    const targetAddress = process.env.ETHEREUM_WALLET_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    console.log('Target account:', targetAddress);
    
    const targetBalance = await provider.getBalance(targetAddress);
    console.log('Target balance:', ethers.formatEther(targetBalance), 'ETH');
    console.log('');
    
    // Send 100 ETH to target account
    console.log('Sending 100 ETH to target account...');
    
    const value = ethers.parseEther('100');
    const tx = await provider.send('eth_sendTransaction', [{
      from: devAccount,
      to: targetAddress,
      value: '0x' + value.toString(16)
    }]);
    
    console.log('Transaction hash:', tx);
    console.log('Waiting for confirmation...');
    
    const receipt = await provider.waitForTransaction(tx);
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    console.log('');
    
    const newBalance = await provider.getBalance(targetAddress);
    console.log('New target balance:', ethers.formatEther(newBalance), 'ETH');
    console.log('');
    console.log('✅ Account funded successfully!');
    console.log('');
    console.log('Now run: node scripts/deploy-to-geth.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
