import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import resumeRoutes from './routes/resumeRoutes';
import jobRoutes from './routes/jobRoutes';
import recruiterRoutes from './routes/recruiterRoutes';
import ecosystemRoutes from './routes/ecosystemRoutes';

const app = express();

// Security Headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS Configuration - Permissive for Vercel Serverless Function and local development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookies & Body Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// URL Normalization Middleware for Vercel Serverless Functions
app.use((req, res, next) => {
  let url = req.url || '/';

  // If Vercel catch-all router populated req.query.path or req.query.slug, reconstruct the real request URL
  if (req.query && (req.query.path || req.query.slug)) {
    const segments = req.query.path || req.query.slug;
    if (Array.isArray(segments)) {
      url = '/' + segments.join('/');
    } else if (typeof segments === 'string') {
      url = '/' + segments;
    }
  }
  
  // Remove any Vercel internal function filename prefixes (e.g. /api/index.ts, /api/[...path].ts, /api/index, /api/[...path], /index.ts)
  url = url.replace(/^\/api\/(?:index(?:\.ts|\.js)?|\[\.\.\.path\](?:\.ts|\.js)?)/, '');
  url = url.replace(/^\/(?:index(?:\.ts|\.js)?|\[\.\.\.path\](?:\.ts|\.js)?)/, '');

  // If url is empty or doesn't start with '/', default to '/'
  if (!url || !url.startsWith('/')) {
    url = '/' + url;
  }

  // Ensure url has /api prefix if it matches core routes without /api
  if (!url.startsWith('/api')) {
    url = '/api' + url;
  }

  req.url = url;
  next();
});

// ResumeAI Core API Routes (Supported with and without /api prefix for Vercel Serverless Functions)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/resumes', '/resumes'], resumeRoutes);
app.use(['/api/jobs', '/jobs'], jobRoutes);
app.use(['/api/recruiter', '/recruiter'], recruiterRoutes);
app.use(['/api/ecosystem', '/ecosystem'], ecosystemRoutes);

// Base Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'ResumeAI Engine',
    timestamp: new Date().toISOString()
  });
});

// 404 JSON Fallback Handler for API Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred'
  });
});

export default app;
