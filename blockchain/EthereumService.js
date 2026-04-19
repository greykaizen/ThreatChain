const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  "function registerReport(bytes32 _reportHash, string memory _reportId) public",
  "function verifyReport(bytes32 _reportHash) public view returns (bool exists, uint256 timestamp, address uploader, string memory reportId)",
  "function getTotalReports() public view returns (uint256)"
];

class EthereumService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isEnabled = false;
    this.initialize();
  }

  initialize() {
    try {
      console.log('📡 Initializing Ethereum Service...');
      
      // 1. Check for Private Key (Required)
      if (!process.env.ETHEREUM_PRIVATE_KEY) {
        console.warn('❌ ETHEREUM_PRIVATE_KEY missing from environment');
        return;
      }

      // 2. Determine Network
      const useLocalGeth = process.env.ETHEREUM_USE_LOCAL === 'true';
      const rpcUrl = process.env.ETHEREUM_RPC_URL;
      
      if (useLocalGeth) {
        const localUrl = process.env.ETHEREUM_RPC_URL || 'http://127.0.0.1:8545';
        this.provider = new ethers.JsonRpcProvider(localUrl);
        console.log('🔗 Mode: Local Geth');
      } else if (rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        console.log('🔗 Mode: Remote RPC (Alchemy)');
      } else {
        console.warn('❌ No RPC URL found (ETHEREUM_RPC_URL missing)');
        return;
      }

      // 3. Create wallet
      this.wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.provider);

      // 4. Connect to contract
      if (process.env.ETHEREUM_CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(
          process.env.ETHEREUM_CONTRACT_ADDRESS,
          CONTRACT_ABI,
          this.wallet
        );
        this.isEnabled = true;
        console.log('✅ Ethereum Service Operational');
        console.log('   Contract:', process.env.ETHEREUM_CONTRACT_ADDRESS);
        console.log('   Wallet:', this.wallet.address);
      } else {
        console.warn('❌ ETHEREUM_CONTRACT_ADDRESS missing');
      }
    } catch (error) {
      console.error('💥 Ethereum init failed:', error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Register a report hash on Ethereum blockchain
   * @param {string} reportHash - SHA-256 hash of the report (hex string)
   * @param {string} reportId - UUID of the report
   * @returns {Promise<Object>} Transaction details
   */
  async registerReportHash(reportHash, reportId) {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Ethereum integration not enabled',
        txHash: null
      };
    }

    try {
      // Convert hash to bytes32 format
      const hashBytes32 = reportHash.startsWith('0x') ? reportHash : '0x' + reportHash;

      console.log('📤 Submitting to Ethereum...');
      console.log('   Hash:', hashBytes32);
      console.log('   Report ID:', reportId);

      // Send transaction
      const tx = await this.contract.registerReport(hashBytes32, reportId);
      console.log('   Transaction sent:', tx.hash);

      // Wait for confirmation
      console.log('   Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('   ✅ Confirmed in block:', receipt.blockNumber);

      // Calculate gas fee (gasUsed * gasPrice)
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.gasPrice || tx.gasPrice || BigInt(0);
      const gasFeeWei = gasUsed * gasPrice;
      const gasFeeEth = ethers.formatEther(gasFeeWei);
      const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');

      console.log('   Gas Used:', gasUsed.toString());
      console.log('   Gas Price:', gasPriceGwei, 'Gwei');
      console.log('   Gas Fee:', gasFeeEth, 'ETH');

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsed.toString(),
        gasPrice: parseFloat(gasPriceGwei),
        gasFee: parseFloat(gasFeeEth),
        timestamp: new Date().toISOString(),
        explorerUrl: `https://sepolia.etherscan.io/tx/${receipt.hash}`
      };
    } catch (error) {
      console.error('❌ Ethereum registration failed:', error.message);
      return {
        success: false,
        message: error.message,
        txHash: null
      };
    }
  }

  /**
   * Verify a report hash on Ethereum blockchain
   * @param {string} reportHash - SHA-256 hash to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyReportHash(reportHash) {
    if (!this.isEnabled) {
      return {
        success: false,
        message: 'Ethereum integration not enabled'
      };
    }

    try {
      const hashBytes32 = reportHash.startsWith('0x') ? reportHash : '0x' + reportHash;

      const result = await this.contract.verifyReport(hashBytes32);

      return {
        success: true,
        exists: result[0],
        timestamp: result[1].toString(),
        uploader: result[2],
        reportId: result[3],
        blockchainVerified: result[0]
      };
    } catch (error) {
      console.error('❌ Ethereum verification failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get total number of reports registered on blockchain
   */
  async getTotalReports() {
    if (!this.isEnabled) {
      return 0;
    }

    try {
      const total = await this.contract.getTotalReports();
      return total.toString();
    } catch (error) {
      console.error('❌ Failed to get total reports:', error.message);
      return 0;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance() {
    if (!this.wallet) {
      return '0';
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      return '0';
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      network: 'Sepolia Testnet',
      contractAddress: process.env.ETHEREUM_CONTRACT_ADDRESS || null,
      walletAddress: this.wallet ? this.wallet.address : null
    };
  }
}

// Export singleton instance
module.exports = new EthereumService();
