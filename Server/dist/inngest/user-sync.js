import { prisma } from "../configs/prisma.js";
export async function syncUserCreation(data) {
    await prisma.user.create({
        data: {
            id: data.id,
            email: data?.email_addresses[0]?.email_address,
            name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || null,
            image: data.image_url,
        }
    });
}
export async function syncUserDeletion(data) {
    try {
        await prisma.user.delete({
            where: {
                id: data.id,
            }
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            console.log('User not found, skipping delete:', data.id);
            return;
        }
        throw error;
    }
}
export async function syncUserUpdation(data) {
    await prisma.user.update({
        where: {
            id: data.id
        },
        data: {
            email: data?.email_addresses[0]?.email_address,
            name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || null,
            image: data?.image_url,
        }
    });
}
