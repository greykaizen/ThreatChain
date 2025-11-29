# 📦 What's Actually Stored on Ethereum - Visual Guide

## 🎯 Quick Answer

**Ethereum stores ONLY 4 pieces of data per report:**
1. **Report Hash** (32 bytes) - The SHA-256 fingerprint
2. **Report ID** (string) - UUID linking to MySQL
3. **Timestamp** (number) - When it was registered
4. **Uploader Address** (20 bytes) - Who uploaded it

**Total size on Ethereum: ~100 bytes per report**

---

## 📊 Real Example: What Gets Stored

### Scenario: You Upload a STIX Report

Let's say you upload `sample-ransomware-attack.json` (50 KB file)

#### ❌ What's NOT Stored on Ethereum:
```json
{
  "type": "bundle",
  "id": "bundle--8a5f2b3c...",
  "objects": [
    {
      "type": "malware",
      "name": "WannaCry",
      "description": "Ransomware that...",
      "kill_chain_phases": [...],
      "indicators": [...]
    }
  ]
}
```
**This 50 KB stays in MySQL!**

#### ✅ What IS Stored on Ethereum:
```solidity
ReportRecord {
  reportHash: 0x3a5f8b2c9d1e4f7a8b3c5d6e9f1a2b4c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a
  reportId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  timestamp: 1732819200
  uploader: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  exists: true
}
```
**Only ~100 bytes on Ethereum!**

---

## 🔍 Visual Comparison

### MySQL Database (Off-Chain)
```
┌─────────────────────────────────────────────────────────┐
│ stix_reports Table                                      │
├─────────────────────────────────────────────────────────┤
│ id: a1b2c3d4-e5f6-7890-abcd-ef1234567890               │
│ title: "WannaCry Ransomware Analysis"                  │
│ content: {                                              │
│   "type": "bundle",                                     │
│   "objects": [                                          │
│     {                                                   │
│       "type": "malware",                                │
│       "name": "WannaCry",                               │
│       "description": "Ransomware targeting...",        │
│       "indicators": [                                   │
│         "hash1", "hash2", "ip1", "domain1"...          │
│       ],                                                │
│       ... (50 KB of data)                               │
│     }                                                   │
│   ]                                                     │
│ }                                                       │
│ hash: 0x3a5f8b2c9d1e4f7a8b3c5d6e9f1a2b4c...           │
│ file_size: 51200 bytes                                 │
│ created_at: 2024-11-28 18:00:00                        │
└─────────────────────────────────────────────────────────┘
         SIZE: ~50 KB per report
```

### Ethereum Blockchain (On-Chain)
```
┌─────────────────────────────────────────────────────────┐
│ ThreatIntelRegistry Smart Contract                     │
├─────────────────────────────────────────────────────────┤
│ records[0x3a5f8b2c...] = {                             │
│   reportHash: 0x3a5f8b2c9d1e4f7a8b3c5d6e9f1a2b4c...   │
│   reportId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"    │
│   timestamp: 1732819200                                 │
│   uploader: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb │
│   exists: true                                          │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
         SIZE: ~100 bytes per report
```

**Cost Difference:**
- MySQL: Free (local storage)
- Ethereum: ~$5-50 per report (depending on gas prices)

---

## 🔗 How to View What's on Ethereum

### Method 1: Using Your Test Script

```bash
cd ThreatChain
node scripts/test-ethereum.js
```

**Output Example:**
```
🔍 Testing Ethereum Connection
================================
✅ Connected to Ethereum network
✅ Contract deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📊 Current State:
   Total Reports: 3

📋 Report #1:
   Hash: 0x3a5f8b2c9d1e4f7a8b3c5d6e9f1a2b4c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a
   Report ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   Timestamp: 2024-11-28 18:00:00
   Uploader: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

📋 Report #2:
   Hash: 0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8
   Report ID: b2c3d4e5-f6a7-8901-bcde-f23456789012
   Timestamp: 2024-11-28 18:15:00
   Uploader: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Method 2: Query Smart Contract Directly

```bash
# Start Hardhat console
npx hardhat console --network localhost
```

```javascript
// Get contract instance
const ThreatIntelRegistry = await ethers.getContractFactory("ThreatIntelRegistry");
const contract = await ThreatIntelRegistry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Get total reports
const total = await contract.getTotalReports();
console.log("Total reports:", total.toString());

// Get first hash
const hash = await contract.getHashByIndex(0);
console.log("First hash:", hash);

// Verify a specific hash
const [exists, timestamp, uploader, reportId] = await contract.verifyReport(hash);
console.log("Exists:", exists);
console.log("Timestamp:", new Date(timestamp * 1000));
console.log("Uploader:", uploader);
console.log("Report ID:", reportId);
```

### Method 3: Check Ethereum Events

```bash
# View all HashRegistered events
npx hardhat run scripts/view-events.js --network localhost
```

---

## 📝 Smart Contract Data Structure Explained

### 1. **reportHash** (bytes32)
```
Type: bytes32 (32 bytes = 256 bits)
Example: 0x3a5f8b2c9d1e4f7a8b3c5d6e9f1a2b4c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a
Purpose: SHA-256 hash of the STIX report
Why: Proves the exact content without storing it
```

**How it's generated:**
```javascript
const crypto = require('crypto');
const hash = crypto.createHash('sha256')
  .update(JSON.stringify(stixReport))
  .digest('hex');
// Result: 3a5f8b2c9d1e4f7a8b3c5d6e9f1a2b4c...
```

### 2. **reportId** (string)
```
Type: string (variable length)
Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
Purpose: UUID that links to MySQL database
Why: Allows you to find the full report in MySQL
```

**How it's used:**
```sql
-- Find full report in MySQL using this ID
SELECT * FROM stix_reports WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### 3. **timestamp** (uint256)
```
Type: uint256 (unsigned integer)
Example: 1732819200
Purpose: Unix timestamp when hash was registered
Why: Proves WHEN the report was registered
```

**Human readable:**
```javascript
new Date(1732819200 * 1000)
// Result: 2024-11-28 18:00:00
```

### 4. **uploader** (address)
```
Type: address (20 bytes)
Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Purpose: Ethereum address that registered the hash
Why: Proves WHO registered it
```

### 5. **exists** (bool)
```
Type: bool (1 byte)
Example: true
Purpose: Flag to check if record exists
Why: Prevents duplicate registrations
```

---

## 🎬 Complete Flow Example

### Step-by-Step: What Happens When You Upload

```
1. You upload: sample-ransomware-attack.json (50 KB)
   ↓

2. Backend generates hash:
   SHA-256(file content) = 0x3a5f8b2c9d1e4f7a...
   ↓

3. Backend stores in MySQL:
   INSERT INTO stix_reports (id, content, hash, ...)
   VALUES ('a1b2c3d4...', '{...50KB...}', '0x3a5f8b2c...', ...)
   ↓

4. Backend calls Ethereum smart contract:
   contract.registerReport(
     0x3a5f8b2c9d1e4f7a...,  // hash
     "a1b2c3d4-e5f6-7890..."  // reportId
   )
   ↓

5. Ethereum stores:
   records[0x3a5f8b2c...] = {
     reportHash: 0x3a5f8b2c...,
     reportId: "a1b2c3d4...",
     timestamp: 1732819200,
     uploader: 0x742d35Cc...,
     exists: true
   }
   ↓

6. Ethereum emits event:
   HashRegistered(
     0x3a5f8b2c...,
     "a1b2c3d4...",
     1732819200,
     0x742d35Cc...
   )
   ↓

7. Backend receives Ethereum transaction hash:
   0x7d9e1a3b5c8f2e4a6b9d0c1f3e5a7b9c...
   ↓

8. Backend updates MySQL:
   UPDATE blockchain_transactions
   SET ethereum_tx_hash = '0x7d9e1a3b...'
   WHERE report_id = 'a1b2c3d4...'
```

---

## 🔐 Verification Example

### Anyone Can Verify Your Report

**Scenario:** Someone wants to verify your WannaCry report is authentic

```javascript
// They have the STIX report file
const reportContent = fs.readFileSync('wannacry-report.json');

// They calculate the hash
const hash = crypto.createHash('sha256')
  .update(reportContent)
  .digest('hex');
// Result: 0x3a5f8b2c9d1e4f7a...

// They check Ethereum
const [exists, timestamp, uploader, reportId] = 
  await contract.verifyReport('0x3a5f8b2c9d1e4f7a...');

if (exists) {
  console.log('✅ Report is authentic!');
  console.log('Registered on:', new Date(timestamp * 1000));
  console.log('By:', uploader);
} else {
  console.log('❌ Report is NOT registered!');
}
```

---

## 📊 Storage Comparison Table

| Data | MySQL | Ethereum | Why Split? |
|------|-------|----------|------------|
| **Full STIX JSON** | ✅ Yes (50 KB) | ❌ No | Too expensive on Ethereum |
| **Report Hash** | ✅ Yes (64 chars) | ✅ Yes (32 bytes) | Proof of content |
| **Report ID** | ✅ Yes (UUID) | ✅ Yes (string) | Link between systems |
| **Timestamp** | ✅ Yes | ✅ Yes | When registered |
| **Uploader** | ✅ Yes | ✅ Yes | Who registered |
| **Indicators** | ✅ Yes (arrays) | ❌ No | Too complex for blockchain |
| **Metadata** | ✅ Yes (JSON) | ❌ No | Not needed on-chain |
| **Search Index** | ✅ Yes | ❌ No | Blockchain can't search |

---

## 💰 Cost Comparison

### Storing 1 Report (50 KB STIX file)

**Option 1: Only MySQL**
- Cost: $0 (free)
- Proof: ❌ None (can be modified)
- Public: ❌ No (private database)

**Option 2: Only Ethereum**
- Cost: ~$500-5000 (50 KB on-chain!)
- Proof: ✅ Immutable
- Public: ✅ Yes
- Problem: ❌ Too expensive!

**Option 3: Hybrid (Your System)**
- MySQL: $0 (full 50 KB report)
- Ethereum: ~$5-50 (only 100 bytes hash)
- Proof: ✅ Immutable hash
- Public: ✅ Hash is public
- Result: ✅ Best of both worlds!

---

## 🎯 Summary

**What's on Ethereum:**
```
✅ Report Hash (32 bytes)
✅ Report ID (UUID string)
✅ Timestamp (when registered)
✅ Uploader Address (who registered)
✅ Exists Flag (boolean)
```

**What's in MySQL:**
```
✅ Full STIX JSON (all indicators, malware data)
✅ Blockchain blocks (your local chain)
✅ Blockchain transactions (with Ethereum link)
✅ Metrics history (for charts)
✅ Everything else!
```

**Why This Design:**
- 💰 **Cost**: Ethereum storage is expensive (~$1 per KB)
- ⚡ **Speed**: MySQL queries are instant, Ethereum takes seconds
- 🔒 **Privacy**: Full reports stay private in MySQL
- ✅ **Proof**: Hashes on Ethereum prove authenticity
- 🌍 **Public**: Anyone can verify hashes on Ethereum

This is the **industry standard** for blockchain applications! 🚀
