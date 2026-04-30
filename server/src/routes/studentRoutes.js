const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getAvailableQuizzes, getQuizById } = require('../controllers/quizController');
const { submitExam } = require('../controllers/attemptController');

// Add this below your existing quiz routes
router.post('/submit-exam', submitExam);
router.use(protect);
router.use(authorize('Student'));

router.get('/quizzes', getAvailableQuizzes);
router.get('/quiz/:id', getQuizById);

module.exports = router;