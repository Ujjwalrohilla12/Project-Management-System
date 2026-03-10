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
    await prisma.user.delete({
        where: {
            id: data.id,
        }
    });
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
