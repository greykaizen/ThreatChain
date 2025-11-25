# ThreadChain Backend API

Backend server for ThreadChain - Blockchain-based Cyber Threat Intelligence Platform

## 🚀 Features

- **Local Blockchain Implementation**: Simple proof-of-work blockchain for storing STIX report hashes
- **MySQL Database**: Off-chain storage for full STIX reports and metadata
- **RESTful API**: Complete API for blockchain, STIX, and provenance operations
- **Provenance Tracking**: Full audit trail for all threat intelligence reports
- **Hash Verification**: Cryptographic verification of report integrity

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- npm or yarn

## 🔧 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory (already created):

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=threadchain_db
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Initialize Database

Make sure MySQL server is running, then:

```bash
npm run init-db
```

This will:
- Create the `threadchain_db` database
- Create all necessary tables
- Set up indexes and foreign keys

### 4. Create Uploads Directory

```bash
mkdir uploads
```

## 🏃 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and service health.

### Blockchain Endpoints

#### Get Blockchain Statistics
```
GET /api/blockchain/stats
```

#### Get All Blocks
```
GET /api/blockchain/blocks?page=1&limit=10
```

#### Get Specific Block
```
GET /api/blockchain/blocks/:blockNumber
```

#### Get All Transactions
```
GET /api/blockchain/transactions?page=1&limit=10&status=confirmed
```

#### Get Specific Transaction
```
GET /api/blockchain/transactions/:txHash
```

#### Submit Hash to Blockchain
```
POST /api/blockchain/submit
Content-Type: application/json

{
  "reportHash": "abc123...",
  "reportId": "uuid",
  "metadata": {}
}
```

#### Verify Hash on Blockchain
```
POST /api/blockchain/verify
Content-Type: application/json

{
  "reportHash": "abc123..."
}
```

#### Check Blockchain Health
```
GET /api/blockchain/health
```

### STIX Endpoints

#### Upload STIX Report
```
POST /api/stix/upload
Content-Type: multipart/form-data

file: [STIX JSON file]
title: "Report Title"
description: "Report Description"
```

#### Get All Reports
```
GET /api/stix/reports?page=1&limit=10
```

#### Get Specific Report
```
GET /api/stix/reports/:id
```

#### Verify Report Integrity
```
POST /api/stix/verify/:id
```

#### Delete Report
```
DELETE /api/stix/reports/:id
```

#### Get STIX Statistics
```
GET /api/stix/stats
```

### Provenance Endpoints

#### Get Provenance Records for Report
```
GET /api/provenance/report/:reportId
```

#### Add Provenance Record
```
POST /api/provenance/record
Content-Type: application/json

{
  "reportId": "uuid",
  "actionType": "created|updated|verified|shared",
  "actor": "username",
  "metadata": {}
}
```

#### Get Complete Provenance Chain
```
GET /api/provenance/chain/:reportId
```

#### Verify Provenance Integrity
```
POST /api/provenance/verify/:reportId
```

#### Get Provenance Statistics
```
GET /api/provenance/stats
```

## 🗄️ Database Schema

### stix_reports
- `id` (VARCHAR 36, PRIMARY KEY)
- `title` (VARCHAR 255)
- `description` (TEXT)
- `content` (LONGTEXT) - Full STIX JSON
- `file_name` (VARCHAR 255)
- `file_size` (INT)
- `hash` (VARCHAR 64, UNIQUE) - SHA-256 hash
- `stix_version` (VARCHAR 10)
- `report_type` (VARCHAR 50)
- `severity` (VARCHAR 20)
- `indicators_count` (INT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### blockchain_transactions
- `id` (VARCHAR 36, PRIMARY KEY)
- `tx_hash` (VARCHAR 66, UNIQUE)
- `block_number` (BIGINT)
- `report_hash` (VARCHAR 64)
- `report_id` (VARCHAR 36, FOREIGN KEY)
- `status` (ENUM: pending, confirmed, failed)
- `gas_used` (BIGINT)
- `timestamp` (TIMESTAMP)
- `confirmation_time` (TIMESTAMP)

### provenance_records
- `id` (VARCHAR 36, PRIMARY KEY)
- `report_id` (VARCHAR 36, FOREIGN KEY)
- `blockchain_tx_id` (VARCHAR 36, FOREIGN KEY)
- `action_type` (ENUM: created, updated, verified, shared)
- `actor` (VARCHAR 255)
- `metadata` (JSON)
- `timestamp` (TIMESTAMP)

### blockchain_blocks
- `block_number` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `block_hash` (VARCHAR 64, UNIQUE)
- `previous_hash` (VARCHAR 64)
- `merkle_root` (VARCHAR 64)
- `timestamp` (TIMESTAMP)
- `nonce` (BIGINT)
- `difficulty` (INT)
- `transactions_count` (INT)

## 🔐 Security Features

- SHA-256 hashing for report integrity
- Blockchain immutability for provenance
- Foreign key constraints for data integrity
- File size limits (50MB)
- File type validation (JSON, XML, CSV only)

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Get blockchain stats
curl http://localhost:3001/api/blockchain/stats

# Upload STIX report
curl -X POST http://localhost:3001/api/stix/upload \
  -F "file=@sample-stix-2.1.json" \
  -F "title=Test Report" \
  -F "description=Test Description"
```

### Using Postman

Import the endpoints and test with the Postman collection (create one based on the endpoints above).

## 📊 Monitoring

The server logs all operations to console. Monitor:
- Database connections
- Blockchain operations
- API requests
- Errors and warnings

## 🛠️ Troubleshooting

### Database Connection Issues

1. Check MySQL is running:
   ```bash
   mysql -u root -p
   ```

2. Verify credentials in `.env`

3. Check user permissions:
   ```sql
   GRANT ALL PRIVILEGES ON threadchain_db.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Port Already in Use

Change the PORT in `.env` file:
```env
PORT=3002
```

### File Upload Issues

Ensure `uploads/` directory exists and has write permissions:
```bash
mkdir uploads
chmod 755 uploads
```

## 📝 Development Notes

- The blockchain is a simple local implementation (not production-ready)
- For production, consider using Ethereum, Hyperledger, or other enterprise blockchain
- Add authentication/authorization for production use
- Implement rate limiting for API endpoints
- Add comprehensive logging and monitoring

## 🤝 Contributing

This is a demo/prototype implementation. For production use:
1. Implement proper authentication
2. Add input validation and sanitization
3. Use a production-grade blockchain
4. Add comprehensive error handling
5. Implement rate limiting
6. Add API documentation (Swagger/OpenAPI)

## 📄 License

MIT License - See LICENSE file for details