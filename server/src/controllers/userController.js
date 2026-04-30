const User = require('../models/User');
const School = require('../models/School');
const Course = require('../models/Course');
const Specialization = require('../models/Specialization');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream');

// ========== USER CRUD ==========

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .populate('school', 'name')
            .populate('course', 'name')
            .populate('specialization', 'name')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('school', 'name')
            .populate('course', 'name')
            .populate('specialization', 'name');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, name, role, school, course, specialization } = req.body;
        
        // Validation
        if (!username || !password || !name || !role) {
            return res.status(400).json({ message: 'Username, password, name, and role are required' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            username,
            password: hashedPassword,
            name,
            role,
            school: school || null,
            course: course || null,
            specialization: specialization || null,
            isActive: true
        });
        
        await user.save();
        await user.populate('school', 'name');
        await user.populate('course', 'name');
        await user.populate('specialization', 'name');
        
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { username, password, name, role, school, course, specialization, isActive } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Check if new username is unique (if changed)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            user.username = username;
        }
        
        // Update password if provided
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        
        if (name) user.name = name;
        if (role) user.role = role;
        if (school !== undefined) user.school = school;
        if (course !== undefined) user.course = course;
        if (specialization !== undefined) user.specialization = specialization;
        if (isActive !== undefined) user.isActive = isActive;
        
        await user.save();
        await user.populate('school', 'name');
        await user.populate('course', 'name');
        await user.populate('specialization', 'name');
        
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Prevent deleting admin users (optional safety measure)
        if (user.role === 'Admin' && user.isActive) {
            return res.status(400).json({ message: 'Cannot delete active admin users' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

// ========== BULK UPLOAD ==========

exports.bulkUploadUsers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'CSV file is required' });
        }
        
        const results = [];
        const errors = [];
        let rowNumber = 1;
        
        // Convert buffer to stream
        const stream = Readable.from([req.file.buffer.toString()]);
        
        // Parse CSV and process each row
        stream
            .pipe(csv())
            .on('data', async (row) => {
                rowNumber++;
                try {
                    const { username, password, name, role, schoolName, courseName, specializationName } = row;
                    
                    // Validate required fields
                    if (!username || !password || !name || !role) {
                        errors.push({
                            row: rowNumber,
                            error: 'Missing required fields: username, password, name, role'
                        });
                        return;
                    }
                    
                    // Check if user exists
                    const existingUser = await User.findOne({ username });
                    if (existingUser) {
                        errors.push({
                            row: rowNumber,
                            error: `Username '${username}' already exists`
                        });
                        return;
                    }
                    
                    // Resolve school, course, specialization names to IDs
                    let schoolId = null;
                    let courseId = null;
                    let specializationId = null;
                    
                    if (schoolName) {
                        const school = await School.findOne({ name: schoolName });
                        if (!school) {
                            errors.push({
                                row: rowNumber,
                                error: `School '${schoolName}' not found`
                            });
                            return;
                        }
                        schoolId = school._id;
                    }
                    
                    if (courseName) {
                        const course = await Course.findOne({ name: courseName });
                        if (!course) {
                            errors.push({
                                row: rowNumber,
                                error: `Course '${courseName}' not found`
                            });
                            return;
                        }
                        courseId = course._id;
                    }
                    
                    if (specializationName) {
                        const spec = await Specialization.findOne({ name: specializationName });
                        if (!spec) {
                            errors.push({
                                row: rowNumber,
                                error: `Specialization '${specializationName}' not found`
                            });
                            return;
                        }
                        specializationId = spec._id;
                    }
                    
                    // Hash password
                    const hashedPassword = await bcrypt.hash(password, 10);
                    
                    // Create user
                    const user = new User({
                        username,
                        password: hashedPassword,
                        name,
                        role,
                        school: schoolId,
                        course: courseId,
                        specialization: specializationId,
                        isActive: true
                    });
                    
                    await user.save();
                    results.push({
                        username,
                        name,
                        role,
                        status: 'Created'
                    });
                    
                } catch (error) {
                    errors.push({
                        row: rowNumber,
                        error: error.message
                    });
                }
            })
            .on('end', () => {
                res.json({
                    message: 'Bulk upload completed',
                    created: results.length,
                    failed: errors.length,
                    results,
                    errors
                });
            })
            .on('error', (error) => {
                res.status(500).json({ message: 'Error parsing CSV', error: error.message });
            });
            
    } catch (error) {
        res.status(500).json({ message: 'Error uploading users', error: error.message });
    }
};

// Setup multer for file upload
const upload = multer({ storage: multer.memoryStorage() });
exports.upload = upload;
