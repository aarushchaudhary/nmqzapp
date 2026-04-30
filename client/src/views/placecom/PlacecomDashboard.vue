<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">All Student Results</h3>
        <p class="text-muted mb-0">System-wide Quiz Performance Dashboard</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="refreshData">🔄 Refresh</button>
        <button class="btn btn-outline-primary" @click="exportAsCSV">📥 Export CSV</button>
      </div>
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

    <!-- Summary Cards -->
    <div v-else class="row mb-4">
      <div class="col-md-3 mb-3">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="text-primary fw-bold text-uppercase mb-1">Total Results</div>
            <div class="h3 mb-0">{{ totalResults }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="text-success fw-bold text-uppercase mb-1">Qualified</div>
            <div class="h3 mb-0">{{ qualifiedCount }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card border-left-danger shadow h-100 py-2">
          <div class="card-body">
            <div class="text-danger fw-bold text-uppercase mb-1">Disqualified</div>
            <div class="h3 mb-0">{{ disqualifiedCount }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="text-info fw-bold text-uppercase mb-1">Avg Score</div>
            <div class="h3 mb-0">{{ avgScore.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card shadow mb-4">
      <div class="card-header bg-light fw-bold d-flex justify-content-between align-items-center">
        <span>Filters</span>
        <button class="btn btn-sm btn-link text-secondary" @click="clearFilters">Clear All</button>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Search Name/Email</label>
            <input 
              v-model="filters.search" 
              type="text" 
              class="form-control" 
              placeholder="Enter student name or email..."
            >
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Course</label>
            <input 
              v-model="filters.course" 
              type="text" 
              class="form-control" 
              placeholder="Filter by course..."
            >
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Specialization</label>
            <input 
              v-model="filters.specialization" 
              type="text" 
              class="form-control" 
              placeholder="Filter by specialization..."
            >
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Status</label>
            <select v-model="filters.status" class="form-select">
              <option value="">All Status</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="!loading && filteredResults.length > 0" class="card shadow">
      <div class="card-header bg-primary text-white fw-bold">
        Showing {{ filteredResults.length }} of {{ results.length }} Results
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Specialization</th>
                <th class="text-center">Quiz</th>
                <th class="text-center">Score</th>
                <th class="text-center">Submitted Date</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in paginatedResults" :key="result._id">
                <td class="fw-bold">{{ result.studentName }}</td>
                <td class="text-muted small">{{ result.studentEmail }}</td>
                <td>{{ result.course }}</td>
                <td>{{ result.specialization }}</td>
                <td class="text-center">
                  <span class="badge bg-info">{{ result.quizTitle }}</span>
                </td>
                <td class="text-center fw-bold">{{ result.totalScore }}</td>
                <td class="text-center small">
                  {{ new Date(result.submittedAt).toLocaleDateString() }}
                </td>
                <td class="text-center">
                  <span v-if="result.disqualified" class="badge bg-danger">
                    ✗ Disqualified
                  </span>
                  <span v-else class="badge bg-success">
                    ✓ Qualified
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pagination -->
      <div class="card-footer bg-light">
        <nav aria-label="Page navigation">
          <ul class="pagination mb-0 justify-content-center">
            <li :class="['page-item', { disabled: currentPage === 1 }]">
              <a class="page-link" href="#" @click.prevent="currentPage--">Previous</a>
            </li>
            <li v-for="page in totalPages" :key="page" :class="['page-item', { active: page === currentPage }]">
              <a class="page-link" href="#" @click.prevent="currentPage = page">{{ page }}</a>
            </li>
            <li :class="['page-item', { disabled: currentPage === totalPages }]">
              <a class="page-link" href="#" @click.prevent="currentPage++">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && results.length === 0" class="alert alert-info text-center py-5">
      <h5>No Results Available</h5>
      <p>There are no evaluated quiz attempts in the system yet.</p>
    </div>

    <!-- No Filter Results -->
    <div v-else-if="!loading && filteredResults.length === 0" class="alert alert-warning text-center py-5">
      <h5>No Results Match Your Filters</h5>
      <p>Try adjusting your search criteria.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const loading = ref(true);
const error = ref('');
const results = ref([]);
const currentPage = ref(1);
const itemsPerPage = 10;

const filters = ref({
  search: '',
  course: '',
  specialization: '',
  status: ''
});

const filteredResults = computed(() => {
  return results.value.filter(result => {
    const matchSearch = !filters.value.search || 
      result.studentName.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      result.studentEmail.toLowerCase().includes(filters.value.search.toLowerCase());
    
    const matchCourse = !filters.value.course ||
      result.course.toLowerCase().includes(filters.value.course.toLowerCase());
    
    const matchSpecialization = !filters.value.specialization ||
      result.specialization.toLowerCase().includes(filters.value.specialization.toLowerCase());
    
    const matchStatus = !filters.value.status ||
      (filters.value.status === 'qualified' && !result.disqualified) ||
      (filters.value.status === 'disqualified' && result.disqualified);
    
    return matchSearch && matchCourse && matchSpecialization && matchStatus;
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / itemsPerPage);
});

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredResults.value.slice(start, end);
});

const totalResults = computed(() => results.value.length);
const qualifiedCount = computed(() => results.value.filter(r => !r.disqualified).length);
const disqualifiedCount = computed(() => results.value.filter(r => r.disqualified).length);
const avgScore = computed(() => {
  if (results.value.length === 0) return 0;
  return results.value.reduce((sum, r) => sum + r.totalScore, 0) / results.value.length;
});

const fetchResults = async () => {
  try {
    loading.value = true;
    error.value = '';
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/placecom/results', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    results.value = response.data.results;
  } catch (err) {
    error.value = err.response?.data?.message || 'Error fetching results';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  currentPage.value = 1;
  fetchResults();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    course: '',
    specialization: '',
    status: ''
  };
  currentPage.value = 1;
};

const exportAsCSV = () => {
  if (filteredResults.value.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = ['Student Name', 'Email', 'Course', 'Specialization', 'Quiz', 'Score', 'Submitted Date', 'Status'];
  const rows = filteredResults.value.map(result => [
    `"${result.studentName}"`,
    result.studentEmail,
    result.course,
    result.specialization,
    result.quizTitle,
    result.totalScore,
    new Date(result.submittedAt).toLocaleDateString(),
    result.disqualified ? 'Disqualified' : 'Qualified'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `all_results_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

onMounted(() => {
  fetchResults();
});
</script>
