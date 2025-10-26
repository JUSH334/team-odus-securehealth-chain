const hre = require("hardhat");

async function main() {
    console.log("\n========================================");
    console.log("   DEPLOYING PAYMENT REGISTRY");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const network = await hre.ethers.provider.getNetwork();
    console.log("Chain ID:", network.chainId);

    console.log("\n📦 Deploying PaymentRegistry contract...");
    const PaymentRegistry = await hre.ethers.getContractFactory("PaymentRegistry");
    
    const paymentRegistry = await PaymentRegistry.deploy({
        gasLimit: 3000000
    });

    const txHash = paymentRegistry.deployTransaction.hash;
    const contractAddress = paymentRegistry.address;
    
    console.log("📝 Transaction hash:", txHash);
    console.log("📍 Contract address:", contractAddress);
    
    console.log("\n⏳ Submitted! Waiting up to 20 seconds for confirmation...");
    
    let confirmed = false;
    
    // Try to wait, but don't block forever
    try {
        await Promise.race([
            paymentRegistry.deployTransaction.wait(1).then(() => { confirmed = true; }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 20000))
        ]);
    } catch (error) {
        if (error.message !== "TIMEOUT") throw error;
    }
    
    if (confirmed) {
        console.log("✅ Transaction confirmed!");
        
        try {
            const stats = await paymentRegistry.getStats();
            console.log("\n📊 Contract verified:");
            console.log("  - Payments Processed:", stats.paymentsProcessed.toString());
            console.log("  - Amount Processed:", stats.amountProcessed.toString());
        } catch (e) {
            console.log("⚠️ Contract deployed but RPC needs time to sync");
        }
    } else {
        console.log("⚠️ Transaction submitted but not yet confirmed");
        console.log("This is normal for DidLab (slow block times)");
    }
    
    console.log("\n========================================");
    console.log("✅ DEPLOYMENT INFO");
    console.log("========================================");
    console.log("Contract Address:", contractAddress);
    console.log("Transaction Hash:", txHash);
    console.log("========================================");
    
    console.log("\n📋 Update your frontend:");
    console.log(`const PAYMENT_CONTRACT_ADDRESS = "${contractAddress}";`);
    
    if (!confirmed) {
        console.log("\n💡 Verify deployment later with:");
        console.log("npx hardhat run scripts/verify-deployment.js --network didlab");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
