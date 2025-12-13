# 🪟 Complete Windows Setup Guide for ThreatChain

## 📋 Prerequisites

Before starting, make sure you have:

1. **Node.js v20+** - [Download](https://nodejs.org/)
2. **MySQL Server** - [Download](https://dev.mysql.com/downloads/installer/) or [XAMPP](https://www.apachefriends.org/)
3. **Git** (already installed ✅)

---

## 🚀 Complete Setup (Step-by-Step)

### Step 1: Upgrade Node.js ⚠️ CRITICAL

You currently have Node.js v18, but need v20+.

1. Download Node.js LTS from: https://nodejs.org/
2. Run installer
3. Restart PowerShell
4. Verify:
   ```powershell
   node --version
   ```
   Should show v20.x or v22.x

---

### Step 2: Install MySQL

**Option A: MySQL Official**
1. Download: https://dev.mysql.com/downloads/installer/
2. Choose "Developer Default"
3. Set root password (remember it!)
4. Complete installation

**Option B: XAMPP (Easier)**
1. Download: https://www.apachefriends.org/
2. Install XAMPP
3. Open XAMPP Control Panel
4. Click "Start" next to MySQL

**Verify MySQL is running:**
```powershell
Get-Service -Name MySQL*
```

---

### Step 3: Configure Environment

1. Copy the example file:
   ```powershell
   copy .env.example .env
   ```

2. Edit `.env` with your MySQL password:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=threadchain_db
   DB_PORT=3306
   
   PORT=3001
   NODE_ENV=development
   
   ETHEREUM_ENABLED=false
   ```

---

### Step 4: Install Dependencies

After upgrading Node.js:

```powershell
# Remove old dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Install fresh
npm install
```

---

### Step 5: Initialize Database

```powershell
npm run init-db
```

**Expected output:**
```
✅ Connected to MySQL server
✅ Database 'threadchain_db' created/verified
✅ Table "stix_reports" created
✅ Table "blockchain_transactions" created
✅ Table "provenance_records" created
✅ Table "blockchain_blocks" created
🎉 Database initialization completed successfully!
```

---

### Step 6: Add Gas Columns

```powershell
node scripts/add-gas-columns.js
```

**Expected output:**
```
✅ Connected to database: threadchain_db
✅ Added gas_price column
✅ Added gas_fee column
✨ Gas tracking is now enabled!
```

---

### Step 7: Setup Ethereum (Optional but Recommended)

```powershell
.\setup-ethereum-now.bat
```

This will:
- ✅ Install Hardhat
- ✅ Start Ethereum node
- ✅ Deploy smart contract
- ✅ Update .env configuration

**Or manually:**

1. Install Hardhat:
   ```powershell
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. Start Ethereum node (keep this window open):
   ```powershell
   npx hardhat node
   ```

3. In a NEW terminal, deploy contract:
   ```powershell
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. Update `.env` with the contract address shown

---

### Step 8: Start Everything

**Option A: All-in-One (Easiest)**
```powershell
.\start-everything.bat
```

This opens 3 windows:
- Ethereum Node (port 8545)
- Backend Server (port 3001)
- Frontend (port 3000)

**Option B: Manual (More Control)**

Terminal 1 - Ethereum:
```powershell
npx hardhat node
```

Terminal 2 - Backend:
```powershell
npm run backend
```

Terminal 3 - Frontend:
```powershell
npm run dev
```

---

### Step 9: Open in Browser

Go to: **http://localhost:3000**

---

## ✅ Verification Checklist

Run these to verify everything works:

```powershell
# Check Node version (should be 20+)
node --version

# Check MySQL service
Get-Service -Name MySQL*

# Check backend health
curl http://localhost:3001/api/health

# Check Ethereum status
curl http://localhost:3001/api/blockchain/ethereum/status

# Check if ports are listening
netstat -ano | findstr "8545 3001 3000"
```

---

## 🎯 Quick Start Commands

### Daily Use

```powershell
# Start everything
.\start-everything.bat

# Stop everything
.\stop-everything.bat
```

### Individual Services

```powershell
# Backend only
npm run backend

# Frontend only
npm run dev

# Ethereum only
npx hardhat node
```

---

## 📁 Important Files Created

- `start-everything.bat` - Start all services at once
- `stop-everything.bat` - Stop all services
- `setup-ethereum-now.bat` - Setup Ethereum blockchain
- `verify-gas-columns.bat` - Add gas tracking columns
- `scripts/add-gas-columns.js` - Node.js version of gas setup

---

## 🐛 Troubleshooting

### Issue: Node.js version warnings

**Solution:** Upgrade to Node.js v20+, then:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: MySQL connection refused

**Solution:**
```powershell
# Start MySQL service
net start MySQL80

# Or start from XAMPP Control Panel
```

### Issue: Port already in use

**Solution:**
```powershell
# Stop everything first
.\stop-everything.bat

# Or manually kill processes
netstat -ano | findstr ":3001"
taskkill /F /PID <PID>
```

### Issue: Ethereum node won't start

**Solution:**
```powershell
# Make sure port 8545 is free
netstat -ano | findstr ":8545"

# If occupied, kill it
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":8545"') do taskkill /F /PID %a
```

### Issue: Contract deployment failed

**Solution:**
1. Make sure Ethereum node is running
2. Wait 10 seconds after starting node
3. Try deploying again:
   ```powershell
   npx hardhat run scripts/deploy.js --network localhost
   ```

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│         http://localhost:3000           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Backend API (Express.js)           │
│      http://localhost:3001              │
└──────┬──────────────────┬───────────────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────────────┐
│   MySQL     │    │  Ethereum Node       │
│   Database  │    │  http://localhost:8545│
└─────────────┘    └──────────────────────┘
```

---

## 📊 What Each Service Does

### Ethereum Node (Port 8545)
- Local blockchain for testing
- Stores cryptographic proofs
- Provides immutability

### Backend Server (Port 3001)
- REST API for data operations
- Connects to MySQL database
- Integrates with Ethereum
- Handles file uploads

### Frontend (Port 3000)
- User interface
- Dashboard and visualizations
- File upload interface
- Blockchain demo

### MySQL Database
- Stores full STIX reports
- Blockchain transaction records
- Metrics and analytics data

---

## 🎯 Testing the System

### 1. Test Backend Health

```powershell
curl http://localhost:3001/api/health
```

Expected:
```json
{
  "status": "OK",
  "services": {
    "database": "connected",
    "blockchain": "active"
  }
}
```

### 2. Test Ethereum Integration

```powershell
curl http://localhost:3001/api/blockchain/ethereum/status
```

Expected:
```json
{
  "enabled": true,
  "network": "Hardhat Local",
  "contractAddress": "0x5FbDB...",
  "balance": "9999.99"
}
```

### 3. Upload Test File

1. Go to http://localhost:3000/blockchain-demo
2. Upload `sample-stix-2.1.json`
3. Click "Record Provenance on Blockchain"
4. Watch the transaction complete!

---

## 📝 Summary of Setup

1. ✅ Upgrade Node.js to v20+
2. ✅ Install MySQL
3. ✅ Configure `.env` file
4. ✅ Install dependencies: `npm install`
5. ✅ Initialize database: `npm run init-db`
6. ✅ Add gas columns: `node scripts/add-gas-columns.js`
7. ✅ Setup Ethereum: `.\setup-ethereum-now.bat`
8. ✅ Start everything: `.\start-everything.bat`
9. ✅ Open browser: http://localhost:3000

---

## 🚀 You're Ready!

Your ThreatChain system is now fully operational with:
- ✅ Complete blockchain integration
- ✅ Ethereum smart contracts
- ✅ Gas tracking and metrics
- ✅ Full database setup
- ✅ Frontend and backend running

**Next:** Start uploading threat intelligence data and watch it get recorded on the blockchain! 🎉

---

## 📚 Additional Resources

- `ETHEREUM-QUICK-START.md` - Ethereum setup details
- `QUICKSTART.md` - General quick start guide
- `START-HERE.md` - Troubleshooting guide
- `README.md` - Project documentation

---

## 💡 Pro Tips

1. **Keep terminals organized** - Label each window clearly
2. **Check logs** - If something fails, check the terminal output
3. **Use batch files** - They make starting/stopping easier
4. **Bookmark URLs** - Save the localhost URLs for quick access
5. **Regular backups** - Export your database periodically

---

**Need help?** Check the troubleshooting section or review the error messages in the terminal windows.
