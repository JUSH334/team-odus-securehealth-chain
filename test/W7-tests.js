// test/W7-tests.js
// WEEK 7 - Testing the vertical slice

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Week 7 - Patient Registration Vertical Slice", function () {
    let PatientRegistry;
    let registry;
    let patient;
    let otherAccount;
    
    // Deploy fresh contract before each test
    beforeEach(async function () {
        [owner, patient, otherAccount] = await ethers.getSigners();
        PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        registry = await PatientRegistry.deploy();
        await registry.deployed();
    });
    
    describe("✅ HAPPY PATH - Successful Registration", function () {
        
        it("Should register a new patient and emit event", async function () {
            // Arrange
            const memberID = "MEM123456";
            const encryptedData = "0x48656c6c6f20576f726c64"; // "Hello World" in hex
            
            // Act - Register patient
            const tx = await registry.connect(patient).registerPatient(memberID, encryptedData);
            const receipt = await tx.wait();
            
            // Assert - Check transaction succeeded
            expect(receipt.status).to.equal(1);
            
            // Assert - Check event was emitted
            const event = receipt.events.find(e => e.event === 'PatientRegistered');
            expect(event).to.not.be.undefined;
            expect(event.args.patientAddress).to.equal(patient.address);
            expect(event.args.memberID).to.equal(memberID);
            
            // Assert - Verify state change via read-back
            const patientData = await registry.getPatient(patient.address);
            expect(patientData.memberID).to.equal(memberID);
            expect(patientData.isActive).to.be.true;
            
            // Assert - Check total count increased
            const totalPatients = await registry.totalPatients();
            expect(totalPatients).to.equal(1);
            
            console.log("      ✓ Patient registered with Member ID:", memberID);
            console.log("      ✓ Event emitted at block:", receipt.blockNumber);
            console.log("      ✓ State verified via read-back");
        });
        
        it("Should store correct patient data on-chain", async function () {
            // Arrange
            const memberID = "MEM789012";
            const patientInfo = { name: "Jane Doe", age: 30 };
            const encryptedData = "0x" + Buffer.from(JSON.stringify(patientInfo)).toString('hex');
            
            // Act
            await registry.connect(patient).registerPatient(memberID, encryptedData);
            
            // Assert - Read back and verify
            const stored = await registry.getPatient(patient.address);
            expect(stored.memberID).to.equal(memberID);
            expect(stored.isActive).to.be.true;
            expect(stored.registrationTimestamp).to.be.gt(0);
            
            console.log("      ✓ Data correctly stored for Member ID:", memberID);
        });
    });
    
    describe("🔴 EDGE CASES - Error Handling", function () {
        
        it("Should prevent duplicate registration from same address", async function () {
            // Arrange - Register first time
            const memberID1 = "MEM111111";
            await registry.connect(patient).registerPatient(memberID1, "0x1234");
            
            // Act & Assert - Try to register again
            const memberID2 = "MEM222222";
            await expect(
                registry.connect(patient).registerPatient(memberID2, "0x5678")
            ).to.be.revertedWith("Patient already registered");
            
            console.log("      ✓ Prevented duplicate registration");
        });
        
        it("Should prevent registration with existing member ID", async function () {
            // Arrange - Register with member ID
            const memberID = "MEM333333";
            await registry.connect(patient).registerPatient(memberID, "0x1234");
            
            // Act & Assert - Try same member ID from different address
            await expect(
                registry.connect(otherAccount).registerPatient(memberID, "0x5678")
            ).to.be.revertedWith("Member ID already exists");
            
            console.log("      ✓ Prevented duplicate Member ID");
        });
        
        it("Should validate required inputs", async function () {
            // Test empty member ID
            await expect(
                registry.connect(patient).registerPatient("", "0x1234")
            ).to.be.revertedWith("Member ID cannot be empty");
            
            // Test empty data
            await expect(
                registry.connect(patient).registerPatient("MEM444444", "")
            ).to.be.revertedWith("Patient data cannot be empty");
            
            console.log("      ✓ Input validation working");
        });
    });
    
    describe("📊 STATE VERIFICATION - Read-back Proofs", function () {
        
        it("Should correctly track total patient count", async function () {
            // Initial state
            expect(await registry.totalPatients()).to.equal(0);
            
            // Register first patient
            await registry.connect(patient).registerPatient("MEM001", "0xdata1");
            expect(await registry.totalPatients()).to.equal(1);
            
            // Register second patient
            await registry.connect(otherAccount).registerPatient("MEM002", "0xdata2");
            expect(await registry.totalPatients()).to.equal(2);
            
            console.log("      ✓ Patient counter working correctly");
        });
        
        it("Should return correct data for registered patients", async function () {
            // Register patient
            const memberID = "MEM555555";
            const data = "0xencrypteddata";
            const tx = await registry.connect(patient).registerPatient(memberID, data);
            const receipt = await tx.wait();
            
            // Read back
            const stored = await registry.getPatient(patient.address);
            
            // Verify all fields
            expect(stored.memberID).to.equal(memberID);
            expect(stored.isActive).to.be.true;
            expect(stored.assignedProvider).to.equal(ethers.constants.AddressZero);
            expect(stored.registrationTimestamp).to.be.gt(0);
            
            console.log("      ✓ Read-back verification successful");
            console.log("      ✓ Transaction Hash:", tx.hash);
            console.log("      ✓ Block Number:", receipt.blockNumber);
        });
    });
});

// Summary test to demonstrate the complete flow
describe("🎯 COMPLETE END-TO-END FLOW", function () {
    let registry;
    let patient;
    
    before(async function () {
        [owner, patient] = await ethers.getSigners();
        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        registry = await PatientRegistry.deploy();
        await registry.deployed();
    });
    
    it("Demonstrates complete patient registration flow", async function () {
        console.log("\n    === STARTING END-TO-END TEST ===\n");
        
        // 1. Initial State
        const initialCount = await registry.totalPatients();
        console.log("    1️⃣  Initial patient count:", initialCount.toString());
        
        // 2. Prepare Registration
        const memberID = "MEM" + Date.now().toString().slice(-6);
        const data = "0x" + Buffer.from("Patient data").toString('hex');
        console.log("    2️⃣  Registering patient with ID:", memberID);
        
        // 3. Submit Transaction
        const tx = await registry.connect(patient).registerPatient(memberID, data);
        console.log("    3️⃣  Transaction submitted:", tx.hash);
        
        // 4. Wait for Confirmation
        const receipt = await tx.wait();
        console.log("    4️⃣  Confirmed at block:", receipt.blockNumber);
        console.log("       Gas used:", receipt.gasUsed.toString());
        
        // 5. Verify Event
        const event = receipt.events.find(e => e.event === 'PatientRegistered');
        console.log("    5️⃣  Event emitted:", event.event);
        
        // 6. Read-back Verification
        const patientData = await registry.getPatient(patient.address);
        console.log("    6️⃣  Patient verified on-chain");
        console.log("       Member ID:", patientData.memberID);
        console.log("       Active:", patientData.isActive);
        
        // 7. Verify State Change
        const newCount = await registry.totalPatients();
        console.log("    7️⃣  New patient count:", newCount.toString());
        
        console.log("\n    === ✅ END-TO-END TEST COMPLETE ===\n");
        
        // Assertions
        expect(event).to.not.be.undefined;
        expect(patientData.memberID).to.equal(memberID);
        expect(newCount).to.equal(initialCount.add(1));
    });
});