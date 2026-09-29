# JobTrack — Job Application Tracker Portal

> A production-ready, full-stack MERN application to manage job applications, visualize interview pipelines with interactive drag-and-drop, attach tailored resumes, automate deadline alerts, and analyze job search metrics.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=json-web-tokens)
![Jest](https://img.shields.io/badge/Tested%20with-Jest%20%26%20Supertest-C21325?style=flat-square&logo=jest)

---

## 📌 Problem Statement

Students and tech professionals apply to dozens of roles across LinkedIn, Indeed, Naukri, and company portals. Without a central tracker:

- Applications and status updates get lost
- Upcoming interview dates and assessment deadlines get missed
- Tailored resumes and cover letters get mixed up
- There is no unified way to measure interview conversion rates

**JobTrack** solves this with a structured, beautiful, and data-driven platform built for modern job seekers.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🔐 **Authentication** | JWT-based registration and login with `bcryptjs` password hashing and protected routes. |
| 🗂️ **Interactive Kanban Board** | Fluid drag-and-drop workflow (`@hello-pangea/dnd`) across stages (`Saved` → `Applied` → `OA` → `Interview` → `Offer` → `Rejected`) with optimistic UI updates. |
| 📄 **Resume & Document Attachments** | Attach tailored resumes (`.pdf`, `.doc`, `.docx`) directly to applications using `multer` with one-click preview and download. |
| ⏰ **Automated Reminders & Cron Alerts** | Scheduled background service (`node-cron` + `nodemailer`) that scans for impending interview dates and deadlines, with real-time in-app alert banners. |
| 📄 **Server-Side Pagination & Filtering** | Scalable database pagination (`page`, `limit`), stage & source filters, and debounced instant search. |
| 📊 **Analytics & Reports Dashboard** | Visual charts (bar charts, pie breakdowns, weekly trends) powered by **Recharts**. |
| ⭐ **Priority Flagging & Tracking** | Highlight dream companies and top-priority applications with status notes and salary notes. |
| 🧪 **Automated Testing Suite** | 14 integration and unit test specs covering Auth and Applications APIs using **Jest** and **Supertest**. |

---

## 🛠️ Tech Stack

### Frontend
- **React.js 18** (Components, Context API, Hooks)
- **@hello-pangea/dnd** (Accessible Drag-and-Drop)
- **React Router v6** (Protected and public routing)
- **Axios** (API requests with automatic JWT interceptors)
- **Recharts** (Analytics and conversion visualization)
- **React Hot Toast** (User notifications)
- **Custom CSS** (Dark editorial design system)

### Backend
- **Node.js** & **Express.js** (REST API)
- **MongoDB** & **Mongoose** (ODM, schemas, text indexing, aggregation pipelines)
- **Multer** (Multipart file uploads and storage)
- **node-cron** & **nodemailer** (Background cron jobs and email alerts)
- **jsonwebtoken** & **bcryptjs** (Auth and encryption)
- **Jest** & **Supertest** (Automated API test suite)

---

## 📁 Folder Structure

```
job-application-tracker-portal/
├── client/                          # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Layout.js            # Sidebar shell & upcoming reminder alerts
│   │   │   └── ApplicationModal.js  # Add/Edit modal with resume upload
│   │   ├── context/
│   │   │   └── AuthContext.js       # Global authentication state
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── ApplicationsPage.js  # Table with server-side pagination
│   │   │   ├── KanbanPage.js        # Drag-and-drop pipeline board
│   │   │   └── ReportsPage.js
│   │   ├── utils/
│   │   │   └── api.js               # Axios instance with interceptors
│   │   ├── App.js                   # Route definitions
│   │   └── index.css                # Global styles
│   └── package.json
│
├── server/                          # Express backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── seedData.js              # Sample data generator
│   ├── controllers/
│   │   ├── authController.js        # Register, login, get current user
│   │   ├── applicationController.js # CRUD, pagination, file upload & alerts
│   │   └── dashboardController.js   # Analytics aggregations
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT route guard
│   │   └── uploadMiddleware.js      # Multer file upload setup
│   ├── models/
│   │   ├── User.js                  # User schema with bcrypt methods
│   │   └── JobApplication.js        # Job Application schema with resume & dates
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── applicationRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/
│   │   └── cronService.js           # Automated deadline & interview reminders
│   ├── tests/                       # Automated test suite
│   │   ├── auth.test.js
│   │   └── applications.test.js
│   ├── jest.config.js
│   ├── index.js                     # Server entrypoint
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas cluster)

### 1. Clone the Repository
```bash
git clone https://github.com/Gunjapalle-Suma-Bhavya/job-application-tracker-portal.git
cd job-application-tracker-portal
```

### 2. Configure Backend (`server`)
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobtrack
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Optional: Email reminders (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the backend development server:
```bash
npm run dev
```

### 3. Configure Frontend (`client`)
In a new terminal window:
```bash
cd client
npm install
npm start
```
The application will open at `http://localhost:3000`.

---

## 🧪 Running Automated Tests

To execute the backend integration and unit test suite:
```bash
cd server
npm test
```
All 14 test specs across authentication, permissions, pagination, and application lifecycle will run and verify endpoints.

---

## 👩‍💻 Author

**Suma Bhavya**
- GitHub: [@Gunjapalle-Suma-Bhavya](https://github.com/Gunjapalle-Suma-Bhavya)
- Repository: [job-application-tracker-portal](https://github.com/Gunjapalle-Suma-Bhavya/job-application-tracker-portal)

---

⭐ If you found this project helpful, feel free to give it a star on GitHub!
