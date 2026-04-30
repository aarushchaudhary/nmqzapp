const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getAvailableQuizzes, getQuizById } = require('../controllers/quizController');
const { submitExam, getStudentResults, getResultDetail } = require('../controllers/attemptController');

// Public routes (no auth required)
router.get('/quizzes', protect, authorize('Student'), getAvailableQuizzes);
router.get('/quiz/:id', protect, authorize('Student'), getQuizById);
router.post('/submit-exam', protect, authorize('Student'), submitExam);

// Results routes
router.get('/results', protect, authorize('Student'), getStudentResults);
router.get('/results/:attemptId', protect, authorize('Student'), getResultDetail);

module.exports = router;