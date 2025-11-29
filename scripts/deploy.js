const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ThreatIntelRegistry contract...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const ThreatIntelRegistry = await hre.ethers.getContractFactory("ThreatIntelRegistry");
  const contract = await ThreatIntelRegistry.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ ThreatIntelRegistry deployed to:", contractAddress);
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update your .env file:");
  console.log(`   ETHEREUM_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("3. Restart your backend server\n");

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const totalReports = await contract.getTotalReports();
  console.log("   Initial reports count:", totalReports.toString());
  console.log("   ✅ Contract is working!\n");

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
