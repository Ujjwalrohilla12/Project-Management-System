import { Inngest } from "inngest";
import { syncUserCreation, syncUserDeletion, syncUserUpdation } from "./user-sync.js";
import { prisma } from "../configs/prisma.js";

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

const syncWorkspaceCreation = inngest.createFunction(
    {id:'sync-workspace-from-clerk'},
{event: 'clerk/organisation.created'},
async({event}) =>{
    const {data} = event;
    await prisma.workspace.create({
        data:{
            id: data.id,
            name: data.name,
            slug: data.slug,
            ownerId: data.created_by,
            image_url: data.image_url,

        }
    }
    )
    // add creater as ADMIN Member
    await prisma.workspaceMember.create({
        data: {
            userId: data.created_by,
            workspaceId: data.id,
            role: 'ADMIN'
        }
    })
}

)

export const functions = [
    syncUserCreationFn,
    syncUserDeletionFn,
    syncUserUpdationFn,
    syncWorkspaceCreation
];