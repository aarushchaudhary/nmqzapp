const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true
        },
        action: {
            type: String,
            required: true,
            enum: [
                'security_violation',
                'multiple_tabs_detected',
                'focus_lost',
                'suspicious_activity'
            ]
        },
        reason: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index for faster queries
systemLogSchema.index({ studentId: 1, quizId: 1 });
systemLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
