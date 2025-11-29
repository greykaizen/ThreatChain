# Ethereum Integration Setup Guide

This guide will help you set up Ethereum blockchain integration for ThreatChain. You have two options:

1. **Local Ethereum (Hardhat)** - For development and testing
2. **Sepolia Testnet** - For public testnet deployment

Your **local SimpleBlockchain** will remain as a backup and continue working alongside Ethereum.

---

## Prerequisites

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install dotenv ethers@6
```

---

## Option 1: Local Ethereum with Hardhat (Recommended for Development)

### Step 1: Initialize Hardhat

```bash
cd ThreatChain
npx hardhat init
```

Choose: "Create a JavaScript project"

### Step 2: Configure Hardhat

Your `hardhat.config.js` is already configured (see file).

### Step 3: Start Local Ethereum Node

```bash
npx hardhat node
```

This will:
- Start a local Ethereum node on `http://localhost:8545`
- Create 20 test accounts with 10,000 ETH each
- Display private keys (use Account #0 for deployment)

Keep this terminal running!

### Step 4: Deploy Contract

In a new terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This will output:
```
ThreatIntelRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 5: Update .env File

```env
# Ethereum Configuration
ETHEREUM_ENABLED=true
ETHEREUM_USE_LOCAL=true
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHEREUM_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 6: Restart Backend

```bash
npm run backend
```

You should see:
```
✅ Ethereum integration enabled
   Network: Private Hardhat (localhost:8545)
   Wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## Option 2: Sepolia Testnet (Public Testnet)

### Step 1: Get Sepolia ETH

1. Create a wallet (MetaMask or use generated private key)
2. Get free Sepolia ETH from faucets:
   - https://sepoliafaucet.com/
   - https://www.infura.io/faucet/sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

### Step 2: Get Infura API Key

1. Sign up at https://infura.io/
2. Create a new project
3. Copy your API key

### Step 3: Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Step 4: Update .env File

```env
# Ethereum Configuration
ETHEREUM_ENABLED=true
ETHEREUM_USE_LOCAL=false
ETHEREUM_PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key_here
ETHEREUM_CONTRACT_ADDRESS=deployed_contract_address_here
```

### Step 5: Verify Contract (Optional)

Get Etherscan API key from https://etherscan.io/apis

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS
```

---

## How It Works

### Dual Blockchain System

ThreatChain uses **both** blockchains simultaneously:

1. **Local SimpleBlockchain** (Always Active)
   - Fast, no gas fees
   - Complete control
   - Stored in MySQL database
   - Used for immediate attestation

2. **Ethereum** (Optional)
   - Public/immutable
   - Requires gas fees
   - Verifiable by anyone
   - Used for public proof

### When You Upload STIX Report:

```javascript
// 1. Local blockchain (always happens)
const localTx = await blockchain.addSTIXTransaction(hash, reportId)

// 2. Ethereum (if enabled)
if (ethereumService.isEnabled) {
  const ethTx = await ethereumService.registerReportHash(hash, reportId)
}
```

### Data Flow

```
STIX Upload
    │
    ├─► Local Blockchain
    │   ├─► Mine block (2 difficulty)
    │   ├─► Save to MySQL
    │   └─► Return TX hash
    │
    └─► Ethereum (if enabled)
        ├─► Send transaction
        ├─► Wait for confirmation
        └─► Return TX hash + block number
```

---

## Testing the Integration

### 1. Check Ethereum Status

```bash
curl http://localhost:3001/api/blockchain/ethereum/status
```

Response:
```json
{
  "enabled": true,
  "network": "Hardhat Local",
  "contractAddress": "0x5FbDB...",
  "walletAddress": "0xf39Fd...",
  "balance": "9999.99"
}
```

### 2. Upload a STIX Report

```bash
curl -X POST http://localhost:3001/api/stix/upload \
  -F "file=@sample-threat-data.csv" \
  -F "title=Test Report"
```

Response will include both blockchain transactions:
```json
{
  "blockchain": {
    "transactionId": "uuid",
    "txHash": "0xabc...",
    "blockNumber": 5
  },
  "ethereum": {
    "success": true,
    "txHash": "0xdef...",
    "blockNumber": 12,
    "explorerUrl": "https://sepolia.etherscan.io/tx/0xdef..."
  }
}
```

### 3. Verify on Blockchain

```bash
curl http://localhost:3001/api/blockchain/ethereum/verify/REPORT_HASH
```

---

## Smart Contract Functions

### registerReport(bytes32 _reportHash, string _reportId)
Registers a new report hash on the blockchain.

**Parameters:**
- `_reportHash`: SHA-256 hash of STIX report (bytes32)
- `_reportId`: UUID from database (string)

**Emits:** `HashRegistered` event

### verifyReport(bytes32 _reportHash)
Verifies if a hash exists and returns its details.

**Returns:**
- `exists`: bool - Whether hash is registered
- `timestamp`: uint256 - When it was registered
- `uploader`: address - Who registered it
- `reportId`: string - Associated report ID

### getTotalReports()
Returns total number of registered reports.

---

## Gas Costs (Approximate)

### Sepolia Testnet
- Deploy contract: ~0.002 ETH
- Register report: ~0.0001 ETH per report
- Verify report: Free (read-only)

### Mainnet (if you ever deploy)
- Deploy contract: ~$50-100
- Register report: ~$2-5 per report

---

## Monitoring

### View Transactions on Etherscan

**Sepolia:**
- Contract: https://sepolia.etherscan.io/address/YOUR_CONTRACT
- Transaction: https://sepolia.etherscan.io/tx/YOUR_TX_HASH

**Local Hardhat:**
- Use Hardhat console or logs

### Check Contract State

```bash
npx hardhat console --network localhost
```

```javascript
const contract = await ethers.getContractAt("ThreatIntelRegistry", "CONTRACT_ADDRESS")
const total = await contract.getTotalReports()
console.log("Total reports:", total.toString())
```

---

## Troubleshooting

### "Ethereum integration not enabled"
- Check `.env` has `ETHEREUM_ENABLED=true`
- Verify private key is set
- Ensure contract address is correct

### "Insufficient funds"
- Local: Restart Hardhat node (resets balances)
- Sepolia: Get more test ETH from faucets

### "Nonce too high"
- Reset Hardhat node: `npx hardhat node --reset`
- Or wait for pending transactions to confirm

### "Contract not deployed"
- Run deployment script again
- Check network in hardhat.config.js
- Verify RPC URL is correct

---

## Security Best Practices

### Private Keys
- **NEVER** commit private keys to Git
- Use `.env` file (already in `.gitignore`)
- For production, use hardware wallets or key management services

### Contract Security
- Contract is immutable once deployed
- Test thoroughly on local/testnet first
- Consider using OpenZeppelin contracts for production

### Gas Optimization
- Batch multiple reports if possible
- Use events for off-chain indexing
- Only store hashes, not full data

---

## Backup Strategy

Your system has **triple redundancy**:

1. **MySQL Database** - Full STIX reports and metadata
2. **Local Blockchain** - Fast attestation, always available
3. **Ethereum** - Public proof, immutable, verifiable by anyone

If Ethereum is down or disabled:
- Local blockchain continues working
- All features remain functional
- No data loss

---

## Next Steps

1. ✅ Deploy contract locally
2. ✅ Test with sample data
3. ✅ Verify on blockchain
4. 🔄 Deploy to Sepolia testnet
5. 🔄 Test with real threat intelligence
6. 🔄 Monitor gas costs
7. 🔄 Consider mainnet deployment (optional)

---

## Support

- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org/v6/
- Sepolia Faucet: https://sepoliafaucet.com/
- Infura: https://infura.io/

---

## Cost Comparison

| Feature | Local Blockchain | Ethereum Sepolia | Ethereum Mainnet |
|---------|-----------------|------------------|------------------|
| Setup Cost | Free | Free | $50-100 |
| Per Report | Free | Free (testnet) | $2-5 |
| Speed | Instant | 12-15 seconds | 12-15 seconds |
| Public Verification | No | Yes | Yes |
| Immutability | Database-level | Blockchain-level | Blockchain-level |
| Recommended For | Development | Testing | Production |
