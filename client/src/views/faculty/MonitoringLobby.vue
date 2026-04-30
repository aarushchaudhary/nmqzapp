<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">{{ quizTitle }}</h3>
        <p class="text-muted mb-0">Live Exam Monitoring</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Quizzes</button>
    </div>

    <!-- Quiz Info -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Duration</h6>
            <h5 class="text-primary fw-bold">{{ quizDuration }} min</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Total Questions</h6>
            <h5 class="text-primary fw-bold">{{ totalQuestions }}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Active Students</h6>
            <h5 class="text-success fw-bold">{{ activeStudentsCount }}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Violations</h6>
            <h5 class="text-danger fw-bold">{{ totalViolations }}</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Students List -->
    <div class="card shadow">
      <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 class="mb-0 fw-bold">Students Taking Exam</h5>
        <small class="text-muted">Last updated: {{ lastUpdate }}</small>
      </div>
      <div class="card-body">
        <div v-if="activeStudents.length === 0" class="text-center text-muted py-4">
          <p>No students are currently taking this exam.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Student Name</th>
                <th>Current Question</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Violations</th>
                <th>Started At</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in activeStudents" :key="student.studentId" :class="getRowClass(student)">
                <td class="fw-bold">{{ student.studentName }}</td>
                <td>
                  <span class="badge bg-info">Q{{ student.currentQuestion + 1 }} / {{ totalQuestions }}</span>
                </td>
                <td>
                  <div class="progress" style="height: 20px; width: 150px;">
                    <div 
                      class="progress-bar bg-success" 
                      :style="{ width: getProgressPercentage(student) + '%' }"
                      role="progressbar"
                    >
                      {{ Math.round(getProgressPercentage(student)) }}%
                    </div>
                  </div>
                </td>
                <td>
                  <span v-if="student.isActive" class="badge bg-success">Active</span>
                  <span v-else class="badge bg-secondary">Inactive</span>
                </td>
                <td>
                  <span v-if="student.violations.length > 0" class="badge bg-danger">
                    {{ student.violations.length }} violations
                  </span>
                  <span v-else class="badge bg-success">Clear</span>
                </td>
                <td>
                  <small>{{ formatTime(student.startedAt) }}</small>
                </td>
                <td>
                  <small>{{ getElapsedTime(student.startedAt) }}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Violations Alert -->
    <div v-if="securityViolations.length > 0" class="card card-danger mt-4 shadow border-danger">
      <div class="card-header bg-danger text-white fw-bold">
        ⚠️ Security Violations Detected
      </div>
      <div class="card-body">
        <div v-for="(violation, idx) in securityViolations" :key="idx" class="alert alert-warning mb-2">
          <strong>{{ violation.studentName }}:</strong> {{ violation.reason }}
          <br>
          <small class="text-muted">{{ formatTime(violation.timestamp) }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { io } from 'socket.io-client';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const socket = ref(null);

// State
const quizId = ref(route.params.id);
const quizTitle = ref('Loading...');
const quizDuration = ref(0);
const totalQuestions = ref(0);
const activeStudents = ref([]);
const securityViolations = ref([]);
const lastUpdate = ref(new Date().toLocaleTimeString());

// Get user from localStorage
const getUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Computed Properties
const activeStudentsCount = computed(() => activeStudents.value.filter(s => s.isActive).length);
const totalViolations = computed(() => securityViolations.value.length);

// Fetch Quiz and Monitoring Data
const fetchMonitoringData = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/faculty/monitor/${quizId.value}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const { quiz, attempts } = response.data;
    quizTitle.value = quiz.title;
    quizDuration.value = quiz.durationMinutes;
    totalQuestions.value = quiz.questionCount;

    // Transform attempts data to display format
    activeStudents.value = attempts.map(attempt => ({
      studentId: attempt.studentId._id,
      studentName: attempt.studentId.name,
      currentQuestion: attempt.answers.length - 1, // Or track separately via Socket.io
      isActive: attempt.status === 'In Progress',
      violations: attempt.disqualified ? [{ reason: attempt.disqualificationReason }] : [],
      startedAt: new Date(attempt.startedAt),
      status: attempt.status
    }));

  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    alert('Failed to load monitoring data');
    router.push('/faculty/dashboard');
  }
};

// Setup Socket.io Connection for Real-Time Updates
const setupWebSockets = () => {
  socket.value = io('http://localhost:5000');
  const user = getUser();

  // Join monitoring room for this quiz
  socket.value.emit('faculty_monitor_quiz', {
    quizId: quizId.value,
    facultyId: user.id,
    facultyName: user.name
  });

  // Receive initial monitoring data
  socket.value.on('monitoring_initialized', (data) => {
    // Sync with fetched data
    console.log('Monitoring initialized:', data);
  });

  // Student joined the exam
  socket.value.on('student_joined', (data) => {
    const exists = activeStudents.value.find(s => s.studentId === data.studentId);
    if (!exists) {
      activeStudents.value.push({
        studentId: data.studentId,
        studentName: data.studentName,
        currentQuestion: data.currentQuestion || 0,
        isActive: true,
        violations: [],
        startedAt: new Date(data.startedAt),
        status: 'In Progress'
      });
    }
    updateLastUpdate();
  });

  // Student progress update
  socket.value.on('live_monitoring_update', (data) => {
    const student = activeStudents.value.find(s => s.studentId === data.studentId);
    if (student) {
      student.currentQuestion = data.currentQuestion;
    }
    updateLastUpdate();
  });

  // Security violation detected
  socket.value.on('student_security_violation', (data) => {
    const student = activeStudents.value.find(s => s.studentId === data.studentId);
    if (student) {
      student.violations.push({
        reason: data.reason,
        timestamp: new Date(data.timestamp)
      });
    }
    securityViolations.value.push({
      studentId: data.studentId,
      studentName: student?.studentName || 'Unknown',
      reason: data.reason,
      timestamp: new Date(data.timestamp)
    });
    updateLastUpdate();
  });

  // Student submitted exam
  socket.value.on('student_submitted', (data) => {
    const student = activeStudents.value.find(s => s.studentId === data.studentId);
    if (student) {
      student.isActive = false;
      student.status = 'Submitted';
    }
    updateLastUpdate();
  });

  // Student disconnected
  socket.value.on('student_disconnected', (data) => {
    const student = activeStudents.value.find(s => s.studentId === data.studentId);
    if (student) {
      student.isActive = false;
    }
    updateLastUpdate();
  });
};

// Helper Functions
const getRowClass = (student) => {
  if (student.violations.length > 0) return 'table-danger';
  if (!student.isActive) return 'table-light text-muted';
  return '';
};

const getProgressPercentage = (student) => {
  if (totalQuestions.value === 0) return 0;
  return ((student.currentQuestion + 1) / totalQuestions.value) * 100;
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString();
};

const getElapsedTime = (startedAt) => {
  const now = new Date();
  const start = new Date(startedAt);
  const diffMs = now - start;
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  return `${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
};

const updateLastUpdate = () => {
  lastUpdate.value = new Date().toLocaleTimeString();
};

const goBack = () => {
  router.push('/faculty/dashboard');
};

// Lifecycle
onMounted(async () => {
  await fetchMonitoringData();
  setupWebSockets();
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.table-danger {
  background-color: #f8d7da;
}

.card-danger {
  border-color: #dc3545 !important;
}

.card-header.bg-danger {
  background-color: #dc3545 !important;
}

.progress {
  background-color: #e9ecef;
  border-radius: 4px;
}
</style>
