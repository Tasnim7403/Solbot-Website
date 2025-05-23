const express = require('express');
const Notification = require('../models/Notification');
const router = express.Router();

// Get all notifications (newest first)
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ timestamp: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Helper to enforce max 25 notifications
async function enforceNotificationLimit() {
    const count = await Notification.countDocuments();
    if (count > 25) {
        const toDelete = await Notification.find().sort({ timestamp: 1 }).limit(count - 25);
        const ids = toDelete.map(n => n._id);
        await Notification.deleteMany({ _id: { $in: ids } });
    }
}

// Mark a notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        res.json(notification);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

module.exports = router; 