#!/bin/bash

echo "🗄️  ThreatChain Database Setup"
echo "=============================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo ""
    echo "Install MySQL with:"
    echo "  sudo apt update"
    echo "  sudo apt install mysql-server"
    echo ""
    exit 1
fi

# Check if MySQL is running
if ! sudo systemctl is-active --quiet mysql; then
    echo "⚠️  MySQL is not running. Starting MySQL..."
    sudo systemctl start mysql
    
    if [ $? -eq 0 ]; then
        echo "✅ MySQL started successfully"
    else
        echo "❌ Failed to start MySQL"
        exit 1
    fi
else
    echo "✅ MySQL is already running"
fi

echo ""
echo "📝 Creating database and user..."
echo ""
echo "Please enter your MySQL root password when prompted:"
echo ""

# Create database and user
sudo mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS threadchain_db;
CREATE USER IF NOT EXISTS 'threadchain_user'@'localhost' IDENTIFIED BY 'threadchain_password';
GRANT ALL PRIVILEGES ON threadchain_db.* TO 'threadchain_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully!' as Status;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed!"
    echo ""
    echo "📋 Database Details:"
    echo "   Database: threadchain_db"
    echo "   User: threadchain_user"
    echo "   Password: threadchain_password"
    echo "   Host: localhost"
    echo "   Port: 3306"
    echo ""
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "📝 Creating .env file..."
        cat > .env << ENVEOF
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=threadchain_user
DB_PASSWORD=threadchain_password
DB_NAME=threadchain_db
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development

# Ethereum Configuration (Optional)
ETHEREUM_ENABLED=false
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_PRIVATE_KEY=
CONTRACT_ADDRESS=
ENVEOF
        echo "✅ .env file created"
    else
        echo "⚠️  .env file already exists (not overwriting)"
    fi
    
    echo ""
    echo "🚀 You can now start the backend with:"
    echo "   ./start-backend.sh"
    echo ""
else
    echo ""
    echo "❌ Database setup failed!"
    echo ""
    echo "Try running manually:"
    echo "  sudo mysql -u root -p"
    echo ""
    echo "Then execute:"
    echo "  CREATE DATABASE threadchain_db;"
    echo "  CREATE USER 'threadchain_user'@'localhost' IDENTIFIED BY 'threadchain_password';"
    echo "  GRANT ALL PRIVILEGES ON threadchain_db.* TO 'threadchain_user'@'localhost';"
    echo "  FLUSH PRIVILEGES;"
    exit 1
fi
