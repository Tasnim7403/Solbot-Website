const Anomaly = require('../models/Anomaly');
const Notification = require('../models/Notification');

// @desc    Add multiple anomalies
// @route   POST /api/anomalies/batch
// @access  Public
exports.addAnomalies = async (req, res) => {
    try {
        const anomalies = req.body;

        // Validate that we received an array
        if (!Array.isArray(anomalies)) {
            return res.status(400).json({
                success: false,
                message: 'Request body must be an array of anomalies'
            });
        }

        console.log('Received anomalies:', req.body);

        // Process each anomaly
        const processedAnomalies = anomalies.map(anomaly => ({
            timestamp: new Date(anomaly.timestamp),
            anomalyType: anomaly.anomaly_type,
            confidence: anomaly.confidence,
            image: anomaly.image_data_base64 || null,
            location: anomaly.location || 'Mahdia'
        }));

        // Insert all anomalies
        const result = await Anomaly.insertMany(processedAnomalies);

        // Notification logic: create a notification for each new anomaly
        for (const anomaly of result) {
            const created = await Notification.create({
                type: 'anomaly',
                message: `New anomaly detected: ${anomaly.anomalyType} (confidence: ${anomaly.confidence})`,
                data: { id: anomaly._id, anomalyType: anomaly.anomalyType, confidence: anomaly.confidence }
            });
            const io = req.app.get('io');
            if (io) io.emit('new-notification', created);
        }

        res.status(201).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        console.error('Error adding anomalies:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding anomalies',
            error: error.message
        });
    }
};

// @desc    Get all anomalies with optional filtering
// @route   GET /api/anomalies
// @access  Private
exports.getAnomalies = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            anomalyType,
            status,
            limit = 50,
            page = 1,
            date
        } = req.query;

        // Build filter object
        const filter = {};

        // If a specific date is provided, filter for that day (UTC)
        if (date) {
            // date is yyyy-mm-dd
            const start = new Date(date + 'T00:00:00.000Z');
            const end = new Date(date + 'T23:59:59.999Z');
            filter.timestamp = { $gte: start, $lte: end };
        } else if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        if (anomalyType) filter.anomalyType = anomalyType;
        if (status) filter.status = status;

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get anomalies with pagination
        const anomalies = await Anomaly.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Anomaly.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: anomalies.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: anomalies
        });
    } catch (error) {
        console.error('Error getting anomalies:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving anomalies',
            error: error.message
        });
    }
};

// @desc    Update anomaly status
// @route   PUT /api/anomalies/:id
// @access  Private
exports.updateAnomaly = async (req, res) => {
    try {
        const { status, notes, assignedTo, location } = req.body;

        const updateFields = {};
        if (status !== undefined) updateFields.status = status;
        if (notes !== undefined) updateFields.notes = notes;
        if (assignedTo !== undefined) updateFields.assignedTo = assignedTo;
        if (location !== undefined) updateFields.location = location;

        const anomaly = await Anomaly.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!anomaly) {
            return res.status(404).json({
                success: false,
                message: 'Anomaly not found'
            });
        }

        res.status(200).json({
            success: true,
            data: anomaly
        });
    } catch (error) {
        console.error('Error updating anomaly:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating anomaly',
            error: error.message
        });
    }
};

// @desc    Get anomaly statistics
// @route   GET /api/anomalies/stats
// @access  Private
exports.getAnomalyStats = async (req, res) => {
    try {
        const stats = await Anomaly.aggregate([
            {
                $group: {
                    _id: '$anomalyType',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            }
        ]);

        const statusStats = await Anomaly.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                byType: stats,
                byStatus: statusStats
            }
        });
    } catch (error) {
        console.error('Error getting anomaly stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving anomaly statistics',
            error: error.message
        });
    }
};

// @desc    Get anomaly count by type
// @route   GET /api/anomalies/by-type
// @access  Private
exports.getAnomaliesByType = async (req, res) => {
    try {
        const result = await Anomaly.aggregate([
            { $group: { _id: '$anomalyType', count: { $sum: 1 } } },
            { $project: { _id: 0, type: '$_id', count: 1 } }
        ]);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error getting anomalies by type:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving anomalies by type',
            error: error.message
        });
    }
};

// @desc    Get 3 most recent anomalies
// @route   GET /api/anomalies/recent
// @access  Private
exports.getRecentAnomalies = async (req, res) => {
    try {
        const anomalies = await Anomaly.find().sort({ timestamp: -1 }).limit(3);
        res.status(200).json({
            success: true,
            data: anomalies
        });
    } catch (error) {
        console.error('Error getting recent anomalies:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recent anomalies',
            error: error.message
        });
    }
}; 