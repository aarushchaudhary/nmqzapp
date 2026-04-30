import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/shared/Login.vue';

const routes = [
    { path: '/', name: 'Login', component: Login },
    { 
        path: '/faculty/create-quiz', 
        name: 'CreateQuiz', 
        component: () => import('../views/faculty/CreateQuiz.vue'),
        meta: { requiresAuth: true }
    },
    { 
        path: '/student/dashboard', 
        name: 'StudentDashboard', 
        component: () => import('../views/student/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    { 
        path: '/student/exam/:id', 
        name: 'StudentExam', 
        component: () => import('../views/student/Exam.vue'), // From Phase 5
        meta: { requiresAuth: true }
    }
];

const router = createRouter({ history: createWebHistory(), routes });

// Auth Guard
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !localStorage.getItem('token')) next('/');
    else next();
});

export default router;