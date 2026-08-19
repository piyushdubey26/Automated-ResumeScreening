import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { mockDb, User, saveDb } from '../utils/mockDb';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_resumeai_token_2026';

export const signup = (req: Request, res: Response) => {
  const { name, email, password, rolePreference, userType } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    const token = jwt.sign({ id: existing.id, email: existing.email, userType: existing.userType }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: existing });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    rolePreference: rolePreference || 'sde',
    userType: userType || 'seeker',
    badges: ['New Explorer', 'ATS Ready'],
    points: 500,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString()
  };

  mockDb.users.push(newUser);
  saveDb();
  const token = jwt.sign({ id: newUser.id, email: newUser.email, userType: newUser.userType }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({ token, user: newUser });
};

export const login = (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Auto-create demo user if not found for seamless testing
  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      rolePreference: 'sde',
      userType: email.includes('recruiter') ? 'recruiter' : 'seeker',
      badges: ['Demo User'],
      points: 1000,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString()
    };
    mockDb.users.push(user);
    saveDb();
  }

  const token = jwt.sign({ id: user.id, email: user.email, userType: user.userType }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user });
};

export const getMe = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ user: mockDb.users[0] });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = mockDb.users.find(u => u.id === decoded.id) || mockDb.users[0];
    return res.json({ user });
  } catch (err) {
    return res.json({ user: mockDb.users[0] });
  }
};
