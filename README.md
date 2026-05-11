# AegisFlow — Project Management System

A full-stack project management application built with React, Node.js, Express, Prisma, and Clerk Authentication.

## 🌟 Features

- **Workspace Management** — Create and switch between multiple workspaces
- **Project Management** — Create, update, and manage projects with status/priority tracking
- **Task Management** — Organize tasks with types, assignees, priorities, and due dates
- **Team Collaboration** — Add workspace and project members with role-based access
- **Project Analytics** — Charts for task status, type, and priority breakdowns
- **Calendar View** — Visualize task due dates on a calendar
- **Task Discussion** — Real-time comment threads per task (polling every 15s)
- **Dashboard** — Stats grid, recent activity, and personal task summary
- **Dark Mode** — Full dark/light theme toggle with persistence
- **Protected Routes** — Clerk-authenticated routes on both client and server

## 📋 Tech Stack

### Client
- **React 18** + **Vite** — UI and build tooling
- **Redux Toolkit** — Global state (workspaces, theme)
- **Tailwind CSS v4** — Styling
- **Clerk React** — Authentication
- **Axios** — HTTP client with auth interceptor
- **react-hot-toast** — Toast notifications
- **Recharts** — Analytics charts
- **date-fns** — Date formatting

### Server
- **Node.js** + **Express 5** — API server
- **Prisma ORM** + **Neon PostgreSQL** — Database
- **Clerk Express** — Auth middleware
- **Inngest** — Background jobs (user/workspace sync from Clerk webhooks)
- **Svix** — Webhook verification

## 🏗️ Architecture

```
Project-Management-System/
├── Client/
│   └── src/
│       ├── app/            # Redux store
│       ├── assets/         # Static assets + dummy data (dev only)
│       ├── components/     # Feature components
│       │   └── ui/         # Reusable UI primitives (Modal, Skeleton)
│       ├── configs/        # Axios instance with auth interceptor
│       ├── features/       # Redux slices (workspace, theme)
│       ├── hooks/          # Reusable hooks (useWorkspaces, useComments)
│       ├── pages/          # Route-level page components
│       ├── services/       # API service layer (all endpoint calls)
│       └── utils/          # Helper functions, color maps
│
└── Server/
    ├── configs/            # Prisma client
    ├── controller/         # Route handlers (fixed bugs)
    ├── inngest/            # Background job functions
    ├── middleware/         # errorHandler, requestLogger, responseFormatter
    ├── prisma/             # schema.prisma (complete with all models)
    ├── routes/             # Clean Express routers
    └── server.js           # App entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm
- Neon PostgreSQL database
- Clerk account

### Installation

```bash
# Clone
git clone <repository-url>
cd Project-Management-System

# Install client deps
cd Client && npm install

# Install server deps
cd ../Server && npm install
```

### Environment Setup

**Server `.env`**
```
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

**Client `.env`**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BASEURL=http://localhost:5000
```

### Database Setup

```bash
cd Server
npx prisma migrate dev --name init
npx prisma generate
```

### Running

```bash
# Terminal 1 — Server
cd Server
npm run dev

# Terminal 2 — Client
cd Client
npm run dev
```

## 🔑 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workspaces` | Get user's workspaces |
| POST | `/api/workspaces` | Create workspace |
| PUT | `/api/workspaces/:id` | Update workspace |
| POST | `/api/workspaces/:id/members` | Add workspace member |
| GET | `/api/projects/:id` | Get project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects` | Update project |
| POST | `/api/projects/:projectId/members` | Add project member |
| GET | `/api/tasks/project/:projectId` | Get tasks by project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks` | Delete tasks (bulk) |
| GET | `/api/comments/:taskId` | Get task comments |
| POST | `/api/comments` | Add comment |

## ✅ Missing Feature Checklist

- [ ] **Notifications** — In-app notification system for task assignments and comments
- [ ] **File Attachments** — Upload files to tasks (S3/Cloudflare R2)
- [ ] **Search** — Global search across projects and tasks (navbar search is currently UI-only)
- [ ] **Workspace Settings page** — Dedicated page to manage workspace name, image, members
- [ ] **Create Workspace UI** — The "Create Workspace" button in the dropdown has no handler
- [ ] **Delete Project** — No delete project endpoint or UI
- [ ] **Remove Member** — No remove member from workspace/project functionality
- [ ] **Task Comments pagination** — Load more comments for large threads
- [ ] **Optimistic UI updates** — Currently refetches on every mutation
- [ ] **React Query** — Replace manual fetch/loading state with TanStack Query
- [ ] **Zod validation** — Add schema validation on both client forms and server request bodies
- [ ] **TypeScript migration** — Client is still `.jsx`; migrate to `.tsx`
- [ ] **Rate limiting** — Add express-rate-limit to API
- [ ] **Refresh token handling** — Handle Clerk token expiry gracefully
- [ ] **E2E tests** — Playwright test suite

## 🗺️ Implementation Roadmap

### Phase 1 — Foundation ✅ (Complete)
- [x] Prisma schema with all models (User, Workspace, Project, ProjectMember, Task, Comment)
- [x] Controller/service/repository architecture
- [x] Async error handler + global error middleware
- [x] Request logger middleware
- [x] Centralized response formatter
- [x] Clean routes folder (eliminated duplicate route/routes confusion)
- [x] All controller bugs fixed (commentController, taskController updateTask, addMember)
- [x] API service layer on client
- [x] Axios interceptor with Clerk token injection
- [x] useWorkspaces hook bootstrapping real data
- [x] useComments hook with polling
- [x] Redux workspaceSlice with setLoading, no dummy data
- [x] All forms wired to real API (CreateProject, CreateTask, ProjectSettings, InviteMember, AddProjectMember)
- [x] Real Clerk userId used everywhere (replaced hardcoded user_1)
- [x] Skeleton loaders
- [x] Reusable Modal component
- [x] Utility helpers (formatDate, STATUS_COLORS, PRIORITY_COLORS)

### Phase 2 — Features (Next)
- [ ] Workspace creation UI
- [ ] Delete project
- [ ] Remove member
- [ ] Global search implementation
- [ ] Notifications system

### Phase 3 — Quality
- [ ] React Query integration
- [ ] Zod validation (client + server)
- [ ] TypeScript migration (client)
- [ ] Rate limiting
- [ ] E2E tests

## 📄 License

MIT License — see [LICENSE.md](Client/LICENSE.md)
