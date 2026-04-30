const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    type: { type: String, enum: ['MCQ', 'Descriptive'], required: true },
    options: [{ type: String }], // Array of strings for MCQ options
    correctAnswer: { type: String }, // For auto-evaluation of MCQs
    marks: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    
    // Exam Settings
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Published', 'Completed'], default: 'Draft' },
    
    // Embed the questions directly into the quiz document
    questions: [questionSchema] 
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);