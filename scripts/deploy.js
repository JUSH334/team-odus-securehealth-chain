// scripts/deploy.js

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting SecureHealth Chain deployment...\n");

    // Get the contract factory
    const PatientRegistry = await hre.ethers.getContractFactory("PatientRegistry");
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", (await deployer.getBalance()).toString(), "\n");

    // Deploy the contract
    console.log("⏳ Deploying PatientRegistry contract...");
    const patientRegistry = await PatientRegistry.deploy();
    await patientRegistry.deployed();

    console.log("✅ PatientRegistry deployed to:", patientRegistry.address);
    console.log("🔗 Transaction hash:", patientRegistry.deployTransaction.hash);
    console.log("🧱 Block number:", patientRegistry.deployTransaction.blockNumber);
    console.log();

    // Save deployment information
    const deploymentInfo = {
        network: hre.network.name,
        contractName: "PatientRegistry",
        address: patientRegistry.address,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        transactionHash: patientRegistry.deployTransaction.hash,
        blockNumber: patientRegistry.deployTransaction.blockNumber,
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    // Save deployment info to JSON file
    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentFile);

    // Verify initial state
    console.log("\n🔍 Verifying initial contract state:");
    console.log("  - Custodian address:", await patientRegistry.custodian());
    console.log("  - Total patients:", (await patientRegistry.totalPatients()).toString());

    // If on localhost, perform initial setup
    if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
        console.log("\n🔧 Performing initial setup for development...");
        
        // Get some test accounts
        const [custodian, provider1, provider2] = await hre.ethers.getSigners();
        
        // Authorize some providers
        console.log("  - Authorizing provider 1:", provider1.address);
        await patientRegistry.authorizeProvider(provider1.address);
        
        console.log("  - Authorizing provider 2:", provider2.address);
        await patientRegistry.authorizeProvider(provider2.address);
        
        console.log("✅ Initial setup completed!");
    }

    // Generate CLI environment file
    const envContent = `# SecureHealth Chain - Environment Configuration
# Generated on ${new Date().toISOString()}

PATIENT_REGISTRY_ADDRESS=${patientRegistry.address}
NETWORK=${hre.network.name}
`;

    const envFile = path.join(__dirname, "..", ".env.local");
    fs.writeFileSync(envFile, envContent);
    console.log("\n📄 Environment file created:", envFile);

    console.log("\n✨ Deployment completed successfully!");
    console.log("─".repeat(50));
    console.log("Next steps:");
    console.log("1. Run the CLI client: npm run cli");
    console.log("2. Run tests: npm test");
    console.log("3. View contract on explorer (if applicable)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });