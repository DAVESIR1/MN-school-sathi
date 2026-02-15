
import nodemailer from 'nodemailer';

async function testEmail() {
    const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
        auth: {
            user: 'help@edunorm.in',
            pass: 'Nitin@220'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Testing SMTP Connection...');
        await transporter.verify();
        console.log('SMTP Connection Successful!');

        console.log('Sending Test Email...');
        const info = await transporter.sendMail({
            from: '"EduNorm Test" <help@edunorm.in>',
            to: 'help@edunorm.in', // Send to self to test
            subject: 'Test Email from Debugger',
            text: 'If you see this, SMTP is working.'
        });
        console.log('Email Sent!', info.messageId);
    } catch (error) {
        console.error('SMTP Failed:', error);
    }
}

testEmail();
