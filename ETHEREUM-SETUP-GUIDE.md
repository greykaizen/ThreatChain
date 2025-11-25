# Ethereum Integration Setup Guide

## 🎯 Overview

This guide will help you integrate real Ethereum blockchain into your ThreadChain project. The system will store report hashes on Ethereum Sepolia testnet while keeping full data in MySQL.

---

## 📋 Prerequisites

- Node.js installed
- Backend running
- Basic understanding of Ethereum

---

## 🚀 Step-by-Step Setup

### Step 1: Install Ethereum Package

```bash
.\install-ethereum.bat
```

Or manually:
```bash
npm install ethers@6
```

---

### Step 2: Get Infura API Key (FREE)

1. Go to https://infura.io
2. Sign up for free account
3. Create new project
4. Select "Web3 API"
5. Copy your API key
6. Add to `.env`:
   ```
   INFURA_API_KEY=your_key_here
   ```

---

### Step 3: Generate Ethereum Wallet

```bash
node scripts/deploy-contract.js --generate-wallet
```

This will output:
```
🔑 New Ethereum Wallet Generated:
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Private Key: 0x1234567890abcdef...

⚠️  IMPORTANT: Save this private key securely!
```

Add to `.env`:
```
ETHEREUM_PRIVATE_KEY=0x1234567890abcdef...
```

---

### Step 4: Get Free Testnet ETH

You need Sepolia testnet ETH to deploy contract and register hashes.

**Faucets (FREE):**
1. https://sepoliafaucet.com/
2. https://www.infura.io/faucet/sepolia
3. https://sepolia-faucet.pk910.de/

**Steps:**
1. Copy your wallet address from Step 3
2. Visit any faucet above
3. Paste your address
4. Request testnet ETH
5. Wait 1-2 minutes

---

### Step 5: Deploy Smart Contract

**Option A: Using Remix (Easiest)**

1. Go to https://remix.ethereum.org
2. Create new file: `ThreatIntelRegistry.sol`
3. Copy contract from `contracts/ThreatIntelRegistry.sol`
4. Compile:
   - Click "Solidity Compiler" tab
   - Click "Compile ThreatIntelRegistry.sol"
5. Deploy:
   - Click "Deploy & Run" tab
   - Select "Injected Provider - MetaMask"
   - Connect MetaMask with your private key
   - Select "Sepolia" network
   - Click "Deploy"
   - Confirm transaction
6. Copy contract address
7. Add to `.env`:
   ```
   ETHEREUM_CONTRACT_ADDRESS=0xYourContractAddress
   ```

**Option B: Using Hardhat (Advanced)**

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# Follow prompts, then deploy
```

---

### Step 6: Verify Setup

```bash
node scripts/deploy-contract.js
```

Should show:
```
✅ Ethereum integration enabled
   Network: Sepolia Testnet
   Contract: 0xYourContractAddress
```

---

### Step 7: Test Integration

1. Start backend: `npm run backend`
2. Upload a STIX report via Blockchain Demo
3. Check console for:
   ```
   📤 Submitting to Ethereum...
      Hash: 0xa3f5b8c9...
      Transaction sent: 0x7f3a...
      ✅ Confirmed in block: 12345678
   ```
4. Verify on Etherscan:
   https://sepolia.etherscan.io/tx/YOUR_TX_HASH

---

## 🔍 How It Works

### Architecture:

```
┌─────────────────────────────────────────┐
│ User Uploads STIX Report                │
└─────────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Generate SHA-256    │
    └─────────────────────┘
              ↓
    ┌─────────────────────────────────┐
    │ Store in MySQL (OFF-CHAIN)      │
    │ - Full STIX JSON                │
    │ - All indicators                │
    │ - Metadata                      │
    └─────────────────────────────────┘
              ↓
    ┌─────────────────────────────────┐
    │ Store Hash on Ethereum          │
    │ (ON-CHAIN)                      │
    │ - Hash only                     │
    │ - Report ID                     │
    │ - Timestamp (automatic)         │
    └─────────────────────────────────┘
              ↓
    ┌─────────────────────────────────┐
    │ Save Ethereum TX Hash           │
    │ in MySQL for verification       │
    └─────────────────────────────────┘
```

### What Goes On Ethereum:
- ✅ SHA-256 hash (64 characters)
- ✅ Report UUID
- ✅ Timestamp (automatic)
- ✅ Uploader address (automatic)

### What Stays in MySQL:
- ✅ Full STIX report
- ✅ All indicators
- ✅ Sensitive data
- ✅ Metadata

---

## 💰 Cost Analysis

### Sepolia Testnet (FREE):
- Gas per transaction: ~50,000 gas
- Cost: $0 (testnet ETH is free)
- Time: ~15 seconds

### Ethereum Mainnet (DON'T USE):
- Gas per transaction: ~50,000 gas
- Cost: $5-20 per transaction
- Not recommended for FYP

---

## 🧪 Testing

### Test 1: Upload Report
1. Go to Blockchain Demo page
2. Upload `sample-stix-2.1.json`
3. Check console for Ethereum confirmation
4. Note the transaction hash

### Test 2: Verify on Etherscan
1. Go to https://sepolia.etherscan.io
2. Search for your transaction hash
3. See your hash stored on blockchain!

### Test 3: Verify Report
```bash
curl http://localhost:3001/api/stix/reports/REPORT_ID
```

Should show:
```json
{
  "ethereum": {
    "success": true,
    "txHash": "0x7f3a...",
    "blockNumber": 12345678,
    "explorerUrl": "https://sepolia.etherscan.io/tx/..."
  }
}
```

---

## ⚠️ Troubleshooting

### "Ethereum integration not enabled"
- Check `.env` has all three variables set
- Restart backend after updating `.env`

### "Insufficient funds"
- Get more testnet ETH from faucets
- Check balance: `node scripts/deploy-contract.js`

### "Transaction failed"
- Check gas price isn't too low
- Ensure contract address is correct
- Verify network is Sepolia

### "Contract not deployed"
- Deploy contract via Remix
- Add contract address to `.env`
- Restart backend

---

## 📊 Monitoring

### Check Ethereum Status:
```bash
curl http://localhost:3001/api/blockchain/ethereum/status
```

### View Your Transactions:
https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS

### Check Contract:
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

---

## 🎓 For Your Thesis

### What to Write:

> "The system integrates with Ethereum Sepolia testnet to provide immutable provenance records. Only cryptographic hashes are stored on-chain, maintaining confidentiality while enabling public verification. This hybrid architecture demonstrates:
> 
> - Real blockchain integration (Ethereum)
> - TLP-compliant data handling (hashes only on-chain)
> - Independent verification via Etherscan
> - Production-ready architecture pattern
> 
> The smart contract stores SHA-256 hashes with timestamps, creating a tamper-evident audit trail without exposing sensitive threat intelligence data."

---

## 🔒 Security Notes

1. **Never commit private keys to Git**
2. **Use testnet only for FYP**
3. **Keep private key secure**
4. **Don't share wallet address publicly**
5. **Testnet ETH has no real value**

---

## 📚 Additional Resources

- Ethereum Docs: https://ethereum.org/developers
- Infura Docs: https://docs.infura.io
- Remix IDE: https://remix.ethereum.org
- Sepolia Faucets: https://sepoliafaucet.com
- Etherscan: https://sepolia.etherscan.io

---

## ✅ Checklist

- [ ] Installed ethers package
- [ ] Got Infura API key
- [ ] Generated Ethereum wallet
- [ ] Got testnet ETH
- [ ] Deployed smart contract
- [ ] Updated .env file
- [ ] Restarted backend
- [ ] Tested upload
- [ ] Verified on Etherscan

---

## 🎉 Success!

Once setup is complete, every STIX report uploaded will be:
1. Stored in MySQL (full data)
2. Registered on Ethereum (hash only)
3. Verifiable on Etherscan (public proof)

Your system now uses REAL blockchain! 🚀
