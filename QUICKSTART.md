# 🚀 ThreadChain Quick Start Guide

## Prerequisites

1. **Node.js** (v14+) - [Download](https://nodejs.org/)
2. **MySQL Server** (v5.7+) - [Download](https://dev.mysql.com/downloads/mysql/)
3. **npm** (comes with Node.js)

## Step-by-Step Setup

### 1. Install MySQL (if not installed)

**Windows:**
- Download MySQL Installer from official website
- Run installer and choose "Developer Default"
- Set root password during installation
- Start MySQL service

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Database

Edit `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=threadchain_db
DB_PORT=3306
PORT=3001
```

### 4. Initialize Database

```bash
npm run init-db
```

You should see:
```
✅ Connected to MySQL server
✅ Database 'threadchain_db' created/verified
✅ Table "stix_reports" created
✅ Table "blockchain_transactions" created
✅ Table "provenance_records" created
✅ Table "blockchain_blocks" created
🎉 Database initialization completed successfully!
```

### 5. Create Uploads Directory

```bash
mkdir uploads
```

### 6. Start Backend Server

```bash
npm start
```

You should see:
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

### 7. Test the API

Open a new terminal and run:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test blockchain stats
curl http://localhost:3001/api/blockchain/stats
```

Or open in browser:
- http://localhost:3001/api/health
- http://localhost:3001/api/blockchain/stats

### 8. Start Frontend (Next.js)

In a new terminal:

```bash
npm run dev
```

The frontend will start on http://localhost:3000

### 9. Test the Complete Flow

1. Open http://localhost:3000 in your browser
2. Login (use any credentials for demo)
3. Navigate to "Blockchain Demo" in the sidebar
4. Upload the `sample-stix-2.1.json` file
5. Click "Record Provenance on Blockchain"
6. Watch the process complete!

## 🧪 Testing with Sample Data

### Upload STIX Report via API

```bash
curl -X POST http://localhost:3001/api/stix/upload \
  -F "file=@sample-stix-2.1.json" \
  -F "title=Test STIX Report" \
  -F "description=Sample threat intelligence report"
```

### Check Blockchain

```bash
curl http://localhost:3001/api/blockchain/blocks
curl http://localhost:3001/api/blockchain/transactions
```

### Verify Report

```bash
# Replace {reportId} with actual ID from upload response
curl -X POST http://localhost:3001/api/stix/verify/{reportId}
```

## 📊 Verify Everything is Working

### Check Database

```bash
mysql -u root -p
```

```sql
USE threadchain_db;
SHOW TABLES;
SELECT COUNT(*) FROM stix_reports;
SELECT COUNT(*) FROM blockchain_blocks;
SELECT COUNT(*) FROM blockchain_transactions;
```

### Check API Endpoints

All these should return JSON responses:

- ✅ http://localhost:3001/api/health
- ✅ http://localhost:3001/api/blockchain/stats
- ✅ http://localhost:3001/api/blockchain/blocks
- ✅ http://localhost:3001/api/blockchain/transactions
- ✅ http://localhost:3001/api/stix/reports
- ✅ http://localhost:3001/api/stix/stats
- ✅ http://localhost:3001/api/provenance/stats

## 🐛 Troubleshooting

### MySQL Connection Error

**Error:** `ER_ACCESS_DENIED_ERROR`

**Solution:**
```bash
mysql -u root -p
```
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:** Change PORT in `.env`:
```env
PORT=3002
```

### Database Not Found

**Error:** `ER_BAD_DB_ERROR: Unknown database 'threadchain_db'`

**Solution:** Run initialization again:
```bash
npm run init-db
```

### Uploads Directory Error

**Error:** `ENOENT: no such file or directory, open 'uploads/...'`

**Solution:**
```bash
mkdir uploads
chmod 755 uploads
```

## 📝 Next Steps

1. **Explore the UI**: Navigate through all dashboard pages
2. **Upload Reports**: Try uploading different STIX files
3. **Check Blockchain**: View blocks and transactions
4. **Test Provenance**: Verify report integrity
5. **Review Code**: Understand the blockchain implementation

## 🎯 Key Features to Demo

1. **Blockchain Demo Page**
   - Upload STIX 2.1 file
   - Watch hash generation
   - See blockchain transaction
   - View off-chain storage

2. **Feed Management**
   - Upload CSV files
   - Auto-generate knowledge graph
   - Export to STIX 2.1

3. **Policy Validation**
   - Upload various file formats
   - See compatibility checks
   - View conversion recommendations

4. **Organizations**
   - View partner organizations
   - See shared reports
   - Track collaboration

5. **Sharing Reports**
   - Share threat intelligence
   - Collaborate via chat
   - Monitor network activity

## 📚 Documentation

- **Backend API**: See `README-BACKEND.md`
- **Frontend**: See `README.md`
- **Database Schema**: See `config/database.js`
- **Blockchain**: See `blockchain/SimpleBlockchain.js`

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs in the terminal
3. Check MySQL error logs
4. Verify all prerequisites are installed

## ✨ Success!

If you see:
- ✅ Backend server running on port 3001
- ✅ Frontend running on port 3000
- ✅ Database connected
- ✅ Genesis block created
- ✅ API endpoints responding

**You're all set! Start exploring ThreadChain! 🎉**