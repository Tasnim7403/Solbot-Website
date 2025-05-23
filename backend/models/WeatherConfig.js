const mongoose = require('mongoose');

const WeatherConfigSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
        default: 'Paris'
    }
});

module.exports = mongoose.model('WeatherConfig', WeatherConfigSchema); 