<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">User Management</h3>
        <p class="text-muted mb-0">Manage system users and permissions</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Admin</button>
    </div>

    <!-- Action Buttons -->
    <div class="mb-3 d-flex gap-2">
      <button class="btn btn-success" @click="openAddUserModal">+ Add User</button>
      <button class="btn btn-info" @click="openBulkUploadModal">📤 Bulk Upload CSV</button>
    </div>

    <!-- Filter -->
    <div class="mb-3">
      <div class="row">
        <div class="col-md-3">
          <select v-model="filterRole" class="form-select">
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
            <option value="Placecom">Placecom</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card shadow">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="text-center text-muted py-4">
          <p>No users found.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>School</th>
                <th>Course</th>
                <th>Specialization</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._id">
                <td class="fw-bold">{{ user.username }}</td>
                <td>{{ user.name }}</td>
                <td>
                  <span :class="getRoleClass(user.role)">{{ user.role }}</span>
                </td>
                <td>{{ user.school?.name || '—' }}</td>
                <td>{{ user.course?.name || '—' }}</td>
                <td>{{ user.specialization?.name || '—' }}</td>
                <td>
                  <span :class="user.isActive ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td><small>{{ formatDate(user.createdAt) }}</small></td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" @click="openEditUserModal(user)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteUser(user._id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div class="modal fade" id="userModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingUserId ? 'Edit' : 'Add' }} User</h5>
            <button type="button" class="btn-close" @click="closeUserModal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Username</label>
                  <input v-model="userForm.username" type="text" class="form-control" :disabled="!!editingUserId">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Name</label>
                  <input v-model="userForm.name" type="text" class="form-control">
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">{{ editingUserId ? 'New Password' : 'Password' }}</label>
                  <input v-model="userForm.password" type="password" class="form-control" :placeholder="editingUserId ? '(leave blank to keep current)' : ''">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Role</label>
                  <select v-model="userForm.role" class="form-select">
                    <option value="">-- Select --</option>
                    <option value="Admin">Admin</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Student">Student</option>
                    <option value="Placecom">Placecom</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label fw-bold">School</label>
                  <select v-model="userForm.school" class="form-select">
                    <option value="">-- Select --</option>
                    <option v-for="school in schools" :key="school._id" :value="school._id">
                      {{ school.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label fw-bold">Course</label>
                  <select v-model="userForm.course" class="form-select">
                    <option value="">-- Select --</option>
                    <option v-for="course in courses" :key="course._id" :value="course._id">
                      {{ course.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3">
                  <label class="form-label fw-bold">Specialization</label>
                  <select v-model="userForm.specialization" class="form-select">
                    <option value="">-- Select --</option>
                    <option v-for="spec in specializations" :key="spec._id" :value="spec._id">
                      {{ spec.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-check">
              <input v-model="userForm.isActive" type="checkbox" class="form-check-input" id="userActive">
              <label class="form-check-label" for="userActive">
                Active
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeUserModal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveUser" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Upload Modal -->
    <div class="modal fade" id="bulkUploadModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Bulk Upload Users (CSV)</h5>
            <button type="button" class="btn-close" @click="closeBulkUploadModal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">CSV Format: username, password, name, role, schoolName, courseName, specializationName</p>
            <div class="mb-3">
              <label class="form-label fw-bold">Upload CSV File</label>
              <input ref="csvFileInput" type="file" class="form-control" accept=".csv" @change="onFileSelected">
            </div>
            <div v-if="uploadResult" class="alert" :class="uploadResult.failed === 0 ? 'alert-success' : 'alert-warning'">
              <strong>Upload Complete:</strong>
              <p class="mb-0">Created: {{ uploadResult.created }} | Failed: {{ uploadResult.failed }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeBulkUploadModal">Close</button>
            <button type="button" class="btn btn-primary" @click="uploadCSV" :disabled="!selectedFile || isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload' }}
            </button>
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

// State
const users = ref([]);
const schools = ref([]);
const courses = ref([]);
const specializations = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const isUploading = ref(false);
const filterRole = ref('');
const editingUserId = ref(null);
const selectedFile = ref(null);
const csvFileInput = ref(null);
const uploadResult = ref(null);

const userForm = ref({
  username: '',
  password: '',
  name: '',
  role: '',
  school: '',
  course: '',
  specialization: '',
  isActive: true
});

let userModal = null;
let bulkUploadModal = null;

// Computed
const filteredUsers = computed(() => {
  if (!filterRole.value) return users.value;
  return users.value.filter(u => u.role === filterRole.value);
});

// Methods
const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    alert('Failed to load users');
  } finally {
    loading.value = false;
  }
};

const fetchAcademicData = async () => {
  try {
    const token = localStorage.getItem('token');
    const [schoolsRes, coursesRes, specsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/admin/academic/schools', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/admin/academic/courses', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('http://localhost:5000/api/admin/academic/specializations', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    schools.value = schoolsRes.data;
    courses.value = coursesRes.data;
    specializations.value = specsRes.data;
  } catch (error) {
    console.error('Error fetching academic data:', error);
  }
};

const openAddUserModal = () => {
  editingUserId.value = null;
  userForm.value = {
    username: '',
    password: '',
    name: '',
    role: '',
    school: '',
    course: '',
    specialization: '',
    isActive: true
  };
  userModal = new bootstrap.Modal(document.getElementById('userModal'));
  userModal.show();
};

const openEditUserModal = (user) => {
  editingUserId.value = user._id;
  userForm.value = {
    username: user.username,
    password: '',
    name: user.name,
    role: user.role,
    school: user.school?._id || '',
    course: user.course?._id || '',
    specialization: user.specialization?._id || '',
    isActive: user.isActive
  };
  userModal = new bootstrap.Modal(document.getElementById('userModal'));
  userModal.show();
};

const closeUserModal = () => {
  if (userModal) userModal.hide();
};

const saveUser = async () => {
  if (!userForm.value.username.trim() || !userForm.value.name.trim()) {
    alert('Username and name are required');
    return;
  }
  if (!editingUserId.value && !userForm.value.password) {
    alert('Password is required for new users');
    return;
  }

  isSaving.value = true;
  try {
    const token = localStorage.getItem('token');
    const payload = { ...userForm.value };

    if (editingUserId.value) {
      if (!payload.password) delete payload.password;
      await axios.put(
        `http://localhost:5000/api/admin/users/${editingUserId.value}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        'http://localhost:5000/api/admin/users',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    closeUserModal();
    fetchUsers();
    alert('User saved successfully!');
  } catch (error) {
    console.error('Error saving user:', error);
    alert(error.response?.data?.message || 'Failed to save user');
  } finally {
    isSaving.value = false;
  }
};

const deleteUser = async (id) => {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:5000/api/admin/users/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUsers();
    alert('User deleted successfully!');
  } catch (error) {
    console.error('Error deleting user:', error);
    alert(error.response?.data?.message || 'Failed to delete user');
  }
};

const openBulkUploadModal = () => {
  uploadResult.value = null;
  selectedFile.value = null;
  bulkUploadModal = new bootstrap.Modal(document.getElementById('bulkUploadModal'));
  bulkUploadModal.show();
};

const closeBulkUploadModal = () => {
  if (bulkUploadModal) bulkUploadModal.hide();
};

const onFileSelected = (event) => {
  selectedFile.value = event.target.files[0];
};

const uploadCSV = async () => {
  if (!selectedFile.value) {
    alert('Please select a file');
    return;
  }

  isUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('csv', selectedFile.value);

    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:5000/api/admin/users/upload',
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    uploadResult.value = response.data;
    fetchUsers();
    setTimeout(() => {
      closeBulkUploadModal();
      alert(`Upload complete! Created: ${response.data.created}, Failed: ${response.data.failed}`);
    }, 1000);
  } catch (error) {
    console.error('Error uploading CSV:', error);
    alert(error.response?.data?.message || 'Failed to upload CSV');
  } finally {
    isUploading.value = false;
  }
};

const getRoleClass = (role) => {
  const roleClasses = {
    'Admin': 'badge bg-danger',
    'Faculty': 'badge bg-primary',
    'Student': 'badge bg-success',
    'Placecom': 'badge bg-warning'
  };
  return roleClasses[role] || 'badge bg-secondary';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const goBack = () => {
  router.push('/admin/dashboard');
};

onMounted(() => {
  fetchUsers();
  fetchAcademicData();
});
</script>
