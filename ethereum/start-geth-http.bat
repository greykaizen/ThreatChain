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
  --networkid 1337 ^
  --http ^
  --http.addr "0.0.0.0" ^
  --http.port 8545 ^
  --http.api "eth,web3,personal,net,admin,debug,miner" ^
  --http.corsdomain "*" ^
  --nodiscover ^
  --maxpeers 0 ^
  --allow-insecure-unlock ^
  --unlock "0xB4Be431F3E009B673F2B381372BCb55A784fC76d" ^
  --password ethereum\password.txt ^
  --mine ^
  --miner.etherbase "0xB4Be431F3E009B673F2B381372BCb55A784fC76d"
