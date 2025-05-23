const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Anomaly = require('../models/Anomaly');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EnergyReading = require('../models/EnergyReading');
const WeatherConfig = require('../models/WeatherConfig');

const staticSuggestions = [
    "anomalies", "staff", "people", "temperature", "wind speed", "connection", "humidity", "battery", "energy", "reports", "solar panel", "robot", "robot status", "maintenance", "alerts", "weather", "location", "efficiency", "production", "dashboard", "supervision", "map", "notifications", "admin", "user", "status", "mode", "speed", "panel", "damage", "dusty", "snow", "rain", "autonomous", "manual", "online", "offline", "fixed", "pending", "not fixed", "zone", "panel 1", "panel 2", "panel 3", "role"
];

// GET /api/search?q=term
router.get('/', async (req, res) => {
    const q = req.query.q;
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid search query' });
    }
    try {
        // Search Persons by name
        const persons = (await Person.find({ name: { $regex: q, $options: 'i' } }).limit(10)).map(p => ({ ...p.toObject(), type: 'person' }));
        // Search Anomalies by all string fields
        const anomalyOr = [
            { anomalyType: { $regex: q, $options: 'i' } },
            { status: { $regex: q, $options: 'i' } },
            { notes: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } },
            { assignedTo: { $regex: q, $options: 'i' } },
        ];
        const qTrimmed = q.trim();
        const qNum = Number(qTrimmed);
        let anomalies = await Anomaly.find({ $or: anomalyOr }).limit(10);
        if (
            qTrimmed !== '' &&
            isFinite(qNum) &&
            /^-?\d+(\.\d+)?$/.test(qTrimmed)
        ) {
            const confidenceAnomalies = await Anomaly.find({ confidence: qNum }).limit(10);
            // Merge and deduplicate by _id
            const map = new Map();
            for (const a of [...anomalies, ...confidenceAnomalies]) {
                map.set(a._id.toString(), a);
            }
            anomalies = Array.from(map.values());
        }
        anomalies = anomalies.map(a => ({ ...a.toObject(), type: 'anomaly' }));
        // Search unread Notifications by message
        const notifications = (await Notification.find({ message: { $regex: q, $options: 'i' }, read: false }).limit(10)).map(n => ({ ...n.toObject(), type: 'notification' }));
        // Search Users by name or email
        const users = (await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        }).limit(10)).map(u => ({ ...u.toObject(), type: 'user' }));
        // Search EnergyReadings by numeric value (if q is a number)
        let energyReadings = [];
        if (!isNaN(qNum)) {
            energyReadings = (await EnergyReading.find({
                $or: [
                    { currentAmps: { $gte: qNum - 0.5, $lte: qNum + 0.5 } },
                    { energyProduction: { $gte: qNum - 0.5, $lte: qNum + 0.5 } },
                    { efficiency: { $gte: qNum - 0.5, $lte: qNum + 0.5 } }
                ]
            }).limit(10)).map(e => ({ ...e.toObject(), type: 'energy' }));
        }
        // Search WeatherConfig/location by location
        const weatherConfigs = (await WeatherConfig.find({ location: { $regex: q, $options: 'i' } }).limit(10)).map(w => ({ ...w.toObject(), type: 'location' }));
        // Weather data (simulate search by keyword)
        let weatherResults = [];
        if (/temperature|humidity|wind|rain|snow/i.test(q)) {
            // Just return a dummy result for now (real implementation would query current weather)
            weatherResults.push({ type: 'weather', keyword: q });
        }
        // Add static suggestions if no results found
        let suggestions = [];
        if (
            (!persons || persons.length === 0) &&
            (!anomalies || anomalies.length === 0) &&
            (!notifications || notifications.length === 0) &&
            (!users || users.length === 0) &&
            (!energyReadings || energyReadings.length === 0) &&
            (!weatherConfigs || weatherConfigs.length === 0) &&
            (!weatherResults || weatherResults.length === 0)
        ) {
            suggestions = staticSuggestions.filter(s =>
                s.toLowerCase().includes(q.toLowerCase())
            );
        }
        // Always include suggestions array
        res.json({ persons, anomalies, notifications, users, energyReadings, weatherConfigs, weatherResults, suggestions });
    } catch (err) {
        res.status(500).json({ error: 'Search failed', details: err.message });
    }
});

module.exports = router; 