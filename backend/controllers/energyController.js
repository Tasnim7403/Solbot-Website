const EnergyReading = require('../models/EnergyReading');
const Notification = require('../models/Notification');
const NotificationState = require('../models/NotificationState');
const moment = require('moment-timezone');

// Add a new reading (from ESP32)
exports.addReading = async (req, res) => {
    try {
        // Accept both 'currentAmps'/'voltageVolts' and 'current'/'voltage' for compatibility
        const currentAmps = req.body.currentAmps !== undefined ? req.body.currentAmps : req.body.current;
        const voltageVolts = req.body.voltageVolts !== undefined ? req.body.voltageVolts : req.body.voltage;
        // Use measured power from ESP32 (prefer req.body.power or req.body.energyProduction)
        const measuredPower = req.body.power !== undefined ? req.body.power : (req.body.energyProduction !== undefined ? req.body.energyProduction : (currentAmps * voltageVolts));

        // Get the most recent previous reading
        const previousReading = await EnergyReading.findOne({}, {}, { sort: { timestamp: -1 } });
        let energyWh = 0;
        let energyTheoreticalWh = 0;
        let prevTimestamp = null;
        let prevPower = null;
        const nowTimestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
        if (previousReading) {
            prevTimestamp = previousReading.timestamp;
            prevPower = previousReading.power;
            const deltaT = (nowTimestamp - prevTimestamp) / 1000; // seconds
            if (prevPower !== undefined && prevPower !== null && deltaT > 0) {
                energyWh = prevPower * (deltaT / 3600);
                // Theoretical calculation (optional, set to 0 if not needed)
                const surface = 0.0049; // m²
                const irradiance = 200; // W/m² (modifiable)
                energyTheoreticalWh = irradiance * surface * (deltaT / 3600);
            }
        }
        // Calculate efficiency using the general formula
        let efficiency = 0;
        if (energyTheoreticalWh > 0) {
            efficiency = (energyWh / energyTheoreticalWh) * 100;
        }
        // Prepare all possible fields for compatibility and clarity
        const reading = new EnergyReading({
            currentAmps: req.body.currentAmps !== undefined ? req.body.currentAmps : req.body.current,
            current: req.body.current !== undefined ? req.body.current : req.body.currentAmps,
            voltageVolts: req.body.voltageVolts !== undefined ? req.body.voltageVolts : req.body.voltage,
            voltage: req.body.voltage !== undefined ? req.body.voltage : req.body.voltageVolts,
            power: req.body.power !== undefined ? req.body.power : (currentAmps * voltageVolts),
            energyProduction: measuredPower,
            efficiency,
            timestamp: nowTimestamp,
            energyWh: energyWh,
            energyTheoreticalWh: energyTheoreticalWh
        });
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
            // Get all readings for the day in the requested timezone
            const start = refDate.clone().tz(tz).startOf('day').utc().toDate();
            const end = refDate.clone().tz(tz).endOf('day').utc().toDate();
            console.log('[DEBUG] Day filter:', { start, end, tz, refDate: refDate.format() });
            match = {
                timestamp: {
                    $gte: start,
                    $lt: end
                }
            };
            let readings = await EnergyReading.find(match).sort({ timestamp: 1 });
            console.log(`[DEBUG] Found ${readings.length} readings for day filter.`);
            if (readings.length > 0) {
                console.log('[DEBUG] Reading timestamps:', readings.map(r => r.timestamp));
            }
            // Removed fallback to previous day: if no readings, just return empty
            const result = readings.map(r => ({
                timestamp: r.timestamp,
                energy: r.energyWh || 0,
                efficiency: r.efficiency || 0,
                current: r.current || r.currentAmps || 0
            }));
            res.json(result);
            return;
        } else if (filter === 'week') {
            // Group by day for the selected week (force UTC)
            match = {
                timestamp: {
                    $gte: refDate.clone().utc().startOf('week').toDate(),
                    $lt: refDate.clone().utc().endOf('week').toDate()
                }
            };
            const readings = await EnergyReading.find(match).sort({ timestamp: 1 });
            // Group readings by day
            const days = {};
            readings.forEach(r => {
                const day = r.timestamp.toISOString().slice(0, 10);
                if (!days[day]) days[day] = [];
                days[day].push(r);
            });
            const result = Object.entries(days).map(([day, dayReadings]) => {
                const totalEnergy = dayReadings.reduce((sum, r) => sum + (r.energyWh || 0), 0);
                const avgEfficiency = dayReadings.length ? dayReadings.reduce((sum, r) => sum + (r.efficiency || 0), 0) / dayReadings.length : 0;
                return {
                    day,
                    energy: Number(totalEnergy.toFixed(4)),
                    efficiency: Number(avgEfficiency.toFixed(2)),
                    count: dayReadings.length,
                    timestamp: dayReadings[0].timestamp
                };
            });
            res.json(result);
            return;
        } else if (filter === 'month') {
            // Group by week of month for the selected month (force UTC)
            match = {
                timestamp: {
                    $gte: refDate.clone().utc().startOf('month').toDate(),
                    $lt: refDate.clone().utc().endOf('month').toDate()
                }
            };
            const readings = await EnergyReading.find(match).sort({ timestamp: 1 });
            // Group readings by week number (1-4)
            const weeks = { 1: [], 2: [], 3: [], 4: [] };
            readings.forEach(r => {
                const weekNum = Math.min(4, Math.ceil((r.timestamp.getDate() - 1) / 7) + 1);
                weeks[weekNum].push(r);
            });
            const result = Object.entries(weeks).map(([week, weekReadings]) => {
                const totalEnergy = weekReadings.reduce((sum, r) => sum + (r.energyWh || 0), 0);
                const avgEfficiency = weekReadings.length ? weekReadings.reduce((sum, r) => sum + (r.efficiency || 0), 0) / weekReadings.length : 0;
                return {
                    week: Number(week),
                    energy: Number(totalEnergy.toFixed(4)),
                    efficiency: Number(avgEfficiency.toFixed(2)),
                    count: weekReadings.length,
                    timestamp: weekReadings[0] ? weekReadings[0].timestamp : null
                };
            });
            res.json(result);
            return;
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