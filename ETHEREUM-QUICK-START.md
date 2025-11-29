# 🚀 Ethereum Setup - Professional & Simple

## What You'll Get

- ✅ Real Ethereum blockchain running locally
- ✅ Smart contract deployed and working
- ✅ Professional setup (same as real companies use)
- ✅ Takes 5 minutes total
- ✅ Can deploy to real Ethereum testnet later

---

## Step-by-Step Setup (5 Minutes)

### Step 1: Install Hardhat Dependencies (1 minute)

```bash
cd ThreatChain
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Step 2: Start Local Ethereum Node (30 seconds)

Open a **NEW terminal** and run:

```bash
npx hardhat node
```

**Keep this terminal open!** You should see:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

### Step 3: Deploy Smart Contract (1 minute)

Open **another terminal** and run:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

You'll see:

```
✅ ThreatIntelRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy that contract address!**

### Step 4: Update .env File (30 seconds)

Open `ThreatChain/.env` and update:

```env
# Ethereum Configuration
ETHEREUM_ENABLED=true
ETHEREUM_USE_LOCAL=true
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHEREUM_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Replace the contract address with yours from Step 3!

### Step 5: Start Backend (30 seconds)

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

### Step 6: Start Frontend (30 seconds)

Open **another terminal**:

```bash
npm run dev
```

Go to: http://localhost:3000

---

## ✅ Test It Works

### Test 1: Upload a Report

1. Go to **Blockchain Demo** page
2. Upload `sample-threat-data.csv`
3. Watch the console - you'll see:
   ```
   📤 Submitting to Ethereum...
   ✅ Confirmed in block: 2
   ```

### Test 2: Check Ethereum Status

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
  "balance": "9999.99",
  "totalReports": "1"
}
```

---

## 🎯 What's Running

You should have **3 terminals open**:

1. **Terminal 1**: `npx hardhat node` (Ethereum blockchain)
2. **Terminal 2**: `npm run backend` (Backend server)
3. **Terminal 3**: `npm run dev` (Frontend)

---

## 🧪 Advanced Testing

### Test the Smart Contract Directly

```bash
npx hardhat run scripts/test-ethereum.js --network localhost
```

This will:

- Register multiple reports
- Verify them on blockchain
- Show gas costs
- Test duplicate prevention

---

## 🌐 Deploy to Real Testnet (Optional - Later)

When you're ready to deploy to Sepolia testnet:

### 1. Get Sepolia ETH

- Go to: https://sepoliafaucet.com/
- Enter your wallet address
- Get free test ETH

### 2. Get Infura API Key

- Sign up: https://infura.io/
- Create project
- Copy API key

### 3. Update .env

```env
ETHEREUM_ENABLED=true
ETHEREUM_USE_LOCAL=false
ETHEREUM_PRIVATE_KEY=your_real_private_key
INFURA_API_KEY=your_infura_key
```

### 4. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 5. View on Etherscan

Your transactions will be visible at:
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

---

## 📊 How It Works

### Dual Blockchain Architecture

```
Upload STIX Report
       │
       ├─► Local SimpleBlockchain (MySQL)
       │   ├─► Instant confirmation
       │   ├─► No gas fees
       │   └─► Always works
       │
       └─► Ethereum Smart Contract
           ├─► Real blockchain
           ├─► Immutable proof
           └─► Public verification
```

### What Gets Stored Where

**MySQL Database:**

- Full STIX report content
- All metadata
- Relationships
- Knowledge graph data

**Local SimpleBlockchain:**

- Report hash
- Transaction ID
- Block number
- Timestamp

**Ethereum:**

- Report hash only (32 bytes)
- Report ID
- Timestamp
- Uploader address

---

## 🛠️ Troubleshooting

### "Cannot connect to Ethereum"

- Make sure `npx hardhat node` is running
- Check port 8545 is not blocked
- Restart the Hardhat node

### "Contract not deployed"

- Run deployment script again
- Check contract address in .env
- Make sure Hardhat node is running

### "Insufficient funds"

- Restart Hardhat node (resets balances to 10000 ETH)
- Use Account #0 private key from Hardhat output

### Backend doesn't show Ethereum enabled

- Check .env file has correct values
- Restart backend server
- Check for error messages in console

---

## 📁 Project Structure

```
ThreatChain/
├── contracts/
│   └── ThreatIntelRegistry.sol    # Smart contract
├── scripts/
│   ├── deploy.js                  # Deployment script
│   └── test-ethereum.js           # Test script
├── blockchain/
│   ├── SimpleBlockchain.js        # Local blockchain (backup)
│   └── EthereumService.js         # Ethereum integration
├── hardhat.config.js              # Hardhat configuration
└── .env                           # Configuration
```

---

## 💰 Cost Analysis

### Local Development (Hardhat)

- Setup: **FREE**
- Per transaction: **FREE**
- Speed: **Instant**

### Sepolia Testnet

- Setup: **FREE**
- Per transaction: **FREE** (test ETH)
- Speed: **12-15 seconds**

### Ethereum Mainnet (Production)

- Setup: **~$50-100**
- Per transaction: **~$2-5**
- Speed: **12-15 seconds**

---

## ✅ Success Checklist

- [ ] Hardhat node running (Terminal 1)
- [ ] Backend running (Terminal 2)
- [ ] Frontend running (Terminal 3)
- [ ] Contract deployed
- [ ] .env updated with contract address
- [ ] Backend shows "Ethereum integration enabled"
- [ ] Can upload reports
- [ ] Reports appear on blockchain
- [ ] Can verify reports

---

## 🎓 For Your Thesis/Project

### What to Say

**Technical Architecture:**
"The system implements a hybrid blockchain architecture using Ethereum smart contracts for immutable attestation while maintaining data confidentiality through off-chain storage. The local development environment uses Hardhat for rapid iteration, with production deployment capability to Ethereum testnets or mainnet."

**Why This Approach:**
"This architecture balances the need for cryptographic proof-of-existence with practical considerations around data privacy, transaction costs, and system performance. The dual-blockchain approach ensures system availability even during network congestion."

**Professional Standards:**
"Development follows industry best practices using Hardhat, the standard Ethereum development environment used by major DeFi protocols and enterprise blockchain applications."

---

## 🚀 Quick Commands Reference

```bash
# Start Ethereum node
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Test contract
npx hardhat run scripts/test-ethereum.js --network localhost

# Start backend
npm run backend

# Start frontend
npm run dev

# Check Ethereum status
curl http://localhost:3001/api/blockchain/ethereum/status
```

---

## 📞 Need Help?

1. Check Hardhat is running: `ps aux | grep hardhat`
2. Check backend logs for errors
3. Verify .env configuration
4. Try restarting everything

---

**You're all set! This is a professional, production-ready setup that you can use right now and deploy to real Ethereum later.** 🎉
