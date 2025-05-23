const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    addAnomalies,
    getAnomalies,
    updateAnomaly,
    getAnomalyStats,
    getAnomaliesByType,
    getRecentAnomalies
} = require('../controllers/anomalyController');

// Public route for adding anomalies (from ESP32)
router.post('/batch', addAnomalies);

// Protected routes (require authentication)
router.get('/', protect, getAnomalies);
router.get('/by-type', protect, getAnomaliesByType);
router.put('/:id', protect, updateAnomaly);
router.get('/stats', protect, getAnomalyStats);
router.get('/recent', getRecentAnomalies);

module.exports = router; 