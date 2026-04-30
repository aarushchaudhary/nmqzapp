<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">Edit Quiz</h3>
        <p class="text-muted mb-0">{{ quizTitle }}</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back to Quizzes</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Form -->
    <div v-else class="row">
      <div class="col-lg-8">
        <!-- Quiz Basic Info -->
        <div class="card shadow mb-4">
          <div class="card-header bg-primary text-white fw-bold">
            Quiz Details
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label fw-bold">Quiz Title</label>
              <input v-model="form.title" type="text" class="form-control" placeholder="e.g., Midterm Exam">
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Description</label>
              <textarea v-model="form.description" class="form-control" rows="3" placeholder="Quiz description..."></textarea>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Duration (minutes)</label>
                  <input v-model.number="form.durationMinutes" type="number" class="form-control" min="1" placeholder="60">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Status</label>
                  <select v-model="form.status" class="form-select" :disabled="cannotChangeStatus">
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <small v-if="cannotChangeStatus" class="text-muted">Cannot change - students have started</small>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Start Time</label>
                  <input v-model="form.startTime" type="datetime-local" class="form-control">
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">End Time</label>
                  <input v-model="form.endTime" type="datetime-local" class="form-control">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Questions -->
        <div class="card shadow mb-4">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <span class="fw-bold">Questions ({{ form.questions.length }})</span>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-light" @click="openBulkUploadModal">📤 Bulk Upload</button>
              <button class="btn btn-sm btn-light" @click="addQuestion">+ Add Question</button>
            </div>
          </div>
          <div class="card-body">
            <div v-for="(question, idx) in form.questions" :key="idx" class="mb-4 p-3 border rounded bg-light">
              <!-- Question Header -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h6 class="mb-0 fw-bold">Question {{ idx + 1 }}</h6>
                <button class="btn btn-sm btn-danger" @click="removeQuestion(idx)">Remove</button>
              </div>

              <!-- Question Type -->
              <div class="mb-3">
                <label class="form-label fw-bold">Type</label>
                <select v-model="question.type" class="form-select">
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="Descriptive">Descriptive</option>
                </select>
              </div>

              <!-- Question Text -->
              <div class="mb-3">
                <label class="form-label fw-bold">Question Text</label>
                <textarea v-model="question.questionText" class="form-control" rows="2" placeholder="Enter question..."></textarea>
              </div>

              <!-- Marks -->
              <div class="mb-3">
                <label class="form-label fw-bold">Marks</label>
                <input v-model.number="question.marks" type="number" class="form-control" min="1" placeholder="e.g., 5">
              </div>

              <!-- MCQ Options -->
              <div v-if="question.type === 'MCQ'" class="mb-3">
                <label class="form-label fw-bold">Options</label>
                <div v-for="(option, optIdx) in question.options" :key="optIdx" class="input-group mb-2">
                  <input v-model="question.options[optIdx]" type="text" class="form-control" placeholder="Option text">
                  <button class="btn btn-outline-danger" @click="removeOption(idx, optIdx)">Remove</button>
                </div>
                <button class="btn btn-sm btn-outline-primary" @click="addOption(idx)">+ Add Option</button>

                <!-- Correct Answer -->
                <div class="mt-3">
                  <label class="form-label fw-bold">Correct Answer</label>
                  <select v-model="question.correctAnswer" class="form-select">
                    <option value="">-- Select --</option>
                    <option v-for="(option, optIdx) in question.options" :key="optIdx" :value="option">
                      {{ option }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar - Summary -->
      <div class="col-lg-4">
        <div class="card shadow mb-4 sticky-top" style="top: 20px;">
          <div class="card-header bg-primary text-white fw-bold">
            Summary
          </div>
          <div class="card-body">
            <div class="mb-3">
              <strong>Total Questions:</strong> {{ form.questions.length }}
            </div>
            <div class="mb-3">
              <strong>Total Marks:</strong> {{ totalMarks }}
            </div>
            <div class="mb-3">
              <strong>Duration:</strong> {{ form.durationMinutes }} min
            </div>
            <div class="mb-3">
              <strong>Status:</strong>
              <span :class="'badge badge-' + getStatusClass(form.status)">
                {{ form.status }}
              </span>
            </div>

            <div v-if="warningMessage" class="alert alert-warning mb-3 small">
              ⚠️ {{ warningMessage }}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="d-grid gap-2">
          <button class="btn btn-success btn-lg" @click="saveQuiz" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : '💾 Save Changes' }}
          </button>
          <button class="btn btn-outline-danger btn-lg" @click="deleteQuiz">
            🗑️ Delete Quiz
          </button>
          <button class="btn btn-outline-secondary" @click="goBack">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Upload Modal -->
    <div v-if="showBulkUploadModal" class="modal d-block" style="background-color: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold">Bulk Upload Questions</h5>
            <button type="button" class="btn-close btn-close-white" @click="closeBulkUploadModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <h6 class="fw-bold">CSV/Excel Format Instructions:</h6>
              <p class="text-muted small mb-2">Your file should contain the following columns:</p>
              <ul class="text-muted small">
                <li><strong>questionText</strong> - The question text (required)</li>
                <li><strong>type</strong> - MCQ or Descriptive (default: MCQ)</li>
                <li><strong>options</strong> - Options separated by pipe symbol | (for MCQ only)</li>
                <li><strong>correctAnswer</strong> - The correct answer (for MCQ)</li>
                <li><strong>marks</strong> - Marks for this question (default: 1)</li>
              </ul>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Upload File</label>
              <input 
                type="file" 
                ref="bulkUploadFileInput"
                class="form-control" 
                accept=".csv,.xlsx,.xls"
                @change="selectFile"
              >
              <small class="text-muted">Supported formats: CSV, Excel (.xlsx, .xls)</small>
            </div>

            <div v-if="bulkUploadError" class="alert alert-danger mb-3">
              {{ bulkUploadError }}
            </div>

            <div v-if="bulkUploadSuccess" class="alert alert-success mb-3">
              ✓ {{ bulkUploadSuccess }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="closeBulkUploadModal">
              Close
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="uploadQuestions"
              :disabled="!selectedFile || isUploading"
            >
              {{ isUploading ? 'Uploading...' : '📤 Upload' }}
            </button>
          </div>
        </div>
      </div>
    </div>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const quizId = ref(route.params.id);

// State
const loading = ref(true);
const isSaving = ref(false);
const quizTitle = ref('');
const form = ref({
  title: '',
  description: '',
  durationMinutes: 60,
  startTime: '',
  endTime: '',
  status: 'Published',
  questions: []
});
const attemptCount = ref(0);

// Bulk upload state
const showBulkUploadModal = ref(false);
const selectedFile = ref(null);
const isUploading = ref(false);
const bulkUploadError = ref('');
const bulkUploadSuccess = ref('');

// Computed
const cannotChangeStatus = computed(() => attemptCount.value > 0 && form.value.status !== 'Draft');
const warningMessage = computed(() => {
  if (attemptCount.value > 0) {
    return `${attemptCount.value} student(s) have already started this quiz. Some changes are restricted.`;
  }
  return '';
});
const totalMarks = computed(() => {
  return form.value.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
});

const getStatusClass = (status) => {
  switch(status) {
    case 'Draft': return 'secondary';
    case 'Published': return 'success';
    case 'Completed': return 'danger';
    default: return 'secondary';
  }
};

// Methods
const fetchQuiz = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/faculty/my-quizzes`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const quiz = response.data.find(q => q._id === quizId.value);
    if (!quiz) throw new Error('Quiz not found');

    quizTitle.value = quiz.title;
    form.value = {
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      startTime: new Date(quiz.startTime).toISOString().slice(0, 16),
      endTime: new Date(quiz.endTime).toISOString().slice(0, 16),
      status: quiz.status,
      questions: JSON.parse(JSON.stringify(quiz.questions))
    };

    // Check if students have started
    const monitoringResponse = await axios.get(
      `http://localhost:5000/api/faculty/monitor/${quizId.value}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    attemptCount.value = monitoringResponse.data.attempts.filter(a => a.status !== 'Draft').length;

  } catch (error) {
    console.error('Error fetching quiz:', error);
    alert('Failed to load quiz');
    router.push('/faculty/dashboard');
  } finally {
    loading.value = false;
  }
};

const addQuestion = () => {
  form.value.questions.push({
    questionText: '',
    type: 'MCQ',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1
  });
};

const removeQuestion = (idx) => {
  form.value.questions.splice(idx, 1);
};

const addOption = (questionIdx) => {
  form.value.questions[questionIdx].options.push('');
};

const removeOption = (questionIdx, optionIdx) => {
  form.value.questions[questionIdx].options.splice(optionIdx, 1);
};

const saveQuiz = async () => {
  if (!form.value.title.trim()) {
    alert('Please enter a quiz title');
    return;
  }
  if (form.value.questions.length === 0) {
    alert('Please add at least one question');
    return;
  }

  isSaving.value = true;
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:5000/api/faculty/quiz/${quizId.value}`,
      form.value,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert('Quiz updated successfully!');
    router.push('/faculty/dashboard');
  } catch (error) {
    console.error('Error saving quiz:', error);
    alert(error.response?.data?.message || 'Failed to save quiz');
  } finally {
    isSaving.value = false;
  }
};

const deleteQuiz = async () => {
  if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:5000/api/faculty/quiz/${quizId.value}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert('Quiz deleted successfully!');
    router.push('/faculty/dashboard');
  } catch (error) {
    console.error('Error deleting quiz:', error);
    alert(error.response?.data?.message || 'Failed to delete quiz');
  }
};

const goBack = () => {
  router.push('/faculty/dashboard');
};

const openBulkUploadModal = () => {
  showBulkUploadModal.value = true;
  bulkUploadError.value = '';
  bulkUploadSuccess.value = '';
  selectedFile.value = null;
};

const closeBulkUploadModal = () => {
  showBulkUploadModal.value = false;
  selectedFile.value = null;
  bulkUploadError.value = '';
  bulkUploadSuccess.value = '';
};

const selectFile = (event) => {
  selectedFile.value = event.target.files[0];
};

const uploadQuestions = async () => {
  if (!selectedFile.value) {
    bulkUploadError.value = 'Please select a file';
    return;
  }

  isUploading.value = true;
  bulkUploadError.value = '';
  bulkUploadSuccess.value = '';

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const token = localStorage.getItem('token');
    const response = await axios.post(
      `http://localhost:5000/api/faculty/quiz/${quizId.value}/upload-questions`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    bulkUploadSuccess.value = `Successfully added ${response.data.questionsAdded} question(s)!`;
    
    // Refresh the quiz data
    setTimeout(async () => {
      await fetchQuiz();
      closeBulkUploadModal();
    }, 1500);
  } catch (error) {
    bulkUploadError.value = error.response?.data?.message || 'Error uploading questions';
    console.error('Error:', error);
  } finally {
    isUploading.value = false;
  }
};

onMounted(() => {
  fetchQuiz();
});
</script>

<style scoped>
.badge-success {
  background-color: #28a745;
}

.badge-secondary {
  background-color: #6c757d;
}

.badge-danger {
  background-color: #dc3545;
}
</style>
