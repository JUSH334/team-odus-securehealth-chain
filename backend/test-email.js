// test-email.js - Place this in your backend folder
// Run with: node test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n========================================');
console.log('📧 EMAIL CONFIGURATION TEST');
console.log('========================================\n');

// Check environment variables
console.log('1. Checking Environment Variables...');
console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || '❌ NOT SET');
console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET (hidden)' : '❌ NOT SET');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ ERROR: Email credentials not found in .env file');
    console.log('\nPlease create a .env file in the backend folder with:');
    console.log('EMAIL_SERVICE=gmail');
    console.log('EMAIL_HOST=smtp.gmail.com');
    console.log('EMAIL_PORT=587');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASS=your-app-password');
    process.exit(1);
}

console.log('\n2. Creating Email Transporter...');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

console.log('   ✅ Transporter created');

console.log('\n3. Testing SMTP Connection...');

transporter.verify(function(error, success) {
    if (error) {
        console.log('   ❌ Connection Failed!');
        console.log('   Error:', error.message);
        
        if (error.message.includes('Invalid login')) {
            console.log('\n💡 FIX: Your Gmail credentials are incorrect.');
            console.log('   - Make sure 2FA is enabled on your Google account');
            console.log('   - Use an App Password, not your regular password');
            console.log('   - Get App Password: https://myaccount.google.com/apppasswords');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 FIX: Cannot connect to SMTP server.');
            console.log('   - Check your internet connection');
            console.log('   - Verify EMAIL_HOST and EMAIL_PORT are correct');
        }
    } else {
        console.log('   ✅ SMTP Connection Successful!');
        
        console.log('\n4. Sending Test Email...');
        
        const mailOptions = {
            from: `"SecureHealth Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: '✅ SecureHealth Email Test - Success!',
            text: 'If you receive this email, your email configuration is working correctly!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #28a745;">✅ Email Configuration Successful!</h1>
                        <p>Your SecureHealth Chain email system is working correctly.</p>
                        <p><strong>Configuration Details:</strong></p>
                        <ul>
                            <li>Service: ${process.env.EMAIL_SERVICE}</li>
                            <li>Host: ${process.env.EMAIL_HOST}</li>
                            <li>Port: ${process.env.EMAIL_PORT}</li>
                            <li>User: ${process.env.EMAIL_USER}</li>
                        </ul>
                        <p style="margin-top: 20px; padding: 15px; background: #d4edda; border-left: 4px solid #28a745; border-radius: 4px;">
                            You can now use the patient registration system!
                        </p>
                    </div>
                </div>
            `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('   ❌ Failed to send test email');
                console.log('   Error:', error.message);
            } else {
                console.log('   ✅ Test Email Sent Successfully!');
                console.log('   Message ID:', info.messageId);
                console.log('\n========================================');
                console.log('✅ ALL TESTS PASSED!');
                console.log('========================================');
                console.log(`Check your inbox at ${process.env.EMAIL_USER}`);
                console.log('(Also check spam folder)');
                console.log('========================================\n');
            }
        });
    }
});