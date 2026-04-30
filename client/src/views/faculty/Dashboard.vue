<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm" v-if="user">
    <div class="container">
      <span class="navbar-brand fw-bold">NM Quiz App</span>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <!-- Admin Links -->
          <li class="nav-item" v-if="user.role === 'Admin'">
            <router-link class="nav-link" to="/admin/dashboard">Dashboard</router-link>
          </li>
          
          <!-- Faculty Links -->
          <template v-if="user.role === 'Faculty'">
            <li class="nav-item">
              <router-link class="nav-link" to="/faculty/dashboard">My Quizzes</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/faculty/create-quiz">Create Quiz</router-link>
            </li>
          </template>

          <!-- Student Links -->
          <li class="nav-item" v-if="user.role === 'Student'">
            <router-link class="nav-link" to="/student/dashboard">Available Exams</router-link>
          </li>
        </ul>

        <div class="d-flex align-items-center">
          <span class="text-light me-3">Welcome, {{ user.name }}</span>
          <button class="btn btn-light btn-sm fw-bold text-primary" @click="logout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Make the user reactive so the navbar updates when localStorage changes
const user = computed(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
});

const logout = () => {
    localStorage.clear();
    router.push('/');
};
</script>