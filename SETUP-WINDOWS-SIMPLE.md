# 🚀 ThreatChain - Simple Windows Setup

## ⚡ Quick Setup (5 Steps)

### 1️⃣ Upgrade Node.js
- Download: https://nodejs.org/ (get v20+)
- Install and restart PowerShell
- Verify: `node --version`

### 2️⃣ Install MySQL
- Download: https://dev.mysql.com/downloads/installer/
- Or XAMPP: https://www.apachefriends.org/
- Set a password and remember it!

### 3️⃣ Configure & Install
```powershell
# Copy environment file
copy .env.example .env

# Edit .env and set your MySQL password

# Install dependencies
npm install

# Initialize database
npm run init-db

# Add gas columns
node scripts/add-gas-columns.js
```

### 4️⃣ Setup Ethereum
```powershell
.\setup-ethereum-now.bat
```

### 5️⃣ Start Everything
```powershell
.\start-everything.bat
```

**Open browser:** http://localhost:3000

---

## 🎯 That's It!

You now have:
- ✅ Ethereum blockchain running
- ✅ Backend API running
- ✅ Frontend running
- ✅ Database configured
- ✅ Gas tracking enabled

---

## 🛑 To Stop Everything

```powershell
.\stop-everything.bat
```

Or close all the terminal windows.

---

## 📋 Daily Usage

**Start:**
```powershell
.\start-everything.bat
```

**Stop:**
```powershell
.\stop-everything.bat
```

**Check Status:**
```powershell
curl http://localhost:3001/api/health
```

---

## 🐛 Common Issues

### "Node version warning"
→ Upgrade to Node.js v20+

### "MySQL connection refused"
→ Start MySQL: `net start MySQL80`

### "Port already in use"
→ Run: `.\stop-everything.bat`

### "Contract deployment failed"
→ Wait 10 seconds after starting Ethereum node, try again

---

## 📁 Key Files

- `start-everything.bat` - Start all services
- `stop-everything.bat` - Stop all services
- `setup-ethereum-now.bat` - Setup Ethereum
- `.env` - Configuration file

---

## 🎓 What's Running

When you run `start-everything.bat`, you get 3 windows:

1. **Ethereum Node** (port 8545) - Blockchain
2. **Backend Server** (port 3001) - API
3. **Frontend** (port 3000) - Web interface

---

## ✅ Success Check

All these should work:
- http://localhost:3000 (Frontend)
- http://localhost:3001/api/health (Backend)
- http://localhost:8545 (Ethereum)

---

**For detailed instructions, see:** `WINDOWS-COMPLETE-SETUP.md`
