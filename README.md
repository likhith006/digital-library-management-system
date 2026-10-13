# 📚 Apex College Digital Library Management System

A full-stack web application for college library administration, academic resource management, digital e-book distribution, automated issue/return tracking, and fine management.

---

## 🌟 Features Overview

### 🔐 Authentication & Security
- **Role-Based Access Control**: 4 Distinct Roles (`ADMIN`, `LIBRARIAN`, `FACULTY`, `STUDENT`).
- **JWT Authentication**: Secure token verification stored in LocalStorage & HTTP headers.
- **Password Hashing**: Passwords encrypted using `bcryptjs` (never stored as plain text).
- **Protected API Routes**: Middleware authorization for endpoints.

### 📚 Book Catalog & Inventory Management
- **Complete Book CRUD**: Add, edit, update, delete academic books with cover preview.
- **Dynamic Stock Tracking**: `totalCopies` and `availableCopies` with automatic guard against negative values.
- **Advanced Search & Filtering**: Live search by Title, Author, ISBN, Publisher, Department, Category, stock status, and language.
- **Location Tracking**: Physical Shelf Number and Rack Number for quick book retrieval.
- **Format Options**: Support for Physical Copies, Digital E-Books (PDFs), or Both.

### 🔄 Book Issue & Return System
- **Librarian Issue Workflow**: Issue books to students or faculty with auto-calculated due dates.
- **Role Borrowing Rules**: Configurable issue durations (14 days for Students, 30 days for Faculty) and loan limits (3 books max for Students, 6 for Faculty).
- **Return Workflow**: Record book returns, update available copies, and auto-notify queued reservations.
- **Automatic Fine Calculation**: Configurable fine per day (default ₹2/day) computed dynamically based on calendar overdue days.

### 📌 Reservation Queue
- Reserve books currently out of stock (availableCopies = 0).
- Queue system that auto-approves and notifies the next waiting user upon book return.
- Prevents duplicate active reservations for the same user and book.

### 💻 Digital E-Library
- Repository for PDFs, Lecture Notes, Study Materials, Previous Question Papers, Research Journals, and Reference Handbooks.
- Filter by Department, Subject, and Semester.
- Download tracking counter with metadata preview.

### 📊 Analytics & Reports
- **Interactive Recharts Dashboard**:
  - Books by Category (Donut Chart)
  - Monthly Book Issues & Returns (Bar Chart)
  - Most Borrowed Academic Titles (Horizontal Bar Chart)
  - User Activity Distribution (Bar Chart)
- **Export Reports**: Generate and download official CSV spreadsheets for borrowing logs and overdue books.

### 🔔 Real-Time Notification Center
- Bell popover in Navbar with unread counter.
- Automated notification triggers for Book Issued, Book Returned, Overdue Warnings, Fine Incurred, Reservation Availability, and System Announcements.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with centralized request/response interceptors
- **Styling**: Vanilla CSS + Tailwind CSS v4 (Glassmorphism theme, modern typography)
- **Charts & Analytics**: Recharts
- **Icons**: React Icons (Feather & Remix Icons)

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose ORM (Atlas compatible + In-Memory Mongo fallback)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`)
- **Security**: `bcryptjs` password hashing & CORS configuration

---

## 📁 Project Structure

```
digital-library-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Sidebar, BookCard, StatCard, Modal, etc.)
│   │   ├── pages/            # Page components (Dashboard, Books, Details, MyBooks, IssueReturn, Users, etc.)
│   │   ├── layouts/          # MainLayout wrapper
│   │   ├── services/         # Axios API service modules
│   │   ├── context/          # AuthContext provider
│   │   ├── hooks/            # Custom hooks
│   │   ├── App.jsx           # App routes definition
│   │   ├── main.jsx          # Entrypoint
│   │   └── index.css         # Tailwind & custom CSS styles
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/               # Database connection (db.js)
│   ├── controllers/          # Business logic controllers
│   ├── middleware/           # Auth, Role, Error handling middlewares
│   ├── models/               # Mongoose schemas (User, Book, Issue, Reservation, Fine, Notification, etc.)
│   ├── routes/               # Express REST API routes
│   ├── utils/                # Fine calculator & JWT generator utilities
│   ├── server.js             # Main server file
│   ├── seed.js               # Database seed script
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🔑 Demo Login Credentials

The seed script initializes sample accounts for testing all user roles:

| Role | Email | Password | Account ID |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gist.edu` | `password123` | ADM-001 |
| **Librarian** | `librarian@gist.edu` | `password123` | LIB-102 |
| **Faculty** | `faculty@gist.edu` | `password123` | FAC-304 |
| **Student** | `student@gist.edu` | `password123` | STU-2024-001 |

---

## 🚀 Quick Start Guide

For demo use, accounts can be added to the configured MongoDB without clearing existing data by running `npm run add-demo-users` from `backend/`. The published demo password is for local/demo use only; change it before exposing the application.

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (Local instance running on `localhost:27017` OR MongoDB Atlas URI). The backend waits for the configured database connection and will not switch to temporary in-memory storage.

### Step 1: Install Backend Dependencies & Seed Data

```bash
cd backend
npm install
npm run seed
```

`npm run seed` clears and recreates library data. To preserve an existing database, use `npm run add-demo-users` and/or `npm run add-books` instead.

### Step 2: Start Backend Server

```bash
npm run dev
# Server will run on http://localhost:5000
```

### Step 3: Install Frontend Dependencies & Launch App

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
# Application will run on http://localhost:5173
```

---

## 📡 REST API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new student/faculty user
- `POST /api/auth/login` - Authenticate user & get JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile details

### Books (`/api/books`)
- `GET /api/books` - Get all books with search & filter params
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Add a new book (Admin/Librarian)
- `PUT /api/books/:id` - Update book details (Admin/Librarian)
- `DELETE /api/books/:id` - Delete book (Admin/Librarian)

### Book Issues (`/api/issues`)
- `POST /api/issues` - Issue book to student/faculty (Admin/Librarian)
- `GET /api/issues` - List all issue records (Admin/Librarian)
- `GET /api/issues/my` - List current user's issued books
- `PUT /api/issues/:id/return` - Return issued book & calculate fine (Admin/Librarian)

### Reservations (`/api/reservations`)
- `POST /api/reservations` - Reserve an out-of-stock book
- `GET /api/reservations` - List all reservations (Admin/Librarian)
- `GET /api/reservations/my` - List current user's reservations
- `PUT /api/reservations/:id` - Update reservation status (Admin/Librarian)
- `DELETE /api/reservations/:id` - Cancel reservation

### Digital Library (`/api/digital-library`)
- `GET /api/digital-library` - List digital study materials & PDFs
- `POST /api/digital-library` - Upload digital resource (Admin/Librarian)
- `GET /api/digital-library/:id/download` - Track & download file

### Fines & Reports (`/api/fines`, `/api/reports`)
- `GET /api/fines` - List fines
- `PUT /api/fines/:id/pay` - Pay or waive fine
- `GET /api/reports/dashboard` - Recharts analytics datasets
- `GET /api/reports/borrowing` - Detailed borrowing report
- `GET /api/reports/overdue` - Overdue books list

---

## 🛡 Business Logic Enforcement

1. **Copy Availability**: Books with `availableCopies = 0` cannot be issued.
2. **Borrowing Limits**: Students max 3 books; Faculty max 6 books (configurable via settings).
3. **Overdue Fine Calculation**: Computed as `(Overdue Days) × Fine Rate`.
4. **Active Reservation Guard**: Users cannot place duplicate active reservations for the same book.
5. **Role Security**: Regular users cannot alter book stock, user permissions, or access administrative reports.
