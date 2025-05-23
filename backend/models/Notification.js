const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g., 'temperature', 'humidity', 'wind', 'anomaly', etc.
    message: { type: String, required: true },
    data: { type: Object }, // optional, for extra info
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', NotificationSchema); 