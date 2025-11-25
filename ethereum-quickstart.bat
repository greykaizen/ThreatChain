@echo off
echo ========================================
echo   Ethereum Integration Quick Start
echo ========================================
echo.

echo Step 1: Install Package
echo ------------------------
call npm install ethers@6
echo.

echo Step 2: Generate Wallet
echo ------------------------
node scripts/deploy-contract.js --generate-wallet
echo.

echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Copy the private key above
echo 2. Add to .env file:
echo    ETHEREUM_PRIVATE_KEY=0xyour_key_here
echo.
echo 3. Get Infura API key from https://infura.io
echo    Add to .env:
echo    INFURA_API_KEY=your_key_here
echo.
echo 4. Get free testnet ETH:
echo    - https://sepoliafaucet.com/
echo    - Paste your wallet address
echo.
echo 5. Deploy contract via Remix:
echo    - https://remix.ethereum.org
echo    - Copy contract from contracts/ThreatIntelRegistry.sol
echo    - Deploy to Sepolia
echo    - Add address to .env:
echo      ETHEREUM_CONTRACT_ADDRESS=0xcontract_address
echo.
echo 6. Restart backend: npm run backend
echo.
echo Full guide: ETHEREUM-SETUP-GUIDE.md
echo.
pause
