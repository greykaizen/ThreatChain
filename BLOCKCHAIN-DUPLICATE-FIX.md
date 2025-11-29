# Blockchain Duplicate Block Fix

## Problem
When clicking "Record Provenance on Blockchain" button, you were getting:
- **Error**: `duplicate entry for key blockchain_blocks.primary`
- **Cause**: The blockchain was using `this.chain.length` to determine the next block number, which didn't account for blocks already in the database

## Solution Applied

### 1. Fixed Block Number Generation
Updated `SimpleBlockchain.js` to query the database for the latest block number before creating a new block:

```javascript
// Before (WRONG):
const newBlock = new Block(
  this.chain.length,  // ❌ This doesn't check the database
  Date.now(),
  transactionData,
  this.getLatestBlock().hash
);

// After (CORRECT):
const latestBlockFromDB = await db.findOne(
  'SELECT MAX(block_number) as max_block FROM blockchain_blocks'
);
const nextBlockNumber = (latestBlockFromDB?.max_block || 0) + 1;

const newBlock = new Block(
  nextBlockNumber,  // ✅ Always gets the correct next number
  Date.now(),
  transactionData,
  this.getLatestBlock().hash
);
```

### 2. Enhanced Error Handling
The frontend already has improved error handling that:
- Detects connection failures to backend
- Shows specific messages for duplicate reports
- Provides actionable error messages

### 3. Duplicate Report Detection
The backend properly:
- Checks for duplicate report hashes before insertion
- Returns HTTP 409 (Conflict) status for duplicates
- Cleans up uploaded files when duplicates are detected
- Provides detailed information about the existing report

## How It Works Now

1. **Upload STIX Report** → Frontend sends file to backend
2. **Generate Hash** → Backend creates SHA-256 hash of content
3. **Check for Duplicates** → Backend queries database for existing hash
4. **Get Next Block Number** → Backend queries for MAX(block_number) + 1
5. **Create Block** → New block created with correct sequential number
6. **Mine Block** → Proof-of-work mining with difficulty 2
7. **Save to Database** → Block and transaction saved atomically

## Testing

### Test 1: Upload Same File Twice
```bash
# First upload should succeed
# Second upload should show: "Duplicate report detected"
```

### Test 2: Upload Different Files
```bash
# Each file should get sequential block numbers: 0, 1, 2, 3...
```

### Test 3: Restart Backend
```bash
# After restart, blockchain should load from database
# Next block should continue from last block number
```

## Database Schema

The fix relies on this table structure:

```sql
CREATE TABLE blockchain_blocks (
  block_number INT PRIMARY KEY,  -- Sequential, no gaps
  block_hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  merkle_root VARCHAR(64),
  nonce INT DEFAULT 0,
  difficulty INT DEFAULT 2,
  transactions_count INT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Verification

Check your blockchain integrity:

```bash
# View all blocks
mysql -u root -p -e "USE threatchain; SELECT block_number, LEFT(block_hash, 16) as hash, timestamp FROM blockchain_blocks ORDER BY block_number;"

# Check for gaps in block numbers
mysql -u root -p -e "USE threatchain; SELECT block_number FROM blockchain_blocks ORDER BY block_number;"

# View transactions
mysql -u root -p -e "USE threatchain; SELECT id, block_number, status, timestamp FROM blockchain_transactions ORDER BY timestamp DESC LIMIT 10;"
```

## What Was Fixed

✅ **Block number collision** - Now queries database for next number
✅ **Duplicate reports** - Properly detected and rejected with clear message
✅ **File cleanup** - Duplicate files are removed from uploads folder
✅ **Error messages** - Clear, actionable error messages in frontend
✅ **Connection errors** - Detects when backend is not running

## Restart Instructions

After applying this fix, restart your backend:

```bash
# Stop the backend (Ctrl+C in the terminal)
# Then restart:
cd ThreatChain
npm run backend
```

The blockchain will automatically load existing blocks from the database and continue with the correct block numbers.
