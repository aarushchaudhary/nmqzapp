require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io'); // Import Socket.io
const connectDB = require('./src/config/db');

// Connect Database
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your Vue Vite dev server
        methods: ["GET", "POST"]
    }
});

// Pass the `io` instance to a dedicated socket handler file
require('./src/sockets/socketHandler')(io);

// Mount Routes (from Phase 3)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/faculty', require('./src/routes/facultyRoutes'));
app.use('/api/student', require('./src/routes/studentRoutes'));
app.use('/api/placecom', require('./src/routes/placecomRoutes'));

const PORT = process.env.PORT || 5000;
// Make sure to use server.listen(), NOT app.listen()
server.listen(PORT, () => console.log(`Server & WebSockets running on port ${PORT}`));