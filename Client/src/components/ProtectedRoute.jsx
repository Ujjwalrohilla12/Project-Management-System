import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AuthLoading from '../components/ui/AuthLoading.jsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';

const ROLE_RANK = { ADMIN: 3, MANAGER: 2, MEMBER: 1 };

/**
 * ProtectedRoute
 *
 * Props:
 *   children     — the route content
 *   requiredRole — optional: 'ADMIN' | 'MANAGER' | 'MEMBER'
 *                  if provided, checks the user's workspace role
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const workspaceRole = useSelector((s) => s.auth.workspaceRole);

  // Clerk is still initializing
  if (!isLoaded) return <AuthLoading />;

  // Not signed in → redirect to sign-in, preserving intended destination
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Role check (only when workspaces have loaded and role is known)
  if (requiredRole && workspaceRole !== null) {
    const userRank = ROLE_RANK[workspaceRole] || 0;
    const requiredRank = ROLE_RANK[requiredRole] || 0;
    if (userRank < requiredRank) {
      return (
        <UnauthorizedPage
          message={`This area requires ${requiredRole} access. Your current role is ${workspaceRole}.`}
        />
      );
    }
  }

  return children;
};

export default ProtectedRoute;
