const hre = require("hardhat");
const crypto = require('crypto');

async function main() {
  console.log("🧪 Testing ThreatIntelRegistry contract...\n");

  // Get contract address from deployment
  const fs = require('fs');
  let contractAddress;
  
  try {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    contractAddress = deploymentInfo.contractAddress;
    console.log("📍 Using deployed contract:", contractAddress, "\n");
  } catch (error) {
    console.error("❌ deployment-info.json not found. Please deploy the contract first.");
    process.exit(1);
  }

  // Get contract instance
  const contract = await hre.ethers.getContractAt("ThreatIntelRegistry", contractAddress);
  const [signer] = await hre.ethers.getSigners();

  console.log("👤 Testing with account:", signer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "ETH\n");

  // Test 1: Register a report
  console.log("📝 Test 1: Registering a report...");
  const reportData = {
    type: "indicator",
    value: "192.168.1.100",
    threat_type: "malware"
  };
  const reportHash = '0x' + crypto.createHash('sha256').update(JSON.stringify(reportData)).digest('hex');
  const reportId = crypto.randomUUID();

  console.log("   Report Hash:", reportHash);
  console.log("   Report ID:", reportId);

  try {
    const tx = await contract.registerReport(reportHash, reportId);
    console.log("   Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("   ✅ Confirmed in block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString(), "\n");
  } catch (error) {
    console.error("   ❌ Registration failed:", error.message, "\n");
  }

  // Test 2: Verify the report
  console.log("🔍 Test 2: Verifying the report...");
  try {
    const result = await contract.verifyReport(reportHash);
    console.log("   Exists:", result[0]);
    console.log("   Timestamp:", new Date(Number(result[1]) * 1000).toISOString());
    console.log("   Uploader:", result[2]);
    console.log("   Report ID:", result[3]);
    console.log("   ✅ Verification successful!\n");
  } catch (error) {
    console.error("   ❌ Verification failed:", error.message, "\n");
  }

  // Test 3: Get total reports
  console.log("📊 Test 3: Getting total reports...");
  try {
    const total = await contract.getTotalReports();
    console.log("   Total reports:", total.toString());
    console.log("   ✅ Query successful!\n");
  } catch (error) {
    console.error("   ❌ Query failed:", error.message, "\n");
  }

  // Test 4: Try to register duplicate (should fail)
  console.log("⚠️  Test 4: Attempting duplicate registration (should fail)...");
  try {
    const tx = await contract.registerReport(reportHash, reportId);
    await tx.wait();
    console.log("   ❌ Duplicate was accepted (this shouldn't happen!)\n");
  } catch (error) {
    console.log("   ✅ Duplicate rejected as expected:", error.message.split('\n')[0], "\n");
  }

  // Test 5: Register multiple reports
  console.log("📝 Test 5: Registering multiple reports...");
  const reports = [
    { value: "evil.com", type: "domain" },
    { value: "abc123def456", type: "hash" },
    { value: "203.0.113.50", type: "ip" }
  ];

  for (let i = 0; i < reports.length; i++) {
    const hash = '0x' + crypto.createHash('sha256').update(JSON.stringify(reports[i])).digest('hex');
    const id = crypto.randomUUID();
    
    try {
      const tx = await contract.registerReport(hash, id);
      await tx.wait();
      console.log(`   ✅ Report ${i + 1}/3 registered`);
    } catch (error) {
      console.log(`   ❌ Report ${i + 1}/3 failed:`, error.message.split('\n')[0]);
    }
  }

  // Final stats
  console.log("\n📊 Final Statistics:");
  const finalTotal = await contract.getTotalReports();
  console.log("   Total reports registered:", finalTotal.toString());
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("   Remaining balance:", hre.ethers.formatEther(balance), "ETH");
  
  console.log("\n✅ All tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
