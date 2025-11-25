# 🪟 Windows Setup Guide for ThreadChain

## Quick Setup Steps

### 1. Install MySQL

**Option A: MySQL Official (Recommended)**
1. Download: https://dev.mysql.com/downloads/installer/
2. Run installer, choose "Developer Default"
3. Set root password (e.g., "root123")
4. Complete installation

**Option B: XAMPP (Easier)**
1. Download: https://www.apachefriends.org/
2. Install XAMPP
3. Open XAMPP Control Panel
4. Click "Start" next to MySQL

### 2. Verify MySQL is Running

Open PowerShell and run:
```powershell
# Check if MySQL service is running
Get-Service -Name MySQL* | Select-Object Name, Status

# Or try to connect
mysql -u root -p
```

If MySQL is running, you should see "Running" status.

### 3. Update .env File

Edit `.env` file in your project root:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=threadchain_db
DB_PORT=3306
```

**Important:** Replace `your_mysql_password_here` with your actual MySQL root password!

### 4. Install Node Dependencies

```powershell
npm install
```

### 5. Initialize Database

```powershell
npm run init-db
```

You should see:
```
✅ Connected to MySQL server
✅ Database 'threadchain_db' created/verified
✅ Table "stix_reports" created
...
```

### 6. Create Uploads Folder

```powershell
mkdir uploads
```

### 7. Start Backend Server

```powershell
npm start
```

You should see:
```
🚀 ThreadChain Backend Server running on port 3001
✅ Database connected successfully
✅ Genesis block created
```

### 8. Start Frontend (in new terminal)

```powershell
# In a NEW PowerShell window
npm run dev
```

Frontend will start on http://localhost:3000

## 🐛 Troubleshooting

### Error: ECONNREFUSED ::1:3306

**Problem:** MySQL is not running or wrong host

**Solution:**
1. Start MySQL service:
   ```powershell
   net start MySQL80
   ```
   Or start XAMPP MySQL

2. Change DB_HOST in .env to `127.0.0.1` instead of `localhost`

### Error: Access Denied

**Problem:** Wrong MySQL password

**Solution:**
1. Update DB_PASSWORD in .env file
2. Or reset MySQL password:
   ```powershell
   mysql -u root -p
   ```
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
   FLUSH PRIVILEGES;
   ```

### Error: nodemon not found

**Problem:** nodemon not installed

**Solution:**
```powershell
npm install
```

### MySQL Service Won't Start

**Solution:**
1. Open Services (Win + R, type `services.msc`)
2. Find "MySQL80" or "MySQL"
3. Right-click → Start
4. If it fails, check Windows Event Viewer for errors

### Port 3001 Already in Use

**Solution:**
Change PORT in .env:
```env
PORT=3002
```

## ✅ Verify Everything Works

### Test Backend
```powershell
# In browser or PowerShell
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

### Test Frontend
Open browser: http://localhost:3000

## 🎯 Complete Startup Commands

**Terminal 1 (Backend):**
```powershell
npm start
```

**Terminal 2 (Frontend):**
```powershell
npm run dev
```

## 📝 Common MySQL Commands

```powershell
# Start MySQL
net start MySQL80

# Stop MySQL
net stop MySQL80

# Connect to MySQL
mysql -u root -p

# Check databases
mysql -u root -p -e "SHOW DATABASES;"
```

## 🔍 Check if MySQL is Installed

```powershell
# Check MySQL installation
mysql --version

# Check if service exists
Get-Service -Name MySQL*

# Check if port 3306 is listening
netstat -an | findstr 3306
```

If you see output, MySQL is installed and running!

## 💡 Quick Test

After setup, run this to test everything:

```powershell
# Test database connection
npm run init-db

# Start backend
npm start

# In another terminal, test API
curl http://localhost:3001/api/health
```

If all commands succeed, you're ready to go! 🎉