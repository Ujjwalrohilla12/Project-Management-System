import { Inngest } from "inngest";
import { prisma } from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "aegisflow" });

// User sync functions
async function syncUserCreation(data: any) {
  try {
    await prisma.user.create({
      data: {
        id: data.id,
        email: data?.email_addresses[0]?.email_address,
        name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || null,
        image: data.image_url,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('User already exists:', data.id)
      return
    }
    throw error
  }
}

async function syncUserDeletion(data: any) {
  try {
    await prisma.user.delete({
      where: { id: data.id }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('User not found, skipping delete:', data.id)
      return
    }
    throw error
  }
}

async function syncUserUpdation(data: any) {
  try {
    await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data?.email_addresses[0]?.email_address,
        name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || null,
        image: data?.image_url,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('User not found, creating instead:', data.id)
      await syncUserCreation(data)
      return
    }
    throw error
  }
}

// Workspace sync functions
async function syncWorkspaceCreation(data: any) {
  try {
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url,
      }
    })
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: 'ADMIN'
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('Workspace already exists:', data.id)
      return
    }
    throw error
  }
}

async function syncWorkspaceUpdation(data: any) {
  try {
    await prisma.workspace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url,
      }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('Workspace not found:', data.id)
      return
    }
    throw error
  }
}

async function syncWorkspaceDeletion(data: any) {
  try {
    await prisma.workspace.delete({
      where: { id: data.id }
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log('Workspace not found, skipping delete:', data.id)
      return
    }
    throw error
  }
}

async function syncWorkspaceMemberCreation(data: any) {
  try {
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organisation_id,
        role: String(data.role_name).toUpperCase(),
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('Member already exists')
      return
    }
    throw error
  }
}

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

const syncWorkspaceCreationFn = inngest.createFunction(
    {id:'sync-workspace-from-clerk'},
    {event: 'clerk/organisation.created'},
    async({event}) => await syncWorkspaceCreation(event.data)
)

const syncWorkspaceUpdationFn = inngest.createFunction({
    id: 'update-workspace-from-clerk'
},
{event: 'clerk/organisation.updated'},
async ({event}) => await syncWorkspaceUpdation(event.data)
)

const syncWorkspaceDeletionFn = inngest.createFunction(
    {id: 'delete-workspace-with-clerk'},
    {event: 'clerk/organisation.deleted'},
    async({event}) => await syncWorkspaceDeletion(event.data)
)

const syncWorkspaceMemberCreationFn = inngest.createFunction(
    {id: 'sync-workspace-member-from-clerk'},
    {event:'clerk/organisationInvitation'},
    async({event}) => await syncWorkspaceMemberCreation(event.data)
)

export const functions = [
    syncUserCreationFn,
    syncUserDeletionFn,
    syncUserUpdationFn,
    syncWorkspaceCreationFn,
    syncWorkspaceUpdationFn,
    syncWorkspaceDeletionFn,
    syncWorkspaceMemberCreationFn
];
