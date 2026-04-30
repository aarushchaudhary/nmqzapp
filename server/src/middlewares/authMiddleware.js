const jwt = require('jsonwebtoken');

// 1. Verify if the user is logged in
const protect = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1]; // Get token from "Bearer <token>"
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            
            req.user = decoded; // Attach user payload to request
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// 2. Verify Role (Role-based Access Control)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };