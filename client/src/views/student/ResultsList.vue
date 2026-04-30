<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">My Results</h3>
        <p class="text-muted mb-0">View your evaluated exam attempts</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Exams</button>
    </div>

    <!-- Results Container -->
    <div class="row">
      <div class="col-12">
        <div v-if="loading" class="card shadow">
          <div class="card-body text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading your results...</p>
          </div>
        </div>

        <div v-else-if="results.length === 0" class="card shadow">
          <div class="card-body text-center py-5">
            <p class="text-muted fs-5">No evaluated results yet.</p>
            <p class="text-muted">Complete and submit exams to see your results here.</p>
          </div>
        </div>

        <div v-else class="row">
          <div v-for="result in results" :key="result._id" class="col-md-6 col-lg-4 mb-4">
            <div class="card shadow-sm border-0 h-100 hover-shadow">
              <div class="card-body d-flex flex-column">
                <!-- Quiz Title -->
                <h5 class="card-title text-primary fw-bold">{{ result.quizId?.title }}</h5>

                <!-- Score Badge -->
                <div class="mb-3">
                  <span :class="getScoreBadgeClass(result)">
                    {{ result.totalScore }} / {{ result.quizId?.totalMarks }} Marks
                  </span>
                </div>

                <!-- Percentage -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="text-muted">Score</small>
                    <small class="fw-bold" :class="getPercentageClass(result)">
                      {{ calculatePercentage(result) }}%
                    </small>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div
                      class="progress-bar"
                      :class="getProgressBarClass(result)"
                      :style="{ width: calculatePercentage(result) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- Details -->
                <div class="mb-3">
                  <small class="d-block text-muted">
                    📅 {{ formatDate(result.submittedAt) }}
                  </small>
                  <small class="d-block text-muted">
                    ⏱️ {{ result.quizId?.duration }} minutes
                  </small>
                </div>

                <!-- Status Badge -->
                <div class="mb-3">
                  <span :class="getStatusBadge(result.status)">
                    {{ result.status }}
                  </span>
                </div>

                <!-- View Details Button -->
                <button
                  class="btn btn-primary mt-auto"
                  @click="viewDetails(result._id)"
                >
                  View Details →
                </button>
              </div>
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
const results = ref([]);
const loading = ref(true);

const fetchResults = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/student/results', {
      headers: { Authorization: `Bearer ${token}` }
    });
    results.value = response.data;
  } catch (error) {
    console.error('Error fetching results:', error);
    alert('Failed to load your results');
  } finally {
    loading.value = false;
  }
};

const calculatePercentage = (result) => {
  if (!result.quizId?.totalMarks) return 0;
  return Math.round((result.totalScore / result.quizId.totalMarks) * 100);
};

const getScoreBadgeClass = (result) => {
  const percentage = calculatePercentage(result);
  if (percentage >= 80) return 'badge bg-success';
  if (percentage >= 60) return 'badge bg-warning';
  return 'badge bg-danger';
};

const getPercentageClass = (result) => {
  const percentage = calculatePercentage(result);
  if (percentage >= 80) return 'text-success';
  if (percentage >= 60) return 'text-warning';
  return 'text-danger';
};

const getProgressBarClass = (result) => {
  const percentage = calculatePercentage(result);
  if (percentage >= 80) return 'bg-success';
  if (percentage >= 60) return 'bg-warning';
  return 'bg-danger';
};

const getStatusBadge = (status) => {
  const statusClasses = {
    'Submitted': 'badge bg-info',
    'Evaluated': 'badge bg-success',
    'In Progress': 'badge bg-secondary'
  };
  return statusClasses[status] || 'badge bg-secondary';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const viewDetails = (attemptId) => {
  router.push(`/student/results/${attemptId}`);
};

const goBack = () => {
  router.push('/student/dashboard');
};

onMounted(() => {
  fetchResults();
});
</script>

<style scoped>
.hover-shadow {
  transition: box-shadow 0.3s ease;
}

.hover-shadow:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
