const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB directly
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/solbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Get the User model directly from MongoDB to bypass middleware
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    password: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    profileImage: String
});

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
    try {
        // Hash the password manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('solbot123', salt);

        // Check if user exists and update or create
        const filter = { email: 'khoiadjatesnim@gmail.com' };
        const update = {
            name: 'Tesnim Khoiadja',
            email: 'khoiadjatesnim@gmail.com',
            password: hashedPassword,
            role: 'superadmin',
            profileImage: ''
        };

        // Use findOneAndUpdate with upsert to create if not exists
        const result = await User.findOneAndUpdate(
            filter,
            update,
            { upsert: true, new: true }
        );

        console.log('Admin user created/updated successfully!');
        console.log(`User ID: ${result._id}`);
        console.log('Email: khoiadjatesnim@gmail.com');
        console.log('Password: solbot123');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin user:', error);
        mongoose.connection.close();
    }
}

createAdminUser();
