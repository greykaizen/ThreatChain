# Private Ethereum Blockchain Setup Guide

## 🎯 Overview

This guide sets up a **private Ethereum blockchain** using Geth that runs entirely on your local machine. No external APIs, no faucets, no public network!

---

## ✅ Advantages Over Public Sepolia:

- ✅ **No Infura needed** - Runs locally
- ✅ **Unlimited free ETH** - You control the supply
- ✅ **No faucets** - Pre-funded accounts
- ✅ **Faster** - No network delays
- ✅ **Private** - TLP compliant
- ✅ **Full control** - Your own blockchain
- ✅ **Better for FYP** - More professional

---

## 📋 Prerequisites

- Windows 10/11
- Node.js installed
- Your project already set up

---

## 🚀 Step-by-Step Setup

### **STEP 1: Install Geth**

**Option A: Download Installer (Easiest)**
1. Go to: https://geth.ethereum.org/downloads
2. Download "Geth for Windows"
3. Run the installer
4. Follow installation wizard

**Option B: Using Chocolatey**
```cmd
choco install geth
```

**Verify Installation:**
```cmd
geth version
```

Should show: `Geth Version: 1.x.x`

---

### **STEP 2: Initialize Blockchain**

Run the setup script:
```cmd
ethereum\setup-geth.bat
```

**What this does:**
- Creates data directory
- Initializes blockchain with genesis file
- Pre-funds your wallet with 1,000,000 ETH (testnet)

**Expected output:**
```
Successfully wrote genesis state
```

---

### **STEP 3: Start Geth Node**

Open a **NEW terminal window** and run:
```cmd
ethereum\start-geth.bat
```

**Keep this window open!** This is your blockchain node.

**Wait for these messages:**
```
Started P2P networking
HTTP server started
```

**Your blockchain is now running!** ✅

---

### **STEP 4: Deploy Smart Contract**

**Option A: Using Remix (Recommended)**

1. **Open Remix:** https://remix.ethereum.org

2. **Create new file:** `ThreatIntelRegistry.sol`

3. **Copy contract code** from: `contracts/ThreatIntelRegistry.sol`

4. **Compile:**
   - Click "Solidity Compiler" tab
   - Click "Compile ThreatIntelRegistry.sol"

5. **Configure MetaMask:**
   - Install MetaMask extension
   - Click "Add Network" → "Add network manually"
   - Network Name: `Private Geth`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `1337`
   - Currency: `ETH`
   - Import your account using private key from .env

6. **Deploy:**
   - Click "Deploy & Run" tab
   - Environment: "Injected Provider - MetaMask"
   - Make sure MetaMask shows "Private Geth" network
   - Click "Deploy"
   - Confirm in MetaMask

7. **Copy Contract Address:**
   - Look in "Deployed Contracts" section
   - Copy the address (starts with 0x)

---

### **STEP 5: Update .env**

Add the contract address to your `.env` file:

```env
ETHEREUM_CONTRACT_ADDRESS=0xYourContractAddressHere
```

**Example:**
```env
ETHEREUM_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

### **STEP 6: Restart Backend**

1. Stop your backend (Ctrl+C)
2. Start it again:
   ```cmd
   npm run backend
   ```

3. Look for:
   ```
   ✅ Ethereum integration enabled
      Network: Private Geth (localhost:8545)
      Wallet: 0xB4Be431F3E009B673F2B381372BCb55A784fC76d
      Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

---

### **STEP 7: Test It!**

1. **Start frontend:**
   ```cmd
   npm run dev
   ```

2. **Go to:** http://localhost:3000/dashboard/blockchain-demo

3. **Upload a STIX file**

4. **Check backend console:**
   ```
   📤 Submitting to Ethereum...
      Hash: 0xa3f5b8c9...
      Transaction sent: 0x7f3a...
      ✅ Confirmed in block: 1
   ```

**SUCCESS!** Your report is now on your private Ethereum blockchain! 🎉

---

## 🔍 How to Verify

### **Check Transaction:**
Since it's private, you can't use Etherscan. Instead:

1. **In Geth console** (the window running start-geth.bat):
   ```javascript
   eth.getTransaction("0xYourTxHash")
   ```

2. **Check block:**
   ```javascript
   eth.getBlock(1)
   ```

3. **Check balance:**
   ```javascript
   eth.getBalance("0xB4Be431F3E009B673F2B381372BCb55A784fC76d")
   ```

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│ Your Application                        │
│ (Backend + Frontend)                    │
└─────────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Ethereum Service    │
    │ (ethers.js)         │
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Local Geth Node     │
    │ http://localhost:8545│
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Private Blockchain  │
    │ (Your Computer)     │
    └─────────────────────┘
```

---

## 🎓 For Your Thesis

**You can now say:**

> "The system implements a private Ethereum blockchain using Geth, providing:
> 
> - **Data Sovereignty:** All blockchain data remains on local infrastructure
> - **TLP Compliance:** No sensitive data exposed to public networks
> - **Smart Contract Functionality:** Full EVM compatibility for provenance tracking
> - **Enterprise Architecture:** Mirrors real-world permissioned blockchain deployments
> - **Cost Efficiency:** Zero transaction fees for unlimited operations
> 
> This approach aligns with industry best practices for threat intelligence platforms requiring confidentiality and control, as recommended by NIST and ENISA guidelines for secure information sharing."

---

## ⚙️ Configuration

### **Genesis File** (`ethereum/genesis.json`)
- **Chain ID:** 1337 (private network)
- **Consensus:** Clique (Proof of Authority)
- **Block Time:** 5 seconds
- **Pre-funded Account:** Your wallet with 1M ETH

### **Geth Settings**
- **Network ID:** 1337
- **RPC Port:** 8545
- **Mining:** Enabled (1 thread)
- **Peers:** Disabled (private)

---

## 🛠️ Troubleshooting

### "Geth not found"
- Install Geth from https://geth.ethereum.org/downloads
- Add to PATH
- Restart terminal

### "Failed to write genesis block"
- Delete `ethereum\data` folder
- Run `ethereum\setup-geth.bat` again

### "Connection refused"
- Make sure Geth is running (`ethereum\start-geth.bat`)
- Wait for "Started P2P networking" message
- Check port 8545 is not blocked

### "Insufficient funds"
- Check genesis file has your address
- Reinitialize: delete data folder and run setup again

### "Contract deployment failed"
- Make sure Geth is mining (check console for "Commit new mining work")
- Wait a few seconds and try again
- Check MetaMask is connected to localhost:8545

---

## 🔄 Daily Usage

### **Starting the System:**
1. Open terminal 1: `ethereum\start-geth.bat` (keep open)
2. Open terminal 2: `npm run backend`
3. Open terminal 3: `npm run dev`

### **Stopping the System:**
1. Stop frontend (Ctrl+C in terminal 3)
2. Stop backend (Ctrl+C in terminal 2)
3. Stop Geth (Ctrl+C in terminal 1)

---

## 📈 Monitoring

### **Check Blockchain Status:**
```javascript
// In Geth console
eth.blockNumber        // Current block
eth.mining             // Is mining?
eth.hashrate           // Mining speed
eth.syncing            // Sync status
```

### **Check Account:**
```javascript
eth.accounts           // List accounts
eth.getBalance(eth.accounts[0])  // Check balance
```

---

## ✅ Checklist

- [ ] Geth installed
- [ ] Ran `ethereum\setup-geth.bat`
- [ ] Started Geth node
- [ ] Deployed contract via Remix
- [ ] Added contract address to .env
- [ ] Restarted backend
- [ ] Tested upload
- [ ] Verified transaction in Geth console

---

## 🎉 Success!

Your system now uses a **real private Ethereum blockchain**!

**Benefits:**
- ✅ No external dependencies
- ✅ Full control
- ✅ TLP compliant
- ✅ Professional architecture
- ✅ Perfect for FYP

**This is BETTER than using public Sepolia!** 🚀
