<template>
  <div>
    <!-- Add New Button -->
    <div class="mb-3">
      <button class="btn btn-success" @click="openAddModal">+ Add Course</button>
    </div>

    <!-- Table -->
    <div class="card shadow">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="courses.length === 0" class="text-center text-muted py-4">
          <p>No courses yet. Create one to get started.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in courses" :key="course._id">
                <td class="fw-bold">{{ course.name }}</td>
                <td>{{ course.schoolId?.name || '—' }}</td>
                <td>{{ course.description || '—' }}</td>
                <td>
                  <span :class="course.isActive ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ course.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td><small>{{ formatDate(course.createdAt) }}</small></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(course)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteCourse(course._id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" id="courseModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Edit' : 'Add' }} Course</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Course Name</label>
              <input v-model="form.name" type="text" class="form-control" placeholder="e.g., B.Tech Computer Science">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">School</label>
              <select v-model="form.schoolId" class="form-select">
                <option value="">-- Select School --</option>
                <option v-for="school in schools" :key="school._id" :value="school._id">
                  {{ school.name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Description</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="Course description..."></textarea>
            </div>
            <div class="form-check">
              <input v-model="form.isActive" type="checkbox" class="form-check-input" id="courseActive">
              <label class="form-check-label" for="courseActive">
                Active
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveCourse" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const emit = defineEmits(['refresh']);

const courses = ref([]);
const schools = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const editingId = ref(null);
const form = ref({
  name: '',
  schoolId: '',
  description: '',
  isActive: true
});

let modal = null;

const fetchCourses = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/academic/courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    courses.value = response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    alert('Failed to load courses');
  } finally {
    loading.value = false;
  }
};

const fetchSchools = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/academic/schools', {
      headers: { Authorization: `Bearer ${token}` }
    });
    schools.value = response.data;
  } catch (error) {
    console.error('Error fetching schools:', error);
  }
};

const openAddModal = () => {
  editingId.value = null;
  form.value = { name: '', schoolId: '', description: '', isActive: true };
  modal = new bootstrap.Modal(document.getElementById('courseModal'));
  modal.show();
};

const openEditModal = (course) => {
  editingId.value = course._id;
  form.value = {
    name: course.name,
    schoolId: course.schoolId?._id || '',
    description: course.description,
    isActive: course.isActive
  };
  modal = new bootstrap.Modal(document.getElementById('courseModal'));
  modal.show();
};

const closeModal = () => {
  if (modal) modal.hide();
};

const saveCourse = async () => {
  if (!form.value.name.trim()) {
    alert('Course name is required');
    return;
  }
  if (!form.value.schoolId) {
    alert('Please select a school');
    return;
  }

  isSaving.value = true;
  try {
    const token = localStorage.getItem('token');

    if (editingId.value) {
      await axios.put(
        `http://localhost:5000/api/admin/academic/courses/${editingId.value}`,
        form.value,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        'http://localhost:5000/api/admin/academic/courses',
        form.value,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    closeModal();
    fetchCourses();
    alert('Course saved successfully!');
  } catch (error) {
    console.error('Error saving course:', error);
    alert(error.response?.data?.message || 'Failed to save course');
  } finally {
    isSaving.value = false;
  }
};

const deleteCourse = async (id) => {
  if (!confirm('Are you sure you want to delete this course?')) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:5000/api/admin/academic/courses/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCourses();
    alert('Course deleted successfully!');
  } catch (error) {
    console.error('Error deleting course:', error);
    alert(error.response?.data?.message || 'Failed to delete course');
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  fetchCourses();
  fetchSchools();
});
</script>
