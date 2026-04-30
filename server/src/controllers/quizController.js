const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// --- FACULTY: Create a Quiz ---
exports.createQuiz = async (req, res) => {
    try {
        const { title, description, durationMinutes, startTime, endTime, questions } = req.body;
        
        const newQuiz = new Quiz({
            title,
            description,
            durationMinutes,
            startTime,
            endTime,
            facultyId: req.user.id, // From authMiddleware
            questions,
            status: 'Published'
        });

        await newQuiz.save();
        res.status(201).json({ message: 'Quiz created successfully', quiz: newQuiz });
    } catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
};

// --- STUDENT: Get Available Quizzes ---
exports.getAvailableQuizzes = async (req, res) => {
    try {
        const now = new Date();
        // Find published quizzes where the current time is between start and end time
        const quizzes = await Quiz.find({
            status: 'Published',
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).select('-questions.correctAnswer'); // HIDE correct answers from students!

        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
};

// --- STUDENT: Fetch Specific Exam Details ---
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).select('-questions.correctAnswer');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
};

// --- FACULTY: Get My Quizzes ---
exports.getFacultyQuizzes = async (req, res) => {
    try {
        // Fetch only quizzes created by the logged-in faculty member
        const quizzes = await Quiz.find({ facultyId: req.user.id }).sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
    }
};