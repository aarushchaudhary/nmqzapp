const express = require('express');
const router = express.Router();
const multer = require('multer');
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
    exportResultsAsCSV,
    bulkUploadQuestions,
    getQuizAnalysis,
    reenableStudent
} = require('../controllers/quizController');

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

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

// Bulk Upload Questions
router.post('/quiz/:id/upload-questions', upload.single('file'), bulkUploadQuestions);

// Item Analysis
router.get('/quiz/:id/analysis', getQuizAnalysis);

// Re-enable Student Attempt
router.put('/attempt/:attemptId/reenable', reenableStudent);

module.exports = router;