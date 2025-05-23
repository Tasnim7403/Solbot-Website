const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed

// Replace with your actual MongoDB connection string and database name
mongoose.connect('mongodb://localhost:27017/SolBot_Website', { useNewUrlParser: true, useUnifiedTopology: true });

async function updateAllPasswords() {
    const users = await User.find();
    for (const user of users) {
        user.password = 'password123'; // Set to your desired plain text password
        await user.save();
    }
    console.log('All passwords updated to plain text!');
    mongoose.disconnect();
}

updateAllPasswords();
