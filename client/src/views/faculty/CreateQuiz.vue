<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between mb-3">
      <h2>Create New Quiz</h2>
      <button @click="router.push('/faculty/dashboard')" class="btn btn-secondary">Back</button>
    </div>

    <form @submit.prevent="submitQuiz">
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title text-primary">Quiz Settings</h5>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Quiz Title</label>
              <input type="text" class="form-control" v-model="quiz.title" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Duration (Minutes)</label>
              <input type="number" class="form-control" v-model="quiz.durationMinutes" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Start Time</label>
              <input type="datetime-local" class="form-control" v-model="quiz.startTime" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">End Time</label>
              <input type="datetime-local" class="form-control" v-model="quiz.endTime" required>
            </div>
          </div>
        </div>
      </div>

      <div v-for="(question, index) in quiz.questions" :key="index" class="card shadow-sm mb-3">
        <div class="card-body bg-light">
          <div class="d-flex justify-content-between">
            <h6>Question {{ index + 1 }}</h6>
            <button type="button" class="btn btn-sm btn-danger" @click="removeQuestion(index)">Remove</button>
          </div>
          <input type="text" class="form-control mb-2" v-model="question.questionText" placeholder="Enter question..." required>
          
          <div class="row">
            <div class="col-6 mb-2" v-for="(opt, oIndex) in 4" :key="oIndex">
              <input type="text" class="form-control form-control-sm" v-model="question.options[oIndex]" :placeholder="'Option ' + (oIndex + 1)" required>
            </div>
          </div>
          <div class="mt-2">
             <label class="form-label small text-success fw-bold">Exact Correct Answer text (must match one option above):</label>
             <input type="text" class="form-control form-control-sm border-success" v-model="question.correctAnswer" required>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-between mb-5">
        <button type="button" class="btn btn-outline-primary" @click="addQuestion">+ Add MCQ Question</button>
        <button type="submit" class="btn btn-success" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Publish Quiz' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isSaving = ref(false);

const quiz = ref({
    title: '', durationMinutes: 60, startTime: '', endTime: '',
    questions: [{ questionText: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' }]
});

const addQuestion = () => {
    quiz.value.questions.push({ questionText: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' });
};

const removeQuestion = (index) => {
    quiz.value.questions.splice(index, 1);
};

const submitQuiz = async () => {
    isSaving.value = true;
    try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/faculty/quiz', quiz.value, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert('Quiz created and published!');
        router.push('/faculty/dashboard'); // Or back to dashboard
    } catch (error) {
        alert('Error saving quiz: ' + error.response?.data?.message);
    } finally {
        isSaving.value = false;
    }
};
</script>