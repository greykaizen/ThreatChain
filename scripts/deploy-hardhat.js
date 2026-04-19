const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ThreatIntelRegistry to local network...");

  const ThreatIntelRegistry = await hre.ethers.getContractFactory("ThreatIntelRegistry");
  const registry = await ThreatIntelRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`✅ ThreatIntelRegistry deployed to: ${address}`);
  
  // Also log the first account for easy use in .env
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deployer address: ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
