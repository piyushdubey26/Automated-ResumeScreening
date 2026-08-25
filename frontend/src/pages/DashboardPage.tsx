import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sampleResumesText, sampleJDsText, resumeApi, jobApi } from '../services/api';
import { FileUpload } from '../components/upload/FileUpload';
import { canAccessFeature } from '../utils/permissions';
import UpgradeGate from '../components/auth/UpgradeGate';
import type {
  ResumeRecord,
  JDMatchResult,
  RewriteResult,
  InterviewQuestion
} from '../types';
import {
  FileText,
  FileCheck2,
  Sparkles,
  Zap,
  Award,
  BookOpen,
  HelpCircle,
  Check,
  AlertTriangle,
  CheckCircle2,
  Info,
  LayoutDashboard,
  Briefcase,
  User,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  desc: string;
  time: string;
}

interface UserApplication {
  id: string;
  role: string;
  company: string;
  status: 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';
  date: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Storage Keys scoped per authenticated user ID
  const KEY_RESUME = `resumeai_user_resume_${userId}`;
  const KEY_RESUME_TEXT = `resumeai_user_resumetext_${userId}`;
  const KEY_JDMATCH = `resumeai_user_jdmatch_${userId}`;
  const KEY_APPS = `resumeai_user_apps_${userId}`;
  const KEY_ACTIVITY = `resumeai_user_activity_${userId}`;
  const KEY_INTERVIEW_SCORE = `resumeai_user_interview_score_${userId}`;
  const KEY_LINKS = `resumeai_user_links_${userId}`;

  const navigate = useNavigate();
  const location = useLocation();

  // Seeker Dashboard Navigation
  const [activeNav, setActiveNav] = useState<
    | 'Dashboard'
    | 'Resume Review'
    | 'Job Matches'
    | 'AI Bullet Rewriter'
    | 'Portfolio & Learning'
    | 'AI Mock Interview'
    | 'Applications'
    | 'Leaderboard & Badges'
    | 'Profile'
  >('Dashboard');

  // Synchronize activeNav from URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/resume-review')) setActiveNav('Resume Review');
    else if (path.endsWith('/job-matches')) setActiveNav('Job Matches');
    else if (path.endsWith('/bullet-rewriter')) setActiveNav('AI Bullet Rewriter');
    else if (path.endsWith('/portfolio')) setActiveNav('Portfolio & Learning');
    else if (path.endsWith('/mock-interview')) setActiveNav('AI Mock Interview');
    else if (path.endsWith('/applications')) setActiveNav('Applications');
    else if (path.endsWith('/leaderboard')) setActiveNav('Leaderboard & Badges');
    else if (path.endsWith('/profile')) setActiveNav('Profile');
    else setActiveNav('Dashboard');
  }, [location.pathname]);

  // Route-based workspace switcher
  const handleNavigate = (nav: typeof activeNav) => {
    if (nav === 'Dashboard') navigate('/dashboard');
    else if (nav === 'Resume Review') navigate('/dashboard/resume-review');
    else if (nav === 'Job Matches') navigate('/dashboard/job-matches');
    else if (nav === 'AI Bullet Rewriter') navigate('/dashboard/bullet-rewriter');
    else if (nav === 'Portfolio & Learning') navigate('/dashboard/portfolio');
    else if (nav === 'AI Mock Interview') navigate('/dashboard/mock-interview');
    else if (nav === 'Applications') navigate('/dashboard/applications');
    else if (nav === 'Leaderboard & Badges') navigate('/dashboard/leaderboard');
    else if (nav === 'Profile') navigate('/dashboard/profile');
  };

  // Clear any legacy un-scoped global demo data keys on mount
  useEffect(() => {
    localStorage.removeItem('resumeRecord');
    localStorage.removeItem('jdMatchResult');
    localStorage.removeItem('userStats');
  }, []);

  // 1. Resume Record (scoped)
  const [resumeRecord, setResumeRecord] = useState<ResumeRecord | null>(() => {
    const saved = localStorage.getItem(KEY_RESUME);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  // 2. Resume Text Input (scoped)
  const [resumeInput, setResumeInput] = useState<string>(() => {
    return localStorage.getItem(KEY_RESUME_TEXT) || '';
  });

  // 3. JD Match Result (scoped)
  const [jdMatchResult, setJdMatchResult] = useState<JDMatchResult | null>(() => {
    const saved = localStorage.getItem(KEY_JDMATCH);
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  // 4. Tracked Job Applications (scoped)
  const [applications, setApplications] = useState<UserApplication[]>(() => {
    const saved = localStorage.getItem(KEY_APPS);
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  // 5. Recent Activity Logs (scoped)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem(KEY_ACTIVITY);
    if (!saved) return [];
    try { return JSON.parse(saved); } catch { return []; }
  });

  // 6. Interview Score (scoped)
  const [interviewScore, setInterviewScore] = useState<number | null>(() => {
    const saved = localStorage.getItem(KEY_INTERVIEW_SCORE);
    if (!saved) return null;
    const parsed = Number(saved);
    return isNaN(parsed) ? null : parsed;
  });

  // 7. Profile Links (scoped)
  const [profileLinks, setProfileLinks] = useState(() => {
    const saved = localStorage.getItem(KEY_LINKS);
    if (!saved) return { github: '', linkedin: '', project: '', coding: '' };
    try { return JSON.parse(saved); } catch { return { github: '', linkedin: '', project: '', coding: '' }; }
  });

  // Target role preference
  const [targetRole, setTargetRole] = useState<'sde' | 'data-science' | 'marketing' | 'product-management'>(
    user?.rolePreference as any || 'sde'
  );

  // Tab 1 UI controls
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'high' | 'medium' | 'success'>('all');

  // Tab 2 State: JD Matching
  const [jdInput, setJdInput] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  // Tab 3 State: AI Bullet Rewriter
  const [bulletInput, setBulletInput] = useState('');
  const [focusMode, setFocusMode] = useState<'quantify' | 'action' | 'concise' | 'role-aligned'>('quantify');
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  // Tab 5 State: AI Mock Interview
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);

  // AI Assistant Chat State
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Applications Form State
  const [newAppRole, setNewAppRole] = useState('');
  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppStatus, setNewAppStatus] = useState<'Applied' | 'Interviewing' | 'Offered' | 'Rejected'>('Applied');
  const [showAddAppForm, setShowAddAppForm] = useState(false);

  // Helper to log user activity
  const addActivityLog = (action: string, desc: string) => {
    const newLog: ActivityItem = {
      id: `act-${Date.now()}`,
      action,
      desc,
      time: 'Just now'
    };
    const updated = [newLog, ...recentActivity.slice(0, 9)];
    setRecentActivity(updated);
    localStorage.setItem(KEY_ACTIVITY, JSON.stringify(updated));
  };

  // Helper to construct full resume with links
  const resumeWithLinks = () => {
    const links = [
      profileLinks.github && `GitHub: ${profileLinks.github}`,
      profileLinks.linkedin && `LinkedIn: ${profileLinks.linkedin}`,
      profileLinks.project && `Project / Portfolio: ${profileLinks.project}`,
      profileLinks.coding && `Coding profile: ${profileLinks.coding}`,
    ].filter(Boolean).join('\n');
    return links ? `${resumeInput}\n\nPROFESSIONAL LINKS\n${links}` : resumeInput;
  };

  // Save profile links on change
  const handleUpdateLinks = (key: keyof typeof profileLinks, val: string) => {
    const updated = { ...profileLinks, [key]: val };
    setProfileLinks(updated);
    localStorage.setItem(KEY_LINKS, JSON.stringify(updated));
  };

  // Handle Load Sample Resume or Rubric Switch
  const handleLoadSampleResume = (role: 'sde' | 'ds' | 'marketing') => {
    const selected = role === 'ds' ? 'data-science' : role;
    setTargetRole(selected);
    
    // Only load sample text if the user does NOT currently have their own uploaded/pasted resume
    if (!resumeInput.trim()) {
      const text = sampleResumesText[role];
      setResumeInput(text);
      localStorage.setItem(KEY_RESUME_TEXT, text);
    }
  };

  // Run JD Matching
  const handleRunJDMatch = async () => {
    if (!resumeInput.trim() && !sampleResumesText.sde) return;
    setIsMatching(true);
    try {
      const textToUse = resumeWithLinks() || sampleResumesText.sde;
      const res = await jobApi.matchJD(textToUse, jdInput || sampleJDsText.sde, targetRole);
      setJdMatchResult(res);
      localStorage.setItem(KEY_JDMATCH, JSON.stringify(res));
      addActivityLog('✓ Job Matched', `Scored ${res.matchPct}% against ${targetRole.toUpperCase()} Job Description.`);
    } finally {
      setIsMatching(false);
    }
  };

  // Run Full Resume & JD Comparison
  const handleRunComparison = async () => {
    if (!resumeInput.trim()) return;
    setIsAnalyzing(true);
    setIsMatching(true);
    try {
      const textToUse = resumeWithLinks();
      const jdToUse = jdInput || sampleJDsText.sde;
      const [resume, match] = await Promise.all([
        resumeApi.uploadAndParse(textToUse, 'My_Resume.pdf', targetRole),
        jobApi.matchJD(textToUse, jdToUse, targetRole)
      ]);
      
      setResumeRecord(resume.resume);
      localStorage.setItem(KEY_RESUME, JSON.stringify(resume.resume));
      localStorage.setItem(KEY_RESUME_TEXT, resumeInput);

      setJdMatchResult(match);
      localStorage.setItem(KEY_JDMATCH, JSON.stringify(match));

      addActivityLog('✓ Resume & JD Analyzed', `Score: ${resume.resume.score}/100 · Match: ${match.matchPct}%`);
    } finally {
      setIsAnalyzing(false);
      setIsMatching(false);
    }
  };

  // Run AI Bullet Rewrite
  const handleRunRewrite = async () => {
    if (!bulletInput.trim()) return;
    setIsRewriting(true);
    try {
      const res = await resumeApi.rewriteBullet(bulletInput, focusMode, targetRole);
      setRewriteResult(res);
      addActivityLog('✓ Bullet Point Rewritten', `Enhanced using ${focusMode} focus mode.`);
    } finally {
      setIsRewriting(false);
    }
  };

  // Generate AI Mock Interview
  const handleGenerateInterview = async () => {
    setIsLoadingInterview(true);
    try {
      const textToUse = resumeWithLinks() || sampleResumesText.sde;
      const jdToUse = jdInput || sampleJDsText.sde;
      const res = await resumeApi.generateMockInterview(targetRole, textToUse, jdToUse);
      setInterviewQuestions(res.questions);
      setInterviewScore(85);
      localStorage.setItem(KEY_INTERVIEW_SCORE, '85');
      addActivityLog('✓ Mock Interview Generated', `Generated ${res.questions.length} questions for ${targetRole.toUpperCase()}.`);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // Add Application
  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppRole.trim() || !newAppCompany.trim()) return;

    const newApp: UserApplication = {
      id: `app-${Date.now()}`,
      role: newAppRole.trim(),
      company: newAppCompany.trim(),
      status: newAppStatus,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [newApp, ...applications];
    setApplications(updated);
    localStorage.setItem(KEY_APPS, JSON.stringify(updated));

    setNewAppRole('');
    setNewAppCompany('');
    setShowAddAppForm(false);
    addActivityLog(`✓ Applied to ${newApp.role}`, `${newApp.company} · ${newApp.status}`);
  };

  // Delete Application
  const handleDeleteApplication = (id: string) => {
    const updated = applications.filter(a => a.id !== id);
    setApplications(updated);
    localStorage.setItem(KEY_APPS, JSON.stringify(updated));
  };

  // AI Career Assistant Query Handler
  const handleSendAssistantQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');

    setTimeout(() => {
      let reply = "I'm your AI career assistant. Try asking how to optimize your resume or prepare for interviews!";
      const lowQuery = userQuery.toLowerCase();
      if (lowQuery.includes('job') || lowQuery.includes('apply')) {
        reply = jdMatchResult 
          ? `Your current JD match percentage is ${jdMatchResult.matchPct}%. You have ${jdMatchResult.matchedKeywords.length} matching skills.` 
          : "You haven't compared a job description yet. Paste a job description under the Job Matches tab to see your match score!";
      } else if (lowQuery.includes('weak') || lowQuery.includes('skill') || lowQuery.includes('improve')) {
        reply = resumeRecord 
          ? `Your resume currently scores ${resumeRecord.score}/100. Check the Actionable Feedback Cards in the Resume Review tab for high-priority fixes.`
          : "Upload and analyze your resume first under the Resume Review tab to discover your skill gaps!";
      } else if (lowQuery.includes('score')) {
        reply = resumeRecord 
          ? `Your current resume score is ${resumeRecord.score}/100. Target role: ${targetRole.toUpperCase()}.`
          : "Your resume has not been analyzed yet. Upload your resume in the Resume Review tab to calculate your score!";
      }
      setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 400);
  };

  const handleTriggerSuggestedPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  // Filter feedback cards
  const filteredFeedback = resumeRecord?.feedback.filter(fb => {
    if (feedbackFilter === 'all') return true;
    return fb.severity === feedbackFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-full lg:w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Career Command Center</p>
              <h2 className="font-serif text-lg text-white font-semibold">Seeker Workspace</h2>
            </div>

            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none border-b border-slate-900 lg:border-none">
              {[
                { name: "Dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
                { name: "Resume Review", label: "Resume Review", icon: FileText, feature: 'resume.basicReview' },
                { name: "Job Matches", label: "Job Matches", icon: Briefcase, feature: 'resume.jdMatch' },
                { name: "AI Bullet Rewriter", label: "AI Bullet Rewriter", icon: Zap, feature: 'ai.bulletRewriter' },
                { name: "Portfolio & Learning", label: "Portfolio & Learning", icon: BookOpen, feature: 'portfolio.analysis' },
                { name: "AI Mock Interview", label: "AI Mock Interview", icon: HelpCircle, feature: 'ai.mockInterview' },
                { name: "Applications", label: "Applications", icon: FileCheck2, feature: null },
                { name: "Leaderboard & Badges", label: "Leaderboard & Badges", icon: Award, feature: null },
                { name: "Profile", label: "Profile", icon: User, feature: null }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigate(item.name as any)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#a84c38]/20 text-[#a84c38] border border-[#a84c38]/20 shadow-md shadow-[#a84c38]/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 min-w-0 flex flex-col space-y-6">
          
          {/* SEEKER WELCOME HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <p className="text-xs font-bold text-[#a84c38] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SEEKER CONTROL CENTER
              </p>
              <h1 className="font-serif text-3xl font-bold text-white mt-1">
                Welcome back, {user?.name || 'Job Seeker'} 👋
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your career progress at a glance. Improve your resume, discover better matches, and prepare for your next interview.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs shrink-0">
              <div className="text-center px-3 border-r border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Monthly Usage</span>
                <span className="font-extrabold text-white text-xs">
                  {(user?.plan === 'pro' || user?.plan === 'career-max') && (user?.subscriptionStatus === 'approved' || user?.subscriptionStatus === 'active')
                    ? 'Unlimited'
                    : `${user?.usage?.['resume_reviews'] || 0} / 5 Used`}
                </span>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">XP Points</span>
                <span className="font-extrabold text-[#a84c38] text-sm">{user?.points ? `${user.points} XP` : '0 XP'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`px-2 py-1 rounded border text-[10px] font-bold ${
                  (user?.plan === 'career-max') && (user?.subscriptionStatus === 'approved' || user?.subscriptionStatus === 'active')
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : (user?.plan === 'pro') && (user?.subscriptionStatus === 'approved' || user?.subscriptionStatus === 'active')
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : user?.subscriptionStatus === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#a84c38]/10 text-[#a84c38] border-[#a84c38]/20'
                }`}>
                  {(user?.plan === 'career-max') && (user?.subscriptionStatus === 'approved' || user?.subscriptionStatus === 'active')
                    ? 'Career Max'
                    : (user?.plan === 'pro') && (user?.subscriptionStatus === 'approved' || user?.subscriptionStatus === 'active')
                    ? 'Job Seeker Pro'
                    : user?.subscriptionStatus === 'pending'
                    ? 'Approval Pending'
                    : 'Free Seeker'}
                </span>
              </div>
            </div>
          </div>

          {/* HORIZONTAL FEATURE TABS NAVIGATION */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 border-b border-slate-900 scrollbar-none">
            {[
              { name: "Dashboard", label: "Dashboard" },
              { name: "Resume Review", label: "Resume Review" },
              { name: "Job Matches", label: "Job Matches" },
              { name: "AI Bullet Rewriter", label: "AI Bullet Rewriter" },
              { name: "Portfolio & Learning", label: "Portfolio & Learning" },
              { name: "AI Mock Interview", label: "AI Mock Interview" },
              { name: "Applications", label: "Applications" },
              { name: "Leaderboard & Badges", label: "Leaderboard & Badges" },
              { name: "Profile", label: "Profile" }
            ].map(tab => {
              const isActive = activeNav === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => handleNavigate(tab.name as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? "bg-[#a84c38] text-white border-[#a84c38] shadow-md shadow-[#a84c38]/15 font-extrabold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeNav === 'Dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "RESUME SCORE",
                    val: resumeRecord ? `${resumeRecord.score} / 100` : "— / 100",
                    change: resumeRecord ? "Score Calculated" : "Not score calculated",
                    col: resumeRecord ? "text-emerald-400" : "text-slate-500",
                    desc: resumeRecord ? `Based on ${targetRole.toUpperCase()} rubric` : "Upload resume to score",
                    onClick: () => handleNavigate("Resume Review")
                  },
                  {
                    label: "JOB MATCHES",
                    val: jdMatchResult ? "1" : "0",
                    change: jdMatchResult ? `Top match: ${jdMatchResult.matchPct}%` : "No matches yet",
                    col: jdMatchResult ? "text-purple-400" : "text-slate-500",
                    desc: jdMatchResult ? "Based on target JD" : "Compare against a JD",
                    onClick: () => handleNavigate("Job Matches")
                  },
                  {
                    label: "APPLICATIONS",
                    val: `${applications.length}`,
                    change: applications.length > 0 ? `${applications.filter(a => a.status === 'Interviewing' || a.status === 'Applied').length} active` : "No applications yet",
                    col: applications.length > 0 ? "text-[#a84c38]" : "text-slate-500",
                    desc: applications.length > 0 ? "Tracked in workspace" : "Add job applications",
                    onClick: () => handleNavigate("Applications")
                  },
                  {
                    label: "INTERVIEW READY",
                    val: interviewScore !== null ? `${interviewScore}%` : "—",
                    change: interviewScore !== null ? "Mock rating" : "Not practiced yet",
                    col: interviewScore !== null ? "text-indigo-400" : "text-slate-500",
                    desc: interviewScore !== null ? "Based on AI interview" : "Complete a mock interview",
                    onClick: () => handleNavigate("AI Mock Interview")
                  }
                ].map(stat => (
                  <div
                    key={stat.label}
                    onClick={stat.onClick}
                    className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute right-0 bottom-0 w-8 h-8 bg-white/2 rounded-full filter blur-md"></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                    <div className="text-2xl font-extrabold mt-2 text-white">{stat.val}</div>
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-900">
                      <span className={`text-[10px] font-bold ${stat.col}`}>{stat.change}</span>
                      <span className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">{stat.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* YOUR CAREER TOOLS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Career Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Resume Review",
                      desc: resumeRecord ? `Your resume currently scores ${resumeRecord.score}/100.` : "Upload your resume to get your personalized score & feedback.",
                      cta: resumeRecord ? "Review Score →" : "Upload & Score Resume →",
                      tab: "Resume Review"
                    },
                    {
                      title: "Job Match",
                      desc: jdMatchResult ? `Match result: ${jdMatchResult.matchPct}% keyword overlap.` : "Compare your resume against any target job description.",
                      cta: "Match JD →",
                      tab: "Job Matches"
                    },
                    {
                      title: "AI Bullet Rewriter",
                      desc: "Turn weak resume bullets into impact-focused statements instantly.",
                      cta: "Rewrite Bullets →",
                      tab: "AI Bullet Rewriter"
                    },
                    {
                      title: "AI Mock Interview",
                      desc: interviewScore !== null ? `Latest practice score: ${interviewScore}%.` : "Practice real-time technical questions tailored to your target role.",
                      cta: "Start Practice →",
                      tab: "AI Mock Interview"
                    }
                  ].map(tool => (
                    <div key={tool.title} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-[#a84c38]/30 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#a84c38] transition-colors">{tool.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{tool.desc}</p>
                      </div>
                      <button
                        onClick={() => handleNavigate(tool.tab as any)}
                        className="text-left text-xs font-bold text-[#a84c38] hover:text-[#c45a44] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        {tool.cta}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-Column Middle Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Resume Health */}
                <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resume Health</h3>
                      <span className="text-xl font-extrabold text-[#a84c38]">
                        {resumeRecord ? `${resumeRecord.score}%` : '—'}
                      </span>
                    </div>

                    {resumeRecord ? (
                      <div className="space-y-3.5">
                        {[
                          { label: "Structure & Contact", val: resumeRecord.scoreBreakdown.structure },
                          { label: "Clarity & Verbs", val: resumeRecord.scoreBreakdown.clarity },
                          { label: "Impact & Metrics", val: resumeRecord.scoreBreakdown.impact },
                          { label: "Role Hard Skills", val: resumeRecord.scoreBreakdown.skills },
                          { label: "Projects & Links", val: resumeRecord.scoreBreakdown.projects },
                          { label: "ATS Readability", val: resumeRecord.scoreBreakdown.ats }
                        ].map(bar => (
                          <div key={bar.label} className="text-xs space-y-1.5">
                            <div className="flex justify-between text-slate-400">
                              <span>{bar.label}</span>
                              <span className="font-semibold text-slate-200">{bar.val}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[#a84c38] h-full" style={{ width: `${bar.val}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                        <Upload className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-300">Upload your resume to get your personalized score.</p>
                        <p className="text-[11px] text-slate-500">Score breakdown will analyze structure, metrics, ATS readability, and hard skills.</p>
                        <button
                          onClick={() => handleNavigate("Resume Review")}
                          className="px-4 py-2 bg-[#a84c38] hover:bg-[#8f3f2d] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Resume</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {resumeRecord && (
                    <button
                      onClick={() => handleNavigate("Resume Review")}
                      className="w-full mt-6 py-2.5 bg-slate-950 border border-slate-800 hover:border-[#a84c38]/40 hover:bg-slate-900/60 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>Improve Resume →</span>
                    </button>
                  )}
                </div>

                {/* Career Progress / Gamification */}
                <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Career Progress</h3>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        {user?.badges && user.badges.length > 0 ? user.badges[0] : 'Beginner Seeker'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Next Tier: <strong className="text-white">Resume Strategist</strong></span>
                          <span>{user?.points || 0} / 1,000 XP</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden border border-slate-800 flex items-center p-0.5">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-[#a84c38] h-full rounded-sm transition-all"
                            style={{ width: `${Math.min(100, ((user?.points || 0) / 1000) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1.5">
                          {Math.max(0, 1000 - (user?.points || 0))} XP remaining for promotion.
                        </span>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">Key Achievements</span>
                        {user?.badges && user.badges.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {user.badges.map(b => (
                              <div key={b} className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center space-x-2">
                                <span className="text-sm">🏆</span>
                                <span className="text-slate-200 font-bold">{b}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                            None unlocked yet. Complete resume reviews and interview practice to earn XP and badges!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigate("Leaderboard & Badges")}
                    className="w-full mt-6 py-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/60 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>View Leaderboard →</span>
                  </button>
                </div>
              </div>

              {/* RECENT ACTIVITY */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-3">Recent Activity</h3>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3.5">
                    {recentActivity.map((act) => (
                      <div key={act.id} className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-white block">{act.action}</span>
                          <span className="text-slate-400 text-[11px] mt-0.5 block">{act.desc}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{act.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No activity yet. Upload a resume, compare a job description, or submit an application to see updates here.
                  </div>
                )}
              </div>

              {/* AI CAREER ASSISTANT */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-6 space-y-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#a84c38]/5 rounded-full filter blur-3xl"></div>
                <div className="flex items-center space-x-1.5 border-b border-slate-900 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">✦ AI Career Assistant</h3>
                </div>
                <p className="text-[11px] text-slate-400">Ask ResumeAI what to improve, where to apply, or how to prepare.</p>
                
                {chatHistory.length > 0 && (
                  <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs max-h-48 overflow-y-auto scrollbar-thin">
                    {chatHistory.map((chat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-500 font-bold">
                          <span>{chat.sender === "user" ? "You" : "ResumeAI"}</span>
                        </div>
                        <p className={`p-2.5 rounded-xl leading-relaxed text-slate-200 ${
                          chat.sender === "user" ? "bg-slate-900/80 text-[#a84c38] font-semibold" : "bg-[#a84c38]/10 text-slate-300"
                        }`}>{chat.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendAssistantQuery} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask ResumeAI anything about your career..."
                    className="flex-1 text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-[#a84c38]"
                  />
                  <button type="submit" className="px-4 py-2.5 bg-[#a84c38] hover:bg-[#8f3f2d] font-bold text-xs text-white rounded-xl transition-all cursor-pointer">
                    Ask
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[10px] text-slate-500 font-medium">Suggested Prompts:</span>
                  {[
                    "How can I improve my resume score?",
                    "What skills are missing for SDE roles?",
                    "Prepare me for a technical interview"
                  ].map(prompt => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => handleTriggerSuggestedPrompt(prompt)}
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:border-[#a84c38]/30 transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESUME REVIEW PAGE */}
          {activeNav === 'Resume Review' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn">
              
              {/* Left Column: Input & Controls */}
              <div className="lg:col-span-1 bg-slate-900/50 border border-slate-900 p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Target Rubric & Text</h3>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleLoadSampleResume('sde')}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                        targetRole === 'sde'
                          ? 'bg-[#a84c38] text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      SDE Rubric
                    </button>
                    <button
                      onClick={() => handleLoadSampleResume('ds')}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                        targetRole === 'data-science'
                          ? 'bg-[#a84c38] text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      DS Rubric
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Role Rubric</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="sde">Software Development Engineer (SDE)</option>
                    <option value="data-science">Data Scientist / ML Engineer</option>
                    <option value="marketing">Growth & Digital Marketer</option>
                    <option value="product-management">Product Manager (PM)</option>
                  </select>
                </div>

                {/* File Upload Zone */}
                <FileUpload
                  onTextExtracted={(text) => {
                    setResumeInput(text);
                    localStorage.setItem(KEY_RESUME_TEXT, text);
                  }}
                  label="Upload Resume (PDF / JPG / PNG)"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  helpText="Drag & drop or click — PDF, JPG, PNG, TXT (max 10MB)"
                />

                <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                  <div className="flex-1 h-px bg-slate-800"></div>
                  <span className="font-bold uppercase tracking-wider">or paste text manually</span>
                  <div className="flex-1 h-px bg-slate-800"></div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Resume Document Text</label>
                  <textarea
                    value={resumeInput}
                    onChange={(e) => {
                      setResumeInput(e.target.value);
                      localStorage.setItem(KEY_RESUME_TEXT, e.target.value);
                    }}
                    rows={8}
                    placeholder="Paste your resume text here..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300">Links & profiles</label>
                      <p className="mt-1 text-[11px] text-slate-500">Add public profiles so the review can check your project footprint.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {([
                      ['github', 'GitHub profile', 'https://github.com/you'],
                      ['linkedin', 'LinkedIn profile', 'https://linkedin.com/in/you'],
                      ['project', 'Project / portfolio link', 'https://yourproject.com'],
                      ['coding', 'Coding platform', 'LeetCode, Kaggle, HackerRank…'],
                    ] as const).map(([key, label, placeholder]) => (
                      <label key={key} className="block">
                        <span className="mb-1 block text-[10px] font-semibold text-slate-400">{label}</span>
                        <input
                          type={key === 'coding' ? 'text' : 'url'}
                          value={profileLinks[key]}
                          onChange={(event) => handleUpdateLinks(key, event.target.value)}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-200 outline-none transition focus:border-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunComparison}
                  disabled={isAnalyzing || isMatching || !resumeInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-[#a84c38] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#a84c38]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <span>Parsing & Evaluating...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Analyze & Score Resume</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Score Breakdown & Feedback Cards */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Score Summary Card */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center md:border-r md:border-slate-800 pr-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Role Score</span>
                    <div className="mt-2 text-5xl font-extrabold text-white">
                      {resumeRecord ? resumeRecord.score : '—'} <span className="text-xs font-normal text-slate-500">/ 100</span>
                    </div>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      {resumeRecord ? `${resumeRecord.targetRole.replace('-', ' ')} Rubric` : 'Upload Resume'}
                    </span>
                  </div>

                  {/* Sub-score Pillars */}
                  <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Structure & Contact</span>
                      <span className="text-sm font-bold text-white mt-1 block">{resumeRecord ? `${resumeRecord.scoreBreakdown.structure}%` : '—'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Clarity & Verbs</span>
                      <span className="text-sm font-bold text-white mt-1 block">{resumeRecord ? `${resumeRecord.scoreBreakdown.clarity}%` : '—'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Impact & Metrics</span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block">{resumeRecord ? `${resumeRecord.scoreBreakdown.impact}%` : '—'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Role Hard Skills</span>
                      <span className="text-sm font-bold text-amber-400 mt-1 block">{resumeRecord ? `${resumeRecord.scoreBreakdown.skills}%` : '—'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Projects & Links</span>
                      <span className="text-sm font-bold text-white mt-1 block">{resumeRecord ? `${resumeRecord.scoreBreakdown.projects}%` : '—'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">ATS Readability</span>
                      <span className="text-sm font-bold text-indigo-400 mt-1 block">{resumeRecord ? `${resumeRecord.scoreBreakdown.ats}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Actionable Feedback Cards */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-white text-base">Actionable Feedback Cards</h3>
                    <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button onClick={() => setFeedbackFilter('all')} className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${feedbackFilter === 'all' ? 'bg-[#a84c38] text-white' : 'text-slate-400'}`}>All</button>
                      <button onClick={() => setFeedbackFilter('high')} className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${feedbackFilter === 'high' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>High Priority</button>
                      <button onClick={() => setFeedbackFilter('medium')} className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${feedbackFilter === 'medium' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>Warnings</button>
                      <button onClick={() => setFeedbackFilter('success')} className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${feedbackFilter === 'success' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Strengths</button>
                    </div>
                  </div>

                  {filteredFeedback.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                      No feedback cards generated yet. Upload or paste your resume on the left and click "Analyze & Score Resume".
                    </div>
                  ) : (
                    filteredFeedback.map((fb, idx) => (
                      <div
                        key={fb.id || idx}
                        className={`p-5 rounded-2xl border transition-all ${
                          fb.severity === 'high'
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : fb.severity === 'medium'
                            ? 'bg-amber-950/20 border-amber-800/60'
                            : 'bg-emerald-950/20 border-emerald-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {fb.severity === 'high' ? (
                              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                            ) : fb.severity === 'medium' ? (
                              <Info className="w-5 h-5 text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            <h4 className="font-bold text-white text-sm">{fb.title}</h4>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {fb.category}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">{fb.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JOB MATCHES */}
          {activeNav === 'Job Matches' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              
              {/* Left Column: Job Description Input */}
              <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="font-bold text-white text-base">Paste Target Job Description</h3>
                <p className="text-xs text-slate-400">Enter the requirements for any job posting to calculate match percentage and missing skills.</p>
                
                {/* Real-time Resume Integration Status Card */}
                {resumeRecord ? (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active Workspace Resume
                      </span>
                      <button 
                        onClick={() => handleNavigate('Resume Review')}
                        className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Evaluated for <strong className="text-slate-200">{targetRole.toUpperCase()}</strong> with a personalized baseline score of <strong className="text-slate-200">{resumeRecord.score}/100</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        No Resume Uploaded
                      </span>
                      <button 
                        onClick={() => handleNavigate('Resume Review')}
                        className="px-2 py-0.5 rounded bg-amber-900/20 hover:bg-amber-900/30 border border-amber-500/20 text-[10px] text-amber-300 font-bold cursor-pointer"
                      >
                        Upload Resume
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      No resume uploaded yet in your workspace. We will use a standard sample resume for comparison.
                    </p>
                  </div>
                )}
                
                <FileUpload
                  onTextExtracted={(text) => setJdInput(text)}
                  label="Upload Job Description document"
                  accept="image/*,.pdf,.txt"
                  helpText="PDF, image, or TXT"
                />

                <textarea
                  value={jdInput}
                  onChange={(e) => setJdInput(e.target.value)}
                  rows={10}
                  placeholder="Paste Job Description text here..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={handleRunJDMatch}
                  disabled={isMatching}
                  className="w-full py-3 bg-gradient-to-r from-purple-650 to-indigo-650 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isMatching ? (
                    <span>Calculating Match...</span>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 text-purple-300" />
                      <span>Calculate JD Match % & Skill Gaps</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: JD Match Breakdown */}
              <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl space-y-6">
                {jdMatchResult ? (
                  <>
                    <div className="text-center p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Job Match Percentage</span>
                      <div className="text-5xl font-extrabold text-[#a84c38]">
                        {jdMatchResult.matchPct}%
                      </div>
                      <p className="text-xs text-slate-400">Keyword Overlap: <strong>{jdMatchResult.keywordScore}%</strong> | Semantic Similarity: <strong>{jdMatchResult.embeddingScore}%</strong></p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-emerald-400 mb-2 flex items-center space-x-1">
                          <Check className="w-4 h-4" />
                          <span>Matched Keywords ({jdMatchResult.matchedKeywords.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {jdMatchResult.matchedKeywords.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-rose-400 mb-2 flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Missing Core Skills ({jdMatchResult.missingCoreSkills.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {jdMatchResult.missingCoreSkills.map((kw, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-350 border border-rose-500/30 font-semibold">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <h4 className="font-bold text-white flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>Improvement Recommendations:</span>
                        </h4>
                        <div className="space-y-2">
                          {jdMatchResult.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start space-x-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="text-xs text-slate-300 leading-relaxed">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                    <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">No Job Match calculated yet.</p>
                    <p className="text-[11px] text-slate-500">Paste a job description on the left and click "Calculate JD Match %".</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AI BULLET REWRITER */}
          {activeNav === 'AI Bullet Rewriter' && (
            !canAccessFeature(user, 'ai.bulletRewriter').allowed ? (
              <UpgradeGate featureKey="ai.bulletRewriter" reason={canAccessFeature(user, 'ai.bulletRewriter').reason} />
            ) : (
              <div className="max-w-4xl mx-auto bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span>AI Resume Bullet Point Enhancer</span>
                  </h3>
                  <p className="text-xs text-slate-400">Input weak or passive bullet points to transform them into strong, quantified statements.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Original Bullet Point Text</label>
                    <textarea
                      value={bulletInput}
                      onChange={(e) => setBulletInput(e.target.value)}
                      rows={3}
                      placeholder="e.g. Responsible for developing microservices with Node.js and SQL."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Focus Mode Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Enhancement Focus Mode</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => setFocusMode('quantify')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          focusMode === 'quantify' ? 'bg-[#a84c38]/20 border-[#a84c38]/40 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="block text-amber-300 font-extrabold">1. Quantify Impact</span>
                        <span className="text-[10px] font-normal block mt-0.5">Embed metrics & ROI</span>
                      </button>

                      <button
                        onClick={() => setFocusMode('action')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          focusMode === 'action' ? 'bg-[#a84c38]/20 border-[#a84c38]/40 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="block text-indigo-350 font-extrabold">2. Action Verbs</span>
                        <span className="text-[10px] font-normal block mt-0.5">Architected, Scaled</span>
                      </button>

                      <button
                        onClick={() => setFocusMode('concise')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          focusMode === 'concise' ? 'bg-[#a84c38]/20 border-[#a84c38]/40 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="block text-emerald-350 font-extrabold">3. Trim Filler</span>
                        <span className="text-[10px] font-normal block mt-0.5">Crisp ATS phrasing</span>
                      </button>

                      <button
                        onClick={() => setFocusMode('role-aligned')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          focusMode === 'role-aligned' ? 'bg-[#a84c38]/20 border-[#a84c38]/40 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="block text-purple-350 font-extrabold">4. Role Alignment</span>
                        <span className="text-[10px] font-normal block mt-0.5">Target {targetRole.toUpperCase()}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleRunRewrite}
                    disabled={isRewriting || !bulletInput.trim()}
                    className="w-full py-3 bg-[#a84c38] hover:bg-[#8f3f2d] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                  >
                    {isRewriting ? 'Generating Enhancements...' : 'Rewrite Bullet Point'}
                  </button>
                </div>

                {rewriteResult && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <h4 className="font-bold text-white text-sm">Enhanced Bullet Statement:</h4>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-semibold leading-relaxed">
                      {rewriteResult.improvedBullet}
                    </div>
                    {rewriteResult.explanation && (
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Why this works:</strong> {rewriteResult.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB 5: PORTFOLIO & LEARNING */}
          {activeNav === 'Portfolio & Learning' && (
            !canAccessFeature(user, 'portfolio.analysis').allowed ? (
              <UpgradeGate featureKey="portfolio.analysis" reason={canAccessFeature(user, 'portfolio.analysis').reason} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fadeIn">
                <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <span>Public Portfolio Signals</span>
                  </h3>
                  <p className="text-xs text-slate-400">Validate code repositories and public activity strength.</p>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">GitHub Profile</span>
                      <span className="text-white font-bold">{profileLinks.github ? 'Connected' : 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">LinkedIn Profile</span>
                      <span className="text-white font-bold">{profileLinks.linkedin ? 'Connected' : 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Portfolio Rating</span>
                      <span className="text-emerald-400 font-bold">{resumeRecord ? `${resumeRecord.scoreBreakdown.projects} / 100` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-white text-base">Curated Learning Paths</h3>
                  <p className="text-xs text-slate-400">Targeted course recommendations to fill identified skill gaps.</p>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-white font-bold">
                        <span>GraphQL & Microservices Architecture</span>
                        <span className="text-indigo-400">6 Hours</span>
                      </div>
                      <p className="text-slate-500 text-[10px]">Educative.io / Coursera</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-white font-bold">
                        <span>Kubernetes Deployment & DevOps Pipelines</span>
                        <span className="text-indigo-400">10 Hours</span>
                      </div>
                      <p className="text-slate-500 text-[10px]">Udemy / LinkedIn Learning</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 6: AI MOCK INTERVIEW */}
          {activeNav === 'AI Mock Interview' && (
            !canAccessFeature(user, 'ai.mockInterview').allowed ? (
              <UpgradeGate featureKey="ai.mockInterview" reason={canAccessFeature(user, 'ai.mockInterview').reason} />
            ) : (
              <div className="bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <HelpCircle className="w-5 h-5 text-pink-400" />
                      <span>AI Mock Interview Generator</span>
                    </h3>
                    <p className="text-xs text-slate-400">Generates custom technical & behavioral questions tailored to target roles.</p>
                  </div>

                  <button
                    onClick={handleGenerateInterview}
                    disabled={isLoadingInterview}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-[#a84c38] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    {isLoadingInterview ? 'Generating Questions...' : 'Generate New Questions'}
                  </button>
                </div>

                <div className="space-y-4">
                  {interviewQuestions.length > 0 ? (
                    interviewQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {q.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {q.difficulty}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm">{q.question}</h4>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                          <span className="text-slate-400 font-bold block">Key Points to Cover in Answer:</span>
                          <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                            {q.keyPointsToCover.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">No mock interview generated yet.</p>
                      <p className="text-[11px] text-slate-500">Click "Generate New Questions" above to practice tailored questions for {targetRole.toUpperCase()}.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* TAB 7: APPLICATIONS TRACKER */}
          {activeNav === 'Applications' && (
            <div className="bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-xl font-serif font-bold text-white">Job Applications Tracker</h3>
                <button
                  onClick={() => setShowAddAppForm(!showAddAppForm)}
                  className="px-3.5 py-2 bg-[#a84c38] hover:bg-[#8f3f2d] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddAppForm ? 'Cancel' : 'Track New Application'}</span>
                </button>
              </div>

              {showAddAppForm && (
                <form onSubmit={handleAddApplication} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                  <h4 className="font-bold text-white">Add Application Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Job Title</label>
                      <input
                        type="text"
                        required
                        value={newAppRole}
                        onChange={e => setNewAppRole(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-[#a84c38]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Company Name</label>
                      <input
                        type="text"
                        required
                        value={newAppCompany}
                        onChange={e => setNewAppCompany(e.target.value)}
                        placeholder="e.g. TechCorp"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-[#a84c38]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Application Status</label>
                      <select
                        value={newAppStatus}
                        onChange={e => setNewAppStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-[#a84c38]"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs rounded-lg cursor-pointer">
                    Save Application
                  </button>
                </form>
              )}

              {applications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3">Job Role</th>
                        <th className="py-3">Company</th>
                        <th className="py-3">Status</th>
                        <th className="py-3">Applied Date</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td className="py-3.5 font-bold text-white">{app.role}</td>
                          <td className="py-3.5 text-slate-400">{app.company}</td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              app.status === 'Offered'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : app.status === 'Interviewing'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : app.status === 'Rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500">{app.date}</td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteApplication(app.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                  <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No applications tracked yet.</p>
                  <p className="text-[11px] text-slate-500">Click "Track New Application" above to add your submitted job applications.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: LEADERBOARD & BADGES */}
          {activeNav === 'Leaderboard & Badges' && (
            <div className="bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
              <h3 className="text-xl font-serif font-bold text-white border-b border-slate-800 pb-4">Achievements & Badges</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: "ATS Ninja", desc: "Achieve a resume ATS score over 85%", earned: user?.badges?.includes("ATS Ninja") },
                  { name: "Metric Machine", desc: "Quantify at least 5 bullet points with clear ROI metrics", earned: user?.badges?.includes("Metric Machine") },
                  { name: "Role Ready", desc: "Complete your first AI mock interview practice", earned: user?.badges?.includes("Role Ready") },
                  { name: "Keyword Master", desc: "Reach 90%+ JD match alignment", earned: user?.badges?.includes("Keyword Master") }
                ].map(badge => (
                  <div key={badge.name} className={`p-5 rounded-2xl border ${badge.earned ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-950 border-slate-800 opacity-60'}`}>
                    <Award className={`w-6 h-6 mb-2 ${badge.earned ? 'text-amber-400' : 'text-slate-600'}`} />
                    <h4 className="font-bold text-white text-sm">{badge.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{badge.desc}</p>
                    <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {badge.earned ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: PROFILE */}
          {activeNav === 'Profile' && (
            <div className="max-w-2xl bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
              <h3 className="text-xl font-serif font-bold text-white border-b border-slate-800 pb-4">Candidate Profile</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Role Preference</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 outline-none focus:border-[#a84c38]"
                  >
                    <option value="sde">Software Development Engineer (SDE)</option>
                    <option value="data-science">Data Scientist / ML Engineer</option>
                    <option value="marketing">Growth & Digital Marketer</option>
                    <option value="product-management">Product Manager (PM)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
