const EnergyReading = require('../models/EnergyReading');
const Notification = require('../models/Notification');
const NotificationState = require('../models/NotificationState');
const moment = require('moment-timezone');

// Add a new reading (from ESP32)
exports.addReading = async (req, res) => {
    try {
        const { currentAmps, energyProduction, battery, temperature, humidity, windSpeed, precipitation } = req.body;
        const efficiency = (currentAmps / 3.0) * 100; // Example formula
        const reading = new EnergyReading({ currentAmps, energyProduction, efficiency });
        await reading.save();

        // Notification logic
        const notifications = [];
        const now = new Date();
        async function maybeNotify(type, value, message) {
            const state = await NotificationState.findOne({ type });
            if (!state || !state.lastSent || (now - state.lastSent) > 60 * 60 * 1000 || state.lastValue !== value) {
                const created = await Notification.create({ type, message });
                const io = req.app.get('io');
                if (io) io.emit('new-notification', created);
                await NotificationState.findOneAndUpdate(
                    { type },
                    { lastValue: value, lastSent: now },
                    { upsert: true }
                );
            }
        }
        if (typeof temperature === 'number') {
            if (temperature > 35) notifications.push({ type: 'temperature', message: `Temperature is too high: ${temperature}°C` });
            if (temperature < 0) notifications.push({ type: 'temperature', message: `Temperature is too low: ${temperature}°C` });
        }
        if (typeof humidity === 'number' && humidity > 80) {
            notifications.push({ type: 'humidity', message: `Humidity is too high: ${humidity}% RH` });
        }
        if (typeof windSpeed === 'number' && windSpeed > 12) {
            notifications.push({ type: 'wind', message: `Wind speed is too high: ${windSpeed} m/s` });
        }
        if (typeof precipitation === 'number' && precipitation >= 40) {
            notifications.push({ type: 'precipitation', message: `High probability of rain/snow: ${precipitation}%` });
        }
        if (typeof battery === 'number' && battery < 20) {
            await maybeNotify('battery', battery, `Battery is low: ${battery}%`);
        }
        if (typeof currentAmps === 'number' && currentAmps < 0.56) {
            notifications.push({ type: 'current', message: `Current is too low: ${currentAmps}A` });
        }
        for (const notif of notifications) {
            await Notification.create({ ...notif });
        }

        res.status(201).json(reading);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get readings for the trend chart (optionally by date range)
exports.getReadings = async (req, res) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from && to) {
            filter.timestamp = { $gte: new Date(from), $lte: new Date(to) };
        }
        const readings = await EnergyReading.find(filter).sort({ timestamp: 1 });
        res.json(readings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get aggregated readings for dashboard filter (day/week/month)
exports.getAggregatedReadings = async (req, res) => {
    try {
        const { filter = 'day', date, timezone } = req.query;
        const tz = timezone || 'Africa/Tunis';
        let match = {};
        let group = {};
        let project = {};
        let sort = {};
        let refDate = date ? moment.tz(date, tz) : moment.tz(tz);

        if (filter === 'day') {
            // Group by 30-minute interval for the selected day
            match = {
                timestamp: {
                    $gte: refDate.clone().startOf('day').toDate(),
                    $lt: refDate.clone().endOf('day').toDate()
                }
            };
            group = {
                _id: {
                    hour: { $hour: { date: '$timestamp', timezone: tz } },
                    halfHour: {
                        $cond: [
                            { $lt: [{ $minute: { date: '$timestamp', timezone: tz } }, 30] },
                            0,
                            30
                        ]
                    }
                },
                avgCurrent: { $avg: '$currentAmps' },
                avgEfficiency: { $avg: '$efficiency' },
                firstTimestamp: { $min: '$timestamp' }
            };
            project = {
                _id: 0,
                hour: '$_id.hour',
                halfHour: '$_id.halfHour',
                avgCurrent: 1,
                avgEfficiency: 1,
                timestamp: '$firstTimestamp'
            };
            sort = { hour: 1, halfHour: 1 };
        } else if (filter === 'week') {
            // Group by day for the selected week
            match = {
                timestamp: {
                    $gte: refDate.clone().startOf('week').toDate(),
                    $lt: refDate.clone().endOf('week').toDate()
                }
            };
            group = {
                _id: { day: { $dayOfMonth: { date: '$timestamp', timezone: tz } } },
                avgCurrent: { $avg: '$currentAmps' },
                avgEnergy: { $avg: '$energyProduction' },
                avgEfficiency: { $avg: '$efficiency' },
                firstTimestamp: { $min: '$timestamp' }
            };
            project = {
                _id: 0,
                day: '$_id.day',
                avgCurrent: 1,
                avgEnergy: 1,
                avgEfficiency: 1,
                timestamp: '$firstTimestamp'
            };
            sort = { day: 1 };
        } else if (filter === 'month') {
            // Group by week of month for the selected month
            match = {
                timestamp: {
                    $gte: refDate.clone().startOf('month').toDate(),
                    $lt: refDate.clone().endOf('month').toDate()
                }
            };
            group = {
                _id: {
                    weekOfMonth: {
                        $ceil: {
                            $divide: [
                                {
                                    $add: [
                                        { $dayOfMonth: { date: '$timestamp', timezone: tz } },
                                        {
                                            $subtract: [
                                                {
                                                    $dayOfWeek: {
                                                        date: {
                                                            $dateFromParts: {
                                                                year: { $year: { date: '$timestamp', timezone: tz } },
                                                                month: { $month: { date: '$timestamp', timezone: tz } },
                                                                day: 1,
                                                                timezone: tz
                                                            }
                                                        }
                                                    }
                                                },
                                                1
                                            ]
                                        }
                                    ]
                                },
                                7
                            ]
                        }
                    }
                },
                avgCurrent: { $avg: '$currentAmps' },
                avgEnergy: { $avg: '$energyProduction' },
                avgEfficiency: { $avg: '$efficiency' },
                firstTimestamp: { $min: '$timestamp' }
            };
            project = {
                _id: 0,
                week: '$_id.weekOfMonth',
                avgCurrent: 1,
                avgEnergy: 1,
                avgEfficiency: 1,
                timestamp: '$firstTimestamp'
            };
            sort = { week: 1 };
        } else {
            return res.status(400).json({ error: 'Invalid filter type' });
        }

        const data = await EnergyReading.aggregate([
            { $match: match },
            { $group: group },
            { $project: project },
            { $sort: sort }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 