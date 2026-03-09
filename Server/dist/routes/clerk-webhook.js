import { Webhook } from 'svix';
import { prisma } from '../configs/prisma.js';
export async function handleClerkWebhook(req, res) {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
        if (!WEBHOOK_SECRET) {
            console.error('Missing CLERK_WEBHOOK_SECRET');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        const svix_id = req.headers['svix-id'];
        const svix_timestamp = req.headers['svix-timestamp'];
        const svix_signature = req.headers['svix-signature'];
        if (!svix_id || !svix_timestamp || !svix_signature) {
            console.error('Missing svix headers');
            return res.status(400).json({ error: 'Missing headers' });
        }
        const payload = JSON.stringify(req.body);
        const wh = new Webhook(WEBHOOK_SECRET);
        let evt;
        try {
            evt = wh.verify(payload, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            });
        }
        catch (err) {
            console.error('Webhook verification failed:', err);
            return res.status(400).json({ error: 'Verification failed' });
        }
        const eventType = evt.type;
        const data = evt.data;
        console.log('Received event:', eventType);
        if (eventType === 'user.created') {
            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data.email_addresses[0]?.email_address || '',
                    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
                    image: data.image_url || null,
                }
            });
            console.log('User created:', data.id);
        }
        else if (eventType === 'user.updated') {
            await prisma.user.update({
                where: { id: data.id },
                data: {
                    email: data.email_addresses[0]?.email_address || '',
                    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
                    image: data.image_url || null,
                }
            });
            console.log('User updated:', data.id);
        }
        else if (eventType === 'user.deleted') {
            await prisma.user.delete({
                where: { id: data.id }
            });
            console.log('User deleted:', data.id);
        }
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: error.message });
    }
}
