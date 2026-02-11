# 🚀 Task Management System (Autonomize AI)

A modern, real-time Task Management System built with the MERN stack (MongoDB, Express, React, Node.js) featuring a glassmorphism UI, real-time updates, background jobs, and caching.

## ✨ Features

- **Dashboard**: Interactive task list with filtering, sorting, and search.
- **Real-time Updates**: Live updates across clients using **Socket.io**.
- **Rich Text**: Markdown support in task comments.
- **Background Jobs**: Asynchronous email notifications using **Bull** (Redis).
- **Caching**: **Redis** caching for high-performance task retrieval.
- **File Attachments**: Upload and download files for tasks.
- **Authentication**: JWT-based secure authentication.
- **Dark Mode**: Premium glassmorphism design.
- **Analytics**: Task completion trends and performance metrics.
- **Testing**: Integrated API tests with **Jest** and **Supertest**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS (Custom Glassmorphism Design System)
- **State/API**: React Query (TanStack Query) / Axios
- **Real-time**: Socket.io-client
- **Markdown**: react-markdown
- **Animation**: Framer Motion

### Backend
- **Runtime**: Node.js / Express
- **Database**: MongoDB (via Prisma ORM)
- **Caching/Queue**: Redis (ioredis, bull)
- **Email**: Nodemailer (Ethereal for dev)
- **Real-time**: Socket.io
- **Testing**: Jest, Supertest

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Redis (Optional, recommended for Caching & Emails)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd autonomize-ai-root
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup Environment Variables
cp .env.example .env
# Edit .env and add your MongoDB URL and JWT Secret

# Run Database Migrations
npx prisma generate
npx prisma db push --accept-data-loss

# Run Tests (Optional)
npm test

# Start Backend
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Setup Environment Variables
# Create .env and set VITE_API_URL=http://localhost:3000

# Start Frontend
npm run dev
```

### 4. Run Both concurrently (Root)
```bash
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend Port | `3000` |
| `DATABASE_URL` | MongoDB Connection String | - |
| `JWT_SECRET` | Secret for signing JWTs | - |
| `REDIS_HOST` | Redis Host | `localhost` |
| `REDIS_PORT` | Redis Port | `6379` |
| `SMTP_HOST` | SMTP Server | `smtp.ethereal.email` |
| `SMTP_PORT` | SMTP Port | `587` |
| `FRONTEND_URL` | CORS Origin URL | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |

---

## 📐 Architecture Decisions

1.  **Monorepo Structure**: Kept Frontend and Backend in a single repository for easier development and deployment coordination (`concurrently` used for dev).
2.  **Prisma ORM**: Chosen for type-safe database access and easy schema management with MongoDB.
3.  **Socket.io for Real-time**: Selected over polling or SSE for bidirectional, event-based communication (perfect for "Task Created/Updated" events).
4.  **Bull for Background Jobs**: Decoupled email sending from the API response cycle to ensure low latency. Use of Redis makes this robust.
5.  **Graceful Degradation**: The Caching and Job Queue services check for Redis connectivity. If Redis is down, the app continues to function (caching disabled, background jobs skipped) to ensure high availability.
6.  **Glassmorphism UI**: Implemented a custom design system using Tailwind utility classes (`backdrop-filter`, `bg-opacity`) rather than a component library to demonstrate CSS proficiency and unique aesthetic.
7.  **Testing Strategy**: Focused on **Integration Tests** for the Controller/API layer as they provide the highest confidence-to-effort ratio for a CRUD application.

---

## 🧐 Assumptions Made

1.  **Redis Availability**: Assumed Redis might not be installed on every dev machine, so the system is built to warn but not crash if Redis is missing.
2.  **Email Delivery**: Used Ethereal (fake SMTP) for demonstration to avoid needing real credentials. Emails are logged to the console/Ethereal URL.
3.  **Single User Logic**: While the system supports multiple users, the current task view filters by `userId` (Personal Task Manager). Real-time events are currently broadcast to all clients for demonstration purposes, but effectively filtered by user ID in production logic.
4.  **Data Persistence**: Attachments are stored as metadata in MongoDB (mock implementation of file storage, or GridFS if extended). Current implementation assumes mostly text-based metadata for files.

---

## 🧪 Running Tests

To run the backend integration tests:

```bash
cd backend
npm test
```
**Metrics Verified**:
- Task Creation
- Validation Logic
- Error Handling
