import { Webhook } from 'svix'
import { Request, Response } from 'express'
import { inngest } from '../inngest/index.js'

export async function handleClerkWebhook(req: Request, res: Response) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const payload = req.body
    const headers = req.headers

    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: any

    try {
      evt = wh.verify(JSON.stringify(payload), headers as any)
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return res.status(400).json({ error: 'Verification failed' })
    }

    const eventType = evt.type
    const data = evt.data

    console.log('Received event:', eventType)

    // Send to Inngest
    await inngest.send({
      name: `clerk/${eventType}`,
      data: data
    })

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: error.message })
  }
}
