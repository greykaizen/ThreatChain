@echo off
echo ========================================
echo   Starting Private Ethereum Node
echo ========================================
echo.
echo Network: Private (ChainID: 1337)
echo RPC: http://localhost:8545
echo.
echo Keep this window open while using the system!
echo Press Ctrl+C to stop the node.
echo.
echo ========================================
echo.

geth ^
  --datadir ethereum\data ^
  --http ^
  --http.addr "127.0.0.1" ^
  --http.port 8545 ^
  --http.api "eth,web3,net,admin,debug" ^
  --http.corsdomain "*" ^
  --dev ^
  --dev.period 5 ^
  console
