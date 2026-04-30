# NMQZAPP (NMIMS Quiz App)

A comprehensive **MEVN Stack** quiz management and evaluation system with role-based access control, real-time monitoring, advanced analytics, and item analysis features.

## 📋 Overview

NMQZAPP is a full-featured web application designed to manage online quizzes and exams with support for multiple user roles:
- **Admin**: System management, user creation, academic structure setup
- **Faculty**: Quiz creation, monitoring, evaluation, item analysis
- **Student**: Quiz participation, result tracking
- **Placecom**: System-wide result dashboard and analytics

---

## 🛠️ Technology Stack

### Frontend
- **Vue 3** (Composition API with `<script setup>`)
- **Vue Router** (SPA routing with role-based guards)
- **Axios** (HTTP client for API calls)
- **Bootstrap 5** (Responsive UI framework)
- **Vite** (Build tool)

### Backend
- **Node.js** (Runtime)
- **Express.js** (Web framework)
- **MongoDB** (NoSQL database)
- **Mongoose** (ODM)
- **Socket.io** (Real-time communication)
- **Multer** (File uploads)
- **CSV Parser** (CSV file processing)
- **JWT** (Authentication)
- **bcryptjs** (Password hashing)

### Development Tools
- **Nodemon** (Auto-restart during development)
- **dotenv** (Environment variables)

---

## 📁 Project Structure

```
NMQZAPP/
├── client/                          # Vue 3 Frontend (Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── App.vue                  # Root component
│   │   ├── main.js                  # Entry point
│   │   ├── style.css                # Global styles
│   │   ├── components/
│   │   │   ├── Navbar.vue           # Navigation (role-aware)
│   │   │   └── HelloWorld.vue
│   │   ├── router/
│   │   │   └── index.js             # Route definitions with auth guards
│   │   ├── views/
│   │   │   ├── shared/
│   │   │   │   └── Login.vue
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── AcademicStructure.vue
│   │   │   │   ├── UserManagement.vue
│   │   │   │   ├── SystemLogs.vue
│   │   │   │   └── AcademicSections/
│   │   │   ├── faculty/
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── CreateQuiz.vue
│   │   │   │   ├── EditQuiz.vue
│   │   │   │   ├── MonitoringLobby.vue
│   │   │   │   ├── EvaluateAnswers.vue
│   │   │   │   └── ItemAnalysis.vue
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.vue
│   │   │   │   ├── Exam.vue
│   │   │   │   ├── ResultsList.vue
│   │   │   │   └── ResultDetail.vue
│   │   │   └── placecom/
│   │   │       └── PlacecomDashboard.vue
│   │   └── services/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── server/                          # Express Backend
    ├── src/
    │   ├── config/
    │   │   └── db.js                # MongoDB connection
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── Quiz.js
    │   │   ├── QuizAttempt.js
    │   │   ├── School.js
    │   │   ├── Course.js
    │   │   ├── Specialization.js
    │   │   └── SystemLog.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── quizController.js
    │   │   ├── attemptController.js
    │   │   ├── userController.js
    │   │   ├── academicController.js
    │   │   └── logsController.js
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── facultyRoutes.js
    │   │   ├── studentRoutes.js
    │   │   ├── adminRoutes.js
    │   │   └── placecomRoutes.js
    │   ├── middlewares/
    │   │   └── authMiddleware.js
    │   └── sockets/
    │       └── socketHandler.js
    ├── server.js                    # Entry point
    ├── package.json
    └── .env.example
```

---

## ✨ Key Features

### 1. **User Management**
- Role-based access control (Admin, Faculty, Student, Placecom)
- User creation with CRUD operations
- Bulk user upload via CSV
- Academic assignment (School, Course, Specialization)

### 2. **Quiz Management (Faculty)**
- Create, edit, delete quizzes
- Question types: MCQ and Descriptive
- Auto-evaluation for MCQ questions
- Bulk question upload via CSV/Excel
- Quiz status tracking (Draft, Published, Completed)

### 3. **Student Exam Experience**
- Browse available quizzes based on schedule
- Real-time exam interface
- Auto-save answers
- Submit completed exams

### 4. **Evaluation System**
- Faculty-led evaluation of descriptive answers
- Grade assignment per question
- Student disqualification with reasons
- Re-enable disqualified students
- Real-time result calculation

### 5. **Item Analysis**
- Per-question statistics
- Success rate analysis
- Attempt breakdown (correct, incorrect, unanswered)
- Visual progress bars with color coding
- CSV export of analysis data

### 6. **Placecom Dashboard**
- System-wide result aggregation
- Advanced filtering (search, course, specialization, status)
- Comprehensive data table with pagination
- CSV export functionality
- Summary statistics

### 7. **Monitoring & Logging**
- Real-time quiz attempt monitoring
- System activity logging
- Student exam tracking

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/nmqzapp
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Admin Routes
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/upload` - Bulk upload users (CSV)
- `GET /api/admin/academic/schools` - Get schools
- `GET /api/admin/academic/courses` - Get courses
- `GET /api/admin/academic/specializations` - Get specializations

### Faculty Routes
- `GET /api/faculty/my-quizzes` - Get faculty's quizzes
- `POST /api/faculty/quiz` - Create quiz
- `PUT /api/faculty/quiz/:id` - Update quiz
- `DELETE /api/faculty/quiz/:id` - Delete quiz
- `GET /api/faculty/monitor/:quizId` - Get quiz monitoring data
- `GET /api/faculty/evaluate/:quizId` - Get attempts for evaluation
- `PUT /api/faculty/evaluate/:quizId` - Save grades
- `POST /api/faculty/quiz/:id/upload-questions` - Bulk upload questions
- `GET /api/faculty/quiz/:id/analysis` - Get item analysis
- `PUT /api/faculty/attempt/:attemptId/reenable` - Re-enable student

### Student Routes
- `GET /api/student/quizzes` - Get available quizzes
- `GET /api/student/quiz/:id` - Get specific quiz
- `POST /api/student/submit-exam` - Submit exam attempt
- `GET /api/student/results` - Get student's results

### Placecom Routes
- `GET /api/placecom/results` - Get all system results

---

## 🔐 Authentication & Authorization

- **JWT Token-based Authentication**: All endpoints (except login/register) require a valid JWT token
- **Role-based Access Control**: Routes protected by role (Admin, Faculty, Student, Placecom)
- **Frontend Guards**: Vue Router guards ensure users can only access routes for their role

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage users, academic structure, system logs |
| **Faculty** | Create/edit quizzes, monitor students, evaluate answers, view item analysis |
| **Student** | Take quizzes, view results |
| **Placecom** | View all system results and analytics |

---

## 📊 Database Schema

### User
```javascript
{
  username: String (unique),
  password: String (hashed),
  name: String,
  role: String (Admin|Faculty|Student|Placecom),
  school: ObjectId (ref: School),
  course: ObjectId (ref: Course),
  specialization: ObjectId (ref: Specialization),
  isActive: Boolean
}
```

### Quiz
```javascript
{
  title: String,
  description: String,
  facultyId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  startTime: Date,
  endTime: Date,
  durationMinutes: Number,
  status: String (Draft|Published|Completed),
  questions: [{
    questionText: String,
    type: String (MCQ|Descriptive),
    options: [String],
    correctAnswer: String,
    marks: Number
  }]
}
```

### QuizAttempt
```javascript
{
  studentId: ObjectId (ref: User),
  quizId: ObjectId (ref: Quiz),
  answers: [{
    questionId: ObjectId,
    submittedAnswer: String,
    isCorrect: Boolean,
    marksAwarded: Number
  }],
  totalScore: Number,
  status: String (In Progress|Submitted|Evaluated),
  disqualified: Boolean,
  disqualificationReason: String,
  startedAt: Date,
  submittedAt: Date
}
```

---

## 🧪 Testing the Application

### Sample Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

**Faculty User:**
- Username: `faculty1`
- Password: `faculty123`

**Student User:**
- Username: `student1`
- Password: `student123`

**Placecom User:**
- Username: `placecom1`
- Password: `placecom123`

---

## 📝 CSV Upload Formats

### Bulk Users Upload
```csv
username,password,name,role,schoolName,courseName,specializationName
john_doe,pass123,John Doe,Faculty,Engineering,B.Tech,CSE
jane_smith,pass456,Jane Smith,Student,Science,B.Sc,Physics
```

### Bulk Questions Upload
```csv
questionText,type,options,correctAnswer,marks
What is 2+2?,MCQ,2|3|4|5,4,1
Explain photosynthesis,Descriptive,,N/A,5
What is the capital of France?,MCQ,London|Paris|Berlin,Paris,2
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port by setting PORT in .env
```

### MongoDB Connection Error
- Ensure MongoDB is running locally or update `MONGODB_URI` in `.env`
- Check connection string format

### CORS Issues
- Frontend should be on `http://localhost:5173`
- Backend should be on `http://localhost:5000`
- CORS is configured in `server.js`

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Development Notes

### Frontend Development
- Uses Vue 3 Composition API with `<script setup>`
- Bootstrap 5 for styling (no custom CSS)
- Axios for API calls with JWT token handling
- Router with meta guards for role-based access

### Backend Development
- Express middleware for authentication and authorization
- Mongoose for database operations
- Socket.io for real-time updates
- CSV parsing for bulk imports
- File uploads handled by Multer

---

## 🚢 Deployment

### Frontend (Vite)
```bash
cd client
npm run build
# Serve dist/ folder with any static host
```

### Backend (Node.js)
```bash
cd server
NODE_ENV=production npm start
# Use PM2 or similar for process management
```

---

## 📄 License

This project is private and proprietary.

---

## 👥 Contributors

- Development Team

---

## 📞 Support

For issues or questions, please contact the development team.

---

## 🎯 Roadmap

- [ ] Real-time Socket.io integration for live monitoring
- [ ] Email notifications for quiz events
- [ ] Advanced report generation
- [ ] Mobile app (React Native)
- [ ] AI-based plagiarism detection
- [ ] Proctoring features

---

## ✅ Verification Checklist

- [x] Full MEVN stack implementation
- [x] Role-based access control
- [x] Quiz management system
- [x] Evaluation system
- [x] Item analysis
- [x] Placecom dashboard
- [x] Bulk upload features
- [x] Error handling
- [x] Bootstrap 5 UI
- [x] JWT authentication

---

**Built with ❤️ using Vue 3, Express, MongoDB, and Node.js**
