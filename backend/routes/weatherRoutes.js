const express = require('express');
const axios = require('axios');
const WeatherConfig = require('../models/WeatherConfig');
const Notification = require('../models/Notification');
const NotificationState = require('../models/NotificationState');
const router = express.Router();

// Get the current weather location
router.get('/location', async (req, res) => {
    let config = await WeatherConfig.findOne();
    if (!config) {
        config = await WeatherConfig.create({ location: 'Paris' });
    }
    res.json({ location: config.location });
});

// Update the weather location
router.put('/location', async (req, res) => {
    const { location } = req.body;
    if (!location) return res.status(400).json({ error: 'Location is required' });
    let config = await WeatherConfig.findOne();
    if (!config) {
        config = await WeatherConfig.create({ location });
    } else {
        config.location = location;
        await config.save();
    }
    res.json({ location: config.location });
});

// Get live weather for the stored location
router.get('/', async (req, res) => {
    let config = await WeatherConfig.findOne();
    if (!config) {
        config = await WeatherConfig.create({ location: 'Paris' });
    }
    const location = config.location;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const probabilityOfRain = data.rain ? data.rain['1h'] || 0 : 0;
        const probabilityOfSnow = data.snow ? data.snow['1h'] || 0 : 0;
        const io = req.app.get('io');
        // Notification logic
        const notifications = [];
        const now = new Date();
        // Helper to check and send notification
        async function maybeNotify(type, value, message) {
            const state = await NotificationState.findOne({ type });
            if (!state || !state.lastSent || (now - state.lastSent) > 60 * 60 * 1000 || state.lastValue !== value) {
                const created = await Notification.create({ type, message });
                if (io) io.emit('new-notification', created);
                await NotificationState.findOneAndUpdate(
                    { type },
                    { lastValue: value, lastSent: now },
                    { upsert: true }
                );
            }
        }
        if (typeof temperature === 'number') {
            if (temperature > 35) await maybeNotify('temperature', temperature, `Temperature is too high: ${temperature}°C`);
            if (temperature < 0) await maybeNotify('temperature', temperature, `Temperature is too low: ${temperature}°C`);
        }
        if (typeof humidity === 'number' && humidity > 80) {
            await maybeNotify('humidity', humidity, `Humidity is too high: ${humidity}% RH`);
        }
        if (typeof windSpeed === 'number' && windSpeed > 12) {
            await maybeNotify('wind', windSpeed, `Wind speed is too high: ${windSpeed} m/s`);
        }
        if (typeof probabilityOfRain === 'number' && probabilityOfRain >= 40) {
            await maybeNotify('precipitation', probabilityOfRain, `High probability of rain: ${probabilityOfRain}%`);
        }
        if (typeof probabilityOfSnow === 'number' && probabilityOfSnow >= 40) {
            await maybeNotify('precipitation', probabilityOfSnow, `High probability of snow: ${probabilityOfSnow}%`);
        }
        res.json({
            temperature,
            humidity,
            windSpeed,
            probabilityOfRain,
            probabilityOfSnow,
            city: data.name,
            country: data.sys.country
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

module.exports = router; 