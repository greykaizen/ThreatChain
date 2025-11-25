# 🔧 Troubleshooting Guide

## Common Errors and Solutions

### 1. ❌ ECONNREFUSED ::1:3306

**Error Message:**
```
❌ Database connection failed: connect ECONNREFUSED ::1:3306
```

**Cause:** MySQL server is not running

**Solutions:**

**A. Start MySQL Service (Windows)**
```powershell
# Open PowerShell as Administrator
net start MySQL80
```

**B. Using XAMPP**
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait for green indicator

**C. Check if MySQL is installed**
```powershell
mysql --version
```

If not installed, see `START-HERE.md` for installation instructions.

**D. Change host in .env**
```env
DB_HOST=127.0.0.1  # Instead of localhost
```

---

### 2. ❌ Access Denied for User 'root'

**Error Message:**
```
ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

**Cause:** Wrong MySQL password in .env file

**Solution:**

**A. Update .env file**
```env
DB_PASSWORD=your_actual_mysql_password
```

**B. Reset MySQL password**
```powershell
mysql -u root -p
```
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
EXIT;
```

Then update `.env`:
```env
DB_PASSWORD=newpassword
```

---

### 3. ❌ nodemon not recognized

**Error Message:**
```
'nodemon' is not recognized as an internal or external command
```

**Cause:** Dependencies not installed

**Solution:**
```powershell
npm install
```

---

### 4. ❌ Port 3001 already in use

**Error Message:**
```
EADDRINUSE: address already in use :::3001
```

**Cause:** Another process is using port 3001

**Solutions:**

**A. Change port in .env**
```env
PORT=3002
```

**B. Kill the process using port 3001**
```powershell
# Find process
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

---

### 5. ❌ Cannot find module 'express'

**Error Message:**
```
Error: Cannot find module 'express'
```

**Cause:** Dependencies not installed

**Solution:**
```powershell
npm install
```

---

### 6. ❌ Database 'threadchain_db' doesn't exist

**Error Message:**
```
ER_BAD_DB_ERROR: Unknown database 'threadchain_db'
```

**Cause:** Database not initialized

**Solution:**
```powershell
npm run init-db
```

---

### 7. ❌ ENOENT: no such file or directory 'uploads'

**Error Message:**
```
ENOENT: no such file or directory, open 'uploads/...'
```

**Cause:** Uploads directory doesn't exist

**Solution:**
```powershell
mkdir uploads
```

---

### 8. ❌ MySQL service won't start

**Error:** MySQL service fails to start in Services

**Solutions:**

**A. Check if port 3306 is in use**
```powershell
netstat -ano | findstr :3306
```

**B. Check MySQL error log**
- Location: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
- Open in notepad and check for errors

**C. Restart computer**
Sometimes a simple restart fixes service issues

**D. Reinstall MySQL**
If all else fails, uninstall and reinstall MySQL

---

### 9. ❌ Frontend won't start (Port 3000 in use)

**Error Message:**
```
Port 3000 is already in use
```

**Solutions:**

**A. Kill process on port 3000**
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

**B. Use different port**
```powershell
# Start on port 3001
npm run dev -- -p 3001
```

---

### 10. ❌ Cannot connect to MySQL from Node.js

**Symptoms:**
- MySQL works in command line
- But Node.js can't connect

**Solutions:**

**A. Use 127.0.0.1 instead of localhost**
In `.env`:
```env
DB_HOST=127.0.0.1
```

**B. Check MySQL is listening on all interfaces**
```sql
mysql -u root -p
SHOW VARIABLES LIKE 'bind_address';
```

Should show `0.0.0.0` or `127.0.0.1`

**C. Check firewall**
Make sure Windows Firewall allows MySQL (port 3306)

---

## 🔍 Diagnostic Commands

### Check MySQL Status
```powershell
# Check service
Get-Service -Name MySQL*

# Check version
mysql --version

# Check if port is listening
netstat -an | findstr 3306

# Try to connect
mysql -u root -p
```

### Check Node.js
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# List installed packages
npm list --depth=0
```

### Check Ports
```powershell
# Check what's using port 3001
netstat -ano | findstr :3001

# Check what's using port 3000
netstat -ano | findstr :3000

# Check what's using port 3306
netstat -ano | findstr :3306
```

### Test Database Connection
```powershell
# Test MySQL connection
mysql -u root -p -e "SELECT 1"

# Show databases
mysql -u root -p -e "SHOW DATABASES"

# Check if threadchain_db exists
mysql -u root -p -e "SHOW DATABASES LIKE 'threadchain_db'"
```

---

## 🆘 Emergency Reset

If nothing works, try this complete reset:

### 1. Stop Everything
```powershell
# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)
# Stop MySQL
net stop MySQL80
```

### 2. Clean Install
```powershell
# Remove node_modules
rmdir /s /q node_modules

# Remove package-lock.json
del package-lock.json

# Reinstall
npm install
```

### 3. Reset Database
```powershell
# Connect to MySQL
mysql -u root -p

# Drop database
DROP DATABASE IF EXISTS threadchain_db;
EXIT;

# Reinitialize
npm run init-db
```

### 4. Start Fresh
```powershell
# Start MySQL
net start MySQL80

# Start backend
npm start

# In new terminal, start frontend
npm run dev
```

---

## 📞 Still Stuck?

### Checklist Before Asking for Help

- [ ] MySQL is installed and running
- [ ] `.env` file has correct password
- [ ] Ran `npm install`
- [ ] Ran `npm run init-db` successfully
- [ ] Created `uploads` folder
- [ ] Checked error messages carefully
- [ ] Tried solutions from this guide

### Provide This Information

When asking for help, provide:

1. **Error message** (full text)
2. **What you tried** (commands you ran)
3. **System info:**
   ```powershell
   node --version
   npm --version
   mysql --version
   ```
4. **MySQL status:**
   ```powershell
   Get-Service -Name MySQL*
   ```
5. **Port status:**
   ```powershell
   netstat -an | findstr "3000 3001 3306"
   ```

---

## 💡 Prevention Tips

1. **Always start MySQL first** before starting backend
2. **Keep terminals open** to see error messages
3. **Check logs** when something fails
4. **Update .env** when changing passwords
5. **Backup database** before major changes:
   ```powershell
   mysqldump -u root -p threadchain_db > backup.sql
   ```

---

## ✅ Verification Steps

After fixing issues, verify everything works:

```powershell
# 1. Check MySQL
mysql -u root -p -e "SELECT 1"

# 2. Check database exists
mysql -u root -p -e "USE threadchain_db; SHOW TABLES;"

# 3. Test backend
curl http://localhost:3001/api/health

# 4. Test frontend
# Open http://localhost:3000 in browser
```

If all these work, you're good to go! 🎉