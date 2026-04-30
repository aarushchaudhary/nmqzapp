const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

exports.submitExam = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const studentId = req.user.id;

        // 1. Fetch the original quiz to grade the MCQs
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let totalScore = 0;
        const gradedAnswers = [];

        // 2. Loop through student answers and grade them
        for (const [questionId, studentAnswer] of Object.entries(answers)) {
            const question = quiz.questions.id(questionId);
            let isCorrect = false;
            let marksAwarded = 0;

            if (question && question.type === 'MCQ') {
                if (question.correctAnswer === studentAnswer) {
                    isCorrect = true;
                    marksAwarded = question.marks;
                    totalScore += marksAwarded;
                }
            }

            gradedAnswers.push({
                questionId,
                submittedAnswer: studentAnswer,
                isCorrect,
                marksAwarded
            });
        }

        // 3. Save the Attempt to MongoDB
        const attempt = new QuizAttempt({
            studentId,
            quizId,
            answers: gradedAnswers,
            totalScore,
            status: 'Submitted',
            submittedAt: new Date()
        });

        await attempt.save();

        res.status(200).json({ 
            message: 'Exam submitted successfully', 
            score: totalScore 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error submitting exam', error: error.message });
    }
};

// Get all evaluated attempts for the logged-in student
exports.getStudentResults = async (req, res) => {
    try {
        const studentId = req.user.id;

        const attempts = await QuizAttempt.find({
            studentId,
            status: { $in: ['Submitted', 'Evaluated'] }
        })
            .populate('quizId', 'title totalMarks duration')
            .sort({ submittedAt: -1 });

        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
};

// Get detailed result for a specific attempt
exports.getResultDetail = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const studentId = req.user.id;

        const attempt = await QuizAttempt.findById(attemptId).populate('quizId');

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        // Verify ownership: ensure the attempt belongs to the student
        if (attempt.studentId.toString() !== studentId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: This attempt does not belong to you' });
        }

        // Get the quiz with full questions to compare answers
        const quiz = await Quiz.findById(attempt.quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Build detailed response
        const detailedAttempt = {
            _id: attempt._id,
            quizTitle: quiz.title,
            totalMarks: quiz.totalMarks,
            totalScore: attempt.totalScore,
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            questions: quiz.questions.map((question) => {
                const answer = attempt.answers.find(a => a.questionId.toString() === question._id.toString());
                return {
                    questionId: question._id,
                    questionText: question.text,
                    type: question.type,
                    marks: question.marks,
                    submittedAnswer: answer?.submittedAnswer || '',
                    correctAnswer: question.type === 'MCQ' ? question.correctAnswer : null,
                    isCorrect: answer?.isCorrect || false,
                    marksAwarded: answer?.marksAwarded || 0,
                    options: question.type === 'MCQ' ? question.options : []
                };
            })
        };

        // Calculate percentage
        const percentage = quiz.totalMarks > 0 
            ? Math.round((attempt.totalScore / quiz.totalMarks) * 100) 
            : 0;

        res.json({ ...detailedAttempt, percentage });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching result detail', error: error.message });
    }
};