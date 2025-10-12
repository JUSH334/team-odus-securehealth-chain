const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PatientRegistry - Week 7 Vertical Slice", function () {
    let PatientRegistry;
    let patientRegistry;
    let custodian;
    let patient1;
    let patient2;
    let provider;
    
    beforeEach(async function () {
        // Get signers
        [custodian, patient1, patient2, provider] = await ethers.getSigners();
        
        // Deploy contract
        PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        patientRegistry = await PatientRegistry.deploy();
        await patientRegistry.deployed();
    });
    
    describe("Patient Registration - Core Vertical Slice", function () {
        
        it("Should successfully register a new patient and emit event", async function () {
            const memberID = "MEM123456";
            const encryptedData = "0x1234567890abcdef"; // Simulated encrypted data
            
            // Connect as patient1
            const patientContract = patientRegistry.connect(patient1);
            
            // Test registration transaction
            await expect(patientContract.registerPatient(memberID, encryptedData))
                .to.emit(patientRegistry, "PatientRegistered")
                .withArgs(patient1.address, memberID, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
            
            // Verify state change - read back patient data
            const patientInfo = await patientRegistry.getPatient(patient1.address);
            expect(patientInfo.memberID).to.equal(memberID);
            expect(patientInfo.isActive).to.be.true;
            expect(patientInfo.assignedProvider).to.equal(ethers.constants.AddressZero);
            
            // Verify member ID mapping
            const mappedAddress = await patientRegistry.memberIDToAddress(memberID);
            expect(mappedAddress).to.equal(patient1.address);
            
            // Verify patient count increased
            const totalPatients = await patientRegistry.totalPatients();
            expect(totalPatients).to.equal(1);
        });
        
        it("Should prevent duplicate registration with same address", async function () {
            const memberID = "MEM123456";
            const encryptedData = "0x1234567890abcdef";
            
            // First registration should succeed
            const patientContract = patientRegistry.connect(patient1);
            await patientContract.registerPatient(memberID, encryptedData);
            
            // Second registration with same address should fail
            await expect(
                patientContract.registerPatient("MEM789012", encryptedData)
            ).to.be.revertedWith("Patient already registered");
        });
        
        it("Should prevent duplicate member ID registration", async function () {
            const memberID = "MEM123456";
            const encryptedData = "0x1234567890abcdef";
            
            // First registration should succeed
            await patientRegistry.connect(patient1).registerPatient(memberID, encryptedData);
            
            // Second registration with same member ID but different address should fail
            await expect(
                patientRegistry.connect(patient2).registerPatient(memberID, encryptedData)
            ).to.be.revertedWith("Member ID already exists");
        });
        
        it("Should validate required fields during registration", async function () {
            const encryptedData = "0x1234567890abcdef";
            
            // Test empty member ID
            await expect(
                patientRegistry.connect(patient1).registerPatient("", encryptedData)
            ).to.be.revertedWith("Member ID cannot be empty");
            
            // Test empty encrypted data
            await expect(
                patientRegistry.connect(patient1).registerPatient("MEM123456", "")
            ).to.be.revertedWith("Patient data cannot be empty");
        });
    });
    
    describe("Patient Data Management", function () {
        
        beforeEach(async function () {
            // Register a patient for testing
            await patientRegistry.connect(patient1).registerPatient("MEM123456", "0x1234567890abcdef");
        });
        
        it("Should update patient data and emit event", async function () {
            const newEncryptedData = "0xfedcba0987654321";
            
            await expect(
                patientRegistry.connect(patient1).updatePatientData(newEncryptedData)
            )
                .to.emit(patientRegistry, "PatientUpdated")
                .withArgs(patient1.address, "MEM123456", await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
        });
        
        it("Should prevent non-registered patient from updating data", async function () {
            await expect(
                patientRegistry.connect(patient2).updatePatientData("0xdata")
            ).to.be.revertedWith("Patient not registered");
        });
    });
    
    describe("Provider Assignment", function () {
        
        beforeEach(async function () {
            // Register a patient and authorize a provider
            await patientRegistry.connect(patient1).registerPatient("MEM123456", "0x1234567890abcdef");
            await patientRegistry.authorizeProvider(provider.address);
        });
        
        it("Should allow custodian to assign provider to patient", async function () {
            await expect(
                patientRegistry.assignProvider(patient1.address, provider.address)
            )
                .to.emit(patientRegistry, "ProviderAssigned")
                .withArgs(patient1.address, provider.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
            
            // Verify provider assignment
            const patientInfo = await patientRegistry.getPatient(patient1.address);
            expect(patientInfo.assignedProvider).to.equal(provider.address);
        });
        
        it("Should prevent non-custodian from assigning provider", async function () {
            await expect(
                patientRegistry.connect(patient1).assignProvider(patient1.address, provider.address)
            ).to.be.revertedWith("Only custodian can perform this action");
        });
        
        it("Should prevent assigning non-authorized provider", async function () {
            const unauthorizedProvider = patient2.address;
            
            await expect(
                patientRegistry.assignProvider(patient1.address, unauthorizedProvider)
            ).to.be.revertedWith("Not an authorized provider");
        });
    });
    
    describe("Query Functions", function () {
        
        it("Should correctly check if member ID is registered", async function () {
            const memberID = "MEM123456";
            
            // Before registration
            expect(await patientRegistry.isMemberIDRegistered(memberID)).to.be.false;
            
            // Register patient
            await patientRegistry.connect(patient1).registerPatient(memberID, "0x1234567890abcdef");
            
            // After registration
            expect(await patientRegistry.isMemberIDRegistered(memberID)).to.be.true;
        });
        
        it("Should return correct total patient count", async function () {
            expect(await patientRegistry.totalPatients()).to.equal(0);
            
            // Register first patient
            await patientRegistry.connect(patient1).registerPatient("MEM123456", "0xdata1");
            expect(await patientRegistry.totalPatients()).to.equal(1);
            
            // Register second patient
            await patientRegistry.connect(patient2).registerPatient("MEM789012", "0xdata2");
            expect(await patientRegistry.totalPatients()).to.equal(2);
        });
    });
    
    describe("Edge Cases", function () {
        
        it("Should handle maximum gas limit scenarios", async function () {
            // Create a very long encrypted data string (simulating large medical records)
            const largeData = "0x" + "a".repeat(10000);
            
            // Should still process within gas limits
            await expect(
                patientRegistry.connect(patient1).registerPatient("MEM_LARGE", largeData)
            ).to.emit(patientRegistry, "PatientRegistered");
        });
        
        it("Should handle concurrent registration attempts", async function () {
            const memberID1 = "MEM111111";
            const memberID2 = "MEM222222";
            
            // Simulate concurrent registrations
            const tx1 = patientRegistry.connect(patient1).registerPatient(memberID1, "0xdata1");
            const tx2 = patientRegistry.connect(patient2).registerPatient(memberID2, "0xdata2");
            
            // Both should succeed as they're different patients with different member IDs
            await expect(tx1).to.emit(patientRegistry, "PatientRegistered");
            await expect(tx2).to.emit(patientRegistry, "PatientRegistered");
            
            // Verify both are registered
            expect(await patientRegistry.totalPatients()).to.equal(2);
        });
    });
});