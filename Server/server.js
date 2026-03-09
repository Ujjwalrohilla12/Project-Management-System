import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./dist/inngest/index.js"
import { handleClerkWebhook } from "./dist/inngest/webhook.js"

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/',(req,res)=> res.send('Server is live!'));
app.post('/api/clerk-webhook', handleClerkWebhook);
app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 5000

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT,()=> console.log(`Server running on port ${PORT}`));
}

export default app;