import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
  Search,
  Eye,
  Ban,
  Trash2,
  Activity,
  BarChart3,
  UserPlus,
  Filter,
  ChevronDown,
  Brain,
  Shield,
  CreditCard,
  Lock,
  Settings,
  AlertTriangle,
  X,
  Edit2
} from "lucide-react";
import { authApi } from "../services/api";
interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  userType: "seeker" | "recruiter" | "admin";
  rolePreference?: string;
  company?: string;
  status: "Active" | "Pending" | "Suspended";
  plan?: string;
  subscriptionStatus?: string;
  subscriptionRequestedAt?: string;
  joinedDate: string;
  lastActive: string;
}

export const AdminDashboardPage: React.FC = () => {

  // Navigation state
  const [activeNav, setActiveNav] = useState<
    | "Dashboard"
    | "Users"
    | "Recruiters"
    | "Candidates"
    | "Jobs"
    | "Resumes"
    | "AI Usage"
    | "Analytics"
    | "Subscriptions"
    | "Security"
    | "Settings"
  >("Dashboard");



  // Search & filters state
  const [globalSearch, setGlobalSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Timeframe selector for analytics
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"7D" | "30D" | "90D" | "1Y">("30D");

  // Selected details / modals state
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    type: "suspend" | "delete" | "approve-pro" | "decline-pro" | "change-role" | null;
    userId: string | null;
    targetRole?: "seeker" | "recruiter" | "admin";
  }>({ type: null, userId: null });

  // Inline edit state
  const [editModalUser, setEditModalUser] = useState<AdminUserRecord | null>(null);

  // Dynamic user database state loaded from LocalStorage
  const [usersDb, setUsersDb] = useState<AdminUserRecord[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);

  const mapToAdminUser = (u: any): AdminUserRecord => ({
    id: u.id,
    name: u.name,
    email: u.email,
    userType: u.userType,
    rolePreference: u.rolePreference,
    company: u.company || '',
    status: u.subscriptionStatus === 'pending' ? 'Pending' : (u.status || 'Active'),
    plan: u.plan || 'free',
    subscriptionStatus: u.subscriptionStatus || 'free',
    subscriptionRequestedAt: u.subscriptionRequestedAt || u.createdAt,
    joinedDate: u.createdAt || new Date().toISOString(),
    lastActive: u.lastActive || 'Just now'
  });

  const fetchSubscriptionRequests = async () => {
    try {
      const res = await authApi.getSubscriptionRequests();
      if (res && res.requests) {
        setSubscriptionRequests(res.requests);
      }
    } catch (err) {
      console.error("Failed to fetch subscription requests:", err);
    }
  };

  const handleApproveSubscriptionRequest = async (id: string) => {
    try {
      const res = await authApi.approveSubscriptionRequest(id);
      alert(res.message || 'Subscription request approved!');
      fetchSubscriptionRequests();
      // Refresh user list as well
      const userRes = await authApi.getAllUsers();
      if (userRes && userRes.users) setUsersDb(userRes.users.map(mapToAdminUser));
    } catch (err: any) {
      alert(`Failed to approve request: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRejectSubscriptionRequest = async (id: string) => {
    try {
      const res = await authApi.rejectSubscriptionRequest(id);
      alert(res.message || 'Subscription request rejected');
      fetchSubscriptionRequests();
      const userRes = await authApi.getAllUsers();
      if (userRes && userRes.users) setUsersDb(userRes.users.map(mapToAdminUser));
    } catch (err: any) {
      alert(`Failed to reject request: ${err.response?.data?.error || err.message}`);
    }
  };

  // Load & poll users from server DB
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authApi.getAllUsers();
        if (res && res.users) {
          setUsersDb(res.users.map(mapToAdminUser));
        }
      } catch (err) {
        console.error("Failed to fetch admin users:", err);
      }
    };

    fetchUsers();
    fetchSubscriptionRequests();
    const interval = setInterval(fetchUsers, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Update helper (local fallback + cloud/sync)
  const syncDb = (updatedList: AdminUserRecord[]) => {
    setUsersDb(updatedList);
  };

  // Perform confirm-modal actions
  const handleConfirmAction = () => {
    const { type, userId, targetRole } = confirmModal;
    if (!userId) return;

    let updated = [...usersDb];
    const index = updated.findIndex(u => u.id === userId);

    if (index >= 0) {
      if (type === "delete") {
        updated.splice(index, 1);
        syncDb(updated);
      } else if (type === "suspend") {
        updated[index].status = updated[index].status === "Suspended" ? "Active" : "Suspended";
        syncDb(updated);
      } else if (type === "approve-pro") {
        const targetUser = updated[index];
        const targetPlan = targetUser.plan && targetUser.plan !== "free" ? targetUser.plan : "career-max";

        updated[index].plan = targetPlan;
        updated[index].subscriptionStatus = "approved";
        updated[index].status = "Active";
        authApi.updateSubscription(targetUser.id, targetPlan, "approved").catch(console.error);
        syncDb(updated);
      } else if (type === "decline-pro") {
        const targetUser = updated[index];
        updated[index].subscriptionStatus = "declined";
        authApi.updateSubscription(targetUser.id, targetUser.plan || "free", "declined").catch(console.error);
        syncDb(updated);
      } else if (type === "change-role" && targetRole) {
        updated[index].userType = targetRole;
        syncDb(updated);
      }
    }

    setConfirmModal({ type: null, userId: null });
    // Update active details modal if open
    if (selectedUser && selectedUser.id === userId) {
      const refreshed = updated.find(u => u.id === userId);
      setSelectedUser(refreshed || null);
    }
  };

  // Inline edit action
  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    const updated = usersDb.map(u => u.id === editModalUser.id ? editModalUser : u);
    syncDb(updated);
    if (selectedUser && selectedUser.id === editModalUser.id) {
      setSelectedUser(editModalUser);
    }
    setEditModalUser(null);
  };

  // Filtered lists
  const filteredUsers = usersDb.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(globalSearch.toLowerCase()) ||
      (u.company && u.company.toLowerCase().includes(globalSearch.toLowerCase()));

    const matchesRole = roleFilter === "All" || u.userType === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const seekers = usersDb.filter(u => u.userType === "seeker");
  const recruiters = usersDb.filter(u => u.userType === "recruiter");

  // Dynamic stats calculation from real database records
  const getActiveJobsCount = () => {
    try {
      const saved = localStorage.getItem('resumeai_recruiter_jobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch {}
    return 0;
  };

  const getResumesCount = () => {
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('resumeai_user_resume_')) {
          const val = localStorage.getItem(key);
          if (val && val !== 'null' && val !== 'undefined') {
            count++;
          }
        }
      }
    } catch {}
    return count;
  };

  const getScreeningsCount = () => {
    try {
      const saved = localStorage.getItem('resumeai_recruiter_candidates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch {}
    return 0;
  };

  const getShortlistedCount = () => {
    try {
      const saved = localStorage.getItem('resumeai_recruiter_candidates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => c.status === 'Shortlisted').length;
        }
      }
    } catch {}
    return 0;
  };

  // Quick count stats calculated dynamically
  const kpiStats = {
    totalUsers: usersDb.length,
    recruiters: recruiters.length,
    candidates: seekers.length,
    activeJobs: getActiveJobsCount(),
    resumes: getResumesCount(),
    screenings: getScreeningsCount(),
    shortlisted: getShortlistedCount(),
    requests: usersDb.filter(u => u.subscriptionStatus === 'pending').length
  };

  // Mock security logs
  const securityLogs = [
    { id: "s-1", action: "Piyush changed Sarah Jenkins' role", time: "2 minutes ago", severity: "info" },
    { id: "s-2", action: "New recruiter account approved", time: "42 minutes ago", severity: "success" },
    { id: "s-3", action: "Failed login attempt (admin@resumeai.com)", time: "1 hour ago", severity: "warning" },
    { id: "s-4", action: "API key rotated for jd-matching-service", time: "2 hours ago", severity: "info" },
    { id: "s-5", action: "Suspicious bulk scraping request blocked", time: "5 hours ago", severity: "danger" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Platform Overview</p>
              <h2 className="font-serif text-lg text-white font-semibold">Admin Panel</h2>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none border-b border-slate-900 lg:border-none">
              {[
                { name: "Dashboard", icon: BarChart3 },
                { name: "Users", icon: Users },
                { name: "Recruiters", icon: Briefcase },
                { name: "Candidates", icon: UserPlus },
                { name: "Jobs", icon: Briefcase },
                { name: "Resumes", icon: FileText },
                { name: "AI Usage", icon: Brain },
                { name: "Analytics", icon: Activity },
                { name: "Subscriptions", icon: CreditCard },
                { name: "Security", icon: Lock },
                { name: "Settings", icon: Settings }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name as any)}
                    className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-amber-600/20 text-amber-500 border border-amber-500/20 shadow-md shadow-amber-950/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* MAIN DASHBOARD INTERFACE CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col space-y-6">
          
          {/* USER WELCOME HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                ResumeAI 2.0 Admin Panel
              </p>
              <h1 className="font-serif text-3xl font-bold text-white mt-1">
                Good afternoon, Piyush 👋
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {activeNav === "Dashboard" && "Here's what's happening across ResumeAI today."}
                {activeNav === "Users" && "Manage every account across ResumeAI."}
                {activeNav === "Recruiters" && "Overview of active hiring managers and teams."}
                {activeNav === "Candidates" && "Analyze seeker accounts and dynamic resume parsing activity."}
                {activeNav === "Jobs" && "Monitor active and closed job vacancies."}
                {activeNav === "Resumes" && "Review parsed documents, failure metrics, and status."}
                {activeNav === "AI Usage" && "Real-time cost, token usage, and AI rubrics telemetry."}
                {activeNav === "Analytics" && "Understand user growth, distribution, and engagement."}
                {activeNav === "Subscriptions" && "Approve plan upgrade requests and track monetization."}
                {activeNav === "Security" && "Audit security events, API key status, and failed authorization logs."}
                {activeNav === "Settings" && "Configure AI API endpoints, retention parameters, and notification alerts."}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Platform Online
              </span>
            </div>
          </div>

          {/* ─── VIEW RENDERER ─────────────────────────────────────────────────── */}

          {/* 1. DASHBOARD VIEW */}
          {activeNav === "Dashboard" && (
            <div className="space-y-8">


            {/* Platform KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "TOTAL USERS", val: kpiStats.totalUsers, change: "↑ 14.2% this month", col: "text-blue-400" },
                { label: "RECRUITERS", val: kpiStats.recruiters, change: "↑ 8.4% this month", col: "text-purple-400" },
                { label: "CANDIDATES", val: kpiStats.candidates, change: "↑ 15.1% this month", col: "text-teal-400" },
                { label: "ACTIVE JOBS", val: kpiStats.activeJobs, change: "↑ 11.3% this month", col: "text-amber-500" }
              ].map(stat => (
                <div key={stat.label} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-4 transition-colors hover:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                  <div className="text-xl sm:text-2xl font-bold mt-2 text-white">{stat.val.toLocaleString()}</div>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1.5">{stat.change}</span>
                </div>
              ))}
            </div>

            {/* Second row of Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "RESUMES", val: kpiStats.resumes },
                { label: "AI SCREENINGS", val: kpiStats.screenings },
                { label: "SHORTLISTED", val: kpiStats.shortlisted },
                { label: "AI REQUESTS", val: kpiStats.requests }
              ].map(stat => (
                <div key={stat.label} className="bg-slate-900/40 border border-slate-900/60 rounded-2xl p-4">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                  <div className="text-lg sm:text-xl font-bold mt-1 text-slate-200">{stat.val.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Main Analytical Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Plotting Chart (SVG Area Chart) */}
              <div className="lg:col-span-2 bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">PLATFORM ACTIVITY</h3>
                  <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
                    {(["7D", "30D", "90D", "1Y"] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setAnalyticsTimeframe(tf)}
                        className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                          analyticsTimeframe === tf ? "bg-amber-600 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {tf === "7D" ? "7 Days" : tf === "30D" ? "30 Days" : tf === "90D" ? "90 Days" : "1 Year"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Visual graph */}
                <div className="h-44 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4" />
                    
                    {/* Users Line (indigo-600) */}
                    <path
                      d="M 0 130 Q 120 100 250 50 T 500 20"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 0 130 Q 120 100 250 50 T 500 20 L 500 150 L 0 150 Z"
                      fill="url(#indigoGlow)"
                      opacity="0.1"
                    />

                    {/* Recruiters Line (purple-500) */}
                    <path
                      d="M 0 140 Q 150 120 300 90 T 500 65"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />

                    {/* AI Screenings (amber-500) */}
                    <path
                      d="M 0 145 Q 100 130 250 110 T 500 45"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />

                    {/* Definitions */}
                    <defs>
                      <linearGradient id="indigoGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#020617" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Legend */}
                  <div className="absolute bottom-1 right-2 flex items-center space-x-3 text-[9px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" />Users</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#a855f7]" />Recruiters</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />Screenings</span>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">
                    SYSTEM HEALTH
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { label: "API Gateway", status: "Operational" },
                      { label: "Resume Parser", status: "Operational" },
                      { label: "AI Screening", status: "Operational" },
                      { label: "Database clusters", status: "Operational" },
                      { label: "Authentication service", status: "Operational" },
                      { label: "Object Storage S3", status: "Operational" }
                    ].map(srv => (
                      <div key={srv.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{srv.label}</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {srv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-900/60 mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Global Uptime</span>
                  <span className="font-bold text-slate-200">99.98% SLA</span>
                </div>
              </div>
            </div>

            {/* Activity and Jobs Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* User Activity */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">
                  RECENT USER ACTIVITY
                </h3>
                <div className="space-y-4">
                  {[
                    { name: "Sarah Jenkins", role: "Recruiter", act: "Created a new job description", time: "2 minutes ago" },
                    { name: "Aarav Sharma", role: "Candidate", act: "Uploaded raw PDF resume", time: "8 minutes ago" },
                    { name: "Alex Rivera", role: "Recruiter", act: "Screened 24 candidates for Backend role", time: "18 minutes ago" },
                    { name: "Priya Mehta", role: "Candidate", act: "Updated profile links and details", time: "31 minutes ago" }
                  ].map((act, i) => (
                    <div key={i} className="flex items-start justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{act.name}</span>
                        <span className="text-[10px] text-purple-400 bg-purple-950/40 px-1 py-0.5 rounded ml-2 border border-purple-500/10 uppercase font-medium">{act.role}</span>
                        <p className="text-slate-400 mt-1">{act.act}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">
                  RECENT PLATFORM JOBS
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-900 pb-2 uppercase tracking-wider text-[10px]">
                        <th className="py-2">Job</th>
                        <th className="py-2">Recruiter</th>
                        <th className="py-2">Apps</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {[
                        { title: "Senior Frontend Engineer", recruiter: "Sarah Jenkins", count: 142, status: "Active" },
                        { title: "Product Designer", recruiter: "Alex Rivera", count: 86, status: "Active" },
                        { title: "Backend Engineer", recruiter: "John Smith", count: 200, status: "Closed" },
                        { title: "Data Analyst", recruiter: "Sarah Jenkins", count: 74, status: "Active" }
                      ].map((j, i) => (
                        <tr key={i} className="hover:bg-slate-900/20">
                          <td className="py-2.5 font-semibold text-slate-200">{j.title}</td>
                          <td className="py-2.5 text-slate-400">{j.recruiter}</td>
                          <td className="py-2.5 text-slate-300">{j.count}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              j.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                            }`}>{j.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. USERS MANAGEMENT VIEW */}
        {activeNav === "Users" && (
          <div className="space-y-6">
            {/* Search, Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 border border-slate-900 rounded-2xl">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="w-full text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2.5 outline-none focus:border-amber-500 cursor-pointer appearance-none"
                  >
                    <option value="All">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Seeker">Candidate</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative flex-1 md:flex-none">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 outline-none focus:border-amber-500 cursor-pointer appearance-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* User Grid Table */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Joined Date</th>
                      <th className="px-5 py-4">Last Active</th>
                      <th className="px-5 py-4">Resume</th>
                      <th className="px-5 py-4">Applications</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filteredUsers.map(user => {
                      const planName = user.userType === 'admin' 
                        ? 'Enterprise Admin' 
                        : user.userType === 'recruiter' 
                        ? 'Recruiter Hub' 
                        : user.plan === 'career-max' 
                        ? 'Career Max' 
                        : user.plan === 'pro' 
                        ? 'Job Seeker Pro' 
                        : 'Free Seeker';

                      const resumeKey = `resumeai_user_resume_${user.id}`;
                      const savedResume = localStorage.getItem(resumeKey);
                      let resumeStatus = 'Not uploaded';
                      if (savedResume) {
                        try {
                          const parsed = JSON.parse(savedResume);
                          if (parsed) resumeStatus = 'Uploaded';
                        } catch {}
                      }

                      const appsKey = `resumeai_user_apps_${user.id}`;
                      const savedApps = localStorage.getItem(appsKey);
                      let appsCount = 0;
                      if (savedApps) {
                        try {
                          const parsed = JSON.parse(savedApps);
                          if (Array.isArray(parsed)) appsCount = parsed.length;
                        } catch {}
                      }

                      return (
                        <tr key={user.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-200 text-xs">{user.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              user.userType === 'admin'
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : user.userType === 'recruiter'
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            }`}>
                              {user.userType === 'seeker' ? 'Candidate' : user.userType}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-slate-300 font-medium">{planName}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : user.status === "Pending"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                user.status === "Active" ? "bg-emerald-400" : user.status === "Pending" ? "bg-amber-400" : "bg-rose-400"
                              }`} />
                              {user.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {new Date(user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">{user.lastActive}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              resumeStatus === 'Uploaded' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {resumeStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-350 font-bold">
                            {appsCount}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDetailModalOpen(true);
                                }}
                                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditModalUser(user)}
                                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                                title="Edit Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmModal({ type: "suspend", userId: user.id })}
                                className={`p-1 rounded ${
                                  user.status === "Suspended"
                                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-900/30"
                                    : "bg-rose-950/40 text-rose-400 border border-rose-500/10 hover:bg-rose-900/30"
                                }`}
                                title={user.status === "Suspended" ? "Activate User" : "Suspend User"}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmModal({ type: "delete", userId: user.id })}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-950/30 hover:text-rose-400 text-slate-500"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Users className="w-8 h-8 text-slate-600 mx-auto" />
                            <p className="font-semibold text-slate-400">No users found</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed">Try changing your search or filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. RECRUITERS PANEL */}
        {activeNav === "Recruiters" && (
          <div className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-4">Recruiter</th>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4">Active Jobs</th>
                    <th className="px-5 py-4">Candidates</th>
                    <th className="px-5 py-4">Screened</th>
                    <th className="px-5 py-4">Shortlisted</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {recruiters.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-900/20 cursor-pointer" onClick={() => { setSelectedUser(rec); setDetailModalOpen(true); }}>
                      <td className="px-5 py-3.5 font-semibold text-slate-200">
                        <div>
                          <p className="font-bold text-slate-200">{rec.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{rec.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-[10px] text-slate-300">{rec.company || "TechCorp"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-medium">12</td>
                      <td className="px-5 py-3.5 text-slate-400">428</td>
                      <td className="px-5 py-3.5 text-slate-400">351</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-bold">41</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${rec.status === "Active" ? "bg-emerald-400" : "bg-rose-400"}`} />
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CANDIDATES PANEL */}
        {activeNav === "Candidates" && (
          <div className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-4">Candidate</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Applications</th>
                    <th className="px-5 py-4">Resumes</th>
                    <th className="px-5 py-4">Last Activity</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {seekers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/20 cursor-pointer" onClick={() => { setSelectedUser(c); setDetailModalOpen(true); }}>
                      <td className="px-5 py-3.5 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{c.email}</td>
                      <td className="px-5 py-3.5 text-slate-300">5</td>
                      <td className="px-5 py-3.5 text-slate-300">3</td>
                      <td className="px-5 py-3.5 text-slate-400">{c.lastActive}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. JOBS PANEL */}
        {activeNav === "Jobs" && (
          <div className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-5 py-4">Job Title</th>
                    <th className="px-5 py-4">Recruiter</th>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4">Applications</th>
                    <th className="px-5 py-4">Screened</th>
                    <th className="px-5 py-4">Shortlisted</th>
                    <th className="px-5 py-4">Created Date</th>
                    <th className="px-5 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {[
                    { id: "1", title: "Senior Frontend Engineer", rec: "Sarah Jenkins", comp: "TechScale", apps: 142, scr: 110, sl: 12, dt: "Aug 22, 2026", st: "Active" },
                    { id: "2", title: "Product Designer", rec: "Alex Rivera", comp: "DesignFlow", apps: 86, scr: 70, sl: 5, dt: "Aug 21, 2026", st: "Active" },
                    { id: "3", title: "Backend Engineer", rec: "John Smith", comp: "CloudBase", apps: 200, scr: 190, sl: 24, dt: "Aug 19, 2026", st: "Closed" },
                    { id: "4", title: "Data Analyst", rec: "Sarah Jenkins", comp: "ComputeCorp", apps: 74, scr: 50, sl: 4, dt: "Aug 15, 2026", st: "Active" }
                  ].map(job => (
                    <tr key={job.id} className="hover:bg-slate-900/20">
                      <td className="px-5 py-3.5 font-semibold text-slate-200">{job.title}</td>
                      <td className="px-5 py-3.5 text-slate-400">{job.rec}</td>
                      <td className="px-5 py-3.5 text-slate-300">{job.comp}</td>
                      <td className="px-5 py-3.5 text-slate-400">{job.apps}</td>
                      <td className="px-5 py-3.5 text-slate-400">{job.scr}</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-bold">{job.sl}</td>
                      <td className="px-5 py-3.5 text-slate-400">{job.dt}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.st === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                        }`}>{job.st}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. RESUMES PANEL */}
        {activeNav === "Resumes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Resumes", val: "48,291" },
                { label: "Processed", val: "46,981", col: "text-emerald-400" },
                { label: "Pending", val: "1,102", col: "text-amber-500" },
                { label: "Failed", val: "208", col: "text-rose-500" }
              ].map(stat => (
                <div key={stat.label} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">{stat.label}</span>
                  <div className={`text-2xl font-bold mt-2 ${stat.col || "text-white"}`}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Resume Processing logs overview */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">
                RESUME PARSING METRICS
              </h3>
              <div className="space-y-3.5">
                {[
                  { label: "PDF Format Parser", rate: "99.1% success" },
                  { label: "DOCX Format Parser", rate: "98.4% success" },
                  { label: "Image (OCR) Parser", rate: "92.0% success" },
                  { label: "Average processing latency", rate: "430ms" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-bold text-slate-200">{item.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. AI USAGE VIEW */}
        {activeNav === "AI Usage" && (
          <div className="space-y-6">
            <h2 className="font-serif text-lg font-bold text-slate-300">✦ AI USAGE TELEMETRY</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "AI Requests Today", val: "8,432", col: "text-indigo-400" },
                { label: "Resume Analyses", val: "3,281", col: "text-purple-400" },
                { label: "Candidate Rankings", val: "2,842", col: "text-teal-400" },
                { label: "AI Recruiter Queries", val: "2,309", col: "text-amber-400" }
              ].map(stat => (
                <div key={stat.label} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">{stat.label}</span>
                  <div className={`text-xl font-bold mt-2 ${stat.col}`}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Model Performance metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">
                  AI MODEL PERFORMANCE MATRIX
                </h3>
                <div className="space-y-3">
                  {[
                    { rubric: "Resume Structure Check", success: "98.7% success" },
                    { rubric: "Rubric Scoring Consistency", success: "97.4% success" },
                    { rubric: "Candidate Matching accuracy", success: "96.8% success" },
                    { rubric: "AI Assistant availability", success: "99.1% uptime" }
                  ].map((perf, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{perf.rubric}</span>
                      <span className="font-bold text-slate-200">{perf.success}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token Consumption */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">
                    MODEL TELEMETRY & BUDGETS
                  </h3>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tokens Consumed</span>
                      <span className="font-bold text-slate-200">4,281,902 tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Response Time</span>
                      <span className="font-bold text-slate-200">820ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Failed AI Requests</span>
                      <span className="font-bold text-rose-400">14 requests</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-900 mt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Estimated Cost (MTD)</span>
                  <span className="text-emerald-400 font-extrabold">$84.32</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. ANALYTICS VIEW */}
        {activeNav === "Analytics" && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2">
                PLATFORM SCORING DISTRIBUTION
              </h3>
              
              {/* Graphical Bar Chart representation */}
              <div className="h-40 flex items-end justify-between gap-2.5 pt-4">
                {[
                  { range: "0-20", height: "h-2", pct: "2%" },
                  { range: "21-40", height: "h-8", pct: "10%" },
                  { range: "41-60", height: "h-16", pct: "22%" },
                  { range: "61-80", height: "h-36", pct: "48%" },
                  { range: "81-100", height: "h-14", pct: "18%" }
                ].map(bar => (
                  <div key={bar.range} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">{bar.pct}</span>
                    <div className={`w-full rounded bg-indigo-600/60 border border-indigo-500/20 ${bar.height}`} />
                    <span className="text-[10px] text-slate-500 font-bold">{bar.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. SUBSCRIPTIONS VIEW */}
        {activeNav === "Subscriptions" && (
          <div className="space-y-6">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Monthly Recurring Revenue (MRR)</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">$12,842</div>
                <span className="text-[10px] text-slate-500 block mt-1.5">Goal: $20,000</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Active Pro & Max Accounts</span>
                <div className="text-2xl font-bold text-indigo-400 mt-2">
                  {usersDb.filter(u => u.plan === 'pro' || u.plan === 'career-max').length + 1100}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1.5">Goal: 2,000</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Active Recruiter Accounts</span>
                <div className="text-2xl font-bold text-purple-400 mt-2">
                  {usersDb.filter(u => u.userType === 'recruiter').length + 480}
                </div>
                <span className="text-[10px] text-slate-500 block mt-1.5">Active hiring teams</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Pending Upgrade Requests</span>
                <div className="text-2xl font-bold text-amber-400 mt-2">
                  {subscriptionRequests.filter(r => r.status === 'pending').length}
                </div>
                <span className="text-[10px] text-amber-500/80 font-semibold block mt-1.5">Requires admin approval</span>
              </div>
            </div>

            {/* SUBSCRIPTION REQUESTS AUDIT TABLE */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">ADMIN CONTROL CENTER</span>
                  <h2 className="text-lg font-serif font-bold text-white mt-0.5">Subscription Upgrade Requests</h2>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-full">
                  {subscriptionRequests.filter(r => r.status === 'pending').length} Pending Requests
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-3">User</th>
                      <th className="p-3">Current Plan</th>
                      <th className="p-3">Requested Plan</th>
                      <th className="p-3">Requested Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {subscriptionRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 italic">No subscription requests found.</td>
                      </tr>
                    ) : (
                      subscriptionRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-3 font-semibold text-white">
                            <div>{req.userName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{req.userEmail}</div>
                          </td>
                          <td className="p-3 uppercase text-slate-400 font-bold">{req.currentPlan || 'free'}</td>
                          <td className="p-3 font-bold text-amber-300">{req.requestedPlanName}</td>
                          <td className="p-3 text-slate-400">{new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              req.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                                : req.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            }`}>
                              {req.status === 'pending' ? 'Pending Approval' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                            {req.status !== 'pending' && (
                              <div className="text-[9px] text-slate-500 mt-1">
                                by {req.approvedByName || req.rejectedByName || 'Admin'}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {req.status === 'pending' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleApproveSubscriptionRequest(req.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectSubscriptionRequest(req.id)}
                                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PLAN TIERS BREAKDOWN GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Job Seeker Free</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-white">{usersDb.filter(u => (!u.plan || u.plan === 'free') && u.userType === 'seeker').length + 8400}</span>
                  <span className="text-[10px] text-slate-500">$0/mo</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Job Seeker Pro</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-indigo-300">{usersDb.filter(u => u.plan === 'pro').length + 1420}</span>
                  <span className="text-[10px] text-indigo-400 font-semibold">$12/mo</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Career Max</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-purple-300">{usersDb.filter(u => u.plan === 'career-max').length + 310}</span>
                  <span className="text-[10px] text-purple-400 font-semibold">$49/mo</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Recruiter Hub</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold text-amber-300">{usersDb.filter(u => u.plan === 'recruiter' || u.userType === 'recruiter').length + 480}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">$49/mo</span>
                </div>
              </div>
            </div>

            {/* Pending Subscription Request Approval Table */}
            <div className="bg-slate-900/30 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  PENDING PRO & CAREER MAX UPGRADE REQUESTS
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {usersDb.filter(u => u.subscriptionStatus === 'pending').length} Pending Action
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-900 pb-2 uppercase tracking-wider text-[10px]">
                      <th className="py-2">User / Candidate</th>
                      <th className="py-2">Target Role</th>
                      <th className="py-2">Requested Tier</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Approval Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {usersDb.filter(u => u.subscriptionStatus === 'pending').map(seeker => (
                      <tr key={seeker.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">
                          <p className="font-bold text-slate-200 text-xs">{seeker.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{seeker.email}</p>
                        </td>
                        <td className="py-3 text-slate-400 capitalize">
                          {seeker.rolePreference ? seeker.rolePreference.replace('-', ' ') : 'Software Engineering'}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            seeker.plan === 'career-max'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                              : 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                          }`}>
                            {seeker.plan === 'career-max' ? 'Career Max ($49/mo)' : seeker.plan === 'recruiter' ? 'Recruiter Hub ($49/mo)' : 'Job Seeker Pro ($12/mo)'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Upgrade Requested
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setConfirmModal({ type: "approve-pro", userId: seeker.id })}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-lg transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setConfirmModal({ type: "decline-pro", userId: seeker.id })}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersDb.filter(u => u.subscriptionStatus === 'pending').length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          No pending subscription requests at this time.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ALL ACTIVE SUBSCRIBERS ROSTER TABLE */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  ALL REGISTERED ACCOUNTS & SUBSCRIPTION TIERS
                </h3>
                <span className="text-[10px] text-slate-400">
                  Showing {usersDb.length} Registered Accounts
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-900 pb-2 uppercase tracking-wider text-[10px]">
                      <th className="py-2">User / Email</th>
                      <th className="py-2">Account Type</th>
                      <th className="py-2">Position / Role</th>
                      <th className="py-2">Current Tier</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {usersDb.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">
                          <p className="font-bold text-slate-200 text-xs">{u.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                            u.userType === 'admin'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : u.userType === 'recruiter'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {u.userType}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 capitalize text-xs">
                          {u.company ? `Recruiter (${u.company})` : u.rolePreference ? u.rolePreference.replace('-', ' ') : 'Software Engineering'}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.plan === 'career-max'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                              : u.plan === 'pro'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60'
                              : u.plan === 'recruiter'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {u.plan === 'career-max'
                              ? 'Career Max ($49/mo)'
                              : u.plan === 'pro'
                              ? 'Job Seeker Pro ($12/mo)'
                              : u.plan === 'recruiter'
                              ? 'Recruiter Hub ($49/mo)'
                              : u.plan === 'enterprise'
                              ? 'Enterprise'
                              : 'Free Plan ($0)'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.subscriptionStatus === 'approved' || u.subscriptionStatus === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : u.subscriptionStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.subscriptionStatus === 'approved' || u.subscriptionStatus === 'active'
                              ? 'Active'
                              : u.subscriptionStatus === 'pending'
                              ? 'Pending Approval'
                              : 'Free Tier'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setDetailModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 10. SECURITY VIEW */}
        {activeNav === "Security" && (
          <div className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Shield className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  SECURITY AUDIT LOGS
                </h3>
              </div>
              <div className="space-y-3">
                {securityLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-start gap-4 p-3 rounded-xl bg-slate-950 border border-slate-900 text-xs">
                    <div>
                      <span className={`inline-block w-2 h-2 rounded-full mr-2.5 ${
                        log.severity === "danger" ? "bg-rose-500" : log.severity === "warning" ? "bg-amber-500" : "bg-blue-400"
                      }`} />
                      <span className="text-slate-200">{log.action}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 11. SETTINGS VIEW */}
        {activeNav === "Settings" && (
          <div className="space-y-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">AI Configuration & Access Policies</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Model Endpoint URL</label>
                  <input
                    type="text"
                    defaultValue="https://api.openai.com/v1/chat/completions"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Monthly Cost Limit Cap</label>
                  <input
                    type="text"
                    defaultValue="$1,200.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => alert("Settings saved locally! (Mock Action)")}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white rounded-xl cursor-pointer"
                >
                  Save Platform Settings
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── MODAL 1: VIEW DETAILS MODAL ─────────────────────────────────────── */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => { setDetailModalOpen(false); setSelectedUser(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">User Record Details</span>
              <h2 className="font-serif text-2xl font-bold text-white mt-1">{selectedUser.name}</h2>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold border capitalize ${
                selectedUser.userType === 'admin'
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : selectedUser.userType === 'recruiter'
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}>
                {selectedUser.userType === 'seeker' ? 'Candidate' : selectedUser.userType} Role
              </span>
            </div>

            <div className="border-t border-b border-slate-800 py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-200">{selectedUser.email}</span>
              </div>
              {selectedUser.company && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Associated Company</span>
                  <span className="font-semibold text-slate-200">{selectedUser.company}</span>
                </div>
              )}
              {selectedUser.rolePreference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Role Preference</span>
                  <span className="font-semibold text-slate-200 uppercase">{selectedUser.rolePreference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Account Status</span>
                <span className={`font-semibold ${selectedUser.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ● {selectedUser.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Joined Date</span>
                <span className="font-semibold text-slate-200">
                  {new Date(selectedUser.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Session</span>
                <span className="font-semibold text-slate-200">{selectedUser.lastActive}</span>
              </div>
            </div>

            {/* Quick Actions inside Details View */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Mode Overrides</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setConfirmModal({ type: "suspend", userId: selectedUser.id });
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedUser.status === "Suspended"
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/30"
                      : "bg-rose-950/40 text-rose-400 border-rose-500/20 hover:bg-rose-900/30"
                  }`}
                >
                  {selectedUser.status === "Suspended" ? "Activate Account" : "Suspend Account"}
                </button>
                <button
                  onClick={() => {
                    setEditModalUser(selectedUser);
                    setDetailModalOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-500 font-medium">Quick Role Change:</span>
                {(["seeker", "recruiter", "admin"] as const).map(roleOption => {
                  if (roleOption === selectedUser.userType) return null;
                  return (
                    <button
                      key={roleOption}
                      onClick={() => setConfirmModal({ type: "change-role", userId: selectedUser.id, targetRole: roleOption })}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[9px] font-bold text-slate-300 uppercase cursor-pointer"
                    >
                      to {roleOption === 'seeker' ? 'Candidate' : roleOption}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: CONFIRMATION MODAL ────────────────────────────────────── */}
      {confirmModal.type && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-white">Confirm Admin Action</h3>
            </div>
            
            <p className="text-slate-300 text-xs leading-relaxed">
              {confirmModal.type === "delete" && "Are you sure you want to permanently delete this user account? All resume reviews and profiles linked to this user ID will be destroyed."}
              {confirmModal.type === "suspend" && "Toggle status between Suspended and Active? Suspended accounts cannot log in to ResumeAI."}
              {confirmModal.type === "approve-pro" && "Approve access to the Pro tier for this candidate user?"}
              {confirmModal.type === "decline-pro" && "Decline this candidate user's subscription upgrade request?"}
              {confirmModal.type === "change-role" && `Change the platform authorization role of this user account to ${confirmModal.targetRole === 'seeker' ? 'Candidate' : confirmModal.targetRole}?`}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ type: null, userId: null })}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                  confirmModal.type === "delete" ? "bg-[#b91c1c] hover:bg-[#991b1b]" : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EDIT USER PROFILE MODAL ─────────────────────────────────── */}
      {editModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveUserEdit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Modify Profile Data</span>
              <h3 className="font-serif text-lg font-bold text-white mt-1">Edit User Profile</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-medium">Name</label>
                <input
                  type="text"
                  required
                  value={editModalUser.name}
                  onChange={e => setEditModalUser({ ...editModalUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-250 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={editModalUser.email}
                  onChange={e => setEditModalUser({ ...editModalUser, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-250 outline-none focus:border-amber-500"
                />
              </div>

              {editModalUser.userType === "recruiter" && (
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Company Name</label>
                  <input
                    type="text"
                    value={editModalUser.company || ""}
                    onChange={e => setEditModalUser({ ...editModalUser, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-250 outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
              >
                Save Edits
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  </div>
  );
};

export default AdminDashboardPage;
