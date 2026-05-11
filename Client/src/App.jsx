import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Team from './pages/Team';
import ProjectDetails from './pages/ProjectDetails';
import TaskDetails from './pages/TaskDetails';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLoading from './components/ui/AuthLoading';
import AIHistory from './components/AIHistory';

// Redirects already-signed-in users away from auth pages
const PublicOnlyRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '14px' },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* ── Public auth routes ─────────────────────────── */}
        <Route
          path="/sign-in"
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/sign-up"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />

        {/* ── Unauthorized page ──────────────────────────── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Protected app routes ───────────────────────── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="team" element={<Team />} />
          <Route path="projectsDetail" element={<ProjectDetails />} />
          <Route path="taskDetails" element={<TaskDetails />} />
          <Route path="ai-history" element={<AIHistory />} />
        </Route>

        {/* ── Catch-all ──────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
