const SystemLog = require('../models/SystemLog');

// Get all system logs (admin only)
exports.getAllLogs = async (req, res) => {
    try {
        const logs = await SystemLog.find()
            .populate('studentId', 'username name')
            .populate('quizId', 'title')
            .sort({ timestamp: -1 })
            .lean();

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};

// Get logs filtered by quiz
exports.getLogsByQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const logs = await SystemLog.find({ quizId })
            .populate('studentId', 'username name')
            .populate('quizId', 'title')
            .sort({ timestamp: -1 })
            .lean();

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};

// Get logs filtered by student
exports.getLogsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const logs = await SystemLog.find({ studentId })
            .populate('studentId', 'username name')
            .populate('quizId', 'title')
            .sort({ timestamp: -1 })
            .lean();

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};
