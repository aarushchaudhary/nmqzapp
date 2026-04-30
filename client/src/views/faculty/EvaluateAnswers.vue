<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1 text-primary fw-bold">{{ quizTitle }}</h3>
        <p class="text-muted mb-0">Evaluate Submitted Answers</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">← Back</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="attempts.length === 0" class="alert alert-info text-center py-5">
      <h5>No submitted attempts yet</h5>
      <p>Students must submit their exams before you can evaluate.</p>
    </div>

    <!-- Attempt Selection -->
    <div v-else class="row">
      <!-- Attempts List (Sidebar) -->
      <div class="col-md-3 mb-4 mb-md-0">
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white fw-bold">
            Submitted Attempts
          </div>
          <div class="list-group list-group-flush" style="max-height: 600px; overflow-y: auto;">
            <button 
              v-for="attempt in attempts" 
              :key="attempt._id"
              @click="selectAttempt(attempt)"
              :class="['list-group-item', 'list-group-item-action', 'text-start', 
                       { active: selectedAttempt?._id === attempt._id }]"
            >
              <div class="fw-bold">{{ attempt.studentId.name }}</div>
              <small class="text-muted">
                Status: 
                <span :class="attempt.status === 'Evaluated' ? 'text-success' : 'text-warning'">
                  {{ attempt.status }}
                </span>
              </small>
            </button>
          </div>
        </div>
      </div>

      <!-- Evaluation Form -->
      <div class="col-md-9">
        <div v-if="selectedAttempt" class="card shadow">
          <!-- Student Info Card -->
          <div class="card-header bg-light border-bottom">
            <div class="row">
              <div class="col-md-6">
                <h5 class="mb-1 fw-bold">{{ selectedAttempt.studentId.name }}</h5>
                <small class="text-muted">{{ selectedAttempt.studentId.email }}</small>
              </div>
              <div class="col-md-6 text-end">
                <div class="mb-2">
                  <strong>Total Score:</strong> <span class="text-success fs-5">{{ calculateTotalScore() }} pts</span>
                </div>
                <small class="text-muted">Status: {{ selectedAttempt.status }}</small>
              </div>
            </div>
          </div>

          <!-- Questions & Answers -->
          <div class="card-body">
            <div v-for="(answer, idx) in selectedAttempt.answers" :key="answer.questionId" class="mb-4 pb-4 border-bottom">
              <!-- Question -->
              <div class="mb-3">
                <h6 class="fw-bold text-primary">Question {{ idx + 1 }}</h6>
                <p class="mb-2">{{ getQuestion(answer.questionId).questionText }}</p>
              </div>

              <!-- MCQ - Display Answer -->
              <div v-if="getQuestion(answer.questionId).type === 'MCQ'" class="mb-3">
                <div class="alert alert-info mb-2">
                  <strong>Student's Answer:</strong> {{ answer.submittedAnswer || '(Not answered)' }}
                </div>
                <div class="alert alert-success">
                  <strong>Correct Answer:</strong> {{ getQuestion(answer.questionId).correctAnswer }}
                </div>
                <div v-if="answer.isCorrect" class="badge bg-success">✓ Correct</div>
                <div v-else class="badge bg-danger">✗ Incorrect</div>
                <div class="mt-2">
                  <strong>Marks:</strong> <span class="text-success">{{ answer.marksAwarded }}</span> / {{ getQuestion(answer.questionId).marks }}
                </div>
              </div>

              <!-- Descriptive - Allow Grading -->
              <div v-else class="mb-3">
                <div class="alert alert-light border mb-3">
                  <strong>Student's Answer:</strong>
                  <p class="mt-2 mb-0">{{ answer.submittedAnswer || '(Not answered)' }}</p>
                </div>

                <!-- Grading Input -->
                <div class="row">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Assign Marks</label>
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control" 
                        min="0" 
                        :max="getQuestion(answer.questionId).marks"
                        v-model.number="grades[answer.questionId]"
                        @input="updateGrades"
                        :placeholder="`Max: ${getQuestion(answer.questionId).marks}`"
                      >
                      <span class="input-group-text">/ {{ getQuestion(answer.questionId).marks }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="card-footer bg-light d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary" @click="selectAttempt(null)">
              Clear Selection
            </button>
            <button 
              class="btn btn-success" 
              @click="submitEvaluation"
              :disabled="isSaving || selectedAttempt.status === 'Evaluated'"
            >
              {{ isSaving ? 'Saving...' : 'Save Evaluation' }}
            </button>
          </div>
        </div>

        <!-- No Attempt Selected -->
        <div v-else class="card shadow text-center py-5 text-muted">
          <p>Select an attempt from the list to evaluate</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const quizId = ref(route.params.id);

// State
const quizTitle = ref('');
const attempts = ref([]);
const selectedAttempt = ref(null);
const grades = ref({});
const loading = ref(true);
const isSaving = ref(false);

// Computed
const questionMap = computed(() => {
  if (!selectedAttempt.value) return {};
  const map = {};
  selectedAttempt.value.questions.forEach(q => {
    map[q._id] = q;
  });
  return map;
});

// Methods
const fetchAttempts = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/faculty/evaluate/${quizId.value}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    quizTitle.value = response.data.quiz.title;
    attempts.value = response.data.attempts;
  } catch (error) {
    console.error('Error fetching attempts:', error);
    alert('Failed to load attempts');
    router.push('/faculty/dashboard');
  } finally {
    loading.value = false;
  }
};

const selectAttempt = (attempt) => {
  selectedAttempt.value = attempt;
  grades.value = {};
  
  // Initialize grades with current values
  if (attempt) {
    attempt.answers.forEach(answer => {
      grades.value[answer.questionId] = answer.marksAwarded || 0;
    });
  }
};

const getQuestion = (questionId) => {
  return questionMap.value[questionId] || {};
};

const updateGrades = () => {
  // Grades are updated reactively
};

const calculateTotalScore = () => {
  if (!selectedAttempt.value) return 0;
  let total = 0;
  selectedAttempt.value.answers.forEach(answer => {
    const mark = grades.value[answer.questionId] || 0;
    total += mark;
  });
  return total;
};

const submitEvaluation = async () => {
  if (!selectedAttempt.value) return;
  
  if (!confirm('Are you sure you want to save these grades?')) return;
  
  isSaving.value = true;
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `http://localhost:5000/api/faculty/evaluate/${quizId.value}`,
      {
        attemptId: selectedAttempt.value._id,
        grades: grades.value
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert('Grades saved successfully!');
    selectedAttempt.value.status = 'Evaluated';
    grades.value = {};
  } catch (error) {
    console.error('Error saving grades:', error);
    alert('Failed to save grades');
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => {
  router.push('/faculty/dashboard');
};

onMounted(() => {
  fetchAttempts();
});
</script>

<style scoped>
.list-group-item.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
</style>
