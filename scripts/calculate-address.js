const hre = require("hardhat");

async function calculateAddress() {
    const deployerAddress = "0xFB3C61Dcc2dF6800C62E7ba2bcA5e9dd7d42f2F7";
    
    console.log("\n========================================");
    console.log("   CALCULATING CONTRACT ADDRESS");
    console.log("========================================\n");
    
    // Get current nonce
    const currentNonce = await hre.ethers.provider.getTransactionCount(deployerAddress);
    console.log("Deployer:", deployerAddress);
    console.log("Current nonce:", currentNonce);
    
    // The deployment transaction used nonce - 1
    const deploymentNonce = currentNonce - 1;
    console.log("Deployment nonce:", deploymentNonce);
    
    // Calculate contract address
    const contractAddress = hre.ethers.utils.getContractAddress({
        from: deployerAddress,
        nonce: deploymentNonce
    });
    
    console.log("\n✅ CONTRACT ADDRESS CALCULATED!");
    console.log("========================================");
    console.log("Contract Address:", contractAddress);
    console.log("========================================");
    
    console.log("\n📋 IMPORTANT: Update your frontend!");
    console.log("In patient-dashboard.html, find this line:");
    console.log('const PAYMENT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";');
    console.log("\nReplace it with:");
    console.log(`const PAYMENT_CONTRACT_ADDRESS = "${contractAddress}";`);
    
    console.log("\n💡 Once the transaction confirms (may take several minutes),");
    console.log("run verify-deployment.js again to verify the contract works.\n");
    
    // Try to check if contract exists
    console.log("🔍 Checking if contract is deployed yet...");
    const code = await hre.ethers.provider.getCode(contractAddress);
    
    if (code !== "0x") {
        console.log("✅ Contract code detected! Deployment confirmed!");
        
        // Try to interact
        const PaymentRegistry = await hre.ethers.getContractFactory("PaymentRegistry");
        const contract = PaymentRegistry.attach(contractAddress);
        
        try {
            const stats = await contract.getStats();
            console.log("\n✅ Contract is working!");
            console.log("Initial stats:");
            console.log("  - Payments Processed:", stats.paymentsProcessed.toString());
            console.log("  - Amount Processed:", stats.amountProcessed.toString());
            console.log("  - Contract Balance:", stats.contractBalance.toString());
        } catch (e) {
            console.log("⚠️ Contract exists but RPC may need time to sync");
        }
    } else {
        console.log("⏳ No contract code yet - transaction still mining");
        console.log("Use the address above in your frontend. It will work once mined!");
    }
    
    console.log("\n========================================");
}

calculateAddress()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });