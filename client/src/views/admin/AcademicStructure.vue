<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">Academic Structure</h3>
        <p class="text-muted mb-0">Manage Schools, Courses, and Specializations</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Admin</button>
    </div>

    <!-- Navigation Tabs -->
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link active" 
          id="schools-tab" 
          data-bs-toggle="tab" 
          data-bs-target="#schools-tab-pane" 
          type="button" 
          @click="activeTab = 'schools'"
        >
          🏛️ Schools
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          id="courses-tab" 
          data-bs-toggle="tab" 
          data-bs-target="#courses-tab-pane" 
          type="button"
          @click="activeTab = 'courses'"
        >
          📚 Courses
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button 
          class="nav-link" 
          id="specializations-tab" 
          data-bs-toggle="tab" 
          data-bs-target="#specializations-tab-pane" 
          type="button"
          @click="activeTab = 'specializations'"
        >
          🎯 Specializations
        </button>
      </li>
    </ul>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Schools Tab -->
      <div class="tab-pane fade show active" id="schools-tab-pane" role="tabpanel">
        <SchoolsSection @refresh="fetchSchools" />
      </div>

      <!-- Courses Tab -->
      <div class="tab-pane fade" id="courses-tab-pane" role="tabpanel">
        <CoursesSection @refresh="fetchCourses" />
      </div>

      <!-- Specializations Tab -->
      <div class="tab-pane fade" id="specializations-tab-pane" role="tabpanel">
        <SpecializationsSection @refresh="fetchSpecializations" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import SchoolsSection from './AcademicSections/SchoolsSection.vue';
import CoursesSection from './AcademicSections/CoursesSection.vue';
import SpecializationsSection from './AcademicSections/SpecializationsSection.vue';

const router = useRouter();
const activeTab = ref('schools');

const goBack = () => {
  router.push('/admin/dashboard');
};

onMounted(() => {
  // Load initial data
});
</script>
