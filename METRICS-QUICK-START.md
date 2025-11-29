# 🚀 Blockchain Metrics Dashboard - Quick Start Guide

## Start in 3 Steps

### Step 1: Start Backend Server
```bash
cd ThreatChain
node server.js
```

Wait for:
```
✅ Ethereum integration enabled
📈 Metrics API: http://localhost:3001/api/blockchain/metrics
```

### Step 2: Start Frontend
```bash
npm run dev
```

### Step 3: View Dashboard
1. Open http://localhost:3000
2. Click "Blockchain Metrics" in sidebar
3. See all metrics in real-time!

---

## 📊 What You'll See

### Top Section - Transaction Metrics
- Gas Fee (Gwei)
- Total Transactions
- Transactions Per Second
- Average Gas Consumption

### Middle Section - Performance
- Current Utilization (%)
- Throughput (records/sec)
- Average Latency (ms)
- CPU Usage (%)

### Bottom Section - Details
- Consensus & Reliability info
- Data Integrity metrics
- Historical trend charts
- Block statistics

---

## 🎯 Key Features

- ✅ **Auto-Refresh** - Updates every 5 seconds
- ✅ **Export** - Download as JSON or CSV
- ✅ **Charts** - View trends over 1h, 24h, 7d, 30d
- ✅ **Alerts** - Red badges for threshold violations

---

## 🧪 Test the API

```bash
# Get current metrics
curl http://localhost:3001/api/blockchain/metrics

# Get historical data
curl "http://localhost:3001/api/blockchain/metrics/history?range=24h"

# Export as JSON
curl "http://localhost:3001/api/blockchain/metrics/export?range=24h&format=json" -o metrics.json
```

---

## 📈 All Metrics Included

✅ Gas Fee, Transaction Security
✅ Current Utilization, Total Transactions
✅ Transactions Per Second
✅ Measurement Performance
✅ Consensus Protocol
✅ Success Rate, Throughput
✅ Avg Latency, Avg Consumption
✅ Provenance, Cross Verify, Challenge Record
✅ Block Size, CPU, Fault Tolerance, Failure Rate
✅ On-chain Metrics

**Everything your professor requested! 🎉**

---

## 🎓 For Demo

1. Show the dashboard with live metrics
2. Click time range buttons to show historical data
3. Export metrics to show data download
4. Point out alert badges (if any thresholds exceeded)
5. Explain auto-refresh feature

---

## Need Help?

- Backend not starting? Check if port 3001 is available
- No data? Wait a few minutes for metrics to collect
- Charts empty? Historical data builds up over time

**Ready to impress your professor! 🚀**
