@echo off
echo.
echo ========================================
echo   ThreatChain - Ethereum Setup
echo ========================================
echo.
echo This will set up a complete Ethereum blockchain locally
echo Takes about 5 minutes
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo SUCCESS: Node.js found: %NODE_VERSION%
echo.

REM Step 1: Install Hardhat
echo Step 1/5: Installing Hardhat...
call npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

if %errorlevel% equ 0 (
    echo    SUCCESS: Hardhat installed
) else (
    echo    ERROR: Installation failed
    pause
    exit /b 1
)
echo.

REM Step 2: Check if Hardhat node is already running
echo Step 2/5: Checking for existing Hardhat node...
netstat -ano | findstr ":8545" >nul 2>&1
if %errorlevel% equ 0 (
    echo    WARNING: Port 8545 is already in use
    echo    Ethereum node might already be running
) else (
    echo    SUCCESS: Port 8545 is available
    echo.
    echo    Starting Hardhat node in background...
    start "Hardhat Node" cmd /k "npx hardhat node"
    echo    Waiting for node to start...
    timeout /t 10 /nobreak >nul
    
    netstat -ano | findstr ":8545" >nul 2>&1
    if %errorlevel% equ 0 (
        echo    SUCCESS: Hardhat node is running
    ) else (
        echo    ERROR: Failed to start Hardhat node
        pause
        exit /b 1
    )
)
echo.

REM Step 3: Deploy contract
echo Step 3/5: Deploying smart contract...
call npx hardhat run scripts/deploy.js --network localhost

if %errorlevel% equ 0 (
    echo    SUCCESS: Contract deployed successfully
) else (
    echo    ERROR: Deployment failed
    pause
    exit /b 1
)
echo.

REM Step 4: Update .env
echo Step 4/5: Updating configuration...

if exist deployment-info.json (
    for /f "tokens=2 delims=:, " %%a in ('findstr "contractAddress" deployment-info.json') do (
        set CONTRACT_ADDRESS=%%a
    )
    set CONTRACT_ADDRESS=%CONTRACT_ADDRESS:"=%
    
    REM Update .env file
    powershell -Command "(Get-Content .env) -replace 'ETHEREUM_CONTRACT_ADDRESS=.*', 'ETHEREUM_CONTRACT_ADDRESS=%CONTRACT_ADDRESS%' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'ETHEREUM_ENABLED=.*', 'ETHEREUM_ENABLED=true' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'ETHEREUM_USE_LOCAL=.*', 'ETHEREUM_USE_LOCAL=true' | Set-Content .env"
    
    echo    SUCCESS: Configuration updated
    echo    Contract: %CONTRACT_ADDRESS%
) else (
    echo    WARNING: deployment-info.json not found
)
echo.

REM Step 5: Test
echo Step 5/5: Running tests...
call npx hardhat run scripts/test-ethereum.js --network localhost

if %errorlevel% equ 0 (
    echo.
    echo    SUCCESS: All tests passed!
) else (
    echo.
    echo    WARNING: Some tests failed (this might be okay)
)
echo.

REM Final instructions
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo What's Running:
echo    * Ethereum Node: http://localhost:8545
echo    * Contract: %CONTRACT_ADDRESS%
echo.
echo Next Steps:
echo.
echo    1. Start Backend (New Terminal):
echo       npm run backend
echo.
echo    2. Start Frontend (New Terminal):
echo       npm run dev
echo.
echo    3. Open Browser:
echo       http://localhost:3000
echo.
echo    4. Test Upload:
echo       Go to Blockchain Demo and upload CSV
echo.
echo ========================================
echo.
echo Check Status:
echo    curl http://localhost:3001/api/blockchain/ethereum/status
echo.
echo Stop Ethereum Node:
echo    Close the Hardhat Node window
echo.
echo Full Guide:
echo    See ETHEREUM-QUICK-START.md
echo.
pause
