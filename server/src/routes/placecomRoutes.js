const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getPlacecomResults } = require('../controllers/quizController');

// All placecom routes are protected
router.use(protect);
router.use(authorize('Placecom'));

// Placecom Dashboard - Get all evaluated results
router.get('/results', getPlacecomResults);

module.exports = router;
