const express = require('express');
const router = express.Router();
const energyController = require('../controllers/energyController');

router.post('/data', energyController.addReading); // For ESP32
router.get('/trend', energyController.getReadings); // For dashboard trend chart
router.get('/aggregate', energyController.getAggregatedReadings);

module.exports = router; 