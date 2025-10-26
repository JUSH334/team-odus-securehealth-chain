const hre = require("hardhat");

async function verify() {
    const txHash = "0x55fcb757746283ad184eca5b285001128bd9f115a0f61698f212e4ab55971bab";
    
    console.log("\n🔍 Checking transaction status...");
    console.log("Transaction Hash:", txHash);
    
    try {
        // Try to get the transaction receipt
        const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
        
        if (receipt) {
            console.log("\n✅ Transaction was mined!");
            console.log("Block Number:", receipt.blockNumber);
            console.log("Gas Used:", receipt.gasUsed.toString());
            console.log("Status:", receipt.status === 1 ? "Success ✅" : "Failed ❌");
            
            if (receipt.contractAddress) {
                console.log("\n🎉 CONTRACT DEPLOYED!");
                console.log("========================================");
                console.log("Contract Address:", receipt.contractAddress);
                console.log("========================================");
                
                console.log("\n📋 Update your frontend with:");
                console.log(`const PAYMENT_CONTRACT_ADDRESS = "${receipt.contractAddress}";`);
                
                // Try to interact with the contract
                const PaymentRegistry = await hre.ethers.getContractFactory("PaymentRegistry");
                const contract = PaymentRegistry.attach(receipt.contractAddress);
                
                try {
                    const stats = await contract.getStats();
                    console.log("\n✅ Contract verified and working!");
                    console.log("Initial stats:");
                    console.log("  - Payments Processed:", stats.paymentsProcessed.toString());
                    console.log("  - Amount Processed:", stats.amountProcessed.toString());
                    console.log("  - Contract Balance:", stats.contractBalance.toString());
                } catch (e) {
                    console.log("\n⚠️ Contract deployed but may need time to sync with RPC");
                }
            }
        } else {
            console.log("\n⏳ Transaction is still pending or not yet visible to RPC");
            console.log("This is normal for DidLab. Wait a minute and run this script again.");
        }
    } catch (error) {
        console.error("\n❌ Error checking transaction:");
        console.error(error.message);
    }
}

verify()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });