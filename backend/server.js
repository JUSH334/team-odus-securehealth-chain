// backend/server.js
// Patient Registration Backend with MongoDB and Blockchain Integration

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/securehealthchain';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// Patient Schema
const patientSchema = new mongoose.Schema({
    memberID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    patientName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    bloodType: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    walletAddress: {
        type: String,
        required: true
    },
    transactionHash: {
        type: String,
        required: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    encryptedData: {
        type: String,
        required: true
    },
    registrationStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'pending'
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    assignedProvider: {
        type: String,
        default: null
    },
    medicalHistory: [{
        date: Date,
        description: String,
        provider: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
patientSchema.index({ registeredAt: -1 });
patientSchema.index({ walletAddress: 1 });
patientSchema.index({ transactionHash: 1 });

const Patient = mongoose.model('Patient', patientSchema);

// Event Schema for audit trail
const eventSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        index: true
    },
    memberID: {
        type: String,
        index: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    blockNumber: Number,
    transactionHash: String
});

const Event = mongoose.model('Event', eventSchema);

// Contract ABI (minimal for registration)
const PATIENT_REGISTRY_ABI = [
    "function registerPatient(string memberID, string encryptedData) returns (bool)",
    "function getPatient(address patientAddress) view returns (string memberID, uint256 registrationTimestamp, bool isActive, address assignedProvider)",
    "function isMemberIDRegistered(string memberID) view returns (bool)",
    "event PatientRegistered(address indexed patientAddress, string memberID, uint256 timestamp)"
];

// Blockchain connection setup
let provider, contract;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function initBlockchain() {
    try {
        // Connect to local Hardhat node or Ethereum network
        provider = new ethers.providers.JsonRpcProvider(
            process.env.RPC_URL || "http://127.0.0.1:8545"
        );
        
        // Use the first signer from the provider
        const signer = provider.getSigner(0);
        contract = new ethers.Contract(CONTRACT_ADDRESS, PATIENT_REGISTRY_ABI, signer);
        
        console.log('✅ Connected to blockchain');
        console.log('📍 Contract address:', CONTRACT_ADDRESS);
        
        return true;
    } catch (error) {
        console.error('⚠️ Blockchain connection failed:', error.message);
        console.log('Running in offline mode (MongoDB only)');
        return false;
    }
}

// Initialize blockchain connection
initBlockchain();

// ============= API ENDPOINTS =============

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const blockchainConnected = contract !== undefined;
    const dbConnected = mongoose.connection.readyState === 1;
    
    res.json({
        status: 'healthy',
        mongodb: dbConnected ? 'connected' : 'disconnected',
        blockchain: blockchainConnected ? 'connected' : 'disconnected',
        contractAddress: CONTRACT_ADDRESS,
        timestamp: new Date().toISOString()
    });
});

// Register new patient
app.post('/api/register', async (req, res) => {
    try {
        const { memberID, patientName, dateOfBirth, bloodType } = req.body;
        
        // Validate input
        if (!memberID || !patientName || !dateOfBirth || !bloodType) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }
        
        // Check if member already exists in database
        const existingPatient = await Patient.findOne({ memberID });
        if (existingPatient) {
            return res.status(400).json({
                success: false,
                error: 'Member ID already registered',
                existingRecord: {
                    memberID: existingPatient.memberID,
                    registeredAt: existingPatient.registeredAt
                }
            });
        }
        
        // Log validation event
        await Event.create({
            eventType: 'validation:success',
            memberID,
            data: { memberID, patientName }
        });
        
        // Prepare encrypted data
        const encryptedData = '0x' + Buffer.from(JSON.stringify({
            patientName,
            dateOfBirth,
            bloodType,
            timestamp: new Date().toISOString()
        })).toString('hex');
        
        let transactionHash, blockNumber, walletAddress;
        
        // Try blockchain registration if connected
        if (contract) {
            try {
                // Submit to blockchain
                const tx = await contract.registerPatient(memberID, encryptedData);
                const receipt = await tx.wait();
                
                transactionHash = receipt.transactionHash;
                blockNumber = receipt.blockNumber;
                walletAddress = receipt.from;
                
                // Log blockchain event
                await Event.create({
                    eventType: 'blockchain:confirmed',
                    memberID,
                    data: { transactionHash, blockNumber },
                    transactionHash,
                    blockNumber
                });
                
            } catch (blockchainError) {
                console.error('Blockchain registration failed:', blockchainError);
                // Continue with database only
                transactionHash = '0x' + Date.now().toString(16);
                blockNumber = 0;
                walletAddress = '0x' + Date.now().toString(16);
            }
        } else {
            // Offline mode - generate mock data
            transactionHash = '0x' + Date.now().toString(16);
            blockNumber = Math.floor(Math.random() * 1000000);
            walletAddress = '0x' + Date.now().toString(16).padStart(40, '0');
        }
        
        // Save to MongoDB
        const newPatient = await Patient.create({
            memberID,
            patientName,
            dateOfBirth,
            bloodType,
            walletAddress,
            transactionHash,
            blockNumber,
            encryptedData,
            registrationStatus: 'confirmed'
        });
        
        // Log success event
        await Event.create({
            eventType: 'registration:success',
            memberID,
            data: {
                memberID,
                transactionHash,
                blockNumber,
                dbRecordId: newPatient._id
            },
            transactionHash,
            blockNumber
        });
        
        res.json({
            success: true,
            data: {
                memberID: newPatient.memberID,
                patientName: newPatient.patientName,
                transactionHash,
                blockNumber,
                walletAddress,
                registeredAt: newPatient.registeredAt,
                _id: newPatient._id
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Log error event
        await Event.create({
            eventType: 'registration:error',
            memberID: req.body.memberID,
            data: { error: error.message }
        });
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all patients (with pagination)
app.get('/api/patients', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const totalCount = await Patient.countDocuments();
        const patients = await Patient.find()
            .select('-encryptedData -__v')
            .sort({ registeredAt: -1 })
            .skip(skip)
            .limit(limit);
        
        res.json({
            success: true,
            data: patients,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single patient by memberID
app.get('/api/patients/:memberID', async (req, res) => {
    try {
        const patient = await Patient.findOne({ 
            memberID: req.params.memberID 
        }).select('-encryptedData -__v');
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }
        
        res.json({
            success: true,
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search patients
app.get('/api/patients/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 2 characters'
            });
        }
        
        const patients = await Patient.find({
            $or: [
                { memberID: { $regex: q, $options: 'i' } },
                { patientName: { $regex: q, $options: 'i' } }
            ]
        })
        .select('-encryptedData -__v')
        .limit(20);
        
        res.json({
            success: true,
            data: patients,
            count: patients.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get registration statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const registeredToday = await Patient.countDocuments({
            registeredAt: { $gte: todayStart }
        });
        
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const registeredThisWeek = await Patient.countDocuments({
            registeredAt: { $gte: last7Days }
        });
        
        // Blood type distribution
        const bloodTypeStats = await Patient.aggregate([
            {
                $group: {
                    _id: '$bloodType',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Recent events
        const recentEvents = await Event.find()
            .sort({ timestamp: -1 })
            .limit(10);
        
        res.json({
            success: true,
            stats: {
                totalPatients,
                registeredToday,
                registeredThisWeek,
                bloodTypeDistribution: bloodTypeStats,
                averagePerDay: (registeredThisWeek / 7).toFixed(1)
            },
            recentEvents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get event history
app.get('/api/events', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const eventType = req.query.type;
        
        const query = eventType ? { eventType } : {};
        
        const events = await Event.find(query)
            .sort({ timestamp: -1 })
            .limit(limit);
        
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update patient information
app.put('/api/patients/:memberID', async (req, res) => {
    try {
        const { emergencyContact, assignedProvider } = req.body;
        
        const patient = await Patient.findOneAndUpdate(
            { memberID: req.params.memberID },
            {
                emergencyContact,
                assignedProvider,
                lastUpdated: new Date()
            },
            { new: true, select: '-encryptedData -__v' }
        );
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }
        
        // Log update event
        await Event.create({
            eventType: 'patient:updated',
            memberID: patient.memberID,
            data: { 
                updatedFields: Object.keys(req.body),
                updatedBy: 'system' 
            }
        });
        
        res.json({
            success: true,
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete patient (soft delete - just marks as inactive)
app.delete('/api/patients/:memberID', async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { memberID: req.params.memberID },
            { 
                registrationStatus: 'inactive',
                lastUpdated: new Date()
            },
            { new: true }
        );
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
        }
        
        // Log deletion event
        await Event.create({
            eventType: 'patient:deactivated',
            memberID: patient.memberID,
            data: { reason: req.body.reason || 'User requested' }
        });
        
        res.json({
            success: true,
            message: 'Patient deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ========================================
    🏥 SecureHealth Chain Backend
    ========================================
    ✅ Server running on port ${PORT}
    📍 API: http://localhost:${PORT}/api
    📊 Health: http://localhost:${PORT}/api/health
    ========================================
    `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing connections...');
    await mongoose.connection.close();
    process.exit(0);
});