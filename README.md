# AegisFlow — Intelligent Project Management System

A full-stack intelligent project management platform built with React, Node.js, Express, Prisma, Neon PostgreSQL, and Clerk Authentication.

---

# 🌟 Features

* **Workspace Management** — Create and switch between multiple workspaces
* **Project Management** — Create, update, and manage projects with status and priority tracking
* **Task Management** — Organize tasks with assignees, priorities, due dates, and task types
* **Team Collaboration** — Add workspace and project members with role-based access
* **Project Analytics** — Charts for task status, type, and priority breakdowns
* **Calendar View** — Visualize task deadlines on a calendar
* **Task Discussion** — Real-time comment threads per task
* **Dashboard** — Statistics, recent activity, and personal task summaries
* **Dark Mode** — Full dark/light theme toggle with persistence
* **Protected Routes** — Clerk-authenticated routes on both client and server
* **Background Jobs** — Automated sync and workflow handling using Inngest

---

# 📋 Tech Stack

## Client

* React 18 + Vite
* Redux Toolkit
* Tailwind CSS v4
* Clerk React
* Axios
* react-hot-toast
* Recharts
* date-fns

## Server

* Node.js
* Express.js 5
* Prisma ORM
* Neon PostgreSQL
* Clerk Express
* Inngest
* Svix

---

# 🏗️ Project Architecture

```bash
Project-Management-System/
├── Client/
│   └── src/
│       ├── app/            # Redux store
│       ├── assets/         # Static assets
│       ├── components/     # Feature components
│       │   └── ui/         # Reusable UI components
│       ├── configs/        # Axios instance & configuration
│       ├── features/       # Redux slices
│       ├── hooks/          # Custom reusable hooks
│       ├── pages/          # Route pages
│       ├── services/       # API service layer
│       └── utils/          # Helper functions
│
└── Server/
    ├── configs/            # Prisma & server configs
    ├── controller/         # Route controllers
    ├── inngest/            # Background job handlers
    ├── middleware/         # Error handling & logging
    ├── prisma/             # Prisma schema
    ├── routes/             # Express routes
    └── server.js           # Entry point
```

---

# 🚀 Getting Started

## Prerequisites

* Node.js v18+
* npm
* Neon PostgreSQL database
* Clerk account

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/Ujjwalrohilla12/Project-Management-System.git
cd Project-Management-System
```

## Install Client Dependencies

```bash
cd Client
npm install
```

## Install Server Dependencies

```bash
cd ../Server
npm install
```

---

# ⚙️ Environment Setup

## Server `.env`

```env
NODE_ENV=development

DATABASE_URL=your_neon_pooled_connection_string
DIRECT_URL=your_neon_direct_connection_string

CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

PORT=5000
```

## Client `.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BASEURL=http://localhost:5000
```

---

# 🗄️ Database Setup

```bash
cd Server

npx prisma migrate dev --name init
npx prisma generate
```

---

# ▶️ Running the Application

## Start Server

```bash
cd Server
npm run dev
```

## Start Client

```bash
cd Client
npm run dev
```

---

# 🔑 API Endpoints

| Method | Endpoint                           | Description          |
| ------ | ---------------------------------- | -------------------- |
| GET    | `/api/workspaces`                  | Get user workspaces  |
| POST   | `/api/workspaces`                  | Create workspace     |
| PUT    | `/api/workspaces/:id`              | Update workspace     |
| POST   | `/api/workspaces/:id/members`      | Add workspace member |
| GET    | `/api/projects/:id`                | Get project          |
| POST   | `/api/projects`                    | Create project       |
| PUT    | `/api/projects`                    | Update project       |
| POST   | `/api/projects/:projectId/members` | Add project member   |
| GET    | `/api/tasks/project/:projectId`    | Get tasks            |
| POST   | `/api/tasks`                       | Create task          |
| PUT    | `/api/tasks/:id`                   | Update task          |
| DELETE | `/api/tasks`                       | Delete tasks         |
| GET    | `/api/comments/:taskId`            | Get task comments    |
| POST   | `/api/comments`                    | Add comment          |

---

# ✅ Current Completed Features

* Prisma schema integration
* Clean controller/service architecture
* Global error handling middleware
* Request logger middleware
* API response formatter
* Clerk authentication
* Axios interceptor with Clerk token injection
* Workspace management
* Project management
* Task management
* Reusable modal components
* Skeleton loaders
* Analytics charts
* Dark mode
* Real API integration
* Redux state management

---

# 🗺️ Upcoming Features

* Notifications system
* File attachments
* Global search
* Workspace settings page
* Delete project functionality
* Remove member functionality
* React Query integration
* Zod validation
* Full TypeScript migration
* Rate limiting
* E2E testing
* AI task breakdown
* Workload analytics
* Deadline prediction

---

# 🛠️ Development Commands

## Client

```bash
cd Client

npm run dev
npm run build
npm run lint
```

## Server

```bash
cd Server

npm run dev
npm start
```

---

# 🚢 Deployment

## Frontend

Deploy easily using:

* Vercel

## Backend

Deploy on:

* Railway
* Render
* VPS
* AWS
* DigitalOcean

---

# 🔐 Authentication

This project uses Clerk Authentication for:

* Login & Signup
* Session Management
* Protected Routes
* Role-Based Access Control

---

# 📊 Database

The project uses Prisma ORM with Neon PostgreSQL.

Run migrations:

```bash
cd Server
npx prisma migrate dev
```

---

# 📄 License

MIT License

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push the branch
5. Create a Pull Request

---

# 📧 Support

For issues and feature requests, create a GitHub issue.

---


