const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getAllSchools, getSchoolById, createSchool, updateSchool, deleteSchool,
    getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse,
    getAllSpecializations, getSpecializationById, createSpecialization, updateSpecialization, deleteSpecialization
} = require('../controllers/academicController');
const {
    getAllUsers, getUserById, createUser, updateUser, deleteUser, bulkUploadUsers, upload
} = require('../controllers/userController');
const { getAllLogs, getLogsByQuiz, getLogsByStudent } = require('../controllers/logsController');

// Apply protection and Admin-only authorization to all routes in this file
router.use(protect);
router.use(authorize('Admin'));

// Dashboard
router.get('/dashboard-stats', (req, res) => {
    res.json({ message: 'Welcome to the Admin Dashboard API' });
});

// ========== SCHOOLS ==========
router.get('/academic/schools', getAllSchools);
router.get('/academic/schools/:id', getSchoolById);
router.post('/academic/schools', createSchool);
router.put('/academic/schools/:id', updateSchool);
router.delete('/academic/schools/:id', deleteSchool);

// ========== COURSES ==========
router.get('/academic/courses', getAllCourses);
router.get('/academic/courses/:id', getCourseById);
router.post('/academic/courses', createCourse);
router.put('/academic/courses/:id', updateCourse);
router.delete('/academic/courses/:id', deleteCourse);

// ========== SPECIALIZATIONS ==========
router.get('/academic/specializations', getAllSpecializations);
router.get('/academic/specializations/:id', getSpecializationById);
router.post('/academic/specializations', createSpecialization);
router.put('/academic/specializations/:id', updateSpecialization);
router.delete('/academic/specializations/:id', deleteSpecialization);

// ========== USERS ==========
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Bulk upload users from CSV
router.post('/users/upload', upload.single('csv'), bulkUploadUsers);

// ========== SYSTEM LOGS ==========
router.get('/logs', getAllLogs);
router.get('/logs/quiz/:quizId', getLogsByQuiz);
router.get('/logs/student/:studentId', getLogsByStudent);

module.exports = router;