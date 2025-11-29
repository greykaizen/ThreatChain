const crypto = require('crypto');
const db = require('../config/database');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block mined: ${this.hash}`);
  }
}

class SimpleBlockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.initializeBlockchain();
  }

  async initializeBlockchain() {
    try {
      // Check if genesis block exists in database
      const existingBlocks = await db.query(
        'SELECT * FROM blockchain_blocks ORDER BY block_number ASC LIMIT 1'
      );

      if (existingBlocks.length === 0) {
        // Create genesis block
        await this.createGenesisBlock();
      } else {
        // Load existing blockchain from database
        await this.loadBlockchainFromDB();
      }
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      await this.createGenesisBlock();
    }
  }

  async createGenesisBlock() {
    const genesisBlock = new Block(0, Date.now(), 'Genesis Block', '0');
    this.chain = [genesisBlock];
    
    // Save genesis block to database
    await db.query(
      `INSERT INTO blockchain_blocks 
       (block_number, block_hash, previous_hash, merkle_root, nonce, difficulty) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        genesisBlock.index,
        genesisBlock.hash,
        genesisBlock.previousHash,
        genesisBlock.hash,
        genesisBlock.nonce,
        this.difficulty
      ]
    );

    console.log('✅ Genesis block created');
  }

  async loadBlockchainFromDB() {
    try {
      const blocks = await db.query(
        'SELECT * FROM blockchain_blocks ORDER BY block_number ASC'
      );

      this.chain = blocks.map(blockData => {
        const block = new Block(
          blockData.block_number,
          blockData.timestamp,
          { merkleRoot: blockData.merkle_root },
          blockData.previous_hash
        );
        block.hash = blockData.block_hash;
        block.nonce = blockData.nonce;
        return block;
      });

      console.log(`✅ Loaded ${this.chain.length} blocks from database`);
    } catch (error) {
      console.error('Error loading blockchain from database:', error);
      await this.createGenesisBlock();
    }
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(newBlock) {
    // Reload latest block from database to ensure we have the most recent state
    const latestBlockFromDB = await db.findOne(
      'SELECT MAX(block_number) as max_block FROM blockchain_blocks'
    );
    
    const nextBlockNumber = (latestBlockFromDB?.max_block || 0) + 1;
    newBlock.index = nextBlockNumber;
    
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    
    this.chain.push(newBlock);

    // Save block to database with duplicate protection
    try {
      await db.query(
        `INSERT INTO blockchain_blocks 
         (block_number, block_hash, previous_hash, merkle_root, nonce, difficulty, transactions_count) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newBlock.index,
          newBlock.hash,
          newBlock.previousHash,
          newBlock.hash, // Using block hash as merkle root for simplicity
          newBlock.nonce,
          this.difficulty,
          1 // Single transaction per block for simplicity
        ]
      );
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        console.error(`⚠️  Block ${newBlock.index} already exists in database. Skipping insertion.`);
        // Don't throw error, just log it - the block is already in the chain
        return newBlock;
      }
      throw dbError; // Re-throw if it's not a duplicate error
    }

    return newBlock;
  }

  async addSTIXTransaction(reportHash, reportId, metadata = {}) {
    try {
      // Create transaction data
      const transactionData = {
        type: 'STIX_REPORT',
        reportHash: reportHash,
        reportId: reportId,
        timestamp: Date.now(),
        metadata: metadata
      };

      // Get the next block number from database
      const latestBlockFromDB = await db.findOne(
        'SELECT MAX(block_number) as max_block FROM blockchain_blocks'
      );
      const nextBlockNumber = (latestBlockFromDB?.max_block || 0) + 1;

      // Create new block with transaction
      const newBlock = new Block(
        nextBlockNumber,
        Date.now(),
        transactionData,
        this.getLatestBlock().hash
      );

      // Add block to chain
      await this.addBlock(newBlock);

      // Generate transaction hash
      const txHash = '0x' + crypto
        .createHash('sha256')
        .update(JSON.stringify(transactionData) + newBlock.hash)
        .digest('hex');

      // Save transaction to database with confirmation time
      const transactionId = crypto.randomUUID();
      const now = new Date();
      await db.query(
        `INSERT INTO blockchain_transactions 
         (id, tx_hash, block_number, report_hash, report_id, status, timestamp, confirmation_time) 
         VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
        [transactionId, txHash, newBlock.index, reportHash, reportId, now, now]
      );

      return {
        transactionId: transactionId,
        txHash: txHash,
        blockNumber: newBlock.index,
        blockHash: newBlock.hash,
        status: 'confirmed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding STIX transaction:', error);
      throw error;
    }
  }

  async getTransactionByHash(txHash) {
    try {
      const transaction = await db.findOne(
        'SELECT * FROM blockchain_transactions WHERE tx_hash = ?',
        [txHash]
      );
      return transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  async getTransactionsByReportId(reportId) {
    try {
      const transactions = await db.query(
        'SELECT * FROM blockchain_transactions WHERE report_id = ? ORDER BY timestamp DESC',
        [reportId]
      );
      return transactions;
    } catch (error) {
      console.error('Error getting transactions by report ID:', error);
      return [];
    }
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  async getBlockchainStats() {
    try {
      const stats = await db.findOne(`
        SELECT 
          COUNT(*) as total_blocks,
          MAX(block_number) as latest_block,
          COUNT(DISTINCT DATE(timestamp)) as active_days
        FROM blockchain_blocks
      `);

      const transactionStats = await db.findOne(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_transactions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions
        FROM blockchain_transactions
      `);

      return {
        totalBlocks: stats.total_blocks || 0,
        latestBlock: stats.latest_block || 0,
        activeDays: stats.active_days || 0,
        totalTransactions: transactionStats.total_transactions || 0,
        confirmedTransactions: transactionStats.confirmed_transactions || 0,
        pendingTransactions: transactionStats.pending_transactions || 0,
        chainValid: this.isChainValid()
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const blockchain = new SimpleBlockchain();

module.exports = blockchain;