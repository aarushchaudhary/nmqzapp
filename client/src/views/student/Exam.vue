<template>
  <div class="container-fluid mt-3">
    <div class="d-flex justify-content-between bg-light p-3 border rounded mb-4 shadow-sm">
      <h4 class="m-0 text-primary">{{ quizTitle }}</h4>
      <h4 class="m-0 text-danger fw-bold">
        Time Left: {{ formattedTime }}
      </h4>
    </div>

    <div class="card shadow" v-if="currentQuestion">
      <div class="card-header bg-white d-flex justify-content-between">
        <strong>Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</strong>
      </div>
      <div class="card-body">
        <h5 class="mb-4">{{ currentQuestion.questionText }}</h5>
        
        <div v-if="currentQuestion.type === 'MCQ'">
          <div class="form-check mb-2" v-for="(option, index) in currentQuestion.options" :key="index">
            <input 
              class="form-check-input" 
              type="radio" 
              :name="'question_' + currentQuestion._id"
              :value="option"
              v-model="answers[currentQuestion._id]"
              @change="syncAnswer"
            >
            <label class="form-check-label">{{ option }}</label>
          </div>
        </div>

        <div v-else>
          <textarea 
            class="form-control" 
            rows="5" 
            v-model="answers[currentQuestion._id]"
            @blur="syncAnswer"
            placeholder="Type your answer here..."
          ></textarea>
        </div>
      </div>
      
      <div class="card-footer bg-white d-flex justify-content-between">
        <button class="btn btn-outline-secondary" @click="prevQuestion" :disabled="currentQuestionIndex === 0">Previous</button>
        <button v-if="isLastQuestion" class="btn btn-success" @click="submitExam" :disabled="isExamSubmitting">
          {{ isExamSubmitting ? 'Submitting...' : 'Submit Exam' }}
        </button>
        <button v-else class="btn btn-primary" @click="nextQuestion">Next</button>
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

// Exam State
const quizId = ref(route.params.id);
const quizTitle = ref("Loading...");
const questions = ref([]);
const currentQuestionIndex = ref(0);
const answers = ref({});
const timeLeft = ref(3600); // Default 1 hour, will be set based on quiz
const isExamSubmitting = ref(false);
let timerInterval = null;

// Computed Properties
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1);
const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
    const s = (timeLeft.value % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
});

// Get user from localStorage
const getUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
};

// Fetch Quiz Data
const fetchQuizData = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/student/quiz/${quizId.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const quiz = response.data;
        quizTitle.value = quiz.title;
        questions.value = quiz.questions;
        timeLeft.value = quiz.durationMinutes * 60;
        
    } catch (error) {
        console.error('Error fetching quiz:', error);
        alert('Failed to load quiz');
        router.push('/student/dashboard');
    }
};

// Real-Time Socket Connection
const setupWebSockets = () => {
    socket.value = io('http://localhost:5000');
    const user = getUser();
    
    // Join exam lobby for real-time updates
    socket.value.emit('join_exam_lobby', {
        quizId: quizId.value,
        studentId: user.id,
        studentName: user.name
    });
    
    // Listen for forced disqualification from faculty/system
    socket.value.on('force_exam_lock', (data) => {
        clearInterval(timerInterval);
        alert(`EXAM LOCKED: ${data.reason}`);
        router.push('/student/dashboard');
    });
};

// Exam Logic
const nextQuestion = () => {
    if (!isLastQuestion.value) {
        currentQuestionIndex.value++;
    }
};

const prevQuestion = () => {
    if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--;
    }
};

const syncAnswer = () => {
    const user = getUser();
    
    // Emit socket event for live faculty monitoring
    socket.value.emit('student_progress_update', {
        quizId: quizId.value,
        studentId: user.id,
        currentQuestion: currentQuestionIndex.value,
        questionText: `Question ${currentQuestionIndex.value + 1}`
    });
};

const submitExam = async () => {
    if (!confirm("Are you sure you want to submit your exam? You cannot resume after submission.")) {
        return;
    }
    
    if (isExamSubmitting.value) return;
    isExamSubmitting.value = true;
    
    try {
        const token = localStorage.getItem('token');
        const user = getUser();
        
        // Prepare answers in the format expected by backend
        const formattedAnswers = {};
        questions.value.forEach(q => {
            formattedAnswers[q._id] = answers.value[q._id] || '';
        });
        
        // Submit exam via API
        const response = await axios.post(
            'http://localhost:5000/api/student/submit-exam',
            {
                quizId: quizId.value,
                answers: formattedAnswers
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        // Notify via socket that exam is submitted
        socket.value.emit('exam_submitted', {
            quizId: quizId.value,
            studentId: user.id
        });
        
        // Clear timer and redirect
        clearInterval(timerInterval);
        alert(`Exam submitted! Your score: ${response.data.score}`);
        router.push('/student/dashboard');
        
    } catch (error) {
        console.error('Error submitting exam:', error);
        alert('Failed to submit exam. Please try again.');
    } finally {
        isExamSubmitting.value = false;
    }
};

const startTimer = () => {
    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            clearInterval(timerInterval);
            submitExam(); // Auto-submit when time is up
        }
    }, 1000);
};

onMounted(async () => {
    await fetchQuizData();
    setupWebSockets();
    startTimer();
});

onUnmounted(() => {
    clearInterval(timerInterval);
    if (socket.value) {
        socket.value.disconnect();
    }
});
</script>