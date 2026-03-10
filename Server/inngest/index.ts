import { Inngest } from "inngest";
import { syncUserCreation, syncUserDeletion, syncUserUpdation } from "./user-sync.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "aegisflow" });

// Inngest functions
const syncUserCreationFn = inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async({event}) => await syncUserCreation(event.data)
)

const syncUserDeletionFn = inngest.createFunction(
    {id:'delete-user-from-clerk'},
    {event:'clerk/user.deleted'},
    async({event}) => await syncUserDeletion(event.data)
)

const syncUserUpdationFn = inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async({event}) => await syncUserUpdation(event.data)
)

export const functions = [
    syncUserCreationFn,
    syncUserDeletionFn,
    syncUserUpdationFn
];
