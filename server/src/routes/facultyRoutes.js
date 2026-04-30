const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createQuiz } = require('../controllers/quizController');
const { getFacultyQuizzes } = require('../controllers/quizController');

// Add this below the create quiz route
router.get('/my-quizzes', getFacultyQuizzes);
router.use(protect);
router.use(authorize('Faculty', 'Admin')); // Both can create quizzes

router.post('/quiz', createQuiz);

module.exports = router;