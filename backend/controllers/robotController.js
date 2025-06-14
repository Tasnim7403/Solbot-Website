// Add signal strength management
let mockSignalStrength = 84; // Static signal strength value

exports.getSignalStrength = async (req, res) => {
    try {
        res.json({ signalStrength: mockSignalStrength });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSignalStrength = async (req, res) => {
    try {
        const { signalStrength } = req.body;
        if (typeof signalStrength === 'number' && signalStrength >= 0 && signalStrength <= 100) {
            mockSignalStrength = signalStrength;
            res.json({ signalStrength: mockSignalStrength });
        } else {
            res.status(400).json({ error: 'Invalid signal strength value' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMapData = async (req, res) => {
    try {
        res.json({ mapData: global.cachedMapData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRobotStatus = async (req, res) => {
    try {
        res.json({ connected: global.robotIsConnected });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 