import jwt from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_resumeai_token_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecret_resumeai_token_2026_refresh';

export interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};

export const sendRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh', // only sent to refresh endpoint
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
  });
};

export function addOneMonth(date: Date): Date {
  const result = new Date(date.getTime());
  const expectedMonth = (date.getMonth() + 1) % 12;
  result.setMonth(date.getMonth() + 1);
  if (result.getMonth() !== expectedMonth) {
    result.setDate(0);
  }
  return result;
}

export const getActiveSubscription = (userId: string) => {
  const { mockDb, saveDb } = require('./mockDb');
  const sub = mockDb.subscriptions.find((s: any) => s.userId === userId);
  if (!sub) return null;
  
  const now = new Date();
  const expiresAt = new Date(sub.expiresAt);
  
  if (sub.status === 'active' && now < expiresAt) {
    return sub;
  }
  
  if (sub.status === 'active' && now >= expiresAt) {
    sub.status = 'expired';
    sub.autoRenew = false;
    
    const user = mockDb.users.find((u: any) => u.id === userId);
    if (user) {
      user.plan = 'free';
      user.subscriptionStatus = 'free';
    }
    
    saveDb();
  }
  
  return null;
};

export const findUserByIdOrEmail = (userId?: string, email?: string) => {
  const { mockDb, saveDb } = require('./mockDb');
  if (userId) {
    const byId = mockDb.users.find((u: any) => u.id === userId);
    if (byId) return byId;
  }
  if (email) {
    const byEmail = mockDb.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (byEmail) return byEmail;
  }

  // Self-healing user hydration for authenticated JWT tokens
  if (userId || email) {
    const nameFromEmail = email ? email.split('@')[0] : 'Candidate';
    const newUser: any = {
      id: userId || `user-${Date.now()}`,
      name: nameFromEmail,
      email: email ? email.toLowerCase() : `${userId}@resumeai.internal`,
      password: 'authenticated_via_jwt',
      rolePreference: 'sde',
      userType: 'seeker',
      badges: ['New Explorer', 'ATS Ready'],
      points: 500,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameFromEmail)}`,
      createdAt: new Date().toISOString(),
      profileLinks: { github: '', linkedin: '', project: '', coding: '' },
      interviewScore: null,
      monthlyUsage: 0,
      plan: 'free',
      subscriptionStatus: 'free'
    };
    mockDb.users.push(newUser);
    saveDb().catch(() => {});
    return newUser;
  }

  return undefined;
};
