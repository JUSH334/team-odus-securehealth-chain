#  SecureHealth Chain

A decentralized healthcare payment and medical records management system built on blockchain technology with robust role-based access control.

##  Overview

SecureHealth Chain combines blockchain transparency with healthcare privacy requirements, enabling:
- **Secure Payment Processing** via blockchain transactions
- **Medical Record Management** with HIPAA-aligned access controls
- **Role-Based Authorization** (RBAC) enforced on-chain
- **Audit Trail** for compliance and accountability

##  Features

### Feature 1: Payment Processing
- Process medical bill and prescription payments on-chain
- Track payment history with immutable records
- Real-time transaction confirmation
- Support for DIDLab QBFT network (Hyperledger Besu)

### Feature 2: Medical Records Access Control 
- **Provider-only** medical bill creation
- **Attribute-Based Access Control (ABAC)** for record access
- **Explicit access grants** with granular permissions
- **Multi-role support**: Admin, Provider, Patient, Auditor
- **On-chain audit logs** for all access attempts

##  Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (HTML/JS)                    │
│  - Patient Dashboard  - Login/Registration  - MetaMask  │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Backend (Node.js/Express)                   │
│  - Email Verification  - Session Management  - API      │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│    MongoDB     │    │  Smart Contract │
│  - Patient DB  │    │  - PaymentReg   │
│  - Email Logs  │    │  - RBAC/ABAC    │
└────────────────┘    └─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  DIDLab QBFT Net  │
                    │ (Hyperledger Besu)│
                    └───────────────────┘
```

##  Tech Stack

**Blockchain:**
- Solidity 0.8.19
- Hardhat Development Framework
- Ethers.js v5.7
- DIDLab QBFT Network (Hyperledger Besu)

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- Nodemailer (Email verification)
- dotenv (Environment config)

**Frontend:**
- HTML5/CSS3/JavaScript
- MetaMask Integration
- Responsive Design

##  Installation

### Prerequisites
- Node.js v16+ and npm
- MongoDB v4.4+
- MetaMask browser extension
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/securehealth-chain.git
cd securehealth-chain

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings:
# - MONGODB_URI
# - EMAIL_USER / EMAIL_PASS
# - CONTRACT_ADDRESS
# - RPC_URL

# Start MongoDB
mongod --dbpath ./data/db

# Deploy smart contract (local)
npx hardhat node                    # Terminal 1
npx hardhat run scripts/deploy-payment.js --network localhost  # Terminal 2

# Start backend server
node backend/server.js              # Terminal 3

# Open frontend
open frontend/client/patient-registration.html
```

##  Testing

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/PaymentRegistry.test.js

# Run with coverage
npx hardhat coverage
```

**Test Coverage:**
-  12+ tests covering all authorization paths
-  Unauthorized access failure tests (5+)
-  Role management tests
-  ABAC enforcement tests
-  Payment processing tests

##  Security

### Authorization Model

**Roles (On-Chain Enforcement):**
- `ADMIN_ROLE` - Full system access, role management
- `PROVIDER_ROLE` - Create medical records, grant access
- `PATIENT_ROLE` - Make payments, view authorized records
- `AUDITOR_ROLE` - Read-only access to all records (compliance)

**Access Control Rules:**
- Medical records require PROVIDER_ROLE to create
- Record access requires explicit grant OR admin/auditor role
- Access grants require record ownership OR admin role
- All authorization checks enforced in smart contract modifiers

See [SECURITY_NOTES.md](./SECURITY_NOTES.md) for detailed trust assumptions and security model.

##  Smart Contract Functions

### Role Management
```solidity
grantRole(bytes32 role, address account)      // Admin only
revokeRole(bytes32 role, address account)     // Admin only
hasRole(bytes32 role, address account) → bool
```

### Medical Records (Feature 2)
```solidity
createMedicalRecord(recordId, memberID, dataHash) → bool  // Provider only
grantRecordAccess(recordId, grantTo) → bool              // Owner/Admin only
accessMedicalRecord(recordId) → MedicalRecord            // Authorized only
getMedicalRecord(recordId) → MedicalRecord               // View with authz
```

### Payments (Feature 1)
```solidity
processPayment(paymentId, itemId, itemType, memberID) payable → bool
getPayment(paymentId) → Payment
getUserPayments(user) → string[]
getStats() → (paymentsProcessed, amountProcessed, balance)
```

##  Network Configuration

### DIDLab QBFT Network
- **Chain ID:** 252501 (0x3DAF5)
- **RPC URL:** https://rpc.didlab.io
- **Explorer:** https://explorer.didlab.org/
- **Gas Token:** Trust Token (TT)
- **Consensus:** QBFT (Byzantine Fault Tolerant)
- **Platform:** Hyperledger Besu

### MetaMask Setup
1. Open MetaMask → Networks → Add Network
2. Enter:
   - Network Name: DIDLab QBFT
   - RPC URL: https://rpc.didlab.io
   - Chain ID: 252501
   - Currency Symbol: TT
   - Block Explorer: https://explorer.didlab.org/

## 📖 Usage Flow

### Patient Registration
1. Visit `patient-registration.html`
2. Fill in: Name, Email, Date of Birth
3. Submit → Receive email with Member ID
4. Click verification link in email
5. Account activated

### Patient Login
1. Visit `patient-login.html`
2. Enter Member ID
3. Access dashboard

### Making Payments
1. Navigate to "Medical Bills" or "Prescriptions"
2. Click "Pay via DIDLab Blockchain"
3. Connect MetaMask wallet
4. Confirm transaction
5. Payment recorded on-chain

### Provider Creates Record (Feature 2)
1. Provider account must have PROVIDER_ROLE
2. Call `createMedicalRecord()` with patient info
3. Record stored on-chain with access control
4. Provider can grant access to specific addresses

### Accessing Medical Records
1. Must have explicit access grant OR admin/auditor role
2. Call `accessMedicalRecord(recordId)`
3. Access attempt logged on-chain
4. Unauthorized attempts revert with error

## 📁 Project Structure

```
securehealth-chain/
├── contracts/
│   └── PaymentRegistry.sol          # Main smart contract with RBAC
├── scripts/
│   └── deploy-payment.js            # Deployment script
├── test/
│   └── PaymentRegistry.test.js      # Authorization tests
├── backend/
│   └── server.js                    # Express API server
├── frontend/
│   └── client/
│       ├── patient-registration.html
│       ├── patient-login.html
│       └── patient-dashboard.html
├── hardhat.config.js                # Hardhat configuration
├── package.json                     # Dependencies
├── .env.example                     # Environment template
├── SECURITY_NOTES.md                # Security documentation
├── MILESTONE.md                     # Project progress
└── README.md                        # This file
```

---

**⚠️ Disclaimer**: This is a prototype/educational project. Not audited for production use. Consult legal and security professionals before deploying in a real healthcare environment.
