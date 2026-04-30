module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // 1. Student Lobby Events
        socket.on('join_exam_lobby', (data) => {
            const { quizId, studentId, studentName } = data;
            // Join a specific room for this quiz
            socket.join(`quiz_${quizId}`); 
            
            // Broadcast to Faculty monitoring this quiz
            io.to(`quiz_${quizId}_faculty`).emit('student_joined', { studentId, studentName });
            console.log(`${studentName} joined lobby for quiz ${quizId}`);
        });

        // Faculty joins a monitoring room to receive updates
        socket.on('faculty_monitor_quiz', (quizId) => {
            socket.join(`quiz_${quizId}_faculty`);
        });

        // 2. Live Monitoring (When student answers a question)
        socket.on('student_progress_update', (data) => {
            const { quizId, studentId, progressText } = data;
            // Instantly push this update to the faculty dashboard
            io.to(`quiz_${quizId}_faculty`).emit('live_monitoring_update', { studentId, progressText });
        });

        // 3. Security Violation (Triggered by Secure Browser)
        socket.on('security_violation_detected', (data) => {
            const { quizId, studentId, reason } = data;
            
            // Notify Faculty immediately
            io.to(`quiz_${quizId}_faculty`).emit('student_disqualified_alert', { studentId, reason });
            
            // Optionally, emit an event back to the specific student to force-lock their screen
            io.to(socket.id).emit('force_exam_lock', { reason });
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};