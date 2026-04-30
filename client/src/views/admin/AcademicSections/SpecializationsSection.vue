<template>
  <div>
    <!-- Add New Button -->
    <div class="mb-3">
      <button class="btn btn-success" @click="openAddModal">+ Add Specialization</button>
    </div>

    <!-- Table -->
    <div class="card shadow">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="specializations.length === 0" class="text-center text-muted py-4">
          <p>No specializations yet. Create one to get started.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>Course</th>
                <th>School</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spec in specializations" :key="spec._id">
                <td class="fw-bold">{{ spec.name }}</td>
                <td>{{ spec.courseId?.name || '—' }}</td>
                <td>{{ spec.courseId?.schoolId?.name || '—' }}</td>
                <td>{{ spec.description || '—' }}</td>
                <td>
                  <span :class="spec.isActive ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ spec.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td><small>{{ formatDate(spec.createdAt) }}</small></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(spec)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteSpec(spec._id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" id="specModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Edit' : 'Add' }} Specialization</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Specialization Name</label>
              <input v-model="form.name" type="text" class="form-control" placeholder="e.g., Artificial Intelligence">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Course</label>
              <select v-model="form.courseId" class="form-select">
                <option value="">-- Select Course --</option>
                <option v-for="course in courses" :key="course._id" :value="course._id">
                  {{ course.name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Description</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="Specialization description..."></textarea>
            </div>
            <div class="form-check">
              <input v-model="form.isActive" type="checkbox" class="form-check-input" id="specActive">
              <label class="form-check-label" for="specActive">
                Active
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveSpec" :disabled="isSaving">
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

const specializations = ref([]);
const courses = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const editingId = ref(null);
const form = ref({
  name: '',
  courseId: '',
  description: '',
  isActive: true
});

let modal = null;

const fetchSpecializations = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/academic/specializations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    specializations.value = response.data;
  } catch (error) {
    console.error('Error fetching specializations:', error);
    alert('Failed to load specializations');
  } finally {
    loading.value = false;
  }
};

const fetchCourses = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/academic/courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    courses.value = response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
};

const openAddModal = () => {
  editingId.value = null;
  form.value = { name: '', courseId: '', description: '', isActive: true };
  modal = new bootstrap.Modal(document.getElementById('specModal'));
  modal.show();
};

const openEditModal = (spec) => {
  editingId.value = spec._id;
  form.value = {
    name: spec.name,
    courseId: spec.courseId?._id || '',
    description: spec.description,
    isActive: spec.isActive
  };
  modal = new bootstrap.Modal(document.getElementById('specModal'));
  modal.show();
};

const closeModal = () => {
  if (modal) modal.hide();
};

const saveSpec = async () => {
  if (!form.value.name.trim()) {
    alert('Specialization name is required');
    return;
  }
  if (!form.value.courseId) {
    alert('Please select a course');
    return;
  }

  isSaving.value = true;
  try {
    const token = localStorage.getItem('token');

    if (editingId.value) {
      await axios.put(
        `http://localhost:5000/api/admin/academic/specializations/${editingId.value}`,
        form.value,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        'http://localhost:5000/api/admin/academic/specializations',
        form.value,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    closeModal();
    fetchSpecializations();
    alert('Specialization saved successfully!');
  } catch (error) {
    console.error('Error saving specialization:', error);
    alert(error.response?.data?.message || 'Failed to save specialization');
  } finally {
    isSaving.value = false;
  }
};

const deleteSpec = async (id) => {
  if (!confirm('Are you sure you want to delete this specialization?')) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:5000/api/admin/academic/specializations/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchSpecializations();
    alert('Specialization deleted successfully!');
  } catch (error) {
    console.error('Error deleting specialization:', error);
    alert(error.response?.data?.message || 'Failed to delete specialization');
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  fetchSpecializations();
  fetchCourses();
});
</script>
