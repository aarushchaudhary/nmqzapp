<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">System Logs</h3>
        <p class="text-muted mb-0">Security violations and system activity</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Admin</button>
    </div>

    <!-- Filters -->
    <div class="row mb-4">
      <div class="col-md-3">
        <input
          v-model="filterAction"
          type="text"
          class="form-control form-control-sm"
          placeholder="Filter by action..."
        >
      </div>
      <div class="col-md-3">
        <input
          v-model="filterStudent"
          type="text"
          class="form-control form-control-sm"
          placeholder="Filter by student name..."
        >
      </div>
      <div class="col-md-3">
        <input
          v-model="filterQuiz"
          type="text"
          class="form-control form-control-sm"
          placeholder="Filter by quiz title..."
        >
      </div>
      <div class="col-md-3">
        <button class="btn btn-outline-secondary btn-sm w-100" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="card shadow">
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading system logs...</p>
        </div>

        <div v-else-if="filteredLogs.length === 0" class="text-center text-muted py-5">
          <p>No logs found.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Timestamp</th>
                <th>Student</th>
                <th>Quiz</th>
                <th>Action</th>
                <th>Reason</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredLogs" :key="log._id">
                <td>
                  <small>{{ formatDateTime(log.timestamp) }}</small>
                </td>
                <td class="fw-bold">
                  {{ log.studentId?.name || '—' }}
                </td>
                <td>
                  {{ log.quizId?.title || '—' }}
                </td>
                <td>
                  <span class="badge bg-info">{{ formatAction(log.action) }}</span>
                </td>
                <td>
                  <small class="text-muted">{{ log.reason }}</small>
                </td>
                <td>
                  <span :class="getSeverityBadge(log.severity)">
                    {{ log.severity }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Info -->
        <div v-if="filteredLogs.length > 0" class="mt-3 text-muted">
          <small>Showing {{ filteredLogs.length }} of {{ logs.length }} logs</small>
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="row mt-4">
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Total Logs</h6>
            <p class="fs-4 fw-bold text-primary mb-0">{{ logs.length }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">High Severity</h6>
            <p class="fs-4 fw-bold text-danger mb-0">{{ highSeverityCount }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Medium Severity</h6>
            <p class="fs-4 fw-bold text-warning mb-0">{{ mediumSeverityCount }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Low Severity</h6>
            <p class="fs-4 fw-bold text-info mb-0">{{ lowSeverityCount }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const logs = ref([]);
const loading = ref(true);
const filterAction = ref('');
const filterStudent = ref('');
const filterQuiz = ref('');

const fetchLogs = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/logs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    logs.value = response.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    alert('Failed to load system logs');
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const actionMatch = !filterAction.value || log.action.toLowerCase().includes(filterAction.value.toLowerCase());
    const studentMatch = !filterStudent.value || (log.studentId?.name || '').toLowerCase().includes(filterStudent.value.toLowerCase());
    const quizMatch = !filterQuiz.value || (log.quizId?.title || '').toLowerCase().includes(filterQuiz.value.toLowerCase());
    return actionMatch && studentMatch && quizMatch;
  });
});

const highSeverityCount = computed(() => logs.value.filter(l => l.severity === 'high').length);
const mediumSeverityCount = computed(() => logs.value.filter(l => l.severity === 'medium').length);
const lowSeverityCount = computed(() => logs.value.filter(l => l.severity === 'low').length);

const formatAction = (action) => {
  const actionMap = {
    'security_violation': 'Security Violation',
    'multiple_tabs_detected': 'Multiple Tabs',
    'focus_lost': 'Focus Lost',
    'suspicious_activity': 'Suspicious Activity'
  };
  return actionMap[action] || action;
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getSeverityBadge = (severity) => {
  const severityClasses = {
    'high': 'badge bg-danger',
    'medium': 'badge bg-warning',
    'low': 'badge bg-info'
  };
  return severityClasses[severity] || 'badge bg-secondary';
};

const clearFilters = () => {
  filterAction.value = '';
  filterStudent.value = '';
  filterQuiz.value = '';
};

const goBack = () => {
  router.push('/admin/dashboard');
};

onMounted(() => {
  fetchLogs();
});
</script>
