#!/bin/bash

echo "⚡ Quick Blockchain Metrics Setup"
echo "================================="
echo ""

# Load .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

echo "✅ Using database: $DB_NAME"
echo "✅ Using user: $DB_USER"
echo ""

# Apply migrations
echo "📦 Applying database migrations..."

# First, check if column exists
COLUMN_EXISTS=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
SELECT COUNT(*) FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = '$DB_NAME' 
AND TABLE_NAME = 'blockchain_transactions' 
AND COLUMN_NAME = 'confirmation_time';
" 2>/dev/null)

if [ "$COLUMN_EXISTS" -eq 0 ]; then
    echo "  Adding confirmation_time column..."
    mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>/dev/null <<EOF
ALTER TABLE blockchain_transactions 
ADD COLUMN confirmation_time TIMESTAMP NULL AFTER timestamp;

-- Create metrics history table
CREATE TABLE IF NOT EXISTS blockchain_metrics_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gas_fee DECIMAL(10,2) DEFAULT 0,
  tps DECIMAL(10,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  latency INT DEFAULT 0,
  utilization DECIMAL(5,2) DEFAULT 0,
  throughput DECIMAL(10,2) DEFAULT 0,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  total_transactions INT DEFAULT 0,
  confirmed_transactions INT DEFAULT 0,
  failed_transactions INT DEFAULT 0,
  latest_block BIGINT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
);

-- Create network peers table
CREATE TABLE IF NOT EXISTS network_peers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  peer_id VARCHAR(255) UNIQUE NOT NULL,
  peer_address VARCHAR(255) NOT NULL,
  peer_type ENUM('local', 'ethereum', 'external') DEFAULT 'local',
  status ENUM('connected', 'disconnected') DEFAULT 'connected',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

EOF
else
    echo "  ✅ confirmation_time column already exists"
fi

# Now create other tables
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>/dev/null <<EOF
-- Update existing transactions
UPDATE blockchain_transactions 
SET confirmation_time = timestamp 
WHERE status = 'confirmed' AND confirmation_time IS NULL;

-- Insert local peer
INSERT IGNORE INTO network_peers (peer_id, peer_address, peer_type, status)
VALUES ('local-node-1', 'localhost:3001', 'local', 'connected');
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
    echo ""
    
    # Show stats
    TX_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -N -e "USE $DB_NAME; SELECT COUNT(*) FROM blockchain_transactions;" 2>/dev/null)
    BLOCK_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -N -e "USE $DB_NAME; SELECT COUNT(*) FROM blockchain_blocks;" 2>/dev/null)
    
    echo "📊 Current Data:"
    echo "   • Transactions: $TX_COUNT"
    echo "   • Blocks: $BLOCK_COUNT"
    echo ""
    
    echo "🎯 Next Steps:"
    echo "   1. Restart backend: npm run backend"
    echo "   2. Open: http://localhost:3000/blockchain-metrics"
    echo "   3. Upload STIX reports to see metrics"
    echo ""
else
    echo "❌ Setup failed"
    exit 1
fi
