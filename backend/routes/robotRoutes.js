const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robotController');

// ... existing routes ...

// Signal strength routes
router.get('/signal-strength', robotController.getSignalStrength);
router.put('/signal-strength', robotController.updateSignalStrength);

module.exports = router; 