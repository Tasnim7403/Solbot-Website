const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robotController');

// ... existing routes ...

// Signal strength routes
router.get('/signal-strength', robotController.getSignalStrength);
router.put('/signal-strength', robotController.updateSignalStrength);

// Map data route
router.get('/map-data', robotController.getMapData);

// Status route
router.get('/status', robotController.getRobotStatus);

module.exports = router; 