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
      // Check if Ethereum is configured
      if (!process.env.ETHEREUM_PRIVATE_KEY) {
        console.log('ℹ️  Ethereum integration not configured (optional)');
        return;
      }

      // Determine which network to use
      const useLocalGeth = process.env.ETHEREUM_USE_LOCAL === 'true';
      
      if (useLocalGeth) {
        // Connect to local Geth node
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
        console.log('🔗 Connecting to local Geth node...');
      } else if (process.env.INFURA_API_KEY) {
        // Connect to Sepolia testnet via Infura
        this.provider = new ethers.JsonRpcProvider(
          `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
        );
        console.log('🔗 Connecting to Sepolia testnet...');
      } else {
        console.log('ℹ️  No Ethereum network configured');
        return;
      }

      // Create wallet
      this.wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY, this.provider);

      // Connect to contract if address is provided
      if (process.env.ETHEREUM_CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(
          process.env.ETHEREUM_CONTRACT_ADDRESS,
          CONTRACT_ABI,
          this.wallet
        );
        this.isEnabled = true;
        console.log('✅ Ethereum integration enabled');
        console.log('   Network:', useLocalGeth ? 'Private Geth (localhost:8545)' : 'Sepolia Testnet');
        console.log('   Wallet:', this.wallet.address);
        console.log('   Contract:', process.env.ETHEREUM_CONTRACT_ADDRESS);
      } else {
        console.log('ℹ️  Ethereum configured but no contract address provided');
      }
    } catch (error) {
      console.error('⚠️  Ethereum initialization failed:', error.message);
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

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
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
