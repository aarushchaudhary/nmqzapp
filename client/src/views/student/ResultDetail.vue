<template>
  <div class="container-fluid mt-4">
    <!-- Loading State -->
    <div v-if="loading" class="card shadow">
      <div class="card-body text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading result details...</p>
      </div>
    </div>

    <!-- Result Detail -->
    <div v-else-if="result" class="container-fluid">
      <!-- Header -->
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="mb-1 text-primary fw-bold">{{ result.quizTitle }}</h3>
            <p class="text-muted mb-0">{{ formatDate(result.submittedAt) }}</p>
          </div>
          <div class="d-flex gap-2 d-print-none">
            <button class="btn btn-outline-primary" @click="printResult">🖨️ Print / Save as PDF</button>
            <button class="btn btn-outline-secondary" @click="goBack">← Back to Results</button>
          </div>
        </div>

        <!-- Score Summary Card -->
        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-6">
                <div class="mb-3 mb-md-0">
                  <h6 class="text-muted mb-2">Final Score</h6>
                  <div class="d-flex align-items-center gap-2">
                    <span class="display-5 fw-bold text-primary">{{ result.totalScore }}</span>
                    <span class="text-muted">/ {{ result.totalMarks }}</span>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="row">
                  <div class="col-6">
                    <h6 class="text-muted mb-2">Percentage</h6>
                    <p class="fs-4 fw-bold" :class="getPercentageClass(result.percentage)">
                      {{ result.percentage }}%
                    </p>
                  </div>
                  <div class="col-6">
                    <h6 class="text-muted mb-2">Status</h6>
                    <span :class="getStatusBadgeClass(result.status)">
                      {{ result.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-3">
              <div class="progress" style="height: 10px;">
                <div
                  class="progress-bar"
                  :class="getProgressBarClass(result.percentage)"
                  :style="{ width: result.percentage + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Questions Breakdown -->
      <div class="mb-5">
        <h5 class="fw-bold mb-3">Questions Review</h5>

        <div v-for="(question, index) in result.questions" :key="question.questionId" class="card shadow-sm border-0 mb-3">
          <div class="card-body">
            <!-- Question Header -->
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="flex-grow-1">
                <h6 class="card-title fw-bold">
                  Question {{ index + 1 }}
                  <span class="badge" :class="question.isCorrect ? 'bg-success' : 'bg-danger'" style="margin-left: 10px;">
                    {{ question.isCorrect ? '✓ Correct' : '✗ Incorrect' }}
                  </span>
                </h6>
                <p class="mb-2 text-dark">{{ question.questionText }}</p>
              </div>
              <div class="text-end">
                <span class="badge bg-info">{{ question.marksAwarded }} / {{ question.marks }} marks</span>
              </div>
            </div>

            <!-- MCQ Options -->
            <div v-if="question.type === 'MCQ'" class="mb-3">
              <div class="mb-2">
                <small class="text-muted fw-bold">Options:</small>
              </div>
              <div v-for="(option, optIdx) in question.options" :key="optIdx" class="mb-2">
                <div
                  class="p-2 rounded"
                  :class="getOptionClass(question, option)"
                >
                  <small class="fw-bold me-2">{{ String.fromCharCode(65 + optIdx) }}.</small>
                  <small>{{ option }}</small>
                  <span
                    v-if="option === question.correctAnswer"
                    class="badge bg-success ms-2"
                  >
                    ✓ Correct
                  </span>
                  <span
                    v-if="option === question.submittedAnswer && option !== question.correctAnswer"
                    class="badge bg-danger ms-2"
                  >
                    ✗ Your Answer
                  </span>
                  <span
                    v-if="option === question.submittedAnswer && option === question.correctAnswer"
                    class="badge bg-success ms-2"
                  >
                    ✓ Your Answer
                  </span>
                </div>
              </div>
            </div>

            <!-- Descriptive Answer -->
            <div v-if="question.type === 'Descriptive'" class="mb-3">
              <div class="mb-2">
                <small class="text-muted fw-bold">Your Answer:</small>
              </div>
              <div class="p-3 bg-light rounded mb-3 border-start border-4" :class="question.isCorrect ? 'border-success' : 'border-warning'">
                <small class="text-dark">{{ question.submittedAnswer || '(No answer provided)' }}</small>
              </div>
            </div>

            <!-- Answer Summary -->
            <div class="row mt-3 pt-3 border-top">
              <div class="col-md-6">
                <small class="text-muted">
                  <strong>Your Answer:</strong> {{ question.submittedAnswer || 'Not answered' }}
                </small>
              </div>
              <div v-if="question.type === 'MCQ'" class="col-md-6">
                <small class="text-muted">
                  <strong>Correct Answer:</strong> {{ question.correctAnswer }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="card shadow">
      <div class="card-body text-center py-5">
        <p class="text-danger fs-5">Could not load result details.</p>
        <button class="btn btn-secondary mt-2" @click="goBack">Go Back</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const result = ref(null);
const loading = ref(true);

const fetchResultDetail = async () => {
  try {
    const { id } = route.params;
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:5000/api/student/results/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    result.value = response.data;
  } catch (error) {
    console.error('Error fetching result detail:', error);
    alert(error.response?.data?.message || 'Failed to load result details');
  } finally {
    loading.value = false;
  }
};

const getOptionClass = (question, option) => {
  if (option === question.correctAnswer) {
    return 'bg-success bg-opacity-10 border border-success';
  }
  if (option === question.submittedAnswer && option !== question.correctAnswer) {
    return 'bg-danger bg-opacity-10 border border-danger';
  }
  return 'bg-light border';
};

const getPercentageClass = (percentage) => {
  if (percentage >= 80) return 'text-success';
  if (percentage >= 60) return 'text-warning';
  return 'text-danger';
};

const getProgressBarClass = (percentage) => {
  if (percentage >= 80) return 'bg-success';
  if (percentage >= 60) return 'bg-warning';
  return 'bg-danger';
};

const getStatusBadgeClass = (status) => {
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

const goBack = () => {
  router.push('/student/results');
};

const printResult = () => {
  window.print();
};

onMounted(() => {
  fetchResultDetail();
});
</script>

<style scoped>
/* Print-specific styling */
@media print {
  /* Hide navbar and action buttons when printing */
  .d-print-none {
    display: none !important;
  }

  /* Set margins and page sizing */
  body {
    margin: 0;
    padding: 0.5in;
  }

  /* Hide nav and ensure proper page breaks */
  .container-fluid {
    margin: 0;
    padding: 0;
  }

  /* Ensure cards are visible in print */
  .card {
    box-shadow: none;
    border: 1px solid #dee2e6;
    page-break-inside: avoid;
  }

  /* Prevent background colors from being hidden */
  .bg-light,
  .bg-success,
  .bg-danger,
  .bg-warning {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Ensure badges are visible */
  .badge {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Improve table printing */
  table {
    page-break-inside: avoid;
  }

  /* Better margins for questions */
  .card-body {
    page-break-inside: avoid;
  }
}
</style>
