#!/bin/bash

echo "🔍 Verifying Gas Columns in Database"
echo "====================================="
echo ""

# Load database credentials from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found"
    exit 1
fi

echo "Checking blockchain_transactions table..."
echo ""

# Run the migration to add gas columns
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/add-gas-columns.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Gas columns verified/added successfully!"
    echo ""
    echo "Columns in blockchain_transactions:"
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE blockchain_transactions;" | grep -E "gas_used|gas_price|gas_fee"
    echo ""
    echo "✅ Setup complete! Gas data will now be recorded for all new transactions."
else
    echo ""
    echo "❌ Failed to add gas columns"
    exit 1
fi
