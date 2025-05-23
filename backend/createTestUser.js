const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/solbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestUser() {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: 'khoiadjatesnim@gmail.com' });

        if (existingUser) {
            console.log('Test user already exists!');
            console.log('Email: khoiadjatesnim@gmail.com');
            console.log('Password: solbot123');
            mongoose.connection.close();
            return;
        }

        // Create new user
        const user = await User.create({
            name: 'Tesnim Khoiadja',
            email: 'khoiadjatesnim@gmail.com',
            password: 'solbot123',
            role: 'superadmin',
            profileImage: ''
        });

        console.log('Test user created successfully!');
        console.log('Email: khoiadjatesnim@gmail.com');
        console.log('Password: solbot123');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating test user:', error.message);
        mongoose.connection.close();
    }
}

createTestUser();
