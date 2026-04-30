const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
    createQuiz, 
    getFacultyQuizzes, 
    getQuizForMonitoring,
    getAttemptsForEvaluation,
    saveEvaluationGrades,
    getEvaluatedResults,
    updateQuiz,
    deleteQuiz,
    exportResultsAsCSV
} = require('../controllers/quizController');

// All faculty routes are protected
router.use(protect);
router.use(authorize('Faculty', 'Admin'));

// Quiz Management
router.get('/my-quizzes', getFacultyQuizzes);
router.post('/quiz', createQuiz);
router.put('/quiz/:id', updateQuiz);
router.delete('/quiz/:id', deleteQuiz);

// Quiz Monitoring
router.get('/monitor/:quizId', getQuizForMonitoring);

// Evaluation
router.get('/evaluate/:quizId', getAttemptsForEvaluation);
router.put('/evaluate/:quizId', saveEvaluationGrades);

// Results
router.get('/results/:quizId', getEvaluatedResults);
router.get('/export/:quizId', exportResultsAsCSV);

module.exports = router;