@echo off
cls
echo ========================================
echo ThreadChain Authentication Setup
echo ========================================
echo.
echo This script will:
echo 1. Install required npm packages (bcrypt, jsonwebtoken)
echo 2. Create database tables (organizations, users)
echo 3. Add organization_id and user_id to stix_reports
echo 4. Create a system organization for legacy reports
echo.
pause
echo.

echo [1/2] Installing dependencies...
echo.
call npm install bcrypt jsonwebtoken
if errorlevel 1 (
    echo.
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo ✅ Dependencies installed successfully!
echo.

echo [2/2] Setting up database tables...
echo.
node -e "const db = require('./config/database'); (async () => { try { const connection = await db.getPool().getConnection(); console.log('Creating organizations table...'); await connection.execute(`CREATE TABLE IF NOT EXISTS organizations ( id VARCHAR(36) PRIMARY KEY, org_name VARCHAR(255) NOT NULL, admin_first_name VARCHAR(100) NOT NULL, admin_last_name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(50), address TEXT, password_hash VARCHAR(255) NOT NULL, api_key VARCHAR(64) UNIQUE, status ENUM('active', 'inactive', 'suspended') DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_email (email), INDEX idx_api_key (api_key), INDEX idx_status (status) )`); console.log('✅ Organizations table created'); console.log('Creating users table...'); await connection.execute(`CREATE TABLE IF NOT EXISTS users ( id VARCHAR(36) PRIMARY KEY, organization_id VARCHAR(36), first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(50), password_hash VARCHAR(255) NOT NULL, role ENUM('individual', 'admin', 'member') DEFAULT 'individual', status ENUM('active', 'inactive') DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL, INDEX idx_email (email), INDEX idx_organization_id (organization_id), INDEX idx_role (role) )`); console.log('✅ Users table created'); console.log('Checking if columns exist in stix_reports...'); const [columns] = await connection.execute(`SHOW COLUMNS FROM stix_reports LIKE 'organization_id'`); if (columns.length === 0) { console.log('Adding organization_id column...'); await connection.execute(`ALTER TABLE stix_reports ADD COLUMN organization_id VARCHAR(36) NULL`); console.log('✅ organization_id column added'); } else { console.log('✅ organization_id column already exists'); } const [userColumns] = await connection.execute(`SHOW COLUMNS FROM stix_reports LIKE 'user_id'`); if (userColumns.length === 0) { console.log('Adding user_id column...'); await connection.execute(`ALTER TABLE stix_reports ADD COLUMN user_id VARCHAR(36) NULL`); console.log('✅ user_id column added'); } else { console.log('✅ user_id column already exists'); } console.log('Adding indexes...'); await connection.execute(`CREATE INDEX idx_organization_id ON stix_reports(organization_id)`).catch(() => console.log('Index idx_organization_id already exists')); await connection.execute(`CREATE INDEX idx_user_id ON stix_reports(user_id)`).catch(() => console.log('Index idx_user_id already exists')); console.log('✅ Indexes added'); console.log('Creating system organization...'); await connection.execute(`INSERT IGNORE INTO organizations (id, org_name, admin_first_name, admin_last_name, email, password_hash, status) VALUES ('system-legacy', 'System', 'System', 'Admin', 'system@threadchain.local', '$2b$10$dummyhash', 'active')`); console.log('✅ System organization created'); console.log('Updating legacy reports...'); const [result] = await connection.execute(`UPDATE stix_reports SET organization_id = 'system-legacy' WHERE organization_id IS NULL`); console.log(`✅ Updated ${result.affectedRows} legacy reports`); connection.release(); console.log(''); console.log('========================================'); console.log('✅ Database setup complete!'); console.log('========================================'); process.exit(0); } catch (error) { console.error('❌ Error:', error.message); console.error('Stack:', error.stack); process.exit(1); } })();"

if errorlevel 1 (
    echo.
    echo ❌ Database setup failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Authentication system is now ready!
echo.
echo IMPORTANT: Update your .env file
echo Add this line if not present:
echo JWT_SECRET=your-secret-key-change-this-in-production
echo.
echo Next steps:
echo 1. Restart backend: npm run backend
echo 2. Restart frontend: npm run dev
echo 3. Visit http://localhost:3000/signup to create an account
echo 4. Visit http://localhost:3000/login to sign in
echo.
echo Features enabled:
echo ✓ User registration (individual and organization)
echo ✓ Login with JWT authentication
echo ✓ Report ownership tracking
echo ✓ Access control for reports
echo ✓ Provenance tracking with user info
echo.
pause
