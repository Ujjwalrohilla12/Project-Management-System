import { useSelector } from 'react-redux';
import {
  selectWorkspaceRole,
  selectProjectRole,
  selectCanManageWorkspace,
  selectCanManageProjects,
  selectCanInviteMembers,
  selectCanManageTasks,
  selectCanEditProject,
  selectIsProjectMember,
} from '../features/authSlice.js';

export const usePermissions = () => {
  const workspaceRole = useSelector(selectWorkspaceRole);
  const projectRole   = useSelector(selectProjectRole);

  return {
    // Raw roles
    workspaceRole,
    projectRole,

    // Workspace-level
    isWorkspaceAdmin:   workspaceRole === 'ADMIN',
    isWorkspaceManager: workspaceRole === 'MANAGER' || workspaceRole === 'ADMIN',
    canManageWorkspace: useSelector(selectCanManageWorkspace),
    canManageProjects:  useSelector(selectCanManageProjects),
    canInviteMembers:   useSelector(selectCanInviteMembers),

    // Project-level
    isProjectLead:    projectRole === 'LEAD' || projectRole === 'WORKSPACE_ADMIN',
    isProjectMember:  useSelector(selectIsProjectMember),
    canManageTasks:   useSelector(selectCanManageTasks),
    canEditProject:   useSelector(selectCanEditProject),
  };
};
