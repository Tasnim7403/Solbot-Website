const mongoose = require('mongoose');

const NotificationStateSchema = new mongoose.Schema({
    type: { type: String, required: true, unique: true },
    lastValue: { type: Number },
    lastSent: { type: Date }
});

module.exports = mongoose.model('NotificationState', NotificationStateSchema); 