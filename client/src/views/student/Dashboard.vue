<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Student Dashboard</h2>
      <button @click="logout" class="btn btn-danger">Logout</button>
    </div>

    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">Active Exams</h5>
      </div>
      <div class="card-body">
        <div v-if="isLoading" class="text-center py-3">
           <span class="spinner-border text-primary"></span>
        </div>
        
        <div v-else-if="quizzes.length === 0" class="text-center py-4 text-muted">
           <p>No active exams available at the moment.</p>
        </div>

        <ul class="list-group list-group-flush" v-else>
          <li v-for="quiz in quizzes" :key="quiz._id" class="list-group-item d-flex justify-content-between align-items-center py-3">
            <div>
              <h5 class="mb-1">{{ quiz.title }}</h5>
              <small class="text-muted">Duration: {{ quiz.durationMinutes }} mins | Ends: {{ new Date(quiz.endTime).toLocaleString() }}</small>
            </div>
            <button @click="startExam(quiz._id)" class="btn btn-success px-4">Start Exam</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const quizzes = ref([]);
const isLoading = ref(true);

const fetchQuizzes = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/student/quizzes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        quizzes.value = response.data;
    } catch (error) {
        console.error("Error fetching quizzes", error);
    } finally {
        isLoading.value = false;
    }
};

const startExam = (quizId) => {
    // Navigate to the Exam view we built in Phase 5, passing the Quiz ID
    router.push({ name: 'StudentExam', params: { id: quizId } });
};

const logout = () => {
    localStorage.clear();
    router.push('/');
};

onMounted(() => {
    fetchQuizzes();
});
</script>