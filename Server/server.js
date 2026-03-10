import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./dist/inngest/index.js";
import { handleClerkWebhook } from "./dist/routes/clerk-webhook.js";
import workspaceRouter from './dist/routes/workspaceroute.js';

import {protect} from './dist/routes/authMiddleware.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/',(req,res)=> res.send('Server is live!'));
app.post('/api/clerk-webhook', handleClerkWebhook);
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect ,workspaceRouter);

const PORT = process.env.PORT || 5000

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT,()=> console.log(`Server running on port ${PORT}`));
}

export default app;