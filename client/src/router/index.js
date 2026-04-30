import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/shared/Login.vue';

const routes = [
    { path: '/', name: 'Login', component: Login },
    
    // Faculty Routes
    { 
        path: '/faculty/dashboard', 
        name: 'FacultyDashboard', 
        component: () => import('../views/faculty/Dashboard.vue'),
        meta: { requiresAuth: true, requiredRole: 'Faculty' }
    },
    { 
        path: '/faculty/create-quiz', 
        name: 'CreateQuiz', 
        component: () => import('../views/faculty/CreateQuiz.vue'),
        meta: { requiresAuth: true, requiredRole: 'Faculty' }
    },
    { 
        path: '/faculty/edit-quiz/:id', 
        name: 'EditQuiz', 
        component: () => import('../views/faculty/EditQuiz.vue'),
        meta: { requiresAuth: true, requiredRole: 'Faculty' }
    },
    { 
        path: '/faculty/monitor/:id', 
        name: 'MonitoringLobby', 
        component: () => import('../views/faculty/MonitoringLobby.vue'),
        meta: { requiresAuth: true, requiredRole: 'Faculty' }
    },
    { 
        path: '/faculty/evaluate/:id', 
        name: 'EvaluateAnswers', 
        component: () => import('../views/faculty/EvaluateAnswers.vue'),
        meta: { requiresAuth: true, requiredRole: 'Faculty' }
    },
    
    // Student Routes
    { 
        path: '/student/dashboard', 
        name: 'StudentDashboard', 
        component: () => import('../views/student/Dashboard.vue'),
        meta: { requiresAuth: true, requiredRole: 'Student' }
    },
    { 
        path: '/student/exam/:id', 
        name: 'StudentExam', 
        component: () => import('../views/student/Exam.vue'),
        meta: { requiresAuth: true, requiredRole: 'Student' }
    },
    { 
        path: '/student/results', 
        name: 'ResultsList', 
        component: () => import('../views/student/ResultsList.vue'),
        meta: { requiresAuth: true, requiredRole: 'Student' }
    },
    { 
        path: '/student/results/:id', 
        name: 'ResultDetail', 
        component: () => import('../views/student/ResultDetail.vue'),
        meta: { requiresAuth: true, requiredRole: 'Student' }
    },
    
    // Admin Routes
    { 
        path: '/admin/dashboard', 
        name: 'AdminDashboard', 
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { requiresAuth: true, requiredRole: 'Admin' }
    },
    { 
        path: '/admin/academic-structure', 
        name: 'AcademicStructure', 
        component: () => import('../views/admin/AcademicStructure.vue'),
        meta: { requiresAuth: true, requiredRole: 'Admin' }
    },
    { 
        path: '/admin/users', 
        name: 'UserManagement', 
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { requiresAuth: true, requiredRole: 'Admin' }
    },
    { 
        path: '/admin/logs', 
        name: 'SystemLogs', 
        component: () => import('../views/admin/SystemLogs.vue'),
        meta: { requiresAuth: true, requiredRole: 'Admin' }
    }
];

const router = createRouter({ history: createWebHistory(), routes });

// Auth Guard
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // If route requires auth
    if (to.meta.requiresAuth) {
        if (!token || !user) {
            next('/');
            return;
        }
        
        // Check role if specified
        if (to.meta.requiredRole) {
            const userData = JSON.parse(user);
            if (userData.role !== to.meta.requiredRole && userData.role !== 'Admin') {
                // Admins can access most routes, but students/faculty are restricted
                next('/');
                return;
            }
        }
    }
    
    next();
});

export default router;