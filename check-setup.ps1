# ThreadChain Setup Status Checker
Write-Host "==========================================="
Write-Host "   ThreadChain Setup Status Check" -ForegroundColor Cyan
Write-Host "==========================================="
Write-Host ""

# Check MySQL
Write-Host "Checking MySQL..." -ForegroundColor Yellow
try {
    $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    if ($mysqlService) {
        Write-Host "[OK] MySQL Service Found: $($mysqlService.Name)" -ForegroundColor Green
        if ($mysqlService.Status -eq 'Running') {
            Write-Host "    Status: Running" -ForegroundColor Green
        } else {
            Write-Host "    Status: $($mysqlService.Status)" -ForegroundColor Red
            Write-Host "    Run: net start $($mysqlService.Name)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[X] MySQL Service Not Found" -ForegroundColor Red
        Write-Host "    Please install MySQL or XAMPP" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[X] Error checking MySQL" -ForegroundColor Red
}
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "[X] Node.js not found" -ForegroundColor Red
    }
} catch {
    Write-Host "[X] Node.js not installed" -ForegroundColor Red
}
Write-Host ""

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "[OK] npm installed: v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host "[X] npm not found" -ForegroundColor Red
    }
} catch {
    Write-Host "[X] npm not installed" -ForegroundColor Red
}
Write-Host ""

# Check project files
Write-Host "Checking project files..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "[OK] .env file exists" -ForegroundColor Green
} else {
    Write-Host "[X] .env file missing" -ForegroundColor Red
}

if (Test-Path "node_modules") {
    Write-Host "[OK] node_modules exists" -ForegroundColor Green
} else {
    Write-Host "[!] node_modules missing - run 'npm install'" -ForegroundColor Yellow
}

if (Test-Path "uploads") {
    Write-Host "[OK] uploads folder exists" -ForegroundColor Green
} else {
    Write-Host "[!] uploads folder missing - run 'mkdir uploads'" -ForegroundColor Yellow
}
Write-Host ""

# Check ports
Write-Host "Checking ports..." -ForegroundColor Yellow
$port3306 = netstat -an | Select-String ":3306"
$port3001 = netstat -an | Select-String ":3001"
$port3000 = netstat -an | Select-String ":3000"

if ($port3306) {
    Write-Host "[OK] Port 3306 (MySQL) is active" -ForegroundColor Green
} else {
    Write-Host "[!] Port 3306 (MySQL) not listening" -ForegroundColor Yellow
}

if ($port3001) {
    Write-Host "[OK] Port 3001 (Backend) is active" -ForegroundColor Green
} else {
    Write-Host "[!] Port 3001 (Backend) not active" -ForegroundColor Yellow
}

if ($port3000) {
    Write-Host "[OK] Port 3000 (Frontend) is active" -ForegroundColor Green
} else {
    Write-Host "[!] Port 3000 (Frontend) not active" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================="
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. If MySQL is not running: net start MySQL80" -ForegroundColor White
Write-Host "2. If node_modules missing: npm install" -ForegroundColor White
Write-Host "3. If uploads missing: mkdir uploads" -ForegroundColor White
Write-Host "4. Initialize database: npm run init-db" -ForegroundColor White
Write-Host "5. Start backend: npm start" -ForegroundColor White
Write-Host "6. Start frontend: npm run dev" -ForegroundColor White
Write-Host ""