const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply protection and Admin-only authorization to all routes in this file
router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard-stats', (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard API' });
});

module.exports = router;