const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username, isActive: true });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT Payload
        const payload = {
            id: user._id,
            role: user.role,
            name: user.name
        };

        // Sign Token (Expires in 8 hours, suitable for exam duration)
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '8h' });

        res.json({
            message: 'Login successful',
            token,
            user: payload
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};