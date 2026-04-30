<template>
  <div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow p-4" style="width: 25rem;">
      <div class="text-center mb-4">
        <h2 class="text-primary fw-bold">NM Quiz App</h2>
        <p class="text-muted">Please login to continue</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label class="form-label">Username</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="username" 
            required 
            placeholder="Enter username"
          >
        </div>

        <div class="mb-3">
          <label class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="password" 
            required 
            placeholder="Enter password"
          >
        </div>

        <div v-if="errorMessage" class="alert alert-danger py-2">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
    isLoading.value = true;
    errorMessage.value = '';

    try {
        // Call the Node.js backend auth endpoint
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            username: username.value,
            password: password.value
        });

        // Save JWT token to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Route based on role
        const role = response.data.user.role;
        if (role === 'Admin') router.push('/admin/dashboard');
        else if (role === 'Faculty') router.push('/faculty/dashboard');
        else if (role === 'Student') router.push('/student/dashboard');

    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Failed to login. Please check server.';
    } finally {
        isLoading.value = false;
    }
};
</script>