# SecureHealth Chain - Blockchain Patient Registry System and Database Setup (Feature 1)

A decentralized healthcare patient registration system built on Ethereum blockchain, featuring MongoDB backend integration and comprehensive medication billing capabilities.

##  Project Overview

SecureHealth Chain is a blockchain-based patient registration and management system that leverages smart contracts for secure, immutable patient records while maintaining HIPAA compliance through encrypted data storage.

### Key Features

- **Blockchain Patient Registration**: Immutable patient records on Ethereum
- **MongoDB Backend**: Scalable database for off-chain data storage
- **Medical Billing System**: Smart contract-based medication billing and payments
- **Dual Authentication**: Wallet-based and Member ID login
- **Event-Driven Architecture**: Complete audit trail of all transactions
- **HIPAA Compliant**: Encrypted patient data with secure access controls

##  Project Structure

```
team-odus-securehealth-chain/
├── contracts/
│   ├── PatientRegistry.sol          # Core patient registration contract
│   └── MedicationBillingLite.sol    # Medication billing contract
├── backend/
│   ├── server.js                    # Express backend with MongoDB
│   └── package.json                 # Backend dependencies
├── frontend/
│   └── client/
│       ├── patient-registration.html   # Patient registration UI
│       ├── patient-login.html          # Patient portal login
│       └── patient-dashboard-billing.html  # Billing dashboard
├── scripts/
│   ├── deploy.js                    # Deployment script
│   └── register-patient.js          # Patient registration script
├── test/
│   ├── PatientRegistry.test.js      # Smart contract tests
│   └── W7-tests.js                  # Vertical slice tests
└── deployments/
    ├── localhost-deployment.json    # Local deployment info
    └── didlab-deployment.json       # Testnet deployment info
```

##  Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v5 or higher)
- MetaMask browser extension
- Hardhat

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/team-odus-securehealth-chain.git
cd team-odus-securehealth-chain
```

2. **Install dependencies**
```bash
npm install
cd backend && npm install
```

3. **Start MongoDB**
```bash
# macOS/Linux
mongod --dbpath ./data/db

# Windows
mongod --dbpath .\data\db
```

4. **Start local blockchain**
```bash
npx hardhat node
```

5. **Deploy smart contracts** (in a new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

6. **Start backend server** (in a new terminal)
```bash
cd backend
npm start
```

7. **Access the application**
Open `frontend/client/patient-registration.html` in your browser

##  Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Blockchain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# MongoDB
MONGODB_URI=mongodb://localhost:27017/securehealthchain

# Backend
PORT=3001
```

### Smart Contract Addresses

- **Local Network**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Didlab Testnet**: `0x959c23cd86c5dBB7aE5706AD2c6F875a97697F86`

##  Smart Contracts

### PatientRegistry.sol

Core contract for patient registration and management.

**Key Functions:**
- `registerPatient(string memberID, string encryptedData)`: Register new patient
- `getPatient(address patientAddress)`: Retrieve patient data
- `updatePatientData(string encryptedData)`: Update patient information
- `assignProvider(address patient, address provider)`: Assign healthcare provider

**Events:**
- `PatientRegistered(address indexed patientAddress, string memberID, uint256 timestamp)`
- `PatientUpdated(address indexed patientAddress, string memberID, uint256 timestamp)`
- `ProviderAssigned(address indexed patientAddress, address indexed providerAddress, uint256 timestamp)`

### MedicationBillingLite.sol

Handles medication billing and payments.

**Key Functions:**
- `createBill(address patient, uint256 amount, uint256 dueDate, string metadata)`: Create new bill
- `payBill(uint256 billId)`: Pay existing bill
- `getPatientBills(address patient)`: Retrieve patient's bills

##  API Endpoints

### Backend REST API

**Base URL**: `http://localhost:3001/api`

#### Patient Registration
```http
POST /register
Content-Type: application/json

{
  "memberID": "MEM123456",
  "patientName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "bloodType": "O+"
}
```

#### Get Patient
```http
GET /patients/:memberID
```

#### List Patients (with pagination)
```http
GET /patients?page=1&limit=10
```

#### Search Patients
```http
GET /patients/search?q=john
```

#### Statistics
```http
GET /stats
```

#### Health Check
```http
GET /health
```

##  Testing

### Run Smart Contract Tests
```bash
npx hardhat test
```

### Run Specific Test Suite
```bash
npx hardhat test test/PatientRegistry.test.js
```

### Test Coverage
```bash
npx hardhat coverage
```

### Sample Test Output
```
PatientRegistry - Week 7 Vertical Slice
  ✓ Should successfully register a new patient
  ✓ Should emit PatientRegistered event
  ✓ Should prevent duplicate registration
  ✓ Should validate required fields
```

##  Frontend Features

### Patient Registration
- Real-time blockchain connection status
- Input validation with error messages
- Event stream monitoring
- Automated testing suite
- Statistics dashboard

### Patient Login
- Dual authentication methods:
  - MetaMask wallet login
  - Member ID + Date of Birth
- Session management
- Secure credential verification

### Billing Dashboard
- View all medical bills
- Filter by payment status
- Pay bills via MetaMask
- Transaction history
- Payment verification

##  Database Schema

### Patient Collection
```javascript
{
  memberID: String (unique, indexed),
  patientName: String,
  dateOfBirth: Date,
  bloodType: String,
  walletAddress: String,
  transactionHash: String,
  blockNumber: Number,
  encryptedData: String,
  registrationStatus: String,
  registeredAt: Date,
  medicalHistory: Array,
  emergencyContact: Object
}
```

### Event Collection
```javascript
{
  eventType: String (indexed),
  memberID: String (indexed),
  data: Mixed,
  timestamp: Date (indexed),
  blockNumber: Number,
  transactionHash: String
}
```

##  Security Considerations

- **Data Encryption**: All sensitive patient data is encrypted before storage
- **Access Control**: Role-based access with custodian and provider authorization
- **Input Validation**: Comprehensive validation on both frontend and smart contract
- **HIPAA Compliance**: Encrypted data handling with audit trails
- **Secure Sessions**: Session management with timeout and validation

## 🛠 Development

### Deploy to Testnet (Didlab)
```bash
npx hardhat run scripts/deploy.js --network didlab
```

### Register a Patient via Script
```bash
npx hardhat run scripts/register-patient.js --network localhost
```

### Start Backend in Development Mode
```bash
cd backend
npm run dev
```

## 📈 Performance

- **Transaction Confirmation**: ~5-15 seconds on localhost
- **Gas Optimization**: Optimized for low gas usage
- **MongoDB Queries**: Indexed for fast lookups
- **Pagination**: Efficient pagination for large datasets
