#!/bin/bash

echo "⚡ Simple Blockchain Metrics Setup"
echo "=================================="
echo ""

# Load .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    echo "✅ Loaded: $DB_NAME as $DB_USER"
else
    echo "❌ .env file not found"
    exit 1
fi

# Test connection
echo ""
echo "🔌 Testing MySQL connection..."
if ! mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null >/dev/null; then
    echo "❌ Cannot connect to MySQL"
    echo "   Try: mysql -u $DB_USER -p$DB_PASSWORD"
    exit 1
fi
echo "✅ Connected successfully"

# Run migrations
echo ""
echo "📦 Creating tables..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>/dev/null < migrations/setup-metrics-tables.sql
if [ $? -eq 0 ]; then
    echo "✅ Tables created"
else
    echo "❌ Failed to create tables"
    exit 1
fi

echo ""
echo "📝 Adding confirmation_time column..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>/dev/null < migrations/add-confirmation-time.sql
if [ $? -eq 0 ]; then
    echo "✅ Column added"
else
    echo "⚠️  Column may already exist (this is OK)"
fi

# Verify
echo ""
echo "🔍 Verifying setup..."
TABLES=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = '$DB_NAME' 
AND table_name IN ('blockchain_metrics_history', 'network_peers');
" 2>/dev/null)

if [ "$TABLES" -eq 2 ]; then
    echo "✅ All tables exist"
else
    echo "⚠️  Found $TABLES/2 tables"
fi

# Show stats
echo ""
echo "📊 Current Data:"
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>/dev/null <<EOF
SELECT 
  'Blocks' as Type, COUNT(*) as Count FROM blockchain_blocks
UNION ALL
SELECT 'Transactions', COUNT(*) FROM blockchain_transactions
UNION ALL
SELECT 'STIX Reports', COUNT(*) FROM stix_reports
UNION ALL
SELECT 'Network Peers', COUNT(*) FROM network_peers;
EOF

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "🎯 Next Steps:"
echo "   1. Restart backend: npm run backend"
echo "   2. Open: http://localhost:3000/blockchain-metrics"
echo "   3. Upload STIX reports to see metrics"
echo ""
