import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },
    setCurrentWorkspace: (state, action) => {
      localStorage.setItem('currentWorkspaceId', action.payload);
      state.currentWorkspace = state.workspaces.find((w) => w.id === action.payload) || null;
    },
    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    },
    updateWorkspace: (state, action) => {
      state.workspaces = state.workspaces.map((w) =>
        w.id === action.payload.id ? action.payload : w
      );
      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },
    deleteWorkspace: (state, action) => {
      state.workspaces = state.workspaces.filter((w) => w.id !== action.payload);
      if (state.currentWorkspace?.id === action.payload) {
        state.currentWorkspace = state.workspaces[0] || null;
      }
    },
    addProject: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects = [...(state.currentWorkspace.projects || []), action.payload];
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? { ...w, projects: [...(w.projects || []), action.payload] }
          : w
      );
    },
    removeProject: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects = state.currentWorkspace.projects.filter((p) => p.id !== action.payload);
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? { ...w, projects: w.projects.filter((p) => p.id !== action.payload) }
          : w
      );
    },
    updateProject: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? { ...w, projects: w.projects.map((p) => (p.id === action.payload.id ? action.payload : p)) }
          : w
      );
    },
    addTask: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: [...(p.tasks || []), action.payload] }
          : p
      );
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: w.projects.map((p) =>
                p.id === action.payload.projectId
                  ? { ...p, tasks: [...(p.tasks || []), action.payload] }
                  : p
              ),
            }
          : w
      );
    },
    updateTask: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)) }
          : p
      );
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: w.projects.map((p) =>
                p.id === action.payload.projectId
                  ? { ...p, tasks: p.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)) }
                  : p
              ),
            }
          : w
      );
    },
    deleteTask: (state, action) => {
      if (!state.currentWorkspace) return;
      state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) => ({
        ...p,
        tasks: p.tasks.filter((t) => !action.payload.includes(t.id)),
      }));
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: w.projects.map((p) => ({
                ...p,
                tasks: p.tasks.filter((t) => !action.payload.includes(t.id)),
              })),
            }
          : w
      );
    },
  },
});

export const {
  setLoading,
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProject,
  removeProject,
  updateProject,
  addTask,
  updateTask,
  deleteTask,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
