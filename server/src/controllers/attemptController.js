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