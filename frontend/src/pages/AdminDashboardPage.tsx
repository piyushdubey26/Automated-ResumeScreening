import React, { useState } from "react";
import {
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
  Search,
  Eye,
  Ban,
  Trash2,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
  UserPlus,
  Upload,
  ScanLine,
  Filter,
  ChevronDown,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const seekersData = [
  {
    id: 1,
    name: "Aarav Mehta",
    email: "aarav.mehta@gmail.com",
    role: "SDE",
    resumeScore: 92,
    badges: ["Top 5%", "Verified"],
    status: "Active" as const,
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya.sharma@outlook.com",
    role: "Data Science",
    resumeScore: 87,
    badges: ["Verified"],
    status: "Active" as const,
  },
  {
    id: 3,
    name: "Rohan Gupta",
    email: "rohan.gupta@yahoo.com",
    role: "Marketing",
    resumeScore: 64,
    badges: [],
    status: "Suspended" as const,
  },
  {
    id: 4,
    name: "Sneha Iyer",
    email: "sneha.iyer@gmail.com",
    role: "PM",
    resumeScore: 81,
    badges: ["Verified"],
    status: "Active" as const,
  },
  {
    id: 5,
    name: "Karan Patel",
    email: "karan.patel@proton.me",
    role: "SDE",
    resumeScore: 75,
    badges: ["Top 10%"],
    status: "Active" as const,
  },
  {
    id: 6,
    name: "Ananya Reddy",
    email: "ananya.reddy@gmail.com",
    role: "Data Science",
    resumeScore: 58,
    badges: [],
    status: "Suspended" as const,
  },
];

const recruitersData = [
  {
    id: 1,
    name: "Vikram Desai",
    company: "Google India",
    email: "vikram.desai@google.com",
    jobsPosted: 12,
    candidatesScreened: 340,
    status: "Active" as const,
  },
  {
    id: 2,
    name: "Meera Joshi",
    company: "Flipkart",
    email: "meera.joshi@flipkart.com",
    jobsPosted: 8,
    candidatesScreened: 215,
    status: "Active" as const,
  },
  {
    id: 3,
    name: "Arjun Nair",
    company: "Infosys",
    email: "arjun.nair@infosys.com",
    jobsPosted: 5,
    candidatesScreened: 128,
    status: "Suspended" as const,
  },
  {
    id: 4,
    name: "Divya Kapoor",
    company: "Razorpay",
    email: "divya.kapoor@razorpay.com",
    jobsPosted: 19,
    candidatesScreened: 487,
    status: "Active" as const,
  },
];

const recentActivity = [
  {
    id: 1,
    icon: UserPlus,
    text: "New seeker signup: Neha Kulkarni registered",
    time: "2 minutes ago",
  },
  {
    id: 2,
    icon: Upload,
    text: "Resume uploaded by Karan Patel",
    time: "8 minutes ago",
  },
  {
    id: 3,
    icon: ScanLine,
    text: "Screening completed for SDE role at Google India",
    time: "15 minutes ago",
  },
  {
    id: 4,
    icon: UserPlus,
    text: "New recruiter signup: Tanvi Shah from Swiggy",
    time: "32 minutes ago",
  },
  {
    id: 5,
    icon: Upload,
    text: "Bulk upload: 24 resumes processed for Flipkart",
    time: "1 hour ago",
  },
];

const roleOptions = ["All", "SDE", "Data Science", "Marketing", "PM"];

// ─── Component ───────────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "seekers" | "recruiters" | "analytics"
  >("seekers");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filteredSeekers = seekersData.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredRecruiters = recruitersData.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: "Active" | "Suspended" }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "Active"
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-rose-500/20 text-rose-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-400" : "bg-rose-400"
        }`}
      />
      {status}
    </span>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-1">
      <button
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-500/20 hover:text-indigo-400"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-500/20 hover:text-amber-400"
        title="Suspend"
      >
        <Ban className="h-4 w-4" />
      </button>
      <button
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // ── Stats Cards ────────────────────────────────────────────────────────────

  const stats = [
    {
      label: "Total Seekers",
      value: "2,847",
      icon: Users,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Total Recruiters",
      value: "156",
      icon: Briefcase,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Resumes Analyzed",
      value: "12,450",
      icon: FileText,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Active Job Postings",
      value: "89",
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  // ── Tab Definitions ────────────────────────────────────────────────────────

  const tabs = [
    { key: "seekers" as const, label: "Manage Job Seekers", icon: Users },
    {
      key: "recruiters" as const,
      label: "Manage Recruiters",
      icon: Briefcase,
    },
    { key: "analytics" as const, label: "Platform Analytics", icon: BarChart3 },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ── Header Banner ─────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/20 via-slate-900/80 to-slate-900/80 p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/30">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Control Panel
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage platform users, monitor activity, and oversee
                recruitment pipeline.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats Overview ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">
                  {stat.label}
                </p>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs Navigation ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery("");
                setRoleFilter("All");
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          {/* ────────────── Seekers Tab ────────────── */}
          {activeTab === "seekers" && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search seekers by name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-10 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role === "All" ? "All Roles" : role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role Preference</th>
                      <th className="px-4 py-3">Resume Score</th>
                      <th className="px-4 py-3">Badges</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredSeekers.map((seeker) => (
                      <tr
                        key={seeker.id}
                        className="transition-colors hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {seeker.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                          {seeker.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                            {seeker.role}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={`h-full rounded-full ${
                                  seeker.resumeScore >= 80
                                    ? "bg-emerald-500"
                                    : seeker.resumeScore >= 65
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{
                                  width: `${seeker.resumeScore}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">
                              {seeker.resumeScore}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex gap-1">
                            {seeker.badges.length > 0 ? (
                              seeker.badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-400"
                                >
                                  {badge}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-600">
                                —
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={seeker.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <ActionButtons />
                        </td>
                      </tr>
                    ))}
                    {filteredSeekers.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No seekers found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ────────────── Recruiters Tab ────────────── */}
          {activeTab === "recruiters" && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search recruiters by name, email, or company…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Jobs Posted</th>
                      <th className="px-4 py-3">Candidates Screened</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredRecruiters.map((recruiter) => (
                      <tr
                        key={recruiter.id}
                        className="transition-colors hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {recruiter.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                            {recruiter.company}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                          {recruiter.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {recruiter.jobsPosted}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {recruiter.candidatesScreened}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={recruiter.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <ActionButtons />
                        </td>
                      </tr>
                    ))}
                    {filteredRecruiters.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No recruiters found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ────────────── Analytics Tab ────────────── */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Average Resume Score",
                    value: "78 / 100",
                    icon: FileText,
                    color: "text-sky-400",
                    bg: "bg-sky-500/10",
                  },
                  {
                    label: "Most Popular Role",
                    value: "SDE (62%)",
                    icon: TrendingUp,
                    color: "text-violet-400",
                    bg: "bg-violet-500/10",
                  },
                  {
                    label: "JD Match Rate",
                    value: "74%",
                    icon: Activity,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                  {
                    label: "Active Users Today",
                    value: "342",
                    icon: Users,
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-400">
                        {metric.label}
                      </p>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.bg}`}
                      >
                        <metric.icon
                          className={`h-4 w-4 ${metric.color}`}
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-2xl font-bold">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity Log */}
              <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold">
                    Recent Activity
                  </h3>
                </div>
                <ul className="space-y-4">
                  {recentActivity.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-700/40 bg-slate-900/60 p-3.5 transition-colors hover:border-slate-700"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
                        <item.icon className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200">
                          {item.text}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
