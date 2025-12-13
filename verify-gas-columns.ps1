Write-Host ""
Write-Host "========================================"
Write-Host "  Verifying Gas Columns in Database"
Write-Host "========================================"
Write-Host ""

# Load .env file
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with database credentials"
    exit 1
}

# Parse .env
$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$DB_HOST = $envVars['DB_HOST']
$DB_USER = $envVars['DB_USER']
$DB_PASSWORD = $envVars['DB_PASSWORD']
$DB_NAME = $envVars['DB_NAME']

Write-Host "Database: $DB_NAME"
Write-Host "Host: $DB_HOST"
Write-Host "User: $DB_USER"
Write-Host ""

# Create SQL migration
$sql = @"
ALTER TABLE blockchain_transactions 
ADD COLUMN IF NOT EXISTS gas_price DECIMAL(20,9) DEFAULT 0 AFTER gas_used;

ALTER TABLE blockchain_transactions 
ADD COLUMN IF NOT EXISTS gas_fee DECIMAL(20,18) DEFAULT 0 AFTER gas_price;
"@

$sql | Out-File -FilePath "temp_gas_migration.sql" -Encoding ASCII

Write-Host "Adding gas columns to blockchain_transactions table..." -ForegroundColor Yellow
Write-Host ""

# Execute SQL
$mysqlCmd = "mysql -h$DB_HOST -u$DB_USER -p$DB_PASSWORD $DB_NAME"
Get-Content temp_gas_migration.sql | & mysql -h$DB_HOST -u$DB_USER -p$DB_PASSWORD $DB_NAME 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  SUCCESS! Gas columns added" -ForegroundColor Green
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Verifying columns..." -ForegroundColor Cyan
    Write-Host ""
    
    & mysql -h$DB_HOST -u$DB_USER -p$DB_PASSWORD $DB_NAME -e "DESCRIBE blockchain_transactions;"
    
    Write-Host ""
    Write-Host "Gas tracking is now enabled!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to add gas columns" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:"
    Write-Host "1. MySQL is running"
    Write-Host "2. Database credentials are correct"
    Write-Host "3. Database exists (run: npm run init-db)"
    Write-Host ""
}

# Cleanup
Remove-Item temp_gas_migration.sql -ErrorAction SilentlyContinue
