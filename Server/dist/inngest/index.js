import { Inngest } from "inngest";
import { syncUserCreation, syncUserDeletion, syncUserUpdation } from "./user-sync.js";
import { syncWorkspaceCreation, syncWorkspaceUpdation, syncWorkspaceDeletion, syncWorkspaceMemberCreation } from "./workspace-sync.js";
// Create a client to send and receive events
export const inngest = new Inngest({ id: "aegisflow" });
// Inngest functions
const syncUserCreationFn = inngest.createFunction({ id: 'sync-user-from-clerk' }, { event: 'clerk/user.created' }, async ({ event }) => await syncUserCreation(event.data));
const syncUserDeletionFn = inngest.createFunction({ id: 'delete-user-from-clerk' }, { event: 'clerk/user.deleted' }, async ({ event }) => await syncUserDeletion(event.data));
const syncUserUpdationFn = inngest.createFunction({ id: 'update-user-from-clerk' }, { event: 'clerk/user.updated' }, async ({ event }) => await syncUserUpdation(event.data));
const syncWorkspaceCreationFn = inngest.createFunction({ id: 'sync-workspace-from-clerk' }, { event: 'clerk/organisation.created' }, async ({ event }) => await syncWorkspaceCreation(event.data));
const syncWorkspaceUpdationFn = inngest.createFunction({
    id: 'update-workspace-from-clerk'
}, { event: 'clerk/organisation.updated' }, async ({ event }) => await syncWorkspaceUpdation(event.data));
const syncWorkspaceDeletionFn = inngest.createFunction({ id: 'delete-workspace-with-clerk' }, { event: 'clerk/organisation.deleted' }, async ({ event }) => await syncWorkspaceDeletion(event.data));
const syncWorkspaceMemeberCreationFn = inngest.createFunction({ id: 'sync-workspace-member-from-clerk' }, { event: 'clerk/organisationInvitation' }, async ({ event }) => await syncWorkspaceMemberCreation(event.data));
export const functions = [
    syncUserCreationFn,
    syncUserDeletionFn,
    syncUserUpdationFn,
    syncWorkspaceCreationFn,
    syncWorkspaceUpdationFn,
    syncWorkspaceDeletionFn,
    syncWorkspaceMemeberCreationFn
];
