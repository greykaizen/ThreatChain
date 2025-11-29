# 🚀 Geth Quick Start Guide

## ⚡ Quick Setup (3 Commands)

```bash
# 1. Setup Geth (one-time)
chmod +x *.sh
./setup-geth.sh

# 2. Deploy contracts (one-time)
npx hardhat compile
node scripts/deploy-to-geth.js

# 3. Start everything
./start-everything-geth.sh
```

That's it! Your application is now running with Geth! 🎉

---

## 📋 Detailed Steps

### Step 1: Install & Setup Geth

```bash
# Make scripts executable
chmod +x setup-geth.sh start-geth.sh start-everything-geth.sh

# Run setup (installs Geth if needed)
./setup-geth.sh
```

**What this does:**
- ✅ Installs Geth (if not installed)
- ✅ Creates genesis block
- ✅ Initializes blockchain
- ✅ Imports account with 10,000 ETH

---

### Step 2: Compile & Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Start Geth (in separate terminal)
./start-geth.sh

# Deploy to Geth (in another terminal)
node scripts/deploy-to-geth.js
```

**What this does:**
- ✅ Compiles ThreatIntelRegistry contract
- ✅ Deploys to Geth network
- ✅ Updates .env with contract address
- ✅ Saves deployment info

---

### Step 3: Start Application

```bash
# Start everything (Geth + Backend + Frontend)
./start-everything-geth.sh
```

**What this does:**
- ✅ Starts Geth node (mining enabled)
- ✅ Starts backend server
- ✅ Starts frontend
- ✅ All services run together

---

## 🔍 Verify Installation

### Check Geth is Running

```bash
# Check if Geth is responding
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

**Expected Response:**
```json
{"jsonrpc":"2.0","id":1,"result":"0x5"}
```

### Check Contract is Deployed

```bash
# View deployment info
cat geth-deployment.json
```

### Check Account Balance

```bash
# Attach to Geth console
geth attach http://localhost:8545

# In Geth console:
> eth.getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
> eth.blockNumber
> exit
```

---

## 🎯 Test the System

### 1. Upload STIX Report

1. Go to: http://localhost:3000/blockchain-demo
2. Upload `sample-ransomware-attack.json`
3. Click "Record Provenance on Blockchain"
4. Wait 5-10 seconds (Geth block time)
5. See confirmation!

### 2. Check Blockchain

```bash
# Run test script
node scripts/test-ethereum.js
```

### 3. View Metrics

Go to: http://localhost:3000/blockchain-metrics

Should show:
- ✅ Real gas prices from Geth
- ✅ Transaction counts
- ✅ Block numbers
- ✅ Success rates

---

## 🛠️ Common Commands

### Start/Stop Services

```bash
# Start everything
./start-everything-geth.sh

# Stop (press Ctrl+C)

# Start only Geth
./start-geth.sh

# Start only backend
npm run backend

# Start only frontend
npm run dev
```

### View Logs

```bash
# Geth logs
tail -f geth.log

# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

### Geth Console

```bash
# Attach to running Geth
geth attach http://localhost:8545

# Useful commands in console:
> eth.blockNumber          # Current block
> eth.mining               # Mining status
> eth.hashrate             # Hash rate
> eth.accounts             # List accounts
> eth.getBalance(eth.accounts[0])  # Check balance
> admin.peers              # Connected peers (should be 0)
> exit
```

### Reset Blockchain

```bash
# Stop Geth
# Remove data
rm -rf geth-data

# Re-setup
./setup-geth.sh

# Re-deploy contracts
node scripts/deploy-to-geth.js
```

---

## 🐛 Troubleshooting

### Issue: "Geth not installed"

**Solution:**
```bash
# Ubuntu/Debian
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum

# macOS
brew tap ethereum/ethereum
brew install ethereum

# Verify
geth version
```

### Issue: "Contract deployment failed"

**Solution:**
```bash
# 1. Make sure Geth is running
ps aux | grep geth

# 2. Check Geth is responding
curl http://localhost:8545

# 3. Check account has balance
geth attach http://localhost:8545
> eth.getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

# 4. Try deploying again
node scripts/deploy-to-geth.js
```

### Issue: "Port 8545 already in use"

**Solution:**
```bash
# Find process using port 8545
lsof -i :8545

# Kill it
kill -9 <PID>

# Or use different port in start-geth.sh
# Change --http.port 8545 to --http.port 8546
```

### Issue: "Transaction taking too long"

**Reason:** Geth mines blocks every 5 seconds

**Solution:** Wait 5-10 seconds for transaction confirmation

---

## 📊 Geth vs Hardhat Comparison

| Feature | Hardhat | Geth |
|---------|---------|------|
| Block Time | Instant | 5 seconds |
| State | Ephemeral | Persistent |
| Mining | Auto | Configurable |
| Production | No | Yes |
| Setup | Easy | Moderate |

---

## 🎉 Success Checklist

- [ ] Geth installed and version shows
- [ ] Genesis block initialized
- [ ] Account imported with balance
- [ ] Contracts compiled
- [ ] Contracts deployed to Geth
- [ ] .env updated with contract address
- [ ] All services start successfully
- [ ] Can upload STIX reports
- [ ] Transactions confirm on blockchain
- [ ] Metrics dashboard shows real data

---

## 📚 Additional Resources

- **Geth Documentation**: https://geth.ethereum.org/docs
- **Geth GitHub**: https://github.com/ethereum/go-ethereum
- **Ethereum JSON-RPC**: https://ethereum.org/en/developers/docs/apis/json-rpc/

---

## 🚀 You're Ready!

Your ThreatChain application is now running on Geth - a production-ready Ethereum client!

**Next Steps:**
1. Upload threat intelligence data
2. Watch it get recorded on blockchain
3. Verify integrity and provenance
4. Share with confidence! 🎊
