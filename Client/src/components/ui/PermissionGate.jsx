import { usePermissions } from '../../hooks/usePermissions.js';

/**
 * PermissionGate
 *
 * Props:
 *   permission  — key from usePermissions() e.g. 'canManageTasks', 'isWorkspaceAdmin'
 *   fallback    — optional: what to render when permission is denied (default: null)
 *   children    — content to render when permission is granted
 *
 * Usage:
 *   <PermissionGate permission="canManageTasks">
 *     <button>Delete Task</button>
 *   </PermissionGate>
 */
const PermissionGate = ({ permission, fallback = null, children }) => {
  const permissions = usePermissions();
  if (!permissions[permission]) return fallback;
  return children;
};

export default PermissionGate;
