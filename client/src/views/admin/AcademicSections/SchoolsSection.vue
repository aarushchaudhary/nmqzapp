<template>
  <div>
    <!-- Add New Button -->
    <div class="mb-3">
      <button class="btn btn-success" @click="openAddModal">+ Add School</button>
    </div>

    <!-- Table -->
    <div class="card shadow">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="schools.length === 0" class="text-center text-muted py-4">
          <p>No schools yet. Create one to get started.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="school in schools" :key="school._id">
                <td class="fw-bold">{{ school.name }}</td>
                <td>{{ school.description || '—' }}</td>
                <td>
                  <span :class="school.isActive ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ school.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td><small>{{ formatDate(school.createdAt) }}</small></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEditModal(school)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteSchool(school._id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal fade" id="schoolModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Edit' : 'Add' }} School</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-bold">School Name</label>
              <input v-model="form.name" type="text" class="form-control" placeholder="e.g., School of Engineering">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Description</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="School description..."></textarea>
            </div>
            <div class="form-check">
              <input v-model="form.isActive" type="checkbox" class="form-check-input" id="schoolActive">
              <label class="form-check-label" for="schoolActive">
                Active
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveSchool" :disabled="isSaving">
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

const schools = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const editingId = ref(null);
const form = ref({
  name: '',
  description: '',
  isActive: true
});

let modal = null;

const fetchSchools = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/academic/schools', {
      headers: { Authorization: `Bearer ${token}` }
    });
    schools.value = response.data;
  } catch (error) {
    console.error('Error fetching schools:', error);
    alert('Failed to load schools');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  editingId.value = null;
  form.value = { name: '', description: '', isActive: true };
  modal = new bootstrap.Modal(document.getElementById('schoolModal'));
  modal.show();
};

const openEditModal = (school) => {
  editingId.value = school._id;
  form.value = { ...school };
  modal = new bootstrap.Modal(document.getElementById('schoolModal'));
  modal.show();
};

const closeModal = () => {
  if (modal) modal.hide();
};

const saveSchool = async () => {
  if (!form.value.name.trim()) {
    alert('School name is required');
    return;
  }

  isSaving.value = true;
  try {
    const token = localStorage.getItem('token');

    if (editingId.value) {
      await axios.put(
        `http://localhost:5000/api/admin/academic/schools/${editingId.value}`,
        form.value,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        'http://localhost:5000/api/admin/academic/schools',
        form.value,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    closeModal();
    fetchSchools();
    alert('School saved successfully!');
  } catch (error) {
    console.error('Error saving school:', error);
    alert(error.response?.data?.message || 'Failed to save school');
  } finally {
    isSaving.value = false;
  }
};

const deleteSchool = async (id) => {
  if (!confirm('Are you sure you want to delete this school?')) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:5000/api/admin/academic/schools/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchSchools();
    alert('School deleted successfully!');
  } catch (error) {
    console.error('Error deleting school:', error);
    alert(error.response?.data?.message || 'Failed to delete school');
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  fetchSchools();
});
</script>
