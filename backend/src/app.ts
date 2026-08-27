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
import adminAiQualityRoutes from './routes/adminAiQualityRoutes';

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

import { ensureDbLoaded } from './utils/mockDb';

// Body Normalization & Cloud DB Synchronization Middleware
app.use(async (req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Ignore parse error
    }
  }
  if (!req.body) {
    req.body = {};
  }
  try {
    await ensureDbLoaded();
  } catch {}
  next();
});

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
  let url = (req.originalUrl && req.originalUrl !== '/' && !req.originalUrl.startsWith('/api/index')) ? req.originalUrl : (req.url || '/');

  // 1. Inspect req.query.path (populated by Vercel rewrite /api/(.*) -> /api/index.ts?path=$1)
  if (req.query && req.query.path) {
    const p = req.query.path;
    if (Array.isArray(p)) {
      url = '/' + p.join('/');
    } else if (typeof p === 'string') {
      url = p.startsWith('/') ? p : '/' + p;
    }
  } else if (req.query && req.query.slug) {
    const s = req.query.slug;
    if (Array.isArray(s)) {
      url = '/' + s.join('/');
    } else if (typeof s === 'string') {
      url = s.startsWith('/') ? s : '/' + s;
    }
  } else {
    // 2. Inspect Vercel route matches header (e.g. x-now-route-matches: 1=auth/login)
    const routeMatches = req.headers['x-now-route-matches'] as string;
    if (routeMatches) {
      const match = routeMatches.match(/(?:1|path)=([^&]+)/);
      if (match && match[1]) {
        url = '/' + decodeURIComponent(match[1]);
      }
    }
    
    // 3. Fallback to Vercel Edge request headers
    if (url === '/' || url.startsWith('/api/index')) {
      const vercelForwardedUri = req.headers['x-forwarded-uri'] as string;
      const vercelInvokePath = req.headers['x-invoke-path'] as string;
      const vercelRewriteUrl = req.headers['x-rewrite-url'] as string;
      const alt = vercelForwardedUri || vercelInvokePath || vercelRewriteUrl || req.originalUrl;
      if (alt && !alt.startsWith('/api/index')) {
        url = alt;
      }
    }
  }

  // Strip query string from url
  if (url.includes('?')) {
    url = url.split('?')[0];
  }

  // Clean up any internal script filename prefixes (e.g. /api/index.ts, /api/[...path].ts)
  url = url.replace(/^\/api\/(?:index(?:\.ts|\.js)?|\[\.\.\.path\](?:\.ts|\.js)?)/, '');
  url = url.replace(/^\/(?:index(?:\.ts|\.js)?|\[\.\.\.path\](?:\.ts|\.js)?)/, '');

  // Ensure url starts with '/'
  if (!url || !url.startsWith('/')) {
    url = '/' + url;
  }

  // Ensure url has /api prefix for router matching
  if (!url.startsWith('/api')) {
    url = '/api' + url;
  }

  req.url = url;
  next();
});

// ResumeAI Core API Routes (Supported with and without /api prefix for Vercel Serverless Functions)
app.use(['/api/auth', '/auth', '/api/index/auth'], authRoutes);
app.use(['/api/resumes', '/resumes', '/api/index/resumes'], resumeRoutes);
app.use(['/api/jobs', '/jobs', '/api/index/jobs'], jobRoutes);
app.use(['/api/recruiter', '/recruiter', '/api/index/recruiter'], recruiterRoutes);
app.use(['/api/ecosystem', '/ecosystem', '/api/index/ecosystem'], ecosystemRoutes);
app.use(['/api/admin/ai-quality', '/admin/ai-quality', '/api/index/admin/ai-quality'], adminAiQualityRoutes);

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
