<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">Item Analysis</h3>
        <p class="text-muted mb-0">{{ quizTitle }}</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Quizzes</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ error }}
      <button type="button" class="btn-close" @click="error = ''" aria-label="Close"></button>
    </div>

    <!-- Analysis Summary -->
    <div v-else class="row mb-4">
      <div class="col-md-3 mb-3">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="text-primary fw-bold text-uppercase mb-1">Total Attempts</div>
            <div class="h3 mb-0">{{ quizData.totalAttempts }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="text-success fw-bold text-uppercase mb-1">Total Questions</div>
            <div class="h3 mb-0">{{ quizData.totalQuestions }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="text-info fw-bold text-uppercase mb-1">Avg Correct</div>
            <div class="h3 mb-0">{{ avgCorrectPercentage.toFixed(2) }}%</div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card border-left-warning shadow h-100 py-2">
          <div class="card-body">
            <div class="text-warning fw-bold text-uppercase mb-1">Avg Incorrect</div>
            <div class="h3 mb-0">{{ avgIncorrectPercentage.toFixed(2) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analysis Table -->
    <div v-if="!loading && analysis.length > 0" class="card shadow mb-4">
      <div class="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
        <span>Question-wise Analysis</span>
        <button class="btn btn-sm btn-light" @click="exportAsCSV">📥 Export CSV</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center">Q#</th>
                <th>Question</th>
                <th class="text-center">Type</th>
                <th class="text-center">Total Attempts</th>
                <th class="text-center">Correct</th>
                <th class="text-center">Incorrect</th>
                <th class="text-center">Unanswered</th>
                <th class="text-center">Success Rate</th>
                <th class="text-center">Marks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in analysis" :key="item.questionNumber">
                <td class="text-center fw-bold">{{ item.questionNumber }}</td>
                <td>
                  <span class="text-truncate d-block" :title="item.questionText">
                    {{ item.questionText }}
                  </span>
                </td>
                <td class="text-center">
                  <span :class="['badge', item.type === 'MCQ' ? 'bg-success' : 'bg-info']">
                    {{ item.type }}
                  </span>
                </td>
                <td class="text-center">{{ item.totalAttempts }}</td>
                <td class="text-center">
                  <span class="badge bg-success">{{ item.correctCount }}</span>
                </td>
                <td class="text-center">
                  <span class="badge bg-danger">{{ item.incorrectCount }}</span>
                </td>
                <td class="text-center">
                  <span class="badge bg-warning">{{ item.unansweredCount }}</span>
                </td>
                <td class="text-center">
                  <div class="progress" style="height: 20px;">
                    <div 
                      class="progress-bar" 
                      :style="{ width: item.correctPercentage + '%', backgroundColor: getProgressColor(item.correctPercentage) }"
                      role="progressbar"
                    >
                      {{ item.correctPercentage }}%
                    </div>
                  </div>
                </td>
                <td class="text-center">{{ item.marks }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && analysis.length === 0" class="alert alert-info text-center py-5">
      <h5>No Data Available</h5>
      <p>This quiz has not been attempted yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const analysis = ref([]);
const quizData = ref({
  title: '',
  totalQuestions: 0,
  totalAttempts: 0
});

const quizTitle = computed(() => quizData.value.title);

const avgCorrectPercentage = computed(() => {
  if (analysis.value.length === 0) return 0;
  const avg = analysis.value.reduce((sum, item) => sum + parseFloat(item.correctPercentage), 0) / analysis.value.length;
  return avg;
});

const avgIncorrectPercentage = computed(() => {
  if (analysis.value.length === 0) return 0;
  const avg = analysis.value.reduce((sum, item) => sum + (100 - parseFloat(item.correctPercentage)), 0) / analysis.value.length;
  return avg;
});

const getProgressColor = (percentage) => {
  if (percentage >= 75) return '#28a745';
  if (percentage >= 50) return '#ffc107';
  return '#dc3545';
};

const fetchAnalysis = async () => {
  try {
    loading.value = true;
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/faculty/quiz/${route.params.id}/analysis`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    quizData.value = response.data.quiz;
    analysis.value = response.data.analysis;
  } catch (err) {
    error.value = err.response?.data?.message || 'Error fetching analysis';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const exportAsCSV = () => {
  if (analysis.value.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = ['Q#', 'Question', 'Type', 'Total Attempts', 'Correct', 'Incorrect', 'Unanswered', 'Success Rate (%)', 'Marks'];
  const rows = analysis.value.map(item => [
    item.questionNumber,
    `"${item.questionText}"`,
    item.type,
    item.totalAttempts,
    item.correctCount,
    item.incorrectCount,
    item.unansweredCount,
    item.correctPercentage,
    item.marks
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `item_analysis_${quizData.value.title.replace(/\s+/g, '_')}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchAnalysis();
});
</script>
