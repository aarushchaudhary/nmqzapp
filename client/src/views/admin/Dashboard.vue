<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-0 text-primary fw-bold">Admin Dashboard</h2>
        <p class="text-muted mb-0">System Administration & Management</p>
      </div>
      <button @click="logout" class="btn btn-danger">Logout</button>
    </div>

    <!-- Main Cards Grid -->
    <div class="row">
      <!-- Academic Structure Card -->
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-primary fw-bold">🏛️ Academic Structure</h5>
            <p class="card-text text-muted mb-3">Manage Schools, Courses, and Specializations</p>
            <button class="btn btn-primary mt-auto" @click="navigateTo('/admin/academic-structure')">
              Manage →
            </button>
          </div>
        </div>
      </div>

      <!-- User Management Card -->
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-success fw-bold">👥 User Management</h5>
            <p class="card-text text-muted mb-3">CRUD operations, Roles, Bulk Upload</p>
            <button class="btn btn-success mt-auto" @click="navigateTo('/admin/users')">
              Manage →
            </button>
          </div>
        </div>
      </div>

      <!-- System Logs Card -->
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-warning fw-bold">📋 System Logs</h5>
            <p class="card-text text-muted mb-3">View security violations & activity logs</p>
            <button class="btn btn-warning mt-auto" @click="navigateTo('/admin/logs')">
              View Logs →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="row mt-4">
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Total Users</h6>
            <p class="fs-4 fw-bold text-primary mb-0">{{ stats.totalUsers }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Schools</h6>
            <p class="fs-4 fw-bold text-primary mb-0">{{ stats.schools }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Courses</h6>
            <p class="fs-4 fw-bold text-primary mb-0">{{ stats.courses }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-lg-2 mb-3">
        <div class="card text-center shadow-sm border-0">
          <div class="card-body">
            <h6 class="text-muted">Specializations</h6>
            <p class="fs-4 fw-bold text-primary mb-0">{{ stats.specializations }}</p>
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
const stats = ref({
  totalUsers: 0,
  schools: 0,
  courses: 0,
  specializations: 0
});

const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // Fetch user count
    const usersRes = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    stats.value.totalUsers = usersRes.data.length;
    
    // Fetch academic data
    const [schoolsRes, coursesRes, specsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/admin/academic/schools', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/admin/academic/courses', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/admin/academic/specializations', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    stats.value.schools = schoolsRes.data.length;
    stats.value.courses = coursesRes.data.length;
    stats.value.specializations = specsRes.data.length;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

const navigateTo = (path) => {
  router.push(path);
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};

onMounted(() => {
  fetchStats();
});
</script>