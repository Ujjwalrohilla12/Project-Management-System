# Project Management System

A full-stack project management application built with React, Node.js, Express, and Prisma. This system helps teams collaborate on projects, manage tasks, and track progress with real-time updates and analytics.

## 🌟 Features

- **Project Management**: Create, update, and manage multiple projects
- **Task Management**: Organize tasks with detailed descriptions, assignees, and deadlines
- **Team Collaboration**: Add team members, manage workspace permissions
- **Project Analytics**: Track project progress and performance metrics
- **Activity Tracking**: Monitor recent activities across projects
- **Calendar View**: Visualize project timelines and task schedules
- **Task Dashboard**: Personal task management with summary statistics
- **Workspace Management**: Organize projects into workspaces

## 📋 Tech Stack

### Client
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **CSS** - Styling

### Server
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Prisma** - ORM for database
- **Clerk** - Authentication service
- **Inngest** - Background jobs

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project-Management-System
   ```

2. **Install Client dependencies**
   ```bash
   cd Client
   npm install
   ```

3. **Install Server dependencies**
   ```bash
   cd ../Server
   npm install
   ```

### Environment Setup

#### Server (.env)
Create a `.env` file in the Server directory with:
```
DATABASE_URL=your_database_url
CLERK_API_KEY=your_clerk_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

#### Client (.env)
Create a `.env` file in the Client directory with:
```
VITE_API_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Running the Application

1. **Start the Server**
   ```bash
   cd Server
   npm start
   ```
   The server will run on `http://localhost:3000`

2. **Start the Client (in a new terminal)**
   ```bash
   cd Client
   npm run dev
   ```
   The client will run on `http://localhost:5173`

## 📁 Project Structure

```
Project-Management-System/
├── Client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Redux slices
│   │   ├── configs/       # Configuration files
│   │   └── assets/        # Static assets
│   └── vite.config.js
│
└── Server/                 # Node.js backend
    ├── controller/        # Route controllers
    ├── route/            # API routes
    ├── prisma/           # Database schema
    ├── configs/          # Configuration files
    ├── inngest/          # Background jobs
    └── server.js
```

## 🔑 Key Components

### Client Components
- **Dashboard** - Main landing page
- **ProjectDetails** - Detailed project view with tasks and analytics
- **Projects** - Project listing and management
- **Team** - Team member management
- **TaskDetails** - Individual task view and editing
- **Navbar** - Top navigation
- **Sidebar** - Navigation sidebar with project list

### Server Endpoints
- `/api/projects/*` - Project CRUD operations
- `/api/tasks/*` - Task management
- `/api/workspace/*` - Workspace operations
- `/api/comments/*` - Comment system
- `/api/auth/*` - Authentication (via Clerk)

## 🔐 Authentication

This application uses **Clerk** for authentication. Users can sign up, log in, and manage their account through Clerk's authentication system.

## 📊 Database

The application uses **Prisma ORM** with the schema defined in `prisma/schema.prisma`. To sync your database with the schema:

```bash
cd Server
npx prisma migrate dev
```

## 🔄 Background Jobs

**Inngest** handles background jobs including:
- User synchronization
- Workspace synchronization

## 📝 API Documentation

Refer to the route files in `Server/route/` for API endpoint documentation.

## 🛠️ Development

### Client Development
```bash
cd Client
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Server Development
```bash
cd Server
npm start        # Start server
npm run dev      # Development mode with hot reload
```

## 🚢 Deployment

### Client
The client is configured for deployment on **Vercel**. Push to your repository and Vercel will automatically build and deploy.

### Server
The server can be deployed to any Node.js hosting service. Update environment variables as needed for production.

## 📄 License

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) for details.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📧 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ by the Development Team**
