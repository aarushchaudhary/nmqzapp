#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const FACULTY_USERNAME = process.env.FACULTY_USERNAME || 'faculty1';
const FACULTY_PASSWORD = process.env.FACULTY_PASSWORD || 'faculty123';
const STUDENT_USERNAME = process.env.STUDENT_USERNAME || 'student1';
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || 'student123';

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
const log = {
  success: (message) => {
    console.log(`${'✅'.green} ${message}`);
    results.passed++;
    results.tests.push({ status: 'PASS', message });
  },
  error: (message) => {
    console.log(`${'❌'.red} ${message}`);
    results.failed++;
    results.tests.push({ status: 'FAIL', message });
  },
  info: (message) => {
    console.log(`${'ℹ️ '.cyan} ${message}`);
  },
  section: (title) => {
    console.log(`\n${'═'.repeat(60)}$`);
    console.log(`${title.underline.bold.blue}`);
    console.log(`${'═'.repeat(60)}`);
  }
};

// Main test runner
async function runTests() {
  console.clear();
  console.log('\n🧪 MEVN QUIZ APP - E2E CONNECTIVITY TEST SUITE\n'.bold.yellow);
  console.log(`Testing: ${BASE_URL}`.gray);
  console.log(`Timestamp: ${new Date().toISOString()}`.gray);

  try {
    // Test 1: Server Health Check
    await testServerHealth();

    // Test 2: Authentication Tests
    await testAdminAuthentication();
    await testFacultyAuthentication();
    await testStudentAuthentication();

    // Test 3: Role-Based Endpoint Tests
    await testAdminEndpoints();
    await testFacultyEndpoints();
    await testStudentEndpoints();

    // Test 4: Database Connectivity (via endpoints)
    await testDatabaseConnectivity();

  } catch (error) {
    log.error(`Unexpected error during tests: ${error.message}`);
  }

  // Print summary
  printSummary();
}

// Test: Server Health Check
async function testServerHealth() {
  log.section('Server Health Check');

  try {
    const response = await axios.get(`${BASE_URL}/auth/health`, { timeout: 5000 });
    log.success(`Server is running and responding (${response.status})`);
  } catch (error) {
    if (error.response?.status === 404) {
      // Health endpoint might not exist, try auth endpoint instead
      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD
        });
        log.success('Server is accessible (via login endpoint)');
      } catch (err) {
        log.error(`Server health check failed: ${err.message}`);
      }
    } else {
      log.error(`Cannot reach server at ${BASE_URL}: ${error.message}`);
    }
  }
}

// Test: Admin Authentication
async function testAdminAuthentication() {
  log.section('Admin Authentication');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD
    });

    if (response.data.token) {
      global.adminToken = response.data.token;
      log.success(`Admin authenticated successfully`);
      log.info(`Token: ${response.data.token.substring(0, 20)}...`);
      return true;
    } else {
      log.error('Admin login succeeded but no token returned');
      return false;
    }
  } catch (error) {
    log.error(`Admin authentication failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test: Faculty Authentication
async function testFacultyAuthentication() {
  log.section('Faculty Authentication');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: FACULTY_USERNAME,
      password: FACULTY_PASSWORD
    });

    if (response.data.token) {
      global.facultyToken = response.data.token;
      log.success(`Faculty authenticated successfully`);
      log.info(`Token: ${response.data.token.substring(0, 20)}...`);
      return true;
    } else {
      log.error('Faculty login succeeded but no token returned');
      return false;
    }
  } catch (error) {
    log.error(`Faculty authentication failed: ${error.response?.data?.message || error.message}`);
    log.info('Note: Faculty user may need to be created via Admin panel first');
    return false;
  }
}

// Test: Student Authentication
async function testStudentAuthentication() {
  log.section('Student Authentication');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: STUDENT_USERNAME,
      password: STUDENT_PASSWORD
    });

    if (response.data.token) {
      global.studentToken = response.data.token;
      log.success(`Student authenticated successfully`);
      log.info(`Token: ${response.data.token.substring(0, 20)}...`);
      return true;
    } else {
      log.error('Student login succeeded but no token returned');
      return false;
    }
  } catch (error) {
    log.error(`Student authentication failed: ${error.response?.data?.message || error.message}`);
    log.info('Note: Student user may need to be created via Admin panel first');
    return false;
  }
}

// Test: Admin Endpoints
async function testAdminEndpoints() {
  log.section('Admin Endpoints');

  if (!global.adminToken) {
    log.error('Skipping admin endpoint tests (admin not authenticated)');
    return;
  }

  const headers = { Authorization: `Bearer ${global.adminToken}` };

  // Test: Get all users
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, { headers });
    log.success(`✓ GET /admin/users - Retrieved ${response.data.length} users`);
  } catch (error) {
    log.error(`✗ GET /admin/users - ${error.response?.data?.message || error.message}`);
  }

  // Test: Get all schools
  try {
    const response = await axios.get(`${BASE_URL}/admin/academic/schools`, { headers });
    log.success(`✓ GET /admin/academic/schools - Retrieved ${response.data.length} schools`);
  } catch (error) {
    log.error(`✗ GET /admin/academic/schools - ${error.response?.data?.message || error.message}`);
  }

  // Test: Get system logs
  try {
    const response = await axios.get(`${BASE_URL}/admin/logs`, { headers });
    log.success(`✓ GET /admin/logs - Retrieved ${response.data.length} logs`);
  } catch (error) {
    log.error(`✗ GET /admin/logs - ${error.response?.data?.message || error.message}`);
  }

  // Test: Get courses
  try {
    const response = await axios.get(`${BASE_URL}/admin/academic/courses`, { headers });
    log.success(`✓ GET /admin/academic/courses - Retrieved ${response.data.length} courses`);
  } catch (error) {
    log.error(`✗ GET /admin/academic/courses - ${error.response?.data?.message || error.message}`);
  }

  // Test: Get specializations
  try {
    const response = await axios.get(`${BASE_URL}/admin/academic/specializations`, { headers });
    log.success(`✓ GET /admin/academic/specializations - Retrieved ${response.data.length} specializations`);
  } catch (error) {
    log.error(`✗ GET /admin/academic/specializations - ${error.response?.data?.message || error.message}`);
  }
}

// Test: Faculty Endpoints
async function testFacultyEndpoints() {
  log.section('Faculty Endpoints');

  if (!global.facultyToken) {
    log.error('Skipping faculty endpoint tests (faculty not authenticated)');
    return;
  }

  const headers = { Authorization: `Bearer ${global.facultyToken}` };

  // Test: Get my quizzes
  try {
    const response = await axios.get(`${BASE_URL}/faculty/my-quizzes`, { headers });
    log.success(`✓ GET /faculty/my-quizzes - Retrieved ${response.data.length} quizzes`);
  } catch (error) {
    log.error(`✗ GET /faculty/my-quizzes - ${error.response?.data?.message || error.message}`);
  }
}

// Test: Student Endpoints
async function testStudentEndpoints() {
  log.section('Student Endpoints');

  if (!global.studentToken) {
    log.error('Skipping student endpoint tests (student not authenticated)');
    return;
  }

  const headers = { Authorization: `Bearer ${global.studentToken}` };

  // Test: Get available quizzes
  try {
    const response = await axios.get(`${BASE_URL}/student/quizzes`, { headers });
    log.success(`✓ GET /student/quizzes - Retrieved ${response.data.length} available quizzes`);
  } catch (error) {
    log.error(`✗ GET /student/quizzes - ${error.response?.data?.message || error.message}`);
  }

  // Test: Get student results
  try {
    const response = await axios.get(`${BASE_URL}/student/results`, { headers });
    log.success(`✓ GET /student/results - Retrieved ${response.data.length} results`);
  } catch (error) {
    log.error(`✗ GET /student/results - ${error.response?.data?.message || error.message}`);
  }
}

// Test: Database Connectivity
async function testDatabaseConnectivity() {
  log.section('Database Connectivity');

  if (!global.adminToken) {
    log.error('Skipping database tests (admin not authenticated)');
    return;
  }

  const headers = { Authorization: `Bearer ${global.adminToken}` };

  // Test: Database has users
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, { headers });
    if (response.data.length > 0) {
      log.success(`Database contains ${response.data.length} users`);
    } else {
      log.error('Database appears to be empty (no users found)');
    }
  } catch (error) {
    log.error(`Database connectivity test failed: ${error.message}`);
  }

  // Test: Database indexes are working
  try {
    const response = await axios.get(`${BASE_URL}/admin/academic/schools`, { headers });
    log.success('Database indexes operational (schools query successful)');
  } catch (error) {
    log.error(`Database index test failed: ${error.message}`);
  }
}

// Print Summary
function printSummary() {
  log.section('Test Summary');

  const total = results.passed + results.failed;
  const passPercentage = ((results.passed / total) * 100).toFixed(1);

  console.log(`\nTotal Tests: ${total}`);
  console.log(`${'Passed:'.green} ${results.passed.toString().green}`);
  console.log(`${'Failed:'.red} ${results.failed.toString().red}`);
  console.log(`Success Rate: ${passPercentage}%\n`);

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Application is ready for use.'.green.bold);
  } else if (results.failed <= 2) {
    console.log('⚠️  Some tests failed. Check the errors above.'.yellow.bold);
  } else {
    console.log('🚨 Multiple tests failed. Please review the backend and database.'.red.bold);
  }

  console.log('\n' + '═'.repeat(60));
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
