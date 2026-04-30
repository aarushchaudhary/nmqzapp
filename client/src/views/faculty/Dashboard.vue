<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-0 text-primary fw-bold">My Quizzes</h2>
        <p class="text-muted mb-0">Manage and monitor your exams</p>
      </div>
      <router-link to="/faculty/create-quiz" class="btn btn-primary btn-lg">
        + Create New Quiz
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="quizzes.length === 0" class="alert alert-info text-center py-5">
      <h5>No quizzes yet</h5>
      <p>Start by creating a new quiz to get started.</p>
    </div>

    <!-- Quizzes List -->
    <div v-else class="row">
      <div v-for="quiz in quizzes" :key="quiz._id" class="col-md-6 col-lg-4 mb-4">
        <div class="card shadow-sm h-100 border-0">
          <div class="card-header bg-primary text-white fw-bold">
            {{ quiz.title }}
          </div>
          <div class="card-body">
            <p class="text-muted mb-2">
              {{ quiz.description || 'No description' }}
            </p>
            <div class="d-flex justify-content-between text-sm mb-3">
              <span>
                <strong>Questions:</strong> {{ quiz.questions?.length || 0 }}
              </span>
              <span>
                <strong>Duration:</strong> {{ quiz.durationMinutes }} min
              </span>
            </div>
            <div class="mb-3">
              <span :class="'badge badge-' + getStatusClass(quiz.status)">
                {{ quiz.status }}
              </span>
            </div>
            <div class="text-sm text-muted mb-3">
              <small>Created: {{ formatDate(quiz.createdAt) }}</small>
            </div>
          </div>
          <div class="card-footer bg-light border-0">
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary flex-grow-1" @click="editQuiz(quiz._id)">
                ✏️ Edit
              </button>
              <button class="btn btn-sm btn-outline-success flex-grow-1" @click="monitorQuiz(quiz._id)">
                👁️ Monitor
              </button>
              <button class="btn btn-sm btn-outline-info flex-grow-1" @click="viewResults(quiz._id)">
                📊 Evaluate
              </button>
              <button class="btn btn-sm btn-outline-secondary flex-grow-1" @click="viewAnalysis(quiz._id)">
                📈 Analysis
              </button>
              <button class="btn btn-sm btn-outline-warning flex-grow-1" @click="exportResults(quiz._id)">
                ⬇️ Export
              </button>
            </div>
          </div>
        </div>
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
const loading = ref(true);

const fetchQuizzes = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/faculty/my-quizzes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    quizzes.value = response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    alert('Failed to load quizzes');
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status) => {
  switch(status) {
    case 'Draft': return 'secondary';
    case 'Published': return 'success';
    case 'Completed': return 'danger';
    default: return 'secondary';
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const editQuiz = (quizId) => {
  router.push(`/faculty/edit-quiz/${quizId}`);
};

const monitorQuiz = (quizId) => {
  router.push(`/faculty/monitor/${quizId}`);
};

const viewResults = (quizId) => {
  router.push(`/faculty/evaluate/${quizId}`);
};

const viewAnalysis = (quizId) => {
  router.push(`/faculty/analysis/${quizId}`);
};

const exportResults = async (quizId) => {
  try {
    const token = localStorage.getItem('token');
    
    // Fetch the CSV file
    const response = await axios.get(
      `http://localhost:5000/api/faculty/export/${quizId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      }
    );

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz_results_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('Results exported successfully!');
  } catch (error) {
    console.error('Error exporting results:', error);
    alert('Failed to export results');
  }
};

onMounted(() => {
  fetchQuizzes();
});
</script>

<style scoped>
.badge-success {
  background-color: #28a745;
}

.badge-secondary {
  background-color: #6c757d;
}

.badge-danger {
  background-color: #dc3545;
}

.btn-group {
  display: flex;
  gap: 5px;
}

.btn-group .btn {
  flex: 1;
}
</style>