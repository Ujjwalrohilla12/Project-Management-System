import { prisma } from "../configs/prisma.js";
export async function syncWorkspaceCreation(data) {
    try {
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: data.created_by,
                image_url: data.image_url,
            }
        });
        await prisma.workspaceMember.create({
            data: {
                userId: data.created_by,
                workspaceId: data.id,
                role: 'ADMIN'
            }
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            console.log('Workspace already exists:', data.id);
            return;
        }
        throw error;
    }
}
export async function syncWorkspaceUpdation(data) {
    try {
        await prisma.workspace.update({
            where: { id: data.id },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url,
            }
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            console.log('Workspace not found:', data.id);
            return;
        }
        throw error;
    }
}
export async function syncWorkspaceDeletion(data) {
    try {
        await prisma.workspace.delete({
            where: { id: data.id }
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            console.log('Workspace not found, skipping delete:', data.id);
            return;
        }
        throw error;
    }
}
export async function syncWorkspaceMemberCreation(data) {
    try {
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organisation_id,
                role: String(data.role_name).toUpperCase(),
            }
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            console.log('Member already exists');
            return;
        }
        throw error;
    }
}
