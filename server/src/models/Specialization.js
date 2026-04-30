const mongoose = require('mongoose');

const specializationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Specialization', specializationSchema);
