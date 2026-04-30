const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    submittedAnswer: { type: String },
    isCorrect: { type: Boolean },
    marksAwarded: { type: Number, default: 0 }
});

const quizAttemptSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    
    answers: [answerSchema],
    totalScore: { type: Number, default: 0 },
    
    // Status tracking
    status: { type: String, enum: ['In Progress', 'Submitted', 'Evaluated'], default: 'In Progress' },
    disqualified: { type: Boolean, default: false },
    disqualificationReason: { type: String },
    
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);