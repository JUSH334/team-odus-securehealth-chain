// scripts/deploy-simple.js
// SIMPLE DEPLOYMENT SCRIPT W7

const hre = require("hardhat");

async function main() {
    console.log("\n🚀 Deploying PatientRegistry Contract...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get balance
    const balance = await deployer.getBalance();
    console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH\n");

    // Deploy contract
    const PatientRegistry = await hre.ethers.getContractFactory("PatientRegistry");
    const registry = await PatientRegistry.deploy();
    await registry.deployed();

    console.log("✅ PatientRegistry deployed!");
    console.log("📍 Contract address:", registry.address);
    console.log("📋 Transaction hash:", registry.deployTransaction.hash);
    console.log("\n========================================");
    console.log("SAVE THIS ADDRESS FOR THE CLIENT SCRIPT:");
    console.log(registry.address);
    console.log("========================================\n");

    // Verify deployment
    const totalPatients = await registry.totalPatients();
    console.log("Initial patient count:", totalPatients.toString());
    console.log("Custodian address:", await registry.custodian());
    
    console.log("\n✨ Deployment complete!");
    console.log("\nNext steps:");
    console.log("1. Copy the contract address above");
    console.log("2. Update register-patient.js with this address");
    console.log("3. Run: npx hardhat run scripts/register-patient.js --network localhost");
    
    return registry.address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });