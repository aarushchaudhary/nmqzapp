require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // We need this to hash the password
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const seedAdmin = async () => {
    await connectDB();

    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit();
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create Admin
        await User.create({
            username: 'admin',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'Admin'
        });

        console.log('Admin user created successfully! (Username: admin, Password: admin123)');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();