const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    anomalyType: {
        type: String,
        required: true,
        enum: ['dusty', 'snowy', 'Electrical damage', 'Physical damage', 'Bird-drop']
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    status: {
        type: String,
        enum: ['pending', 'fixed', 'not_fixed'],
        default: 'not_fixed'
    },
    notes: {
        type: String,
        default: ''
    },
    assignedTo: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: 'A - Panel 1'
    },
    image: {
        type: String, // base64 string or URL
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient querying
anomalySchema.index({ timestamp: -1 });
anomalySchema.index({ anomalyType: 1 });
anomalySchema.index({ status: 1 });

module.exports = mongoose.model('Anomaly', anomalySchema); 