# Attendance Management System

A full-stack attendance management web application built for **Mantech Attendance Pro** coding coaching institute.

## 🌐 Live Deployment
- **Frontend (Vercel):** [attendance-management-software-nine.vercel.app](https://attendance-management-software-nine.vercel.app)
- **Backend API (Render):** [attendance-management-software-5g4z.onrender.com](https://attendance-management-software-5g4z.onrender.com)
- **Database:** MongoDB Atlas (Cloud)

> ⚠️ The backend runs on Render's free tier and may take ~15–30 seconds to wake up after inactivity. The frontend will show a warning banner during this time.

## 🚀 Features
- **JWT Authentication** — Secure login & admin-only registration (Registration Key required)
- **Student Management** — Add/edit/delete students with multi-batch enrollment support
- **Batch Management** — Create and manage coaching batches; students can belong to multiple batches
- **Attendance Tracking** — Mark students present / absent / late per batch per day (bulk toggle)
- **Reports & Analytics** — Charts (Recharts) + Excel export (xlsx)
- **Notifications** — Real-time via Socket.io, email via Nodemailer
- **Dark Mode** — Full dark/light theme toggle
- **Responsive Design** — Works on mobile and desktop

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts, Tailwind CSS |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | Socket.io |
| Email | Nodemailer |
| Export | xlsx |

## 📁 Project Structure
```
attendance-software/
├── server.js           # Express entry point
├── config/             # DB connection
├── models/             # Mongoose schemas (User, Student, Batch, Attendance)
├── controllers/        # Business logic
├── routes/             # API route definitions
├── middleware/         # JWT auth middleware
└── frontend/           # React + Vite app
    └── src/
        ├── pages/      # Dashboard, Students, Batches, Attendance, Reports, Login, Register
        ├── components/ # Reusable UI components
        ├── layouts/    # MainLayout with sidebar + dark toggle
        ├── context/    # AuthContext (JWT storage)
        └── services/   # API call functions
```

## 🛠️ Local Development

### Backend
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, ADMIN_REGISTRATION_KEY

# Run dev server
npm run dev   # Uses nodemon, runs on port 5000
```

### Frontend
```bash
cd frontend
npm install

# Create frontend/.env
# VITE_API_URL=http://localhost:5000

npm run dev   # Runs on port 5173
```

## 🔐 Environment Variables

### Backend (`.env`)
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `ADMIN_REGISTRATION_KEY` | Key required to create new admin accounts |
| `PORT` | Server port (default: 5000) |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## 📄 API Endpoints

All data endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register (requires admin key) |
| GET | `/api/students` | List all students |
| POST | `/api/students` | Add student |
| GET | `/api/batches` | List all batches |
| POST | `/api/batches` | Create batch |
| POST | `/api/attendance` | Mark attendance (bulk) |
| GET | `/api/reports` | Get attendance reports |
| GET | `/health` | Health check (no auth needed) |

---

*Built with ❤️ by Yatin for Mantech Attendance Pro Coaching Institute*
