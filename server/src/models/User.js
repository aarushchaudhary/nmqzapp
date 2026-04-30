const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will store hashed password
    name: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Admin', 'Faculty', 'Placecom', 'Student'], 
        required: true 
    },
    // Academic references (primarily for Students/Faculty)
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    specialization: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialization' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);