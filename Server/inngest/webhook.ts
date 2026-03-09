import { Webhook } from 'svix'
import { inngest } from './index.js'

export async function handleClerkWebhook(req, res) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env')
  }

  const svix_id = req.headers['svix-id']
  const svix_timestamp = req.headers['svix-timestamp']
  const svix_signature = req.headers['svix-signature']

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' })
  }

  const payload = JSON.stringify(req.body)
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return res.status(400).json({ error: 'Webhook verification failed' })
  }

  const eventType = evt.type

  // Send event to Inngest
  if (eventType === 'user.created') {
    await inngest.send({
      name: 'clerk/user.created',
      data: evt.data,
    })
  } else if (eventType === 'user.updated') {
    await inngest.send({
      name: 'clerk/user.updated',
      data: evt.data,
    })
  } else if (eventType === 'user.deleted') {
    await inngest.send({
      name: 'clerk/user.deleted',
      data: evt.data,
    })
  }

  return res.status(200).json({ message: 'Webhook received' })
}
