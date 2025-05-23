const mongoose = require('mongoose');

const EnergyReadingSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    currentAmps: { type: Number, required: true },
    energyProduction: { type: Number }, // optional, for future use
    efficiency: { type: Number }        // optional, for future use
});

module.exports = mongoose.model('EnergyReading', EnergyReadingSchema, 'energyreadings');
