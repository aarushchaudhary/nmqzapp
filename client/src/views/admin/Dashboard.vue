<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Admin Dashboard</h2>
      <button @click="logout" class="btn btn-danger">Logout</button>
    </div>

    <div class="row" v-if="!isLoading">
      <div class="col-md-4">
        <div class="card text-white bg-primary mb-3 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Total Users</h5>
            <p class="card-text fs-2 fw-bold">{{ stats.totalUsers }}</p>
          </div>
        </div>
      </div>
      </div>

    <div v-else class="text-center mt-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Loading dashboard data...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const stats = ref({ totalUsers: 0 });
const isLoading = ref(true);

const fetchDashboardStats = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats', {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Assuming your backend returns { totalUsers: 150 }
        stats.value = response.data;
    } catch (error) {
        console.error("Failed to load stats", error);
        if (error.response?.status === 401) logout(); // Token expired
    } finally {
        isLoading.value = false;
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
};

onMounted(() => {
    fetchDashboardStats();
});
</script>