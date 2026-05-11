import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { clerkMiddleware } from '@clerk/express';
import { serve } from 'inngest/express';
import { inngest, functions } from './dist/inngest/index.js';
import { handleClerkWebhook } from './dist/routes/clerk-webhook.js';
import { protect } from './middleware/auth.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorMiddleware } from './middleware/errorHandler.js';
import { sanitizeBody } from './middleware/sanitize.js';
import workspaceRouter from './routes/workspaceRouter.js';
import projectRouter from './routes/projectRouter.js';
import taskRouter from './routes/taskRouter.js';
import commentRouter from './routes/commentRouter.js';
import organizationRouter from './routes/organizationRouter.js';
import aiRouter from './routes/aiRouter.js';

const app = express();

// ── Security headers (Helmet) ──────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
}));

// ── CORS ───────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ───────────────────────────────────────────
// Webhook must receive raw body for Svix signature verification
app.use('/api/clerk-webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting ──────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many write requests, please slow down.' },
});

app.use(globalLimiter);

// ── Clerk middleware ───────────────────────────────────────
app.use(clerkMiddleware());

// ── Logging ────────────────────────────────────────────────
app.use(requestLogger);

// ── Input sanitization ─────────────────────────────────────
app.use(sanitizeBody);

// ── Health check ───────────────────────────────────────────
app.get('/', (_req, res) => res.json({ success: true, message: 'AegisFlow API is live' }));

// ── Webhooks (no auth, raw body) ───────────────────────────
app.post('/api/clerk-webhook', handleClerkWebhook);

// ── Inngest ────────────────────────────────────────────────
app.use('/api/inngest', serve({ client: inngest, functions }));

// ── Protected API routes ───────────────────────────────────
app.use('/api/workspaces',    authLimiter,  protect, workspaceRouter);
app.use('/api/org',           authLimiter,  protect, organizationRouter);
app.use('/api/projects',      authLimiter,  protect, projectRouter);
app.use('/api/tasks',         writeLimiter, protect, taskRouter);
app.use('/api/comments',      writeLimiter, protect, commentRouter);
app.use('/api/ai',            writeLimiter, protect, aiRouter);

// ── 404 handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`[server] Running on http://localhost:${PORT}`));
}

export default app;
