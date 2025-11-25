# 🚀 START HERE - Complete Setup Guide

## ⚠️ Current Issue: MySQL Not Running

Your error shows: `ECONNREFUSED ::1:3306` - This means MySQL is not running on your system.

## 📋 Step-by-Step Fix

### **Step 1: Install MySQL (Choose One)**

#### **Option A: MySQL Official (Recommended)**
1. Download: https://dev.mysql.com/downloads/installer/
2. Choose "Windows (x86, 32-bit), MSI Installer" (smaller file)
3. Run installer
4. Select "Developer Default" setup type
5. Click "Next" through the installation
6. **IMPORTANT:** When asked, set a root password (e.g., "root123")
7. Complete installation
8. MySQL will start automatically

#### **Option B: XAMPP (Easier for Beginners)**
1. Download: https://www.apachefriends.org/download.html
2. Install XAMPP
3. Open "XAMPP Control Panel"
4. Click "Start" button next to "MySQL"
5. MySQL is now running!

### **Step 2: Verify MySQL is Running**

Open PowerShell and run:
```powershell
mysql --version
```

You should see something like: `mysql  Ver 8.0.x`

### **Step 3: Update Your .env File**

Open `.env` file in your project and update:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=root123
DB_NAME=threadchain_db
DB_PORT=3306
```

**Replace `root123` with YOUR MySQL password!**

### **Step 4: Install Dependencies**

```powershell
npm install
```

### **Step 5: Initialize Database**

```powershell
npm run init-db
```

**Expected Output:**
```
✅ Connected to MySQL server
✅ Database 'threadchain_db' created/verified
✅ Table "stix_reports" created
✅ Table "blockchain_transactions" created
✅ Table "provenance_records" created
✅ Table "blockchain_blocks" created
🎉 Database initialization completed successfully!
```

### **Step 6: Create Uploads Folder**

```powershell
mkdir uploads
```

### **Step 7: Start the Backend**

**Option A: Using npm**
```powershell
npm start
```

**Option B: Using batch file**
```powershell
.\start-backend.bat
```

**Expected Output:**
```
🚀 ThreadChain Backend Server running on port 3001
📊 Health check: http://localhost:3001/api/health
✅ Database connected successfully
✅ Database tables initialized successfully
✅ Genesis block created
```

### **Step 8: Start the Frontend (New Terminal)**

Open a **NEW PowerShell window** and run:

**Option A: Using npm**
```powershell
npm run dev
```

**Option B: Using batch file**
```powershell
.\start-frontend.bat
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### **Step 9: Open in Browser**

Open your browser and go to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/health

## ✅ Success Checklist

- [ ] MySQL installed and running
- [ ] `.env` file updated with correct password
- [ ] `npm install` completed successfully
- [ ] `npm run init-db` completed successfully
- [ ] `uploads` folder created
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000 in browser

## 🐛 Still Having Issues?

### Issue 1: "ECONNREFUSED ::1:3306"

**Cause:** MySQL is not running

**Fix:**
```powershell
# Start MySQL service
net start MySQL80

# Or if using XAMPP, open XAMPP Control Panel and start MySQL
```

### Issue 2: "Access denied for user 'root'"

**Cause:** Wrong password in .env

**Fix:**
1. Open `.env` file
2. Update `DB_PASSWORD=your_actual_password`
3. Save and restart backend

### Issue 3: "nodemon not found"

**Cause:** Dependencies not installed

**Fix:**
```powershell
npm install
```

### Issue 4: "Port 3001 already in use"

**Cause:** Another process using port 3001

**Fix:**
1. Open `.env`
2. Change `PORT=3002`
3. Restart backend

### Issue 5: MySQL won't start

**Fix:**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "MySQL80" or "MySQL"
4. Right-click → Start
5. If it fails, restart your computer

## 🎯 Quick Commands Reference

```powershell
# Check MySQL status
Get-Service -Name MySQL*

# Start MySQL
net start MySQL80

# Stop MySQL
net stop MySQL80

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start backend
npm start

# Start frontend (in new terminal)
npm run dev

# Test backend API
curl http://localhost:3001/api/health
```

## 📚 Next Steps After Setup

1. **Login to Frontend**
   - Go to http://localhost:3000
   - Use any credentials (demo mode)

2. **Test Blockchain Demo**
   - Navigate to "Blockchain Demo" in sidebar
   - Upload `sample-stix-2.1.json`
   - Click "Record Provenance on Blockchain"
   - Watch the magic happen! ✨

3. **Explore Features**
   - Feed Management
   - Knowledge Graph
   - Policy Validation
   - Organizations
   - Sharing Reports

## 💡 Pro Tips

1. **Keep both terminals open** - One for backend, one for frontend
2. **Check backend logs** - They show what's happening
3. **Use XAMPP** - It's easier for beginners
4. **Save your MySQL password** - You'll need it!

## 🆘 Need More Help?

1. Read `setup-windows.md` for detailed Windows setup
2. Read `QUICKSTART.md` for general setup guide
3. Read `README-BACKEND.md` for API documentation
4. Check the error messages carefully - they usually tell you what's wrong!

## 🎉 You're Almost There!

Just follow the steps above, and you'll have ThreadChain running in no time!

**Remember:** The main issue is MySQL not running. Once you fix that, everything else will work! 💪