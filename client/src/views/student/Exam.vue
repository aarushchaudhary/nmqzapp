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
              @change="syncAnswer(currentQuestion._id, option)"
            >
            <label class="form-check-label">{{ option }}</label>
          </div>
        </div>

        <div v-else>
          <textarea 
            class="form-control" 
            rows="5" 
            v-model="answers[currentQuestion._id]"
            @blur="syncAnswer(currentQuestion._id, answers[currentQuestion._id])"
            placeholder="Type your answer here..."
          ></textarea>
        </div>
      </div>
      
      <div class="card-footer bg-white d-flex justify-content-between">
        <button class="btn btn-outline-secondary" @click="prevQuestion" :disabled="currentQuestionIndex === 0">Previous</button>
        <button v-if="isLastQuestion" class="btn btn-success" @click="submitExam">Submit Exam</button>
        <button v-else class="btn btn-primary" @click="nextQuestion">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { io } from 'socket.io-client';
import axios from 'axios';

const router = useRouter();
const socket = ref(null);

// Exam State
const quizTitle = ref("Midterm Examination");
const questions = ref([]); // Fetched from API
const currentQuestionIndex = ref(0);
const answers = ref({}); // Stores answers locally: { questionId: 'Selected Option' }
const timeLeft = ref(3600); // e.g., 3600 seconds (1 hour)
let timerInterval = null;

// Computed Properties
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1);
const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
    const s = (timeLeft.value % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
});

// Real-Time Socket Connection
const setupWebSockets = () => {
    socket.value = io('http://localhost:5000');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Listen for forced disqualification from faculty/system
    socket.value.on('force_exam_lock', (data) => {
        alert(`EXAM LOCKED: ${data.reason}`);
        router.push('/student/disqualified');
    });
};

// Exam Logic
const nextQuestion = () => currentQuestionIndex.value++;
const prevQuestion = () => currentQuestionIndex.value--;

const syncAnswer = async (questionId, answer) => {
    // 1. Emit socket event for live faculty monitoring
    socket.value.emit('student_progress_update', {
        quizId: 'quiz_123', // Dynamically get this
        studentId: JSON.parse(localStorage.getItem('user')).id,
        progressText: `Answered Q${currentQuestionIndex.value + 1}`
    });

    // 2. Call backend API to save draft to MongoDB
    // await axios.post('/api/student/save-answer', { questionId, answer }, ...headers);
};

const submitExam = async () => {
    if(confirm("Are you sure you want to submit your exam?")) {
        // API call to finalize exam
        router.push('/student/results');
    }
};

const startTimer = () => {
    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) timeLeft.value--;
        else {
            clearInterval(timerInterval);
            submitExam(); // Auto-submit when time is up
        }
    }, 1000);
};

onMounted(() => {
    // Fetch questions from API here, then start exam
    // questions.value = response.data;
    setupWebSockets();
    startTimer();
});

onUnmounted(() => {
    clearInterval(timerInterval);
    if(socket.value) socket.value.disconnect();
});
</script>