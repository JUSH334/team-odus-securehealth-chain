// scripts/register-patient.js

const { ethers } = require("hardhat");

// Contract ABI - only what we need for registration
const PATIENT_REGISTRY_ABI = [
    "function registerPatient(string memberID, string encryptedData) returns (bool)",
    "function getPatient(address patientAddress) view returns (string memberID, uint256 registrationTimestamp, bool isActive, address assignedProvider)",
    "function totalPatients() view returns (uint256)",
    "event PatientRegistered(address indexed patientAddress, string memberID, uint256 timestamp)"
];

async function main() {
    console.log("\n========================================");
    console.log("   PATIENT REGISTRATION                   ");
    console.log("========================================\n");

    try {
        // 1. SETUP - Get signer and contract
        console.log("📡 Connecting to blockchain...");
        const [signer] = await ethers.getSigners();
        console.log("✅ Connected as:", signer.address);

        // Use the deployed contract address (update if different)
        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const contract = new ethers.Contract(contractAddress, PATIENT_REGISTRY_ABI, signer);

        // 2. PREPARE TEST DATA
        const memberID = "MEM" + Date.now().toString().slice(-6); // Unique ID
        const testData = {
            name: "John Doe",
            dob: "1990-01-01",
            timestamp: new Date().toISOString()
        };
        
        // Simple encryption (just convert to hex for demo)
        const encryptedData = "0x" + Buffer.from(JSON.stringify(testData)).toString('hex');
        
        console.log("\n📝 Registration Data:");
        console.log("   Member ID:", memberID);
        console.log("   Patient Name:", testData.name);
        console.log("   DOB:", testData.dob);

        // 3. GET INITIAL STATE (for comparison)
        const initialCount = await contract.totalPatients();
        console.log("\n📊 Current total patients:", initialCount.toString());

        // 4. SUBMIT REGISTRATION TRANSACTION
        console.log("\n🚀 Submitting registration transaction...");
        const tx = await contract.registerPatient(memberID, encryptedData);
        console.log("📤 Transaction sent!");
        console.log("   Hash:", tx.hash);
        
        // 5. WAIT FOR CONFIRMATION
        console.log("\n⏳ Waiting for blockchain confirmation...");
        const receipt = await tx.wait();
        
        console.log("✅ Transaction confirmed!");
        console.log("   Block Number:", receipt.blockNumber);
        console.log("   Gas Used:", receipt.gasUsed.toString());

        // 6. EXTRACT AND DISPLAY EVENT
        const event = receipt.events?.find(e => e.event === 'PatientRegistered');
        if (event) {
            console.log("\n📢 Event Emitted: PatientRegistered");
            console.log("   Patient Address:", event.args.patientAddress);
            console.log("   Member ID:", event.args.memberID);
            console.log("   Timestamp:", new Date(event.args.timestamp * 1000).toLocaleString());
        }

        // 7. VERIFY STATE CHANGE - Read back from blockchain
        console.log("\n🔍 Verifying registration (read-back proof)...");
        const patientData = await contract.getPatient(signer.address);
        console.log("✅ Patient found on blockchain!");
        console.log("   Stored Member ID:", patientData.memberID);
        console.log("   Is Active:", patientData.isActive);
        console.log("   Registration Time:", new Date(patientData.registrationTimestamp * 1000).toLocaleString());

        // 8. VERIFY COUNT INCREASED
        const newCount = await contract.totalPatients();
        console.log("\n📊 New total patients:", newCount.toString());
        console.log("   Patients added:", (newCount - initialCount).toString());

        // 9. SUCCESS SUMMARY
        console.log("\n========================================");
        console.log("   ✅ REGISTRATION SUCCESSFUL!");
        console.log("========================================");
        console.log("   Transaction Hash:", tx.hash);
        console.log("   Block Number:", receipt.blockNumber);
        console.log("   Member ID:", memberID);
        console.log("   Patient Address:", signer.address);
        console.log("========================================\n");

        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            memberID: memberID
        };

    } catch (error) {
        console.error("\n❌ Registration failed!");
        console.error("Error:", error.message);
        
        // Common error hints
        if (error.message.includes("already registered")) {
            console.log("\n💡 Hint: This address is already registered. Use a different account.");
        } else if (error.message.includes("cannot estimate gas")) {
            console.log("\n💡 Hint: Check that the contract is deployed at the correct address.");
        } else if (error.message.includes("ECONNREFUSED")) {
            console.log("\n💡 Hint: Make sure Hardhat node is running (npx hardhat node)");
        }
        
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;