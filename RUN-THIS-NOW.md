# 🚀 RUN THIS NOW - Your Setup is Ready!

## ✅ What's Already Done:
- ✅ MySQL installed and running
- ✅ MySQL password set to: `9110`
- ✅ `.env` file updated with your password

## 📋 What You Need to Do (3 Simple Steps):

### **Step 1: Run the Setup Script**

Open PowerShell in your project folder and run:

```powershell
.\setup-complete.bat
```

This will:
- Install all npm dependencies
- Create uploads folder
- Initialize the database with tables

**Expected Output:**
```
[OK] Dependencies installed
[OK] uploads folder created
✅ Database 'threadchain_db' created/verified
✅ Table "stix_reports" created
✅ Table "blockchain_transactions" created
✅ Table "provenance_records" created
✅ Table "blockchain_blocks" created
🎉 Database initialization completed successfully!
```

---

### **Step 2: Start the Backend**

In the same PowerShell window:

```powershell
npm start
```

**Expected Output:**
```
🚀 ThreadChain Backend Server running on port 3001
📊 Health check: http://localhost:3001/api/health
🔗 Blockchain API: http://localhost:3001/api/blockchain
📄 STIX API: http://localhost:3001/api/stix
🔒 Provenance API: http://localhost:3001/api/provenance
✅ Database connected successfully
✅ Database tables initialized successfully
✅ Genesis block created
```

**Keep this terminal open!**

---

### **Step 3: Start the Frontend**

Open a **NEW PowerShell window** and run:

```powershell
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- Local:        http://localhost:3000
```

**Keep this terminal open too!**

---

## 🎉 You're Done! Open Your Browser

Go to: **http://localhost:3000**

You should see the ThreadChain login page!

---

## 🧪 Test Everything Works

### Test 1: Backend API
Open in browser or run:
```powershell
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "OK",
  "services": {
    "database": "connected",
    "blockchain": "active"
  }
}
```

### Test 2: Frontend
- Go to http://localhost:3000
- Login with any credentials (demo mode)
- Navigate to "Blockchain Demo"
- Upload `sample-stix-2.1.json`
- Click "Record Provenance on Blockchain"
- Watch it work! ✨

---

## 📊 Verify Database

Check if database was created:

```powershell
mysql -u root -p9110 -e "SHOW DATABASES;"
```

You should see `threadchain_db` in the list.

Check tables:
```powershell
mysql -u root -p9110 -e "USE threadchain_db; SHOW TABLES;"
```

You should see:
- blockchain_blocks
- blockchain_transactions
- provenance_records
- stix_reports

---

## 🎯 Quick Commands Reference

```powershell
# Start backend
npm start

# Start frontend (in new terminal)
npm run dev

# Check database
mysql -u root -p9110 -e "USE threadchain_db; SHOW TABLES;"

# Test backend API
curl http://localhost:3001/api/health

# Check blockchain stats
curl http://localhost:3001/api/blockchain/stats
```

---

## 🐛 If Something Goes Wrong

### Error: "npm install failed"
```powershell
# Clear cache and try again
npm cache clean --force
npm install
```

### Error: "Database initialization failed"
```powershell
# Check MySQL is running
mysql -u root -p9110 -e "SELECT 1"

# If that works, try init again
npm run init-db
```

### Error: "Port already in use"
```powershell
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change port in .env
# PORT=3002
```

---

## 📁 Project Structure

```
threadchain-dashboard/
├── server.js              # Backend server
├── config/
│   └── database.js        # Database config
├── blockchain/
│   └── SimpleBlockchain.js # Blockchain implementation
├── routes/
│   ├── blockchain.js      # Blockchain API
│   ├── stix.js           # STIX API
│   └── provenance.js     # Provenance API
├── app/                   # Frontend (Next.js)
├── components/            # UI components
├── uploads/              # File uploads (created by setup)
└── .env                  # Configuration (password: 9110)
```

---

## 🎮 What to Try After Setup

1. **Blockchain Demo**
   - Upload STIX files
   - See hash generation
   - View blockchain transactions

2. **Feed Management**
   - Upload CSV files
   - Generate knowledge graphs
   - Export to STIX 2.1

3. **Policy Validation**
   - Test file format validation
   - See conversion recommendations

4. **Organizations**
   - View partner organizations
   - See shared reports

5. **Sharing Reports**
   - Share threat intelligence
   - Use collaboration chat

---

## ✅ Success Checklist

After running the setup, you should have:

- [x] MySQL running with password 9110
- [x] Dependencies installed (node_modules folder)
- [x] Database `threadchain_db` created
- [x] 4 tables created in database
- [x] Genesis block created in blockchain
- [x] uploads folder created
- [x] Backend running on port 3001
- [x] Frontend running on port 3000
- [x] Can access http://localhost:3000

---

## 🆘 Need Help?

1. Check `TROUBLESHOOTING.md` for common issues
2. Run `.\check-setup.ps1` to verify your setup
3. Check the terminal logs for error messages

---

## 🎊 That's It!

Just run these 3 commands:

```powershell
# 1. Setup
.\setup-complete.bat

# 2. Start backend
npm start

# 3. Start frontend (new terminal)
npm run dev
```

Then open http://localhost:3000 and enjoy! 🚀