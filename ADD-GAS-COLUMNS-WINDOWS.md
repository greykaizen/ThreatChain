# How to Add Gas Columns on Windows

The gas columns (`gas_price` and `gas_fee`) need to be added to your database for complete blockchain metrics tracking.

## ✅ EASIEST METHOD (Recommended for Windows)

Use the Node.js script - no MySQL command-line tools needed:

```powershell
node scripts/add-gas-columns.js
```

**Expected Output:**
```
========================================
  Adding Gas Columns to Database
========================================

✅ Connected to database: threadchain_db

Adding gas_price and gas_fee columns...

✅ Added gas_price column
✅ Added gas_fee column

========================================
  SUCCESS! Gas columns added
========================================

✨ Gas tracking is now enabled!
```

---

## Alternative Methods

### Method 2: PowerShell Script

If you have MySQL command-line tools installed:

```powershell
.\verify-gas-columns.ps1
```

### Method 3: Batch File

```cmd
verify-gas-columns.bat
```

---

## What These Columns Do

- **gas_used**: Amount of gas consumed (already exists)
- **gas_price**: Price per gas unit in Gwei (NEW)
- **gas_fee**: Total fee in ETH (NEW)

These columns track blockchain transaction costs and performance.

---

## After Adding Columns

1. **Restart your backend:**
   ```powershell
   npm run backend
   ```

2. **Test by uploading a STIX report**

3. **Check metrics dashboard** - you should see gas data

---

## Populate Existing Transactions (Optional)

If you have old transactions without gas data:

```powershell
node scripts/populate-gas-data.js
```

This adds simulated gas data to existing records.

---

## Verify Columns Were Added

Check your database:

```powershell
node -e "const db = require('./config/database'); db.query('DESCRIBE blockchain_transactions').then(r => console.table(r)).then(() => process.exit())"
```

You should see `gas_price` and `gas_fee` in the list.

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solution:** Make sure MySQL is running and .env is configured correctly

### Error: "Table doesn't exist"

**Solution:** Run database initialization first:
```powershell
npm run init-db
```

### Error: "Column already exists"

**Solution:** Great! The columns are already there. No action needed.

---

## Summary

**Just run this:**
```powershell
node scripts/add-gas-columns.js
```

That's it! Gas tracking will be enabled.
