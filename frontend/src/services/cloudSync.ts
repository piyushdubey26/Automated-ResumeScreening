// ─── Cloud Sync Service for Multi-Device Real-Time State ──────────────────────
// Syncs users, registrations, and subscription requests across all mobile & desktop devices.

export interface CloudUserRecord {
  id: string;
  name: string;
  email: string;
  userType: 'seeker' | 'recruiter' | 'admin';
  rolePreference?: string;
  company?: string;
  status: 'Active' | 'Pending' | 'Suspended';
  plan?: string;
  subscriptionStatus?: string;
  subscriptionRequestedAt?: string;
  joinedDate: string;
  lastActive: string;
}

const LOCAL_DB_KEY = 'resumeai_local_db';
const CLOUD_SYNC_URL = 'https://api.jsonbin.io/v3/b/66d80000e41b4d34e428e100'; // Cloud fallback endpoint

// Sample initial seed users so admin always has rich data
const DEFAULT_SEED_USERS: CloudUserRecord[] = [
  {
    id: 'u-pending-1',
    name: 'Sameer Verma',
    email: 'sameer.verma@techmail.com',
    userType: 'seeker',
    rolePreference: 'sde',
    status: 'Pending',
    plan: 'pro',
    subscriptionStatus: 'pending',
    subscriptionRequestedAt: new Date(Date.now() - 3600000).toISOString(),
    joinedDate: new Date(Date.now() - 86400000).toISOString(),
    lastActive: '5 mins ago'
  },
  {
    id: 'u-pending-2',
    name: 'Ananya Roy',
    email: 'ananya.roy@designhub.io',
    userType: 'seeker',
    rolePreference: 'product-management',
    status: 'Pending',
    plan: 'career-max',
    subscriptionStatus: 'pending',
    subscriptionRequestedAt: new Date(Date.now() - 7200000).toISOString(),
    joinedDate: new Date(Date.now() - 172800000).toISOString(),
    lastActive: '12 mins ago'
  },
  {
    id: 'u-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    userType: 'seeker',
    rolePreference: 'sde',
    status: 'Active',
    plan: 'free',
    subscriptionStatus: 'free',
    joinedDate: '2026-08-20T10:00:00Z',
    lastActive: '2 minutes ago'
  },
  {
    id: 'u-2',
    name: 'Priya Mehta',
    email: 'priya.mehta@example.com',
    userType: 'seeker',
    rolePreference: 'sde',
    status: 'Active',
    plan: 'pro',
    subscriptionStatus: 'approved',
    joinedDate: '2026-08-18T14:30:00Z',
    lastActive: '31 minutes ago'
  },
  {
    id: 'u-4',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@techcorp.com',
    userType: 'recruiter',
    company: 'TechCorp',
    status: 'Active',
    plan: 'recruiter',
    subscriptionStatus: 'approved',
    joinedDate: '2026-08-22T08:00:00Z',
    lastActive: 'Today'
  },
  {
    id: 'u-6',
    name: 'Piyush Dubey',
    email: 'piyushdubey447@gmail.com',
    userType: 'admin',
    status: 'Active',
    plan: 'pro',
    subscriptionStatus: 'approved',
    joinedDate: '2026-08-10T12:00:00Z',
    lastActive: 'Just now'
  }
];

export const cloudSync = {
  // Get all users from localStorage combined with cloud cache
  getUsers: (): CloudUserRecord[] => {
    try {
      const saved = localStorage.getItem(LOCAL_DB_KEY);
      let localUsers: CloudUserRecord[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && Array.isArray(parsed.users)) {
          localUsers = parsed.users;
        }
      }

      // Merge seed users with local storage users by email
      const userMap = new Map<string, CloudUserRecord>();
      DEFAULT_SEED_USERS.forEach(u => userMap.set(u.email.toLowerCase(), u));
      localUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));

      const merged = Array.from(userMap.values());
      return merged;
    } catch {
      return DEFAULT_SEED_USERS;
    }
  },

  // Save or update a user record locally & dispatch change event
  saveUser: (user: CloudUserRecord) => {
    try {
      const users = cloudSync.getUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (index >= 0) {
        users[index] = { ...users[index], ...user };
      } else {
        users.unshift(user);
      }

      // Preserve resumes when saving user to avoid conflicting database structures
      const saved = localStorage.getItem(LOCAL_DB_KEY);
      let resumes: any[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.resumes) resumes = parsed.resumes;
        } catch {}
      }

      const dbData = { users, resumes, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(dbData));
      window.dispatchEvent(new Event('resumeai-db-updated'));
      window.dispatchEvent(new Event('resumeai-subscription-updated'));

      // Asynchronous cloud sync push
      cloudSync.pushToCloud(users);
    } catch (err) {
      console.error('Error saving user locally:', err);
    }
  },

  // Request subscription upgrade for candidate or recruiter
  requestSubscription: (email: string, plan: string): CloudUserRecord | null => {
    const users = cloudSync.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;

    user.plan = plan;
    user.subscriptionStatus = 'pending';
    user.subscriptionRequestedAt = new Date().toISOString();
    user.status = 'Pending';

    cloudSync.saveUser(user);
    return user;
  },

  // Approve subscription request (Admin action) - preserves exact requested tier (career-max, pro, recruiter)
  approveSubscription: (email: string): CloudUserRecord | null => {
    const users = cloudSync.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;

    user.subscriptionStatus = 'approved';
    user.status = 'Active';
    if (!user.plan || user.plan === 'free') {
      user.plan = 'career-max';
    }
    cloudSync.saveUser(user);
    return user;
  },

  // Decline subscription request (Admin action)
  declineSubscription: (email: string): CloudUserRecord | null => {
    const users = cloudSync.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;

    user.subscriptionStatus = 'declined';
    user.status = 'Active';
    cloudSync.saveUser(user);
    return user;
  },

  // Push dataset to cloud endpoint for cross-browser sync
  pushToCloud: async (users: CloudUserRecord[]) => {
    try {
      await fetch(CLOUD_SYNC_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users })
      });
    } catch {
      // Quiet fallback if offline
    }
  },

  // Pull latest dataset from cloud endpoint
  pullFromCloud: async (): Promise<CloudUserRecord[]> => {
    try {
      const res = await fetch(CLOUD_SYNC_URL);
      if (res.ok) {
        const data = await res.json();
        if (data && data.record && Array.isArray(data.record.users)) {
          const cloudUsers: CloudUserRecord[] = data.record.users;
          const currentLocal = cloudSync.getUsers();

          // Merge cloud records with local records
          const map = new Map<string, CloudUserRecord>();
          cloudUsers.forEach(u => map.set(u.email.toLowerCase(), u));
          currentLocal.forEach(u => map.set(u.email.toLowerCase(), u));

          const merged = Array.from(map.values());
          
          // Preserve resumes when pulling from cloud to avoid deleting uploaded resumes
          const saved = localStorage.getItem(LOCAL_DB_KEY);
          let resumes: any[] = [];
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.resumes) resumes = parsed.resumes;
            } catch {}
          }

          localStorage.setItem(LOCAL_DB_KEY, JSON.stringify({ users: merged, resumes }));
          window.dispatchEvent(new Event('resumeai-db-updated'));
          return merged;
        }
      }
    } catch {
      // Fallback to local
    }
    return cloudSync.getUsers();
  }
};
