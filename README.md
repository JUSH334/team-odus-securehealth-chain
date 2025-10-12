# SecureHealth Chain - Week 7 Vertical Slice
## Blockchain-Based Patient Registration System

###  Project Overview
SecureHealth Chain is a blockchain-based healthcare platform that provides transparent, secure patient registration and insurance claim processing. This Week 7 milestone demonstrates a complete end-to-end patient registration flow from CLI to blockchain.

### 🎯 Week 7 Deliverables
-  **Minimal CLI Client** - Single command patient registration
-  **Smart Contract** - PatientRegistry with state management
-  **State Changes** - Patient data stored on-chain
-  **Event Emission** - PatientRegistered events
-  **Read-back Verification** - Confirm registration via blockchain query
-  **Test Suite** - 8 tests covering happy path and edge cases

---

##  Quick Start Guide

### Prerequisites
- Node.js (v16+)
- npm (v8+)
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/JUSH334/team-odus-securehealth-chain.git
cd team-odus-securehealth-chain

# Install dependencies
npm install --legacy-peer-deps
```

### Project Structure
```
blockchain/
├── contracts/
│   └── PatientRegistry.sol       # Smart contract
├── scripts/
│   ├── deploy-simple.js          # Deployment script
│   ├── register-patient.js       # Minimal CLI client
│   └── patient-cli.js            # Full CLI (optional)
├── test/
│   └── W7-tests.js               # Test suite
├── docs/
│   └── diagrams/
│       └── W7_architecture.md    # Architecture diagram
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies

```

---

##  How to Run

### Step 1: Start the Blockchain
Open Terminal/PowerShell #1:
```bash
npx hardhat node
```
** Keep this terminal open and running!**

### Step 2: Deploy the Contract
Open Terminal/PowerShell #2:
```bash
# Compile the smart contract
npx hardhat compile

# Deploy to local blockchain
npx hardhat run scripts/deploy-simple.js --network localhost
```

** Copy the deployed contract address** (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

### Step 3: Update Contract Address
Edit `scripts/register-patient.js` line 26:
```javascript
const contractAddress = "YOUR_DEPLOYED_ADDRESS_HERE";
```

### Step 4: Run Patient Registration (Main Demo)
```bash
npx hardhat run scripts/register-patient.js --network localhost
```

**Expected Output:**
```
========================================
   PATIENT REGISTRATION - WEEK 7 DEMO   
========================================

📡 Connecting to blockchain...
✅ Connected as: 0xf39Fd6e51aad88F6F4f54fB484fC3d93F642f64180aa3

📝 Registration Data:
   Member ID: MEM123456
   Patient Name: John Doe

🚀 Submitting registration transaction...
📤 Transaction sent!
   Hash: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7

✅ REGISTRATION SUCCESSFUL!
   Block Number: 2
   Gas Used: 248539
```

### Step 5: Run Tests
```bash
npx hardhat test test/W7-tests.js
```

**Expected Output:**
```
  Week 7 - Patient Registration Vertical Slice
    ✅ HAPPY PATH - Successful Registration
      ✓ Should register a new patient and emit event (95ms)
      ✓ Should store correct patient data on-chain (42ms)
    🔴 EDGE CASES - Error Handling
      ✓ Should prevent duplicate registration (38ms)
      ✓ Should validate required inputs (25ms)

  8 passing (442ms)
```

---

## 📖 Understanding the Components

### Smart Contract: `PatientRegistry.sol`
Core functions:
- `registerPatient(memberID, encryptedData)` - Register new patient
- `getPatient(address)` - Retrieve patient data
- `totalPatients()` - Get total registered patients

Key features:
- Prevents duplicate registrations
- Validates inputs
- Emits events for transparency
- Stores encrypted patient data (HIPAA compliance)

### Minimal Client: `register-patient.js`
- Single-purpose script for patient registration
- Connects to blockchain
- Submits transaction
- Verifies registration via read-back
- Shows transaction details and block number

### Test Suite: `W7-tests.js`
Tests covered:
1. ✅ Successful registration with event
2. ✅ Correct data storage
3. ✅ Duplicate address prevention
4. ✅ Duplicate member ID prevention
5. ✅ Input validation
6. ✅ Patient count tracking
7. ✅ Read-back verification
8. ✅ Complete end-to-end flow

---

### Screenshots:
1. **Patient Registration Output**
<img width="873" height="742" alt="patient-registration " src="https://github.com/user-attachments/assets/daf921a3-9b6d-480b-9c95-6f7a2e165c0e" />

2. **Test Results**
<img width="1133" height="432" alt="test1" src="https://github.com/user-attachments/assets/a64457c3-1ead-493b-9939-967a2f53a837" />
<img width="1106" height="767" alt="test2" src="https://github.com/user-attachments/assets/c3310023-03c1-49fc-98b5-48b6e4217a2f" />
<img width="1086" height="715" alt="test3" src="https://github.com/user-attachments/assets/3c23d3c1-1bea-4376-a5e3-4f424402b08a" />

3. **Blockchain State**
Contract Deployment:
<img width="797" height="135" alt="contract deploy block 1" src="https://github.com/user-attachments/assets/3bfad823-a956-4c7a-af1b-b1fb4f92fecd" />


Patient Registration:
<img width="807" height="150" alt="patient registraction block2" src="https://github.com/user-attachments/assets/70ce63ae-ce01-4b73-9a2c-28b83dda4d7f" />

Verification Calls:
<img width="657" height="245" alt="state verification calls" src="https://github.com/user-attachments/assets/5236e043-1c6c-4e1a-b088-a88f78827e4e" />

### Recording:
https://www.youtube.com/watch?v=aWd5LaiasVU
---

