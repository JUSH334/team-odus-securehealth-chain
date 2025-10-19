// scripts/deploy-didlab.js
// Deployment script specifically configured for didlab network with manual gas settings

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting SecureHealth Chain deployment on Didlab...\n");
    
    try {
        // Get deployer
        const [deployer] = await hre.ethers.getSigners();
        console.log("👤 Deploying with account:", deployer.address);
        
        // Check balance
        const balance = await deployer.getBalance();
        console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");
        
        // Get current block number
        const blockNumber = await deployer.provider.getBlockNumber();
        console.log("📦 Current block:", blockNumber);
        
        // Get the contract factory
        const PatientRegistry = await hre.ethers.getContractFactory("PatientRegistry");
        
        // IMPORTANT: Set manual gas price since network reports 0 gwei
        const manualGasPrice = hre.ethers.utils.parseUnits("1", "gwei"); // Start with 1 gwei
        console.log("⛽ Using manual gas price:", hre.ethers.utils.formatUnits(manualGasPrice, "gwei"), "gwei");
        
        // Deploy with explicit gas settings
        console.log("\n📤 Sending deployment transaction...");
        const patientRegistry = await PatientRegistry.deploy({
            gasLimit: 2000000, // 2M gas limit
            gasPrice: manualGasPrice, // Force 1 gwei
            nonce: await deployer.getTransactionCount(), // Explicit nonce
        });
        
        console.log("📋 Transaction hash:", patientRegistry.deployTransaction.hash);
        console.log("⏳ Waiting for confirmation (this may take a while on didlab)...");
        console.log("   Block at submission:", blockNumber);
        
        // Wait for deployment with periodic status checks
        let confirmed = false;
        let attempts = 0;
        const maxAttempts = 60; // Wait up to 5 minutes
        
        while (!confirmed && attempts < maxAttempts) {
            try {
                // Check transaction receipt
                const receipt = await deployer.provider.getTransactionReceipt(patientRegistry.deployTransaction.hash);
                
                if (receipt) {
                    if (receipt.status === 1) {
                        console.log("\n✅ Transaction confirmed!");
                        console.log("📍 Contract deployed to:", receipt.contractAddress);
                        console.log("🔢 Block number:", receipt.blockNumber);
                        console.log("⛽ Gas used:", receipt.gasUsed.toString());
                        confirmed = true;
                    } else {
                        console.log("\n❌ Transaction failed!");
                        process.exit(1);
                    }
                } else {
                    // No receipt yet, check current block
                    const currentBlock = await deployer.provider.getBlockNumber();
                    if (attempts % 6 === 0) { // Log every 30 seconds
                        console.log(`   Still waiting... Current block: ${currentBlock} (+${currentBlock - blockNumber})`);
                    }
                }
            } catch (err) {
                // Ignore errors during polling
            }
            
            // Wait 5 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }
        
        if (!confirmed) {
            console.log("\n⚠️ Transaction not confirmed after 5 minutes");
            console.log("Transaction hash:", patientRegistry.deployTransaction.hash);
            console.log("Check the transaction on block explorer or try again with higher gas price");
            
            // Try alternative confirmation method
            console.log("\n🔄 Attempting alternative confirmation method...");
            try {
                await patientRegistry.deployed();
                console.log("✅ Contract confirmed via alternative method!");
                console.log("📍 Contract address:", patientRegistry.address);
            } catch (altError) {
                console.log("❌ Alternative confirmation also failed");
                console.log("The transaction might still be pending. Save this hash:", patientRegistry.deployTransaction.hash);
            }
        }
        
        // Save deployment info even if not fully confirmed
        const deploymentInfo = {
            network: hre.network.name,
            contractName: "PatientRegistry",
            address: patientRegistry.address || "pending",
            deployer: deployer.address,
            deploymentTime: new Date().toISOString(),
            transactionHash: patientRegistry.deployTransaction.hash,
            gasPrice: manualGasPrice.toString(),
            status: confirmed ? "confirmed" : "pending"
        };
        
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }
        
        const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n💾 Deployment info saved to:", deploymentFile);
        
        console.log("\n========================================");
        if (confirmed) {
            console.log("DEPLOYMENT SUCCESSFUL!");
            console.log("Contract Address:", patientRegistry.address);
        } else {
            console.log("DEPLOYMENT PENDING");
            console.log("Transaction Hash:", patientRegistry.deployTransaction.hash);
            console.log("Check status on block explorer");
        }
        console.log("========================================\n");
        
    } catch (error) {
        console.error("\n❌ Deployment error:", error.message);
        
        // Specific error handling for common issues
        if (error.message.includes("nonce")) {
            console.log("\n💡 Nonce issue detected. Try:");
            console.log("1. Wait for any pending transactions to complete");
            console.log("2. Check for stuck transactions on the network");
        } else if (error.message.includes("insufficient")) {
            console.log("\n💡 Insufficient funds. Current balance might be too low after gas costs");
        } else if (error.message.includes("timeout")) {
            console.log("\n💡 Network timeout. The didlab network might be slow. Try:");
            console.log("1. Increasing the gas price (edit the script)");
            console.log("2. Checking if the network is operational");
        }
        
        process.exit(1);
    }
}

// Alternative deployment function with higher gas price
async function deployWithHigherGas() {
    console.log("\n🔄 Trying deployment with higher gas price...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    const PatientRegistry = await hre.ethers.getContractFactory("PatientRegistry");
    
    // Try progressively higher gas prices
    const gasPrices = ["5", "10", "20", "50", "100"]; // in gwei
    
    for (const gasPrice of gasPrices) {
        console.log(`\n🔄 Attempting with ${gasPrice} gwei...`);
        
        try {
            const patientRegistry = await PatientRegistry.deploy({
                gasLimit: 3000000,
                gasPrice: hre.ethers.utils.parseUnits(gasPrice, "gwei")
            });
            
            console.log("📤 Transaction sent:", patientRegistry.deployTransaction.hash);
            
            // Wait up to 1 minute for this attempt
            const receipt = await Promise.race([
                patientRegistry.deployed(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout")), 60000)
                )
            ]);
            
            console.log("✅ Success with", gasPrice, "gwei!");
            console.log("📍 Contract:", patientRegistry.address);
            return patientRegistry;
            
        } catch (error) {
            console.log(`❌ Failed with ${gasPrice} gwei:`, error.message);
        }
    }
    
    throw new Error("All gas price attempts failed");
}

// Run main deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        
        // If main fails, try with higher gas
        console.log("\n🔄 Main deployment failed. Trying alternative approach...");
        
        deployWithHigherGas()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    });