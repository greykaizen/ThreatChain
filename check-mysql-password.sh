#!/bin/bash

echo "🔍 MySQL Password Checker"
echo "========================="
echo ""

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded .env file"
    echo ""
    echo "📋 Your MySQL credentials:"
    echo "   Host: $DB_HOST"
    echo "   User: $DB_USER"
    echo "   Password: $DB_PASSWORD"
    echo "   Database: $DB_NAME"
    echo "   Port: $DB_PORT"
    echo ""
else
    echo "❌ .env file not found"
    exit 1
fi

# Test connection
echo "🔌 Testing MySQL connection..."
echo ""

if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
    echo ""
    
    # Check if database exists
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database '$DB_NAME' exists"
        
        # Show table counts
        echo ""
        echo "📊 Database statistics:"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
            SELECT 
                'blockchain_blocks' as table_name, 
                COUNT(*) as count 
            FROM blockchain_blocks
            UNION ALL
            SELECT 
                'blockchain_transactions', 
                COUNT(*) 
            FROM blockchain_transactions
            UNION ALL
            SELECT 
                'stix_reports', 
                COUNT(*) 
            FROM stix_reports;
        "
    else
        echo "⚠️  Database '$DB_NAME' does not exist"
        echo ""
        echo "Would you like to create it? Run:"
        echo "   ./setup-database.sh"
    fi
else
    echo "❌ Connection failed!"
    echo ""
    echo "Possible issues:"
    echo "1. MySQL is not running"
    echo "   Fix: sudo systemctl start mysql"
    echo ""
    echo "2. Password is incorrect"
    echo "   Fix: Reset MySQL root password"
    echo ""
    echo "3. User doesn't have permissions"
    echo "   Fix: Grant permissions to user"
    echo ""
    echo "To reset MySQL root password:"
    echo "   sudo mysql"
    echo "   ALTER USER 'root'@'localhost' IDENTIFIED BY '9110';"
    echo "   FLUSH PRIVILEGES;"
    echo "   EXIT;"
fi

echo ""
echo "========================="
echo "💡 Quick Commands:"
echo ""
echo "Connect to MySQL:"
echo "   mysql -u root -p9110"
echo ""
echo "Connect to your database:"
echo "   mysql -u root -p9110 $DB_NAME"
echo ""
echo "Run setup script with password:"
echo "   MYSQL_ROOT_PASSWORD=9110 ./setup-full-metrics.sh"
