const mongoose = require('mongoose');

const EnergyReadingSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    currentAmps: { type: Number, required: false }, // Accept either currentAmps or current
    current: { type: Number, required: false },     // For ESP32 compatibility
    voltageVolts: { type: Number, required: false },
    voltage: { type: Number, required: false },     // For ESP32 compatibility
    energyProduction: { type: Number }, // optional, for future use
    power: { type: Number },            // Store power if provided
    efficiency: { type: Number },        // optional, for future use
    energyWh: { type: Number },          // energy generated between this and previous reading (Wh)
    energyTheoreticalWh: { type: Number } // theoretical solar energy for the interval (Wh)
});

module.exports = mongoose.model('EnergyReading', EnergyReadingSchema, 'energyreadings');
