# 📋 Setup Summary

## ✅ What's Already Configured

```
✓ MySQL installed and running
✓ MySQL password: 9110
✓ .env file updated with password
✓ Database configuration ready
✓ All backend files created
✓ All frontend files ready
```

## 🚀 What You Need to Do (Copy & Paste These Commands)

### Terminal 1 (Setup & Backend):

```powershell
# Step 1: Run setup (installs dependencies, creates database)
.\setup-complete.bat

# Step 2: Start backend server
npm start
```

**Keep Terminal 1 open!**

---

### Terminal 2 (Frontend):

```powershell
# Step 3: Start frontend
npm run dev
```

**Keep Terminal 2 open!**

---

### Browser:

```
Open: http://localhost:3000
```

---

## 📊 What the Setup Does

### `.\setup-complete.bat` will:

1. **Install Dependencies** (~2-3 minutes)
   - Installs Express, MySQL2, Multer, etc.
   - Creates node_modules folder

2. **Create Uploads Folder**
   - Creates `uploads/` directory for file storage

3. **Initialize Database** (~10 seconds)
   - Creates `threadchain_db` database
   - Creates 4 tables:
     - `stix_reports` - Stores STIX reports
     - `blockchain_transactions` - Blockchain records
     - `provenance_records` - Audit trail
     - `blockchain_blocks` - Block data
   - Creates genesis block

---

## 🎯 Expected Output

### After `.\setup-complete.bat`:

```
[OK] Dependencies installed
[OK] uploads folder created
✅ Database 'threadchain_db' created/verified
✅ Table "stix_reports" created
✅ Table "blockchain_transactions" created
✅ Table "provenance_records" created
✅ Table "blockchain_blocks" created
🎉 Database initialization completed successfully!

Setup Complete!
```

### After `npm start`:

```
🚀 ThreadChain Backend Server running on port 3001
📊 Health check: http://localhost:3001/api/health
🔗 Blockchain API: http://localhost:3001/api/blockchain
📄 STIX API: http://localhost:3001/api/stix
🔒 Provenance API: http://localhost:3001/api/provenance
✅ Database connected successfully
✅ Genesis block created
```

### After `npm run dev`:

```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

---

## 🧪 Quick Test

After everything is running, test these URLs:

1. **Backend Health:**
   ```
   http://localhost:3001/api/health
   ```
   Should show: `{"status":"OK"}`

2. **Blockchain Stats:**
   ```
   http://localhost:3001/api/blockchain/stats
   ```
   Should show blockchain statistics

3. **Frontend:**
   ```
   http://localhost:3000
   ```
   Should show login page

---

## 📁 What Gets Created

```
threadchain-dashboard/
├── node_modules/          ← Created by npm install
├── uploads/               ← Created by setup script
├── .env                   ← Updated with password 9110
└── Database: threadchain_db
    ├── stix_reports
    ├── blockchain_transactions
    ├── provenance_records
    └── blockchain_blocks
```

---

## 🎮 Features to Try

Once running, try these features:

### 1. Blockchain Demo
- Navigate to "Blockchain Demo" in sidebar
- Upload `sample-stix-2.1.json`
- Click "Record Provenance on Blockchain"
- See the complete process!

### 2. Feed Management
- Go to "Feeds" page
- Upload CSV file
- See auto-generated knowledge graph

### 3. Policy Validation
- Go to "Policy" page
- Upload different file formats
- See validation results

### 4. Organizations
- View partner organizations
- See shared reports
- Track collaboration

---

## 🔧 Useful Commands

```powershell
# Check if MySQL is running
mysql -u root -p9110 -e "SELECT 1"

# View database tables
mysql -u root -p9110 -e "USE threadchain_db; SHOW TABLES;"

# Check backend status
curl http://localhost:3001/api/health

# Check blockchain
curl http://localhost:3001/api/blockchain/stats

# View all reports
curl http://localhost:3001/api/stix/reports
```

---

## 🐛 Common Issues

### Issue: "npm install failed"
**Solution:**
```powershell
npm cache clean --force
npm install
```

### Issue: "Database connection failed"
**Solution:**
```powershell
# Check MySQL is running
mysql -u root -p9110 -e "SELECT 1"

# If password wrong, update .env
# DB_PASSWORD=9110
```

### Issue: "Port 3001 already in use"
**Solution:**
```powershell
# Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `node_modules` folder exists
- [ ] `uploads` folder exists
- [ ] Backend shows "Database connected successfully"
- [ ] Backend shows "Genesis block created"
- [ ] Frontend loads at http://localhost:3000
- [ ] Can login to frontend
- [ ] Can navigate between pages

---

## 📞 Support Files

- `RUN-THIS-NOW.md` - Detailed instructions
- `TROUBLESHOOTING.md` - Common problems and solutions
- `START-HERE.md` - Complete setup guide
- `INSTRUCTIONS.txt` - Quick reference
- `check-setup.ps1` - Check your setup status

---

## 🎊 You're Ready!

Just run:
1. `.\setup-complete.bat`
2. `npm start`
3. `npm run dev` (in new terminal)

Then enjoy ThreadChain! 🚀