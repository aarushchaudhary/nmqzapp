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

// --- FACULTY: Get Quiz with Monitoring Data ---
exports.getQuizForMonitoring = async (req, res) => {
    try {
        const { quizId } = req.params;
        const quiz = await Quiz.findById(quizId);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Verify that the requesting user is the faculty who created this quiz
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to monitor this quiz' });
        }
        
        // Fetch all quiz attempts (submitted or in progress) for this quiz
        const attempts = await QuizAttempt.find({ quizId })
            .populate('studentId', 'username name')
            .select('studentId status startedAt submittedAt disqualified disqualificationReason answers totalScore');
        
        res.json({
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                durationMinutes: quiz.durationMinutes,
                startTime: quiz.startTime,
                endTime: quiz.endTime,
                questionCount: quiz.questions.length,
                status: quiz.status
            },
            attempts
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching monitoring data', error: error.message });
    }
};

// --- FACULTY: Get Attempts for Evaluation ---
exports.getAttemptsForEvaluation = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Verify quiz ownership
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Fetch all submitted attempts for this quiz
        const attempts = await QuizAttempt.find({ quizId, status: { $in: ['Submitted', 'Evaluated'] } })
            .populate('studentId', 'username name email')
            .lean();
        
        // Map quiz questions into attempts for easy reference
        const attemptsWithQuestions = attempts.map(attempt => ({
            ...attempt,
            questions: quiz.questions.map(q => ({
                _id: q._id,
                questionText: q.questionText,
                type: q.type,
                options: q.options,
                marks: q.marks,
                correctAnswer: q.correctAnswer
            }))
        }));
        
        res.json({
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                totalQuestions: quiz.questions.length
            },
            attempts: attemptsWithQuestions
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attempts', error: error.message });
    }
};

// --- FACULTY: Save Evaluation Grades ---
exports.saveEvaluationGrades = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { attemptId, grades } = req.body; // grades: { questionId: marksAwarded }
        
        // Verify quiz ownership
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Find and update the attempt
        const attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
        if (attempt.quizId.toString() !== quizId) {
            return res.status(400).json({ message: 'Attempt does not belong to this quiz' });
        }
        
        // Update marks for each question
        let totalScore = 0;
        attempt.answers.forEach(answer => {
            if (grades[answer.questionId]) {
                answer.marksAwarded = grades[answer.questionId];
            }
            totalScore += answer.marksAwarded || 0;
        });
        
        attempt.totalScore = totalScore;
        attempt.status = 'Evaluated';
        await attempt.save();
        
        res.json({
            message: 'Grades saved successfully',
            attempt: {
                _id: attempt._id,
                totalScore: attempt.totalScore,
                status: attempt.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error saving grades', error: error.message });
    }
};

// --- FACULTY: Get All Evaluated Results for Export ---
exports.getEvaluatedResults = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Verify quiz ownership
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Fetch all evaluated attempts
        const attempts = await QuizAttempt.find({ quizId, status: 'Evaluated' })
            .populate('studentId', 'username name email')
            .lean();
        
        res.json({
            quiz: {
                title: quiz.title,
                totalQuestions: quiz.questions.length
            },
            results: attempts.map(attempt => ({
                studentName: attempt.studentId.name,
                studentUsername: attempt.studentId.username,
                studentEmail: attempt.studentId.email,
                totalScore: attempt.totalScore,
                submittedAt: attempt.submittedAt,
                disqualified: attempt.disqualified,
                disqualificationReason: attempt.disqualificationReason
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
};

// --- FACULTY: Update Quiz ---
exports.updateQuiz = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const { title, description, durationMinutes, startTime, endTime, questions } = req.body;
        
        // Find quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        // Verify ownership
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this quiz' });
        }
        
        // Check if quiz can be edited (Draft status or no attempts started)
        const attemptCount = await QuizAttempt.countDocuments({ quizId });
        if (quiz.status !== 'Draft' && attemptCount > 0) {
            return res.status(400).json({ 
                message: 'Cannot edit quiz - students have already started taking it' 
            });
        }
        
        // Update quiz
        quiz.title = title || quiz.title;
        quiz.description = description || quiz.description;
        quiz.durationMinutes = durationMinutes || quiz.durationMinutes;
        quiz.startTime = startTime || quiz.startTime;
        quiz.endTime = endTime || quiz.endTime;
        if (questions) quiz.questions = questions;
        
        await quiz.save();
        
        res.json({ message: 'Quiz updated successfully', quiz });
    } catch (error) {
        res.status(500).json({ message: 'Error updating quiz', error: error.message });
    }
};

// --- FACULTY: Delete Quiz ---
exports.deleteQuiz = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        
        // Find quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        // Verify ownership
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this quiz' });
        }
        
        // Check if quiz can be deleted
        const attemptCount = await QuizAttempt.countDocuments({ quizId });
        if (quiz.status !== 'Draft' && attemptCount > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete quiz - students have already started taking it' 
            });
        }
        
        // Delete quiz
        await Quiz.findByIdAndDelete(quizId);
        
        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};

// --- FACULTY: Export Results as CSV ---
exports.exportResultsAsCSV = async (req, res) => {
    try {
        const { quizId } = req.params;
        
        // Verify quiz ownership
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Fetch all evaluated attempts
        const attempts = await QuizAttempt.find({ quizId, status: 'Evaluated' })
            .populate('studentId', 'username name email')
            .lean();
        
        // Format CSV Header
        const headers = ['Student Name', 'Username', 'Email', 'Total Score', 'Submitted At', 'Disqualified', 'Disqualification Reason'];
        
        // Format CSV Rows
        const rows = attempts.map(attempt => [
            attempt.studentId.name,
            attempt.studentId.username,
            attempt.studentId.email,
            attempt.totalScore,
            new Date(attempt.submittedAt).toLocaleString(),
            attempt.disqualified ? 'Yes' : 'No',
            attempt.disqualificationReason || ''
        ]);
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="quiz_results_${quiz.title.replace(/\s+/g, '_')}_${Date.now()}.csv"`);
        res.send(csvContent);
        
    } catch (error) {
        res.status(500).json({ message: 'Error exporting results', error: error.message });
    }
};

// --- FACULTY: Bulk Upload Questions from CSV ---
exports.bulkUploadQuestions = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }
        
        // Find quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        // Verify ownership
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this quiz' });
        }
        
        // Parse CSV file
        const csv = require('csv-parser');
        const { Readable } = require('stream');
        
        const questions = [];
        const buffer = req.file.buffer.toString('utf-8');
        
        await new Promise((resolve, reject) => {
            Readable.from([buffer])
                .pipe(csv())
                .on('data', (row) => {
                    // Expected CSV columns: questionText, type, options, correctAnswer, marks
                    const question = {
                        questionText: row.questionText || row['Question Text'] || '',
                        type: row.type || row['Type'] || 'MCQ',
                        options: row.options ? row.options.split('|') : [], // Pipe-separated options
                        correctAnswer: row.correctAnswer || row['Correct Answer'] || '',
                        marks: parseInt(row.marks || row['Marks'] || 1)
                    };
                    
                    if (question.questionText) {
                        questions.push(question);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });
        
        if (questions.length === 0) {
            return res.status(400).json({ message: 'No valid questions found in the file' });
        }
        
        // Append questions to quiz
        quiz.questions.push(...questions);
        await quiz.save();
        
        res.json({
            message: `Successfully added ${questions.length} question(s) to the quiz`,
            questionsAdded: questions.length,
            totalQuestions: quiz.questions.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading questions', error: error.message });
    }
};

// --- FACULTY: Get Quiz Item Analysis ---
exports.getQuizAnalysis = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        
        // Find quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        // Verify ownership
        if (quiz.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Fetch all attempts for this quiz
        const attempts = await QuizAttempt.find({ quizId }).lean();
        
        // Build analysis per question
        const analysis = quiz.questions.map((question, idx) => {
            let totalAttempts = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            let unansweredCount = 0;
            
            attempts.forEach(attempt => {
                const answer = attempt.answers[idx];
                if (!answer) return;
                
                totalAttempts++;
                
                if (!answer.submittedAnswer) {
                    unansweredCount++;
                } else if (answer.isCorrect === true) {
                    correctCount++;
                } else {
                    incorrectCount++;
                }
            });
            
            return {
                questionNumber: idx + 1,
                questionText: question.questionText.substring(0, 100) + '...', // Truncate for display
                type: question.type,
                totalAttempts,
                correctCount,
                incorrectCount,
                unansweredCount,
                correctPercentage: totalAttempts > 0 ? ((correctCount / totalAttempts) * 100).toFixed(2) : 0,
                marks: question.marks
            };
        });
        
        res.json({
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                totalQuestions: quiz.questions.length,
                totalAttempts: attempts.length
            },
            analysis
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analysis', error: error.message });
    }
};

// --- FACULTY: Re-enable Student Attempt ---
exports.reenableStudent = async (req, res) => {
    try {
        const { attemptId } = req.params;
        
        // Find attempt
        const attempt = await QuizAttempt.findById(attemptId).populate('quizId');
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
        
        // Verify that the quiz belongs to the requesting faculty
        if (attempt.quizId.facultyId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Re-enable the student
        attempt.disqualified = false;
        attempt.disqualificationReason = null;
        await attempt.save();
        
        res.json({
            message: 'Student has been re-enabled',
            attempt: {
                _id: attempt._id,
                disqualified: attempt.disqualified
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error re-enabling student', error: error.message });
    }
};

// --- PLACECOM: Get All Evaluated Results Across System ---
exports.getPlacecomResults = async (req, res) => {
    try {
        // Fetch all evaluated attempts, populating student, quiz, course, school, and specialization details
        const attempts = await QuizAttempt.find({ status: 'Evaluated' })
            .populate({
                path: 'studentId',
                select: 'name username email course specialization school',
                populate: [
                    { path: 'course', select: 'name' },
                    { path: 'specialization', select: 'name' },
                    { path: 'school', select: 'name' }
                ]
            })
            .populate({
                path: 'quizId',
                select: 'title description startTime endTime durationMinutes'
            })
            .lean();
        
        // Format results for display
        const results = attempts.map(attempt => ({
            _id: attempt._id,
            studentName: attempt.studentId.name,
            studentUsername: attempt.studentId.username,
            studentEmail: attempt.studentId.email,
            course: attempt.studentId.course?.name || 'N/A',
            specialization: attempt.studentId.specialization?.name || 'N/A',
            school: attempt.studentId.school?.name || 'N/A',
            quizTitle: attempt.quizId.title,
            quizDescription: attempt.quizId.description,
            totalScore: attempt.totalScore,
            submittedAt: attempt.submittedAt,
            disqualified: attempt.disqualified,
            disqualificationReason: attempt.disqualificationReason || 'N/A'
        }));
        
        res.json({
            totalResults: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
};