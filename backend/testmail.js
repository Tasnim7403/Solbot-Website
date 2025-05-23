const nodemailer = require('nodemailer');

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'solbotwebsite@gmail.com',
        // Replace with your new app password from Google
        pass: 'YOUR_APP_PASSWORD'
    }
});

const mailOptions = {
    to: 'khoiadjatesnim@gmail.com', // The recipient email
    from: 'solbotwebsite@gmail.com',
    subject: 'Test Email',
    text: 'This is a test email from nodemailer',
    html: '<p>This is a test <b>email</b> from nodemailer</p>'
};

// Send the email
transporter.sendMail(mailOptions)
    .then(info => {
        console.log('Email sent successfully!');
        console.log('Response:', info.response);
    })
    .catch(error => {
        console.error('Email error details:', error);
    });