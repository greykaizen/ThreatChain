# ThreatChain: Blockchain & System Architecture Learning Guide

## Overview

ThreatChain is a threat intelligence platform that combines STIX 2.1 data processing with blockchain verification. The system uses dual blockchain architecture (local + Ethereum) to provide immutable provenance tracking for threat intelligence reports.

---

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ThreatChain Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Next.js)  →  Backend (Node.js)  →  MySQL DB     │
│                              ↓                              │
│                    ┌─────────┴─────────┐                   │
│                    ↓                   ↓                    │
│          SimpleBlockchain         EthereumService          │
│          (Local Chain)            (Geth/Sepolia)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL 3.18
- **Blockchain**: 
  - Local: Custom SimpleBlockchain (SHA-256, PoW)
  - Ethereum: Geth (private network) or Sepolia testnet
- **Smart Contracts**: Solidity, ethers.js 6.15
- **ML Service**: Python Flask, XGBoost

---

## Dual Blockchain Architecture

### Why Two Blockchains?

ThreatChain uses **two complementary blockchain systems**:

1. **SimpleBlockchain (Local)**: Fast, always available, stores all transactions
2. **Ethereum (Optional)**: Provides external verification, cryptographic proof

### 1. SimpleBlockchain (Local Chain)

**Location**: `blockchain/SimpleBlockchain.js`

**Purpose**: Primary blockchain for fast, reliable transaction recording

**Key Features**:
- SHA-256 hashing
- Proof-of-Work mining (difficulty: 2)
- MySQL persistence
- Block validation
- Transaction tracking

**How It Works**:

```javascript
// Block Structure
{
  index: 0,                    // Block number
  timestamp: 1709251200000,    // Unix timestamp
  data: { ... },               // Transaction data
  previousHash: "0x...",       // Link to previous block
  nonce: 12345,                // Mining nonce
  hash: "0x..."                // Block hash (SHA-256)
}
```

**Mining Process**:
1. Create new block with transaction data
2. Calculate hash with nonce = 0
3. If hash doesn't start with "00" (difficulty 2), increment nonce
4. Repeat until valid hash found
5. Add block to chain
6. Save to MySQL database

**Database Tables**:
- `blockchain_blocks`: Stores block data
- `blockchain_transactions`: Stores transaction details with gas metrics

### 2. EthereumService (External Chain)

**Location**: `blockchain/EthereumService.js`

**Purpose**: Optional external verification on real Ethereum network

**Supported Networks**:
- **Geth Private Network**: Local development (Chain ID: 1337)
- **Sepolia Testnet**: Public testing network
- **Mainnet**: Production (future)

**Smart Contract**: `ThreatIntelRegistry.sol`

```solidity
// Key Functions
registerReport(bytes32 _reportHash, string memory _reportId)
verifyReport(bytes32 _reportHash) returns (bool, uint256, address, string)
getTotalReports() returns (uint256)
```

**Configuration** (`.env`):
```env
ETHEREUM_USE_LOCAL=true                    # Use Geth vs Sepolia
ETHEREUM_RPC_URL=http://127.0.0.1:8545    # Geth endpoint
ETHEREUM_PRIVATE_KEY=0x...                 # Wallet private key
ETHEREUM_CONTRACT_ADDRESS=0x...            # Deployed contract
INFURA_API_KEY=...                         # For Sepolia (optional)
```

---

## STIX Upload & Blockchain Recording Flow

### Complete Transaction Flow

```
User Uploads STIX Report
        ↓
┌───────────────────────────────────────────────────────────┐
│ 1. Frontend (app/dashboard/upload/page.tsx)              │
│    - User selects JSON/XML/CSV file                      │
│    - File sent to /api/stix/upload                       │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 2. Backend (routes/stix.js)                              │
│    - Parse file content                                   │
│    - Extract STIX metadata                                │
│    - Generate SHA-256 hash                                │
│    - Check for duplicates (hash-based)                    │
│    - Save to MySQL (stix_reports table)                   │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 3. Ethereum Recording (if enabled)                        │
│    - EthereumService.registerReportHash()                 │
│    - Convert hash to bytes32                              │
│    - Send transaction to smart contract                   │
│    - Wait for mining confirmation                         │
│    - Extract gas metrics (gasUsed, gasPrice, gasFee)      │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 4. Local Blockchain Recording                             │
│    - SimpleBlockchain.addSTIXTransaction()                │
│    - Create transaction with metadata + gas data          │
│    - Mine new block (PoW)                                 │
│    - Add to chain                                         │
│    - Save to blockchain_blocks table                      │
│    - Save to blockchain_transactions table                │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 5. Provenance Recording                                   │
│    - Create provenance_records entry                      │
│    - Link to blockchain transaction                       │
│    - Store actor info (user/organization)                 │
│    - Store metadata (timestamps, Ethereum TX)             │
└───────────────────────────────────────────────────────────┘
        ↓
    Response to User
```

### Code Flow Example

**Step 1: Upload Handler** (`routes/stix.js`)
```javascript
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  // Parse STIX content
  const stixContent = JSON.parse(fileContent);
  
  // Generate hash
  const reportHash = crypto.createHash('sha256')
    .update(JSON.stringify(stixContent))
    .digest('hex');
  
  // Check duplicates
  const existing = await db.findOne(
    'SELECT id FROM stix_reports WHERE hash = ?', [reportHash]
  );
  if (existing) return res.status(409).json({ error: 'Duplicate' });
  
  // Save to database
  await db.query('INSERT INTO stix_reports ...', [...]);
  
  // Record on blockchains...
});
```

**Step 2: Ethereum Recording**
```javascript
// EthereumService.registerReportHash()
const tx = await this.contract.registerReport(hashBytes32, reportId);
const receipt = await tx.wait();

// Extract gas metrics
const gasUsed = receipt.gasUsed;
const gasPrice = receipt.gasPrice;
const gasFee = gasUsed * gasPrice; // in Wei
```

**Step 3: Local Blockchain Recording**
```javascript
// SimpleBlockchain.addSTIXTransaction()
const transactionData = {
  type: 'STIX_REPORT',
  reportHash: reportHash,
  reportId: reportId,
  timestamp: Date.now(),
  metadata: { gasUsed, gasPrice, gasFee }
};

const newBlock = new Block(nextBlockNumber, Date.now(), transactionData, previousHash);
newBlock.mineBlock(this.difficulty); // PoW mining
this.chain.push(newBlock);

// Save to database
await db.query('INSERT INTO blockchain_blocks ...', [...]);
await db.query('INSERT INTO blockchain_transactions ...', [...]);
```

---

## Verification Process

### Hash Verification Flow

```
User Requests Verification
        ↓
┌───────────────────────────────────────────────────────────┐
│ 1. Fetch Report from Database                             │
│    - Get report by ID                                     │
│    - Extract stored hash                                  │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 2. Recalculate Hash                                       │
│    - Parse report content                                 │
│    - Generate SHA-256 hash                                │
│    - Compare with stored hash                             │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 3. Check Local Blockchain                                 │
│    - Query blockchain_transactions table                  │
│    - Find transaction with matching report_hash           │
│    - Verify status = 'confirmed'                          │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 4. Check Ethereum (if available)                          │
│    - Call contract.verifyReport(hash)                     │
│    - Get on-chain timestamp and uploader                  │
│    - Verify existence on blockchain                       │
└───────────────────────────────────────────────────────────┘
        ↓
    Return Verification Result
```

**Verification Endpoint**: `POST /api/stix/verify/:id`

**Response**:
```json
{
  "verified": true,
  "currentHash": "abc123...",
  "originalHash": "abc123...",
  "hashMatch": true,
  "blockchainRecorded": true,
  "transaction": {
    "tx_hash": "0x...",
    "block_number": 42,
    "timestamp": "2026-03-01T10:00:00Z"
  }
}
```

---

## TAXII 2.1 Server Integration

### What is TAXII?

**TAXII** (Trusted Automated Exchange of Intelligence Information) is a standard protocol for sharing threat intelligence.

**Location**: `routes/taxii.js`

### TAXII Collections

ThreatChain exposes 4 collections:

1. **all-threats**: Complete feed of all reports
2. **malware-reports**: Malware, ransomware, trojans
3. **apt-campaigns**: APT and threat actor campaigns
4. **indicators**: IOCs and observables

### TAXII Endpoints

```
GET  /api/taxii/                                    # Discovery
GET  /api/taxii/threatchain/                        # API Root
GET  /api/taxii/threatchain/collections/            # Collections List
GET  /api/taxii/threatchain/collections/:id/        # Collection Info
GET  /api/taxii/threatchain/collections/:id/objects/ # Get Objects
```

### Blockchain-Enhanced STIX Objects

Every STIX object returned via TAXII includes blockchain metadata:

```json
{
  "type": "indicator",
  "id": "indicator--uuid",
  "pattern": "[ipv4-addr:value = '192.168.1.1']",
  "x_threatchain_blockchain": {
    "verified": true,
    "tx_hash": "0xabc123...",
    "block_number": 42,
    "timestamp": "2026-03-01T10:00:00Z",
    "report_hash": "sha256..."
  }
}
```

### Query Parameters

- `limit`: Max objects to return (default: 100, max: 1000)
- `added_after`: ISO timestamp filter
- `next`: Pagination offset

---

## Database Schema

### Key Tables

**stix_reports**
```sql
- id (UUID, PRIMARY KEY)
- title, description
- content (JSON)
- hash (SHA-256, UNIQUE)
- stix_version, report_type
- indicators_count
- organization_id, user_id
- created_at, updated_at
```

**blockchain_blocks**
```sql
- block_number (INT, PRIMARY KEY)
- block_hash (VARCHAR 64)
- previous_hash (VARCHAR 64)
- merkle_root (VARCHAR 64)
- nonce (INT)
- difficulty (INT)
- transactions_count (INT)
- timestamp (DATETIME)
```

**blockchain_transactions**
```sql
- id (UUID, PRIMARY KEY)
- tx_hash (VARCHAR 66, UNIQUE)
- block_number (INT, FK)
- report_hash (VARCHAR 64)
- report_id (UUID, FK)
- status (ENUM: pending, confirmed)
- gas_used (BIGINT)
- gas_price (DECIMAL)
- gas_fee (DECIMAL)
- timestamp, confirmation_time
```

**provenance_records**
```sql
- id (UUID, PRIMARY KEY)
- report_id (UUID, FK)
- blockchain_tx_id (UUID, FK)
- action_type (VARCHAR: created, updated, verified)
- actor (VARCHAR)
- metadata (JSON)
- timestamp
```

---

## Blockchain Evolution: 3 Phases

### Phase 1: Simulated (MySQL Only)
- No real blockchain
- All data in MySQL
- Simulated blocks and transactions
- Fast but not cryptographically secure

### Phase 2: Hardhat Development
- Ethereum simulation for testing
- Smart contracts deployed
- Instant mining
- Not persistent (resets on restart)

**Detailed Hardhat Setup**: See dedicated section below

### Phase 3: Geth Production (Current)
- Real Ethereum node (Go-Ethereum)
- Persistent blockchain storage
- Real mining (5-second blocks)
- Real gas fees
- Production-ready

**Current Status**: Phase 3 (Geth) with fallback to Phase 1 (MySQL)

---

## Hardhat Development Environment (Phase 2)

### What is Hardhat?

**Hardhat** is the industry-standard Ethereum development environment used by professional blockchain developers. It provides a local Ethereum network for testing smart contracts without spending real money.

**Official Site**: https://hardhat.org/

### Why Hardhat?

- **Fast Development**: Instant transaction confirmation (no waiting)
- **Free Testing**: Unlimited fake ETH for testing
- **Professional Tool**: Used by Uniswap, Aave, Compound, and other major DeFi protocols
- **Rich Ecosystem**: Built-in testing, debugging, and deployment tools
- **Zero Cost**: No gas fees, no real ETH needed

### Hardhat vs Geth

| Feature | Hardhat | Geth |
|---------|---------|------|
| Purpose | Development/Testing | Production |
| Speed | Instant mining | 5-second blocks |
| Persistence | No (resets on restart) | Yes (permanent) |
| Cost | Free | Free (private) / Real ETH (mainnet) |
| Setup | Simple (1 command) | Complex (node setup) |
| Use Case | Local development | Production deployment |

### Hardhat Configuration

**Location**: `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",  // Solidity compiler version
  networks: {
    hardhat: {
      chainId: 31337  // Default Hardhat chain ID
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  }
};
```

### Installation

```bash
# Install Hardhat and toolbox
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat (if starting fresh)
npx hardhat init
```

**Dependencies Installed**:
- `hardhat`: Core framework
- `@nomicfoundation/hardhat-toolbox`: Testing utilities
- `ethers.js`: Ethereum library
- `chai`: Testing assertions
- `hardhat-gas-reporter`: Gas usage analysis

### Starting Hardhat Node

**Command**:
```bash
npx hardhat node
```

**Output**:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.
```

**What This Provides**:
- Local Ethereum node at `http://127.0.0.1:8545`
- 20 pre-funded accounts (10,000 ETH each)
- Instant mining (transactions confirm immediately)
- Console logging of all transactions
- Automatic reset on restart

### Smart Contract Deployment

**Deployment Script**: `scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying ThreatIntelRegistry contract...");

  // Get contract factory
  const ThreatIntelRegistry = await hre.ethers.getContractFactory("ThreatIntelRegistry");
  
  // Deploy contract
  const contract = await ThreatIntelRegistry.deploy();
  
  // Wait for deployment
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log(`✅ ThreatIntelRegistry deployed to: ${address}`);
  console.log(`\nAdd to .env:`);
  console.log(`ETHEREUM_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Deploy Command**:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Output**:
```
Deploying ThreatIntelRegistry contract...
✅ ThreatIntelRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Add to .env:
ETHEREUM_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Hardhat Console Interaction

**Start Console**:
```bash
npx hardhat console --network localhost
```

**Example Interactions**:
```javascript
// Get contract instance
const Contract = await ethers.getContractFactory("ThreatIntelRegistry");
const contract = await Contract.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Register a report
const hash = ethers.keccak256(ethers.toUtf8Bytes("test-report"));
const tx = await contract.registerReport(hash, "report-123");
await tx.wait();

// Verify report
const result = await contract.verifyReport(hash);
console.log("Verified:", result[0]);  // true
console.log("Timestamp:", result[1].toString());

// Get total reports
const total = await contract.getTotalReports();
console.log("Total reports:", total.toString());
```

### Testing Smart Contracts

**Test File**: `test/ThreatIntelRegistry.test.js`

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ThreatIntelRegistry", function () {
  let contract;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const ThreatIntelRegistry = await ethers.getContractFactory("ThreatIntelRegistry");
    contract = await ThreatIntelRegistry.deploy();
    await contract.waitForDeployment();
  });

  it("Should register a report", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const reportId = "report-123";
    
    await contract.registerReport(hash, reportId);
    
    const [exists, timestamp, uploader, storedId] = await contract.verifyReport(hash);
    
    expect(exists).to.be.true;
    expect(storedId).to.equal(reportId);
    expect(uploader).to.equal(owner.address);
  });

  it("Should prevent duplicate registration", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    
    await contract.registerReport(hash, "report-1");
    
    await expect(
      contract.registerReport(hash, "report-2")
    ).to.be.revertedWith("Report already registered");
  });

  it("Should return false for unregistered report", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));
    
    const [exists] = await contract.verifyReport(hash);
    
    expect(exists).to.be.false;
  });
});
```

**Run Tests**:
```bash
npx hardhat test
```

**Output**:
```
  ThreatIntelRegistry
    ✔ Should register a report (125ms)
    ✔ Should prevent duplicate registration (89ms)
    ✔ Should return false for unregistered report (45ms)

  3 passing (2s)
```

### Hardhat Network Features

#### 1. Console Logging in Contracts

```solidity
import "hardhat/console.sol";

contract ThreatIntelRegistry {
    function registerReport(bytes32 _reportHash, string memory _reportId) public {
        console.log("Registering report:", _reportId);
        console.log("Hash:", uint256(_reportHash));
        // ... rest of function
    }
}
```

#### 2. Forking Mainnet

Test against real mainnet state:

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
        blockNumber: 14390000  // Optional: pin to specific block
      }
    }
  }
};
```

#### 3. Gas Reporting

```bash
# Install gas reporter
npm install --save-dev hardhat-gas-reporter

# Add to hardhat.config.js
require("hardhat-gas-reporter");

module.exports = {
  gasReporter: {
    enabled: true,
    currency: 'USD',
    coinmarketcap: 'YOUR_API_KEY'
  }
};
```

**Output**:
```
·-----------------------------------------|---------------------------|-------------|-----------------------------·
|  Solc version: 0.8.19                   ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
··········································|···························|·············|······························
|  Methods                                                                                                         │
·························|················|·············|·············|·············|···············|··············
|  Contract              ·  Method        ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
·························|················|·············|·············|·············|···············|··············
|  ThreatIntelRegistry   ·  registerReport·  45,234     ·  62,345     ·  53,789     ·  10          ·  $2.15      │
·························|················|·············|·············|·············|···············|··············
```

### Integration with ThreatChain Backend

**EthereumService Configuration** (`blockchain/EthereumService.js`):

```javascript
// Detect Hardhat network
if (process.env.ETHEREUM_USE_LOCAL === 'true') {
  this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
  this.networkName = 'Hardhat Local';
  
  // Use Hardhat's default account
  this.wallet = new ethers.Wallet(
    process.env.ETHEREUM_PRIVATE_KEY,
    this.provider
  );
  
  console.log('✅ Connected to Hardhat network');
  console.log(`   Wallet: ${this.wallet.address}`);
}
```

**Transaction Flow with Hardhat**:

1. Backend receives STIX upload
2. Generates SHA-256 hash
3. Calls `EthereumService.registerReportHash()`
4. Sends transaction to Hardhat node (localhost:8545)
5. Transaction confirms instantly (no mining delay)
6. Returns transaction hash and receipt
7. Saves to MySQL with gas metrics

### Hardhat vs Geth Transaction Comparison

**Hardhat Transaction**:
```javascript
// Instant confirmation
const tx = await contract.registerReport(hash, reportId);
const receipt = await tx.wait();  // Returns immediately

console.log('Confirmed in block:', receipt.blockNumber);  // Block 1, 2, 3...
console.log('Gas used:', receipt.gasUsed.toString());     // Simulated gas
```

**Geth Transaction**:
```javascript
// 5-second wait for mining
const tx = await contract.registerReport(hash, reportId);
const receipt = await tx.wait();  // Waits ~5 seconds

console.log('Confirmed in block:', receipt.blockNumber);  // Real block number
console.log('Gas used:', receipt.gasUsed.toString());     // Real gas consumption
```

### Debugging with Hardhat

#### Stack Traces

Hardhat provides detailed error messages:

```
Error: VM Exception while processing transaction: reverted with reason string 'Report already registered'
    at ThreatIntelRegistry.registerReport (contracts/ThreatIntelRegistry.sol:45)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async HardhatNode._mineBlockWithPendingTxs (node_modules/hardhat/internal/hardhat-network/provider/node.ts:1802:23)
```

#### Transaction Tracing

```bash
# Enable verbose logging
npx hardhat node --verbose
```

Shows every transaction detail:
```
eth_sendTransaction
  Contract call:       ThreatIntelRegistry#registerReport
  Transaction:         0x1234...
  From:                0xf39f...
  To:                  0x5fbd...
  Value:               0 ETH
  Gas used:            45234 of 30000000
  Block #2:            0xabcd...
  
  console.log:
    Registering report: report-123
```

### Limitations of Hardhat

1. **Not Persistent**: All data lost on restart
2. **No Real Mining**: Instant confirmation (not realistic)
3. **No Network**: Single node (no consensus)
4. **Simulated Gas**: Not accurate to mainnet costs
5. **Development Only**: Not for production use

### When to Use Hardhat vs Geth

**Use Hardhat for**:
- Initial development
- Smart contract testing
- Rapid iteration
- Unit tests
- CI/CD pipelines
- Learning Ethereum

**Use Geth for**:
- Production deployment
- Persistent blockchain
- Realistic gas costs
- Multi-node testing
- Performance testing
- Final validation

### Migrating from Hardhat to Geth

**Step 1**: Develop and test on Hardhat
```bash
npx hardhat node
npx hardhat test
npx hardhat run scripts/deploy.js --network localhost
```

**Step 2**: Deploy to Geth private network
```bash
./start-geth.sh
npx hardhat run scripts/deploy.js --network localhost
```

**Step 3**: Test on Geth
```bash
# Same contract, same code, just different network
# Transactions now take 5 seconds instead of instant
```

**Step 4**: Deploy to testnet (Sepolia)
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Step 5**: Deploy to mainnet (production)
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Hardhat Commands Reference

```bash
# Start local node
npx hardhat node

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Open console
npx hardhat console --network localhost

# Clean artifacts
npx hardhat clean

# Check contract size
npx hardhat size-contracts

# Verify contract (on Etherscan)
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Environment Configuration for Hardhat

**.env for Hardhat**:
```env
# Ethereum Configuration
ETHEREUM_ENABLED=true
ETHEREUM_USE_LOCAL=true
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHEREUM_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Note**: The private key above is Hardhat's default Account #0. It's publicly known and safe to use for local development only.

---

## Gas Tracking

### What is Gas?

Gas is the computational cost of executing transactions on Ethereum.

### Gas Metrics Tracked

- **gas_used**: Computational units consumed
- **gas_price**: Price per unit (in Gwei)
- **gas_fee**: Total cost (gas_used × gas_price, in ETH)

### Where Gas Data is Stored

1. **Ethereum Transaction Receipt**: Real gas data from network
2. **blockchain_transactions table**: Persisted for analytics
3. **Metrics API**: Exposed via `/api/blockchain/metrics`

### Gas Calculation Example

```javascript
const gasUsed = 21000;              // units
const gasPrice = 0.000000114;       // Gwei
const gasFee = gasUsed * gasPrice;  // 0.000002394 ETH
```

---

## API Routes Summary

### Blockchain Routes (`/api/blockchain`)

- `GET /stats` - Blockchain statistics
- `GET /blocks` - List all blocks (paginated)
- `GET /blocks/:blockNumber` - Get specific block
- `GET /transactions` - List transactions
- `GET /transactions/:txHash` - Get transaction details
- `POST /submit` - Submit hash to blockchain
- `POST /verify` - Verify hash on blockchain
- `GET /health` - Blockchain health check

### Ethereum Routes (`/api/blockchain/ethereum`)

- `GET /status` - Ethereum service status
- `POST /register` - Register hash on Ethereum
- `GET /verify/:hash` - Verify hash on Ethereum
- `POST /verify-hash` - Manual blockchain search

### STIX Routes (`/api/stix`)

- `POST /upload` - Upload STIX report
- `GET /reports` - List all reports
- `GET /reports/:id` - Get specific report
- `POST /verify/:id` - Verify report integrity
- `DELETE /reports/:id` - Delete report
- `POST /convert` - Convert knowledge graph to STIX
- `GET /stats` - STIX statistics

### TAXII Routes (`/api/taxii`)

- `GET /` - Discovery endpoint
- `GET /threatchain/` - API root
- `GET /threatchain/collections/` - Collections list
- `GET /threatchain/collections/:id/` - Collection info
- `GET /threatchain/collections/:id/objects/` - Get STIX objects

---

## Key Files Reference

### Blockchain Implementation
- `blockchain/SimpleBlockchain.js` - Local blockchain
- `blockchain/EthereumService.js` - Ethereum integration
- `contracts/ThreatIntelRegistry.sol` - Smart contract

### API Routes
- `routes/blockchain.js` - Blockchain endpoints
- `routes/stix.js` - STIX upload/management
- `routes/taxii.js` - TAXII 2.1 server
- `routes/provenance.js` - Provenance tracking

### Configuration
- `.env` - Environment variables
- `hardhat.config.js` - Hardhat configuration
- `config/database.js` - MySQL connection

### Documentation
- `BLOCKCHAIN-EVOLUTION.md` - Blockchain phases
- `ETHEREUM-SETUP-GUIDE.md` - Ethereum setup
- `GETH-QUICK-START.md` - Geth node setup

---

## Common Operations

### Start Geth Node
```bash
./start-geth.sh
# or
geth --datadir ./geth-data --dev --http --http.api eth,web3,net --http.corsdomain "*"
```

### Deploy Smart Contract
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Check Blockchain Status
```bash
curl http://localhost:3001/api/blockchain/health
```

### Upload STIX Report
```bash
curl -X POST http://localhost:3001/api/stix/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@report.json" \
  -F "title=Test Report"
```

### Verify Report
```bash
curl -X POST http://localhost:3001/api/stix/verify/<report-id>
```

---

## Security Considerations

1. **Hash Integrity**: SHA-256 ensures data hasn't been tampered with
2. **Blockchain Immutability**: Once recorded, cannot be altered
3. **Duplicate Prevention**: Hash-based duplicate detection
4. **Access Control**: JWT authentication for uploads
5. **Private Keys**: Stored in `.env`, never committed to git
6. **Gas Limits**: Prevents runaway transactions

---

## Troubleshooting

### Duplicate Block Error
**Problem**: `ER_DUP_ENTRY` for blockchain_blocks
**Solution**: Fixed in `SimpleBlockchain.js` - queries DB for latest block number

### Ethereum Connection Failed
**Problem**: Cannot connect to Geth/Sepolia
**Solution**: Check `ETHEREUM_RPC_URL` and ensure node is running

### Gas Columns Missing
**Problem**: `Unknown column 'gas_used'`
**Solution**: Run migration: `node scripts/add-gas-columns.js`

---

## Summary

ThreatChain provides a robust, dual-blockchain architecture for threat intelligence:

- **Local blockchain** for fast, reliable recording
- **Ethereum integration** for external verification
- **STIX 2.1 compliance** for standard threat data
- **TAXII 2.1 server** for intelligence sharing
- **Complete provenance** tracking with immutable audit trail
- **Gas metrics** for transaction cost analysis

The system balances performance (local chain) with cryptographic security (Ethereum) to create a production-ready threat intelligence platform.
