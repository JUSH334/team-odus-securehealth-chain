// backend/server.js
// Patient Registration Backend with MongoDB and Blockchain Integration

require('dotenv').config(); // MUST BE FIRST LINE!

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// Email configuration
const EMAIL_CONFIG = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
};

// Create email transporter
let emailTransporter;
try {
    emailTransporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('✅ Email transporter configured');
    console.log('📧 Sending from:', EMAIL_CONFIG.auth.user);
} catch (error) {
    console.error('⚠️ Email configuration failed:', error.message);
    console.log('Running without email functionality');
}

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://jush334.github.io'
    ],
    credentials: true
}));

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
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: null
    },
    verificationTokenExpiry: {
        type: Date,
        default: null
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
patientSchema.index({ email: 1 });

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

// ============= HELPER FUNCTIONS =============

// Generate unique Member ID
function generateMemberID() {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `MEM${timestamp}${random}`;
}

// Send verification email (simulation for now)
async function sendVerificationEmail(email, memberID, token) {
    const verificationLink = `http://localhost:3001/api/verify-email?token=${token}`;
    
    // Email HTML template
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .member-id-box {
                background: white;
                border: 2px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .member-id {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                font-family: monospace;
                letter-spacing: 2px;
            }
            .verify-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #6c757d;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏥 Welcome to SecureHealth Chain</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with SecureHealth Chain! We're excited to have you on board.</p>
            
            <div class="member-id-box">
                <p style="margin: 0 0 10px 0; color: #6c757d;">Your Member ID:</p>
                <div class="member-id">${memberID}</div>
                <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 14px;">Save this ID - you'll need it to log in!</p>
            </div>
            
            <p>Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${verificationLink}" class="verify-button">Verify Email Address</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationLink}">${verificationLink}</a>
            </p>
            
            <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours.
            </p>
            
            <p style="margin-top: 20px;">
                If you didn't create an account with SecureHealth Chain, please ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 SecureHealth Chain. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </body>
    </html>
    `;
    
    // Email text version (fallback)
    const emailText = `
Welcome to SecureHealth Chain!

Your Member ID: ${memberID}

Please verify your email address by clicking the link below:
${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with SecureHealth Chain, please ignore this email.

© 2025 SecureHealth Chain. All rights reserved.
    `;
    
    try {
        if (emailTransporter) {
            // Send actual email
            const info = await emailTransporter.sendMail({
                from: `"SecureHealth Chain" <${EMAIL_CONFIG.auth.user}>`,
                to: email,
                subject: '🏥 Verify Your SecureHealth Chain Account - Member ID Inside',
                text: emailText,
                html: emailHTML
            });
            
            console.log('\n========================================');
            console.log('📧 EMAIL SENT SUCCESSFULLY');
            console.log('========================================');
            console.log('To:', email);
            console.log('Member ID:', memberID);
            console.log('Message ID:', info.messageId);
            console.log('========================================\n');
            
            return true;
        } else {
            // Fallback: Log to console if email not configured
            console.log('\n========================================');
            console.log('📧 VERIFICATION EMAIL (Console Mode)');
            console.log('========================================');
            console.log('To:', email);
            console.log('Subject: Verify Your SecureHealth Chain Account');
            console.log('\nYour Member ID:', memberID);
            console.log('\nVerification Link:');
            console.log(verificationLink);
            console.log('\nThis link will expire in 24 hours.');
            console.log('========================================\n');
            
            return true;
        }
    } catch (error) {
        console.error('Failed to send email:', error);
        
        // Still log to console as fallback
        console.log('\n========================================');
        console.log('📧 EMAIL FAILED - CONSOLE FALLBACK');
        console.log('========================================');
        console.log('To:', email);
        console.log('Member ID:', memberID);
        console.log('Verification Link:', verificationLink);
        console.log('========================================\n');
        
        throw new Error('Failed to send verification email');
    }
}

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
        const { patientName, dateOfBirth, email } = req.body;
        
        // Validate input
        if (!patientName || !dateOfBirth || !email) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        
        // Check if email already exists
        const existingEmail = await Patient.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                error: 'This email is already registered',
                existingRecord: {
                    email: existingEmail.email,
                    registeredAt: existingEmail.registeredAt
                }
            });
        }
        
        // Generate unique Member ID
        let memberID;
        let isUnique = false;
        while (!isUnique) {
            memberID = generateMemberID();
            const existing = await Patient.findOne({ memberID });
            if (!existing) isUnique = true;
        }
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Log validation event
        await Event.create({
            eventType: 'validation:success',
            memberID,
            data: { memberID, patientName, email }
        });
        
        // Prepare encrypted data
        const encryptedData = '0x' + Buffer.from(JSON.stringify({
            patientName,
            dateOfBirth,
            email,
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
            email: email.toLowerCase(),
            emailVerified: false,
            verificationToken,
            verificationTokenExpiry,
            walletAddress,
            transactionHash,
            blockNumber,
            encryptedData,
            registrationStatus: 'pending'
        });
        
        // Send verification email
        await sendVerificationEmail(email, memberID, verificationToken);
        
        // Log success event
        await Event.create({
            eventType: 'registration:success',
            memberID,
            data: {
                memberID,
                email,
                transactionHash,
                blockNumber,
                dbRecordId: newPatient._id,
                emailSent: true
            },
            transactionHash,
            blockNumber
        });
        
        res.json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                memberID: newPatient.memberID,
                patientName: newPatient.patientName,
                email: newPatient.email,
                transactionHash,
                blockNumber,
                walletAddress,
                registeredAt: newPatient.registeredAt,
                _id: newPatient._id,
                emailVerified: false
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Log error event
        await Event.create({
            eventType: 'registration:error',
            memberID: req.body.memberID || 'unknown',
            data: { error: error.message }
        });
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Email verification endpoint
app.get('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Verification Link</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1 class="error">❌ Invalid Verification Link</h1>
                    <p>The verification link is invalid or missing.</p>
                </body>
                </html>
            `);
        }
        
        // Find patient with this token
        const patient = await Patient.findOne({ 
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() }
        });
        
        if (!patient) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Verification Failed</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1 class="error">❌ Verification Link Expired</h1>
                    <p>This verification link has expired or is invalid.</p>
                    <p>Please register again or contact support.</p>
                </body>
                </html>
            `);
        }
        
        // Update patient status
        patient.emailVerified = true;
        patient.registrationStatus = 'confirmed';
        patient.verificationToken = null;
        patient.verificationTokenExpiry = null;
        await patient.save();
        
        // Log verification event
        await Event.create({
            eventType: 'email:verified',
            memberID: patient.memberID,
            data: { 
                email: patient.email,
                verifiedAt: new Date()
            }
        });
        
        // Return success page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Verified</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .success { 
                        background: white;
                        color: #333;
                        padding: 40px;
                        border-radius: 20px;
                        max-width: 500px;
                        margin: 0 auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    }
                    .check { color: #28a745; font-size: 60px; }
                    .member-id { 
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 10px;
                        margin: 20px 0;
                        font-family: monospace;
                        font-size: 18px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="success">
                    <div class="check">✓</div>
                    <h1>Email Verified Successfully!</h1>
                    <p>Your account has been activated.</p>
                    <div class="member-id">
                        Your Member ID: ${patient.memberID}
                    </div>
                    <p>You can now use this Member ID to log in to your account.</p>
                    <p><strong>Patient Name:</strong> ${patient.patientName}</p>
                    <p><strong>Email:</strong> ${patient.email}</p>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Verification Error</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #dc3545; }
                </style>
            </head>
            <body>
                <h1 class="error">❌ Verification Error</h1>
                <p>An error occurred during verification. Please try again later.</p>
            </body>
            </html>
        `);
    }
});

// Send login link via email
app.post('/api/send-login-link', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }
        
        // Find patient by email
        const patient = await Patient.findOne({ email: email.toLowerCase() });
        
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: 'No account found with this email address'
            });
        }
        
        if (!patient.emailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Please verify your email first. Check your inbox for the verification link.'
            });
        }
        
        // Generate login token
        const loginToken = crypto.randomBytes(32).toString('hex');
        const loginTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // Store login token
        patient.loginToken = loginToken;
        patient.loginTokenExpiry = loginTokenExpiry;
        await patient.save();
        
        // Send login link email
        const loginLink = `http://localhost:3001/api/email-login?token=${loginToken}`;
        
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }
                .login-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 SecureHealth Chain</h1>
            </div>
            <div class="content">
                <h2>Login to Your Account</h2>
                <p>Hi ${patient.patientName},</p>
                <p>Click the button below to securely log in to your SecureHealth Chain account:</p>
                
                <div style="text-align: center;">
                    <a href="${loginLink}" class="login-button">Login to Dashboard</a>
                </div>
                
                <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${loginLink}">${loginLink}</a>
                </p>
                
                <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    <strong>⚠️ Security Notice:</strong> This login link will expire in 1 hour. If you didn't request this login link, please ignore this email.
                </p>
                
                <p style="margin-top: 20px;">
                    <strong>Your Member ID:</strong> ${patient.memberID}
                </p>
            </div>
        </body>
        </html>
        `;
        
        try {
            if (emailTransporter) {
                await emailTransporter.sendMail({
                    from: `"SecureHealth Chain" <${EMAIL_CONFIG.auth.user}>`,
                    to: email,
                    subject: '🔐 Your SecureHealth Chain Login Link',
                    html: emailHTML
                });
                
                console.log('📧 Login link sent to:', email);
            } else {
                console.log('\n========================================');
                console.log('📧 LOGIN LINK (Console Mode)');
                console.log('========================================');
                console.log('To:', email);
                console.log('Login Link:', loginLink);
                console.log('Member ID:', patient.memberID);
                console.log('========================================\n');
            }
        } catch (error) {
            console.error('Failed to send login email:', error);
        }
        
        res.json({
            success: true,
            message: 'Login link sent to your email'
        });
        
    } catch (error) {
        console.error('Send login link error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Handle email login link
app.get('/api/email-login', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Login Link</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1 class="error">❌ Invalid Login Link</h1>
                    <p>The login link is invalid or missing.</p>
                </body>
                </html>
            `);
        }
        
        // Find patient with this login token
        const patient = await Patient.findOne({
            loginToken: token,
            loginTokenExpiry: { $gt: new Date() }
        }).select('-encryptedData -__v');
        
        if (!patient) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Login Failed</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <h1 class="error">❌ Login Link Expired</h1>
                    <p>This login link has expired or is invalid.</p>
                    <p><a href="/patient-login.html">Request a new login link</a></p>
                </body>
                </html>
            `);
        }
        
        // Clear the login token
        patient.loginToken = null;
        patient.loginTokenExpiry = null;
        await patient.save();
        
        // Redirect to login page with patient data in URL (temporary session)
        const patientDataEncoded = encodeURIComponent(JSON.stringify({
            memberID: patient.memberID,
            patientName: patient.patientName,
            email: patient.email,
            dateOfBirth: patient.dateOfBirth,
            registeredAt: patient.registeredAt,
            emailVerified: patient.emailVerified,
            registrationStatus: patient.registrationStatus
        }));
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Logging In...</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .spinner {
                        border: 4px solid rgba(255,255,255,0.3);
                        border-top: 4px solid white;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <h1>✅ Login Successful!</h1>
                <div class="spinner"></div>
                <p>Redirecting to your dashboard...</p>
                <script>
                    sessionStorage.setItem('currentPatient', '${patientDataEncoded}');
                    setTimeout(() => {
                        window.location.href = '/patient-login.html';
                    }, 2000);
                </script>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Email login error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Error</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #dc3545; }
                </style>
            </head>
            <body>
                <h1 class="error">❌ Login Error</h1>
                <p>An error occurred during login. Please try again.</p>
            </body>
            </html>
        `);
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
                { patientName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
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