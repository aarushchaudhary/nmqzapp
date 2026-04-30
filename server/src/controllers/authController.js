const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Check for Hardcoded Admin (from .env)
        if (
            username === process.env.ADMIN_USERNAME && 
            password === process.env.ADMIN_PASSWORD
        ) {
            // Create JWT Payload for Admin
            const adminPayload = {
                id: 'admin_id_env', // A dummy ID since they aren't in the DB
                role: 'Admin',
                name: 'System Admin'
            };

            const adminToken = jwt.sign(adminPayload, process.env.JWT_SECRET, { expiresIn: '8h' });

            return res.json({
                message: 'Admin Login successful',
                token: adminToken,
                user: adminPayload
            });
        }

        // 2. If not the admin, check the database for other users (Faculty/Student)
        const user = await User.findOne({ username, isActive: true });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT Payload for DB User
        const payload = {
            id: user._id,
            role: user.role,
            name: user.name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({
            message: 'Login successful',
            token,
            user: payload
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};