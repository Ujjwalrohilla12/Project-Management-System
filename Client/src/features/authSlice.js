import { createSlice } from '@reduxjs/toolkit';

// Role hierarchy: ADMIN > MANAGER > MEMBER
const ROLE_RANK = { ADMIN: 3, MANAGER: 2, MEMBER: 1 };

const hasRank = (userRole, required) =>
  (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[required] || 0);

const initialState = {
  // Role in the currently active workspace
  workspaceRole: null,   // 'ADMIN' | 'MANAGER' | 'MEMBER' | null
  // Role in the currently viewed project
  projectRole: null,     // 'LEAD' | 'MEMBER' | 'WORKSPACE_ADMIN' | null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setWorkspaceRole: (state, action) => {
      state.workspaceRole = action.payload;
    },
    setProjectRole: (state, action) => {
      state.projectRole = action.payload;
    },
    clearRoles: (state) => {
      state.workspaceRole = null;
      state.projectRole = null;
    },
  },
});

export const { setWorkspaceRole, setProjectRole, clearRoles } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ──────────────────────────────────────────────
export const selectWorkspaceRole = (state) => state.auth.workspaceRole;
export const selectProjectRole   = (state) => state.auth.projectRole;

// Workspace permission selectors
export const selectCanManageWorkspace = (state) =>
  hasRank(state.auth.workspaceRole, 'ADMIN');

export const selectCanManageProjects = (state) =>
  hasRank(state.auth.workspaceRole, 'ADMIN');

export const selectCanInviteMembers = (state) =>
  hasRank(state.auth.workspaceRole, 'ADMIN');

// Project permission selectors
export const selectCanManageTasks = (state) =>
  state.auth.projectRole === 'LEAD' || state.auth.projectRole === 'WORKSPACE_ADMIN';

export const selectCanEditProject = (state) =>
  state.auth.projectRole === 'LEAD' || state.auth.projectRole === 'WORKSPACE_ADMIN';

export const selectIsProjectMember = (state) =>
  state.auth.projectRole !== null;
