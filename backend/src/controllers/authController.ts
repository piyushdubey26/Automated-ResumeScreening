import { Request, Response } from 'express';
import { mockDb, User, saveDb } from '../utils/mockDb';
import { generateAccessToken, addOneMonth, getActiveSubscription } from '../utils/auth';

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, rolePreference, userType } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account already exists with this email address' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    rolePreference: rolePreference || 'sde',
    userType: userType || 'seeker',
    badges: ['New Explorer', 'ATS Ready'],
    points: 500,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString(),
    profileLinks: { github: '', linkedin: '', project: '', coding: '' },
    interviewScore: null,
    monthlyUsage: 0,
    plan: userType === 'recruiter' ? 'recruiter' : 'free',
    subscriptionStatus: userType === 'recruiter' ? 'approved' : 'free'
  };

  mockDb.users.push(newUser);
  await saveDb();

  const token = generateAccessToken({ userId: newUser.id, role: newUser.userType, email: newUser.email });
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  const userResponse = { ...newUser };
  delete userResponse.password;

  return res.status(201).json({ token, user: userResponse });
};

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Verify password
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Calendar month reset check during login
  const d = new Date();
  const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (user.usageMonth !== currentMonth) {
    user.usageMonth = currentMonth;
    user.monthlyUsage = 0;
    saveDb();
  } else if (user.monthlyUsage === undefined) {
    user.monthlyUsage = 0;
    saveDb();
  }

  const token = generateAccessToken({ userId: user.id, role: user.userType, email: user.email });
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  const userResponse = { ...user };
  delete userResponse.password;

  return res.json({ token, user: userResponse });
};

export const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let user = mockDb.users.find(u => u.id === req.user?.userId);
  if (!user && (req.user as any).email) {
    user = mockDb.users.find(u => u.email.toLowerCase() === (req.user as any).email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ error: 'User account not found' });
  }

  // Calendar month reset check
  const d = new Date();
  const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (user.usageMonth !== currentMonth) {
    user.usageMonth = currentMonth;
    user.monthlyUsage = 0;
    saveDb();
  }

  const userResponse = { ...user };
  delete userResponse.password;
  return res.json({ user: userResponse });
};

export const updateProfile = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = mockDb.users.find(u => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { rolePreference, profileLinks, points, badges, interviewScore } = req.body;

  if (rolePreference) user.rolePreference = rolePreference;
  if (profileLinks) user.profileLinks = { ...user.profileLinks, ...profileLinks };
  if (typeof points === 'number') user.points = points;
  if (badges) user.badges = badges;
  if (interviewScore !== undefined) user.interviewScore = interviewScore;

  saveDb();

  const userResponse = { ...user };
  delete userResponse.password;
  return res.json({ user: userResponse });
};

export const getAllUsers = (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const usersResponse = mockDb.users.map(u => {
    const userCopy = { ...u };
    delete userCopy.password;

    // Check monthly period reset
    if (u.usageMonth !== currentMonthStr) {
      u.usageMonth = currentMonthStr;
      u.monthlyUsage = 0;
      userCopy.usageMonth = currentMonthStr;
      userCopy.monthlyUsage = 0;
    }

    // Attach latest subscription info
    const sub = mockDb.subscriptions.find(s => s.userId === u.id);
    if (sub) {
      (userCopy as any).subscription = sub;
      if (sub.status === 'active') {
        const diff = new Date(sub.expiresAt).getTime() - now.getTime();
        (userCopy as any).daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    }

    // Attach complete scan history and usage analytics
    const userResumes = mockDb.resumes
      .filter(r => r.userId === u.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeSub = getActiveSubscription(u.id);
    const isPaid = u.plan === 'job_seeker_pro' || u.plan === 'pro' || u.plan === 'career-max' || u.userType === 'recruiter' || u.userType === 'admin' || (activeSub && activeSub.status === 'active');
    const monthlyLimit = isPaid ? null : 5;
    const monthlyUsed = u.monthlyUsage || 0;
    const remainingScans = isPaid ? null : Math.max(0, 5 - monthlyUsed);

    (userCopy as any).monthlyUsage = monthlyUsed;
    (userCopy as any).monthlyLimit = monthlyLimit;
    (userCopy as any).remainingScans = remainingScans;
    (userCopy as any).isUnlimited = isPaid;
    (userCopy as any).totalScans = userResumes.length;
    (userCopy as any).latestScanDate = userResumes.length > 0 ? userResumes[0].createdAt : null;
    (userCopy as any).latestResumeScore = userResumes.length > 0 ? userResumes[0].score : null;
    (userCopy as any).hasResume = userResumes.length > 0;
    (userCopy as any).scanHistory = userResumes.map(r => ({
      id: r.id,
      filename: r.filename,
      score: r.score,
      targetRole: r.targetRole,
      createdAt: r.createdAt,
      status: 'Completed'
    }));

    return userCopy;
  });

  return res.json({ users: usersResponse });
};

export const updateSubscription = (req: Request, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { userId } = req.params;
  const { plan, subscriptionStatus } = req.body;

  const user = mockDb.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (plan) user.plan = plan;
  if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;

  saveDb();
  const userResponse = { ...user };
  delete userResponse.password;
  return res.json({ user: userResponse });
};

export const getUserSubscription = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Trigger auto expiry check
  getActiveSubscription(authUserId);

  const user = mockDb.users.find(u => u.id === authUserId);
  const sub = mockDb.subscriptions.find(s => s.userId === authUserId);
  const pendingRequest = mockDb.subscriptionRequests.find(r => r.userId === authUserId && r.status === 'pending') || null;

  return res.json({
    success: true,
    plan: user?.plan || 'free',
    subscriptionStatus: user?.subscriptionStatus || 'free',
    subscription: sub || null,
    pendingRequest: pendingRequest,
    hasPendingAction: !!pendingRequest,
    pendingPlan: pendingRequest ? pendingRequest.requestedPlan : null,
    canChooseAnotherPlan: !pendingRequest && (!sub || sub.status !== 'active')
  });
};

// User creates a subscription upgrade request (Pending Admin Approval)
export const requestSubscriptionUpgrade = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  const user = mockDb.users.find(u => u.id === authUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const targetPlanId = (planId === 'job_seeker_pro' || planId === 'pro') ? 'job_seeker_pro' : 'career-max';
  const requestedPlanName = targetPlanId === 'job_seeker_pro' ? 'Job Seeker Pro' : 'Career Max';

  // Backend active subscription check: prevent multi-paid plan collision
  const activeSub = getActiveSubscription(authUserId);
  const currentPlan = user.plan || 'free';
  const isCurrentlyPaid = (currentPlan === 'job_seeker_pro' || currentPlan === 'pro' || currentPlan === 'career-max') && activeSub && activeSub.status === 'active';

  if (isCurrentlyPaid) {
    const isSamePlan = currentPlan === targetPlanId || (currentPlan === 'pro' && targetPlanId === 'job_seeker_pro');
    if (isSamePlan) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_ON_PLAN',
        error: `You are already subscribed to the ${requestedPlanName} plan.`,
        currentPlan
      });
    }

    const activePlanName = (currentPlan === 'job_seeker_pro' || currentPlan === 'pro') ? 'Job Seeker Pro ($12)' : 'Career Max ($49)';
    return res.status(400).json({
      success: false,
      code: 'CURRENT_SUBSCRIPTION_ACTIVE',
      error: `You currently have an active ${activePlanName} subscription. Cancel your existing subscription before switching to the ${requestedPlanName} plan.`,
      currentPlan
    });
  }

  // Duplicate Protection: Check if a pending request for this user already exists
  const existingPending = mockDb.subscriptionRequests.find(r => r.userId === authUserId && r.status === 'pending');
  if (existingPending) {
    const planLabel = existingPending.requestedPlanName || 'subscription upgrade';
    return res.status(400).json({
      success: false,
      code: 'SUBSCRIPTION_ACTION_PENDING',
      error: `Your ${planLabel} upgrade request is already pending. Cancel the existing request before choosing another plan.`,
      request: existingPending
    });
  }

  const newRequest: any = {
    id: `subreq-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    currentPlan,
    requestedPlan: targetPlanId,
    requestedPlanName,
    status: 'pending',
    requestedAt: new Date().toISOString()
  };

  mockDb.subscriptionRequests.unshift(newRequest);
  user.subscriptionStatus = 'pending_approval';
  saveDb();

  return res.status(201).json({
    success: true,
    message: `Subscription upgrade request for ${requestedPlanName} submitted. Waiting for administrator approval.`,
    request: newRequest
  });
};

// Deprecated direct purchase - mapped to requestSubscriptionUpgrade for security
export const purchaseSubscription = requestSubscriptionUpgrade;

export const getSubscriptionRequests = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const authUser = mockDb.users.find(u => u.id === authUserId);
  if (authUser?.userType === 'admin') {
    return res.json({ requests: mockDb.subscriptionRequests });
  }

  const userRequests = mockDb.subscriptionRequests.filter(r => r.userId === authUserId);
  return res.json({ requests: userRequests });
};

export const approveSubscriptionRequest = async (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const adminUser = mockDb.users.find(u => u.id === authUserId);
  if (!adminUser || adminUser.userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  const { id } = req.params;
  const reqItem = mockDb.subscriptionRequests.find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Subscription request not found' });
  }

  if (reqItem.status !== 'pending') {
    return res.status(400).json({ error: `Request has already been ${reqItem.status}` });
  }

  let targetUser = mockDb.users.find(u => u.id === reqItem.userId);
  if (!targetUser && reqItem.userEmail) {
    targetUser = mockDb.users.find(u => u.email.toLowerCase() === reqItem.userEmail.toLowerCase());
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Target user account not found' });
  }

  const now = new Date();
  const expiresAt = addOneMonth(now);

  // Mark request approved
  reqItem.status = 'approved';
  reqItem.approvedAt = now.toISOString();
  reqItem.approvedBy = adminUser.id;
  reqItem.approvedByName = adminUser.name;
  reqItem.currentPlan = reqItem.requestedPlan;

  // Activate user plan atomically
  targetUser.plan = reqItem.requestedPlan;
  targetUser.subscriptionStatus = 'approved';

  let sub = mockDb.subscriptions.find(s => s.userId === targetUser.id);
  if (sub) {
    sub.planId = reqItem.requestedPlan;
    sub.planName = reqItem.requestedPlanName;
    sub.status = 'active';
    sub.startedAt = now.toISOString();
    sub.expiresAt = expiresAt.toISOString();
    sub.autoRenew = true;
    sub.updatedAt = now.toISOString();
  } else {
    sub = {
      id: `sub-${Date.now()}`,
      userId: targetUser.id,
      planId: reqItem.requestedPlan,
      planName: reqItem.requestedPlanName,
      status: 'active',
      billingInterval: 'monthly',
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    mockDb.subscriptions.push(sub);
  }

  await saveDb();

  return res.json({
    success: true,
    message: `Successfully approved ${reqItem.requestedPlanName} plan for ${targetUser.name}`,
    request: reqItem,
    subscription: sub
  });
};

export const rejectSubscriptionRequest = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const adminUser = mockDb.users.find(u => u.id === authUserId);
  if (!adminUser || adminUser.userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  const { id } = req.params;
  const reqItem = mockDb.subscriptionRequests.find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ error: 'Subscription request not found' });
  }

  if (reqItem.status !== 'pending') {
    return res.status(400).json({ error: `Request has already been ${reqItem.status}` });
  }

  const targetUser = mockDb.users.find(u => u.id === reqItem.userId);

  const now = new Date();
  reqItem.status = 'rejected';
  reqItem.rejectedAt = now.toISOString();
  reqItem.rejectedBy = adminUser.id;
  reqItem.rejectedByName = adminUser.name;

  if (targetUser) {
    targetUser.subscriptionStatus = 'rejected';
  }

  saveDb();

  return res.json({
    success: true,
    message: `Subscription request for ${reqItem.userName} was rejected`,
    request: reqItem
  });
};

export const cancelSubscription = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = mockDb.users.find(u => u.id === authUserId);
  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const sub = mockDb.subscriptions.find(s => s.userId === authUserId);
  if (sub) {
    sub.autoRenew = false;
    sub.status = 'expired';
    sub.updatedAt = new Date().toISOString();
  }

  user.plan = 'free';
  user.subscriptionStatus = 'free';

  // Remove any pending subscription requests
  mockDb.subscriptionRequests = mockDb.subscriptionRequests.filter(r => r.userId !== authUserId);

  saveDb();

  const userResponse = { ...user };
  delete userResponse.password;

  return res.json({
    success: true,
    message: 'Subscription cancelled successfully.',
    subscription: sub || null,
    user: userResponse
  });
};

export const reactivateSubscription = (req: Request, res: Response) => {
  const authUserId = req.user?.userId;
  if (!authUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sub = mockDb.subscriptions.find(s => s.userId === authUserId);
  if (!sub) {
    return res.status(404).json({ error: 'No subscription found' });
  }

  const user = mockDb.users.find(u => u.id === authUserId);

  const now = new Date();
  if (sub.status === 'expired' || now >= new Date(sub.expiresAt)) {
    const expiresAt = addOneMonth(now);
    sub.status = 'active';
    sub.startedAt = now.toISOString();
    sub.expiresAt = expiresAt.toISOString();
    sub.autoRenew = true;
    if (user) {
      user.plan = sub.planId;
      user.subscriptionStatus = 'approved';
    }
  } else {
    sub.autoRenew = true;
    if (user) {
      user.plan = sub.planId;
      user.subscriptionStatus = 'approved';
    }
  }
  sub.updatedAt = now.toISOString();

  saveDb();

  return res.json({ subscription: sub });
};
