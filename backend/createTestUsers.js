const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6
    },
    role: { type: String, default: 'user' },
    profileImage: { type: String, default: '' },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { collection: 'admins' });

// Remove hashing
// UserSchema.pre('save', async function (next) { ... });

// Compare passwords as plain text (not recommended for real projects)
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return enteredPassword === this.password;
};

module.exports = mongoose.model('User', UserSchema);
