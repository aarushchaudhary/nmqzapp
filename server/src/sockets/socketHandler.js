// In-memory tracking of active exam sessions
// Structure: { quizId: { studentId: { socketId, studentName, currentQuestion, startedAt, violations } } }
const activeExamSessions = {};
const SystemLog = require('../models/SystemLog');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // 1. Student Starts Exam - Track the session
        socket.on('join_exam_lobby', (data) => {
            const { quizId, studentId, studentName } = data;
            
            // Initialize quiz tracking if not exists
            if (!activeExamSessions[quizId]) {
                activeExamSessions[quizId] = {};
            }
            
            // Track this student's exam session
            activeExamSessions[quizId][studentId] = {
                socketId: socket.id,
                studentName,
                currentQuestion: 0,
                startedAt: new Date(),
                violations: [],
                isActive: true
            };
            
            socket.join(`quiz_${quizId}`);
            
            // Notify faculty monitoring this quiz about the new student
            io.to(`quiz_${quizId}_faculty`).emit('student_joined', {
                studentId,
                studentName,
                startedAt: new Date(),
                currentQuestion: 0
            });
            
            console.log(`${studentName} (${studentId}) joined exam for quiz ${quizId}`);
        });

        // 2. Faculty Joins Monitoring Room
        socket.on('faculty_monitor_quiz', (data) => {
            const { quizId, facultyId, facultyName } = data;
            socket.join(`quiz_${quizId}_faculty`);
            
            // Send current list of active students to the faculty
            const activeStudents = activeExamSessions[quizId] || {};
            const studentList = Object.entries(activeStudents).map(([studentId, session]) => ({
                studentId,
                studentName: session.studentName,
                currentQuestion: session.currentQuestion,
                startedAt: session.startedAt,
                violations: session.violations,
                isActive: session.isActive
            }));
            
            socket.emit('monitoring_initialized', {
                quizId,
                activeStudents: studentList,
                timestamp: new Date()
            });
            
            console.log(`${facultyName} (${facultyId}) started monitoring quiz ${quizId}`);
        });

        // 3. Live Progress Update (Student answers a question)
        socket.on('student_progress_update', (data) => {
            const { quizId, studentId, currentQuestion, questionText } = data;
            
            // Update session tracking
            if (activeExamSessions[quizId] && activeExamSessions[quizId][studentId]) {
                activeExamSessions[quizId][studentId].currentQuestion = currentQuestion;
            }
            
            // Broadcast update to all faculty monitoring this quiz
            io.to(`quiz_${quizId}_faculty`).emit('live_monitoring_update', {
                studentId,
                currentQuestion,
                questionText,
                timestamp: new Date()
            });
        });

        // 4. Security Violation Alert
        socket.on('security_violation_detected', async (data) => {
            const { quizId, studentId, reason } = data;
            
            // Record violation in memory
            if (activeExamSessions[quizId] && activeExamSessions[quizId][studentId]) {
                activeExamSessions[quizId][studentId].violations.push({
                    reason,
                    timestamp: new Date()
                });
            }
            
            // Save to MongoDB asynchronously
            try {
                await SystemLog.create({
                    studentId,
                    quizId,
                    action: 'security_violation',
                    reason,
                    severity: 'high'
                });
            } catch (error) {
                console.error('Error saving system log:', error);
            }
            
            // Notify all faculty monitoring this quiz
            io.to(`quiz_${quizId}_faculty`).emit('student_security_violation', {
                studentId,
                reason,
                violationCount: activeExamSessions[quizId]?.[studentId]?.violations?.length || 1,
                timestamp: new Date()
            });
            
            // Force lock the student's screen
            io.to(socket.id).emit('force_exam_lock', { reason });
        });

        // 5. Student Submits Exam
        socket.on('exam_submitted', (data) => {
            const { quizId, studentId } = data;
            
            // Mark session as inactive
            if (activeExamSessions[quizId] && activeExamSessions[quizId][studentId]) {
                activeExamSessions[quizId][studentId].isActive = false;
                activeExamSessions[quizId][studentId].submittedAt = new Date();
            }
            
            // Notify faculty
            io.to(`quiz_${quizId}_faculty`).emit('student_submitted', {
                studentId,
                submittedAt: new Date()
            });
            
            socket.leave(`quiz_${quizId}`);
        });

        // 6. Cleanup on disconnect
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            
            // Remove student from active sessions
            for (const quizId in activeExamSessions) {
                for (const studentId in activeExamSessions[quizId]) {
                    if (activeExamSessions[quizId][studentId].socketId === socket.id) {
                        activeExamSessions[quizId][studentId].isActive = false;
                        
                        // Notify faculty
                        io.to(`quiz_${quizId}_faculty`).emit('student_disconnected', {
                            studentId,
                            disconnectedAt: new Date()
                        });
                        
                        delete activeExamSessions[quizId][studentId];
                    }
                }
                
                // Clean up empty quiz entries
                if (Object.keys(activeExamSessions[quizId]).length === 0) {
                    delete activeExamSessions[quizId];
                }
            }
        });
    });
};