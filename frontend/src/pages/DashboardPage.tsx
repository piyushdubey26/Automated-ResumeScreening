import React, { useState } from 'react';
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
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Info,
  LayoutDashboard,
  Briefcase,
  User,
  Lock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
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

  const customizeResumeText = (rawText: string) => {
    if (!user || !user.name) return rawText;
    return rawText
      .replace(/Alex Rivera/g, user.name)
      .replace(/Priya Sharma/g, user.name)
      .replace(/Jordan Lee/g, user.name)
      .replace(/alex\.rivera@example\.com/g, user.email || 'alex.rivera@example.com')
      .replace(/priya\.sharma@example\.com/g, user.email || 'priya.sharma@example.com')
      .replace(/jordan\.lee@example\.com/g, user.email || 'jordan.lee@example.com');
  };

  // Tab 1 State: Resume Upload & Analysis
  const [targetRole, setTargetRole] = useState<'sde' | 'data-science' | 'marketing' | 'product-management'>('sde');
  const [resumeInput, setResumeInput] = useState(() => {
    return customizeResumeText(sampleResumesText.sde);
  });
  const [resumeRecord, setResumeRecord] = useState<ResumeRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'high' | 'medium' | 'success'>('all');
  const [profileLinks, setProfileLinks] = useState({ github: '', linkedin: '', project: '', coding: '' });

  const resumeWithLinks = () => {
    const links = [
      profileLinks.github && `GitHub: ${profileLinks.github}`,
      profileLinks.linkedin && `LinkedIn: ${profileLinks.linkedin}`,
      profileLinks.project && `Project / Portfolio: ${profileLinks.project}`,
      profileLinks.coding && `Coding profile: ${profileLinks.coding}`,
    ].filter(Boolean).join('\n');
    return links ? `${resumeInput}\n\nPROFESSIONAL LINKS\n${links}` : resumeInput;
  };

  // Tab 2 State: JD Matching
  const [jdInput, setJdInput] = useState(sampleJDsText.sde);
  const [jdMatchResult, setJdMatchResult] = useState<JDMatchResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Tab 3 State: AI Bullet Rewriter
  const [bulletInput, setBulletInput] = useState('Responsible for developing microservices with Node.js and SQL.');
  const [focusMode, setFocusMode] = useState<'quantify' | 'action' | 'concise' | 'role-aligned'>('quantify');
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [copiedBullet, setCopiedBullet] = useState(false);

  // Tab 5 State: AI Mock Interview
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);

  // AI Assistant Chat State
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Applications tracking state
  const [applications] = useState([
    { id: 'app-1', role: 'Senior Full Stack Engineer', company: 'TechScale Innovations', status: 'Interviewing', date: 'Aug 22, 2026' },
    { id: 'app-2', role: 'Frontend Engineer', company: 'CloudTech Solutions', status: 'Applied', date: 'Aug 20, 2026' },
    { id: 'app-3', role: 'Backend Engineer', company: 'TechCorp', status: 'Applied', date: 'Aug 18, 2026' },
    { id: 'app-4', role: 'Software Engineer', company: 'FinTech Group', status: 'Rejected', date: 'Aug 10, 2026' }
  ]);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Alex Rivera',
    email: user?.email || 'alex.rivera@example.com',
    github: 'github.com/alexrivera',
    linkedin: 'linkedin.com/in/alexrivera'
  });

  // Handle Load Sample Resume
  const handleLoadSampleResume = (role: 'sde' | 'ds' | 'marketing') => {
    setTargetRole(role === 'ds' ? 'data-science' : role);
    setResumeInput(customizeResumeText(sampleResumesText[role]));
  };

  // Run JD Matching
  const handleRunJDMatch = async () => {
    setIsMatching(true);
    try {
      const res = await jobApi.matchJD(resumeWithLinks(), jdInput, targetRole);
      setJdMatchResult(res);
    } finally {
      setIsMatching(false);
    }
  };

  const handleRunComparison = async () => {
    setIsAnalyzing(true);
    setIsMatching(true);
    try {
      const [resume, match] = await Promise.all([
        resumeApi.uploadAndParse(resumeWithLinks(), 'My_Resume.pdf', targetRole),
        jobApi.matchJD(resumeWithLinks(), jdInput, targetRole)
      ]);
      setResumeRecord(resume.resume);
      setJdMatchResult(match);
    } finally {
      setIsAnalyzing(false);
      setIsMatching(false);
    }
  };

  // Run AI Bullet Rewrite
  const handleRunRewrite = async () => {
    setIsRewriting(true);
    try {
      const res = await resumeApi.rewriteBullet(bulletInput, focusMode, targetRole);
      setRewriteResult(res);
    } finally {
      setIsRewriting(false);
    }
  };

  // Generate AI Mock Interview
  const handleGenerateInterview = async () => {
    setIsLoadingInterview(true);
    try {
      const res = await resumeApi.generateMockInterview(targetRole, resumeWithLinks(), jdInput);
      setInterviewQuestions(res.questions);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // AI Career Assistant Query Handler
  const handleSendAssistantQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userQuery = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');

    setTimeout(() => {
      let reply = "I can help guide you! Try one of the suggested prompts or visit the Resume Review section to parse your resume.";
      const lowQuery = userQuery.toLowerCase();
      if (lowQuery.includes('job') || lowQuery.includes('apply')) {
        reply = "Based on your current resume skills (React, TypeScript, AWS), we found 18 matching positions. Top matches include: Senior Full Stack Engineer (94% match) and Frontend Engineer (89% match). Go to the Job Matches tab to compare!";
      } else if (lowQuery.includes('weak') || lowQuery.includes('skill') || lowQuery.includes('improve')) {
        reply = `Your weakest resume health sub-score is 'Projects & Links' at ${resumeRecord ? resumeRecord.scoreBreakdown.projects : 80}%. We suggest verifying public git repositories or linking LeetCode profiles to boost this rating by up to 10 points.`;
      } else if (lowQuery.includes('interview') || lowQuery.includes('prepare')) {
        reply = "I've generated standard behavioral and technical questions in the AI Mock Interview tab. Try answering: 'How would you architect a high-throughput microservices application handling 2M+ daily requests?'";
      } else if (lowQuery.includes('score') || lowQuery.includes('why')) {
        reply = `Your current resume score is ${resumeRecord ? resumeRecord.score : 86}/100. This places you in the 'Strong SDE Alignment' tier. To reach the next tier (90+), focus on improving Projects & Links and resolving warning flags under the Resume Review tab.`;
      }
      setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 500);
  };

  const handleTriggerSuggestedPrompt = (prompt: string) => {
    setChatHistory(prev => [...prev, { sender: 'user', text: prompt }]);
    setTimeout(() => {
      let reply = "";
      if (prompt.includes('jobs')) {
        reply = "Based on your current resume skills (React, TypeScript, AWS), we found 18 matching positions. Top matches include: Senior Full Stack Engineer (94% match) and Frontend Engineer (89% match). Go to the Job Matches tab to compare!";
      } else if (prompt.includes('weakest')) {
        reply = `Your weakest resume health sub-score is 'Projects & Links' at ${resumeRecord ? resumeRecord.scoreBreakdown.projects : 80}%. We suggest verifying public git repositories or linking LeetCode profiles to boost this rating by up to 10 points.`;
      } else if (prompt.includes('frontend')) {
        reply = "I've generated standard behavioral and technical questions in the AI Mock Interview tab. Try answering: 'How would you architect a high-throughput microservices application handling 2M+ daily requests?'";
      } else if (prompt.includes('86')) {
        reply = `Your current resume score is ${resumeRecord ? resumeRecord.score : 86}/100. This places you in the 'Strong SDE Alignment' tier. To reach the next tier (90+), focus on improving Projects & Links and resolving warning flags under the Resume Review tab.`;
      }
      setChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 500);
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
                const access = item.feature ? canAccessFeature(user, item.feature as any) : { allowed: true };
                const isLocked = !access.allowed;

                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveNav(item.name as any)}
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
                    {isLocked && (
                      <Lock className="w-3 h-3 text-amber-400 opacity-80" />
                    )}
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
                Welcome back, {user?.name || 'Alex Rivera'} 👋
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {activeNav === "Dashboard" && "Your career progress at a glance. Improve your resume, discover better matches, and prepare for your next interview."}
                {activeNav === "Resume Review" && "Score and optimize your resume against role rubrics and custom job descriptions."}
                {activeNav === "Job Matches" && "Find roles that match your skills, experience, and parsed profile."}
                {activeNav === "AI Bullet Rewriter" && "Turn weak resume bullets into impact-focused statements."}
                {activeNav === "Portfolio & Learning" && "Track public signals and curated learning paths to fill skill gaps."}
                {activeNav === "AI Mock Interview" && "Practice custom questions generated based on your resume and target roles."}
                {activeNav === "Applications" && "Track and manage your submitted applications and progress."}
                {activeNav === "Leaderboard & Badges" && "Compete with other job seekers, earn XP, and unlock achievements."}
                {activeNav === "Profile" && "Manage your target roles, social link connections, and user preferences."}
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
                <span className="font-extrabold text-[#a84c38] text-sm">{user?.points ? `${user.points} XP` : '1,450 XP'}</span>
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

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeNav === 'Dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "RESUME SCORE", val: resumeRecord ? `${resumeRecord.score} / 100` : "86 / 100", change: "↑ +6 this month", col: "text-emerald-400", desc: "Based on SDE rubric" },
                  { label: "JOB MATCHES", val: "18", change: "5 strong matches", col: "text-purple-400", desc: "Top match: 94%" },
                  { label: "APPLICATIONS", val: "24", change: "6 active pipelines", col: "text-[#a84c38]", desc: "Last application: 2d ago" },
                  { label: "INTERVIEW READY", val: "82%", change: "↑ 12% improvement", col: "text-indigo-400", desc: "Average mock rating" }
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all group relative overflow-hidden">
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
                    { title: "Resume Review", desc: `Your resume currently scores ${resumeRecord ? resumeRecord.score : 86}/100. Check keywords gap.`, cta: "Review Resume →", tab: "Resume Review" },
                    { title: "Job Match", desc: "Find roles that match your skills, experience, and parsed profile.", cta: "Find Jobs →", tab: "Job Matches" },
                    { title: "AI Bullet Rewriter", desc: "Turn weak resume bullets into impact-focused statements instantly.", cta: "Rewrite →", tab: "AI Bullet Rewriter" },
                    { title: "AI Mock Interview", desc: "Practice real-time technical questions based on your target role.", cta: "Start Interview →", tab: "AI Mock Interview" }
                  ].map(tool => (
                    <div key={tool.title} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-[#a84c38]/30 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#a84c38] transition-colors">{tool.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{tool.desc}</p>
                      </div>
                      <button
                        onClick={() => setActiveNav(tool.tab as any)}
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
                      <span className="text-xl font-extrabold text-[#a84c38]">{resumeRecord ? resumeRecord.score : 86}%</span>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { label: "Structure & Contact", val: resumeRecord ? resumeRecord.scoreBreakdown.structure : 90 },
                        { label: "Clarity & Verbs", val: resumeRecord ? resumeRecord.scoreBreakdown.clarity : 88 },
                        { label: "Impact & Metrics", val: resumeRecord ? resumeRecord.scoreBreakdown.impact : 92 },
                        { label: "Role Hard Skills", val: resumeRecord ? resumeRecord.scoreBreakdown.skills : 85 },
                        { label: "Projects & Links", val: resumeRecord ? resumeRecord.scoreBreakdown.projects : 80 },
                        { label: "ATS Readability", val: resumeRecord ? resumeRecord.scoreBreakdown.ats : 82 }
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
                  </div>

                  <button
                    onClick={() => setActiveNav("Resume Review")}
                    className="w-full mt-6 py-2.5 bg-slate-950 border border-slate-800 hover:border-[#a84c38]/40 hover:bg-slate-900/60 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Improve Resume →</span>
                  </button>
                </div>

                {/* Career Progress / Gamification */}
                <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Career Progress</h3>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">ATS Ninja</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Next Tier: <strong className="text-white">Resume Strategist</strong></span>
                          <span>1,450 / 2,200 XP</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden border border-slate-800 flex items-center p-0.5">
                          <div className="bg-gradient-to-r from-purple-600 to-[#a84c38] h-full rounded-sm" style={{ width: "65.9%" }}></div>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1.5">750 XP remaining for promotion.</span>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">Key Achievements</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {[
                            { emoji: "🏆", label: "Resume Optimized" },
                            { emoji: "🎯", label: "10 Job Matches" },
                            { emoji: "⚡", label: "5 AI Improvements" },
                            { emoji: "🎤", label: "First Mock Interview" }
                          ].map(ach => (
                            <div key={ach.label} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
                              <span className="text-sm">{ach.emoji}</span>
                              <span className="text-slate-300 font-bold">{ach.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav("Leaderboard & Badges")}
                    className="w-full mt-6 py-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/60 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>View Leaderboard →</span>
                  </button>
                </div>
              </div>

              {/* TOP JOB MATCHES */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Job Matches</h3>
                  <button onClick={() => setActiveNav("Job Matches")} className="text-xs font-bold text-[#a84c38] hover:underline cursor-pointer">View All Matches</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Senior Full Stack Engineer", company: "TechScale Innovations", score: 94, skills: "React · Node.js · TypeScript · AWS", exp: "5 years experience", jd: sampleJDsText.sde },
                    { title: "Frontend Engineer", company: "CloudTech Solutions", score: 89, skills: "React · Next.js · TypeScript", exp: "3 years experience", jd: sampleJDsText.sde },
                    { title: "Backend Engineer", company: "TechCorp", score: 84, skills: "Node.js · PostgreSQL · Docker", exp: "3 years experience", jd: sampleJDsText.sde }
                  ].map(job => (
                    <div key={job.title} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-900 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-xs">{job.title}</h4>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">{job.score}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{job.company}</p>
                        <p className="text-[10px] text-slate-400 mt-3">Skills: <strong className="text-slate-300 font-semibold">{job.skills}</strong></p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{job.exp}</p>
                      </div>
                      <button
                        onClick={() => {
                          setJdInput(job.jd);
                          setActiveNav("Job Matches");
                          setTimeout(() => {
                            handleRunJDMatch();
                          }, 100);
                        }}
                        className="w-full py-1.5 bg-slate-950 border border-slate-800 hover:border-[#a84c38]/40 text-[10px] font-bold text-slate-300 rounded-lg text-center cursor-pointer"
                      >
                        View & Compare Match
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT ACTIVITY */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-3">Recent Activity</h3>
                <div className="space-y-3.5">
                  {[
                    { action: "✓ Resume reviewed", desc: `Score improved from 81 → ${resumeRecord ? resumeRecord.score : 86}`, time: "Today" },
                    { action: "✓ Job matched", desc: "Senior Full Stack Engineer · 94%", time: "Yesterday" },
                    { action: "✓ Interview completed", desc: "Frontend Engineer · 82% scoring", time: "2 days ago" },
                    { action: "✓ Resume bullet rewritten", desc: "4 improvements generated using AI focus", time: "3 days ago" }
                  ].map((act, i) => (
                    <div key={i} className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-white block">{act.action}</span>
                        <span className="text-slate-400 text-[11px] mt-0.5 block">{act.desc}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{act.time}</span>
                    </div>
                  ))}
                </div>
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
                    "Find jobs matching my resume",
                    "Improve my weakest skill",
                    "Prepare me for a frontend interview",
                    "Why is my resume score 86?"
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
                    <button onClick={() => handleLoadSampleResume('sde')} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer">SDE</button>
                    <button onClick={() => handleLoadSampleResume('ds')} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer">DS</button>
                    <button onClick={() => handleLoadSampleResume('marketing')} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer">MKT</button>
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

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-400">Target job description</label>
                    <button onClick={() => setJdInput(sampleJDsText.sde)} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">Load sample JD</button>
                  </div>
                  <FileUpload
                    onTextExtracted={(text) => setJdInput(text)}
                    label="Upload JD image or document"
                    accept="image/*,.pdf,.txt"
                    helpText="Any image, PDF, or TXT file (max 10MB)"
                  />
                  <textarea
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    rows={7}
                    placeholder="Paste the job description you want to compare..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">Add both your resume and the job description here. We will score the resume and show the skills gap together.</p>
                </div>

                {/* File Upload Zone */}
                <FileUpload
                  onTextExtracted={(text) => setResumeInput(text)}
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
                    onChange={(e) => setResumeInput(e.target.value)}
                    rows={8}
                    placeholder="Paste your resume text here..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div><label className="block text-xs font-semibold text-slate-300">Links & profiles</label><p className="mt-1 text-[11px] text-slate-500">Add public profiles so the review can check your project footprint.</p></div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Optional</span>
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
                          onChange={(event) => setProfileLinks(current => ({ ...current, [key]: event.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-200 outline-none transition focus:border-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRunComparison}
                  disabled={isAnalyzing || isMatching}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-[#a84c38] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#a84c38]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <span>Parsing & Evaluating...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Compare Resume & Job Description</span>
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
                      {resumeRecord ? resumeRecord.score : 86} <span className="text-xs font-normal text-slate-500">/ 100</span>
                    </div>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      Strong {resumeRecord ? resumeRecord.targetRole.replace('-', ' ') : targetRole.replace('-', ' ')} Alignment
                    </span>
                  </div>

                  {/* Sub-score Pillars */}
                  <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Structure & Contact</span>
                      <span className="text-sm font-bold text-white mt-1 block">{resumeRecord ? resumeRecord.scoreBreakdown.structure : 90}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Clarity & Verbs</span>
                      <span className="text-sm font-bold text-white mt-1 block">{resumeRecord ? resumeRecord.scoreBreakdown.clarity : 88}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Impact & Metrics</span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block">{resumeRecord ? resumeRecord.scoreBreakdown.impact : 92}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Role Hard Skills</span>
                      <span className="text-sm font-bold text-amber-400 mt-1 block">{resumeRecord ? resumeRecord.scoreBreakdown.skills : 85}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Projects & Links</span>
                      <span className="text-sm font-bold text-white mt-1 block">{resumeRecord ? resumeRecord.scoreBreakdown.projects : 80}%</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">ATS Readability</span>
                      <span className="text-sm font-bold text-indigo-400 mt-1 block">{resumeRecord ? resumeRecord.scoreBreakdown.ats : 82}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-900 bg-slate-900/50 p-5 md:grid-cols-[150px_1fr] md:items-center">
                  <div className="md:border-r md:border-slate-800 md:pr-5"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">JD match</p><p className="mt-1 text-4xl font-extrabold text-emerald-400">{jdMatchResult ? jdMatchResult.matchPct : 86}%</p><p className="mt-1 text-[11px] text-slate-500">Resume vs. this role</p></div>
                  <div><p className="text-xs font-semibold text-slate-300">Skills to review</p><div className="mt-2 flex flex-wrap gap-2">{(jdMatchResult ? jdMatchResult.missingCoreSkills : ['GraphQL', 'Kubernetes']).map(skill => <span key={skill} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">{skill}</span>)}</div><p className="mt-3 text-[11px] text-slate-500">The matching score compares the resume text with the job description entered on the left.</p></div>
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
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                      No feedback cards matching selected filter. Try loading or pasting a resume, then running comparison.
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
                        
                        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-indigo-300">
                          <strong>Suggestion:</strong> {fb.suggestion}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: JOB MATCHES */}
          {activeNav === 'Job Matches' && (
            !canAccessFeature(user, 'resume.jdMatch').allowed ? (
              <UpgradeGate featureKey="resume.jdMatch" reason={canAccessFeature(user, 'resume.jdMatch').reason} />
            ) : (
              <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: Job Description Input */}
                <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Paste Target Job Description (JD)</h3>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => setJdInput(sampleJDsText.sde)} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer">SDE JD</button>
                      <button onClick={() => setJdInput(sampleJDsText.ds)} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer">DS JD</button>
                    </div>
                  </div>

                  {/* File Upload Zone for JD */}
                  <FileUpload
                    onTextExtracted={(text) => setJdInput(text)}
                    label="Upload Job Description (PDF / JPG / PNG)"
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                    helpText="Upload JD as PDF, image, or text file"
                  />

                  <div className="flex items-center space-x-3 text-[10px] text-slate-500">
                    <div className="flex-1 h-px bg-slate-800"></div>
                    <span className="font-bold uppercase tracking-wider">or paste JD text</span>
                    <div className="flex-1 h-px bg-slate-800"></div>
                  </div>

                  <textarea
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    rows={8}
                    placeholder="Paste Job Description text here..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    onClick={handleRunJDMatch}
                    disabled={isMatching}
                    className="w-full py-3 bg-gradient-to-r from-purple-650 to-indigo-650 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isMatching ? (
                      <span>Calculating Keyword Overlap...</span>
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
                  <div className="text-center p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Job Match Percentage</span>
                    <div className="text-5xl font-extrabold text-[#a84c38]">
                      {jdMatchResult ? jdMatchResult.matchPct : 86}%
                    </div>
                    <p className="text-xs text-slate-400">Keyword Overlap: <strong>{jdMatchResult ? jdMatchResult.keywordScore : 84}%</strong> | Semantic Similarity: <strong>{jdMatchResult ? jdMatchResult.embeddingScore : 88}%</strong></p>
                  </div>

                  {/* Matched vs Missing Core Skills */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-emerald-400 mb-2 flex items-center space-x-1">
                        <Check className="w-4 h-4" />
                        <span>Matched Keywords ({jdMatchResult ? jdMatchResult.matchedKeywords.length : 7})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(jdMatchResult ? jdMatchResult.matchedKeywords : ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Docker', 'AWS', 'Redis']).map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-rose-400 mb-2 flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Missing Core Skills ({jdMatchResult ? jdMatchResult.missingCoreSkills.length : 2})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(jdMatchResult ? jdMatchResult.missingCoreSkills : ['GraphQL', 'Kubernetes']).map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-350 border border-rose-500/30 font-semibold">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Keywords Detail */}
                    <div>
                      <h4 className="font-bold text-amber-400 mb-2 flex items-center space-x-1">
                        <Info className="w-4 h-4" />
                        <span>All Missing Keywords ({jdMatchResult ? jdMatchResult.missingKeywords.length : 3})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(jdMatchResult ? jdMatchResult.missingKeywords : ['GraphQL', 'Kubernetes', 'CI/CD']).map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actionable Recommendations */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <h4 className="font-bold text-white flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>How to Improve Your Resume for This JD:</span>
                      </h4>
                      <div className="space-y-2">
                        {(jdMatchResult ? jdMatchResult.recommendations : [
                          'Explicitly incorporate missing target skills: GraphQL, Kubernetes into your Skills or Experience section.',
                          'Align your resume summary headline directly with the Senior Full Stack Engineer title.'
                        ]).map((rec, idx) => (
                          <div key={idx} className="flex items-start space-x-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-300 leading-relaxed">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Recommended Jobs Database Table */}
              <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Recommended Job Matches Database</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-3">Job Title</th>
                        <th className="py-3">Company</th>
                        <th className="py-3">Required Experience</th>
                        <th className="py-3">ATS Match</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {[
                        { title: "Senior Full Stack Engineer", company: "TechScale Innovations", exp: "5+ yrs", match: "94%", jd: sampleJDsText.sde },
                        { title: "Frontend Engineer", company: "CloudTech Solutions", exp: "3+ yrs", match: "89%", jd: sampleJDsText.sde },
                        { title: "Backend Engineer", company: "TechCorp", exp: "3+ yrs", match: "84%", jd: sampleJDsText.sde },
                        { title: "Full Stack Developer", company: "Innovate Labs", exp: "2+ yrs", match: "81%", jd: sampleJDsText.sde }
                      ].map((j, i) => (
                        <tr key={i} className="hover:bg-slate-950/30">
                          <td className="py-3.5 font-bold text-white">{j.title}</td>
                          <td className="py-3.5 text-slate-400">{j.company}</td>
                          <td className="py-3.5 text-slate-400">{j.exp}</td>
                          <td className="py-3.5 text-emerald-400 font-bold">{j.match}</td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => {
                                setJdInput(j.jd);
                                handleRunJDMatch();
                              }}
                              className="px-2.5 py-1 rounded bg-[#a84c38]/10 text-[#a84c38] border border-[#a84c38]/20 text-[10px] font-bold cursor-pointer"
                            >
                              Load & Score
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

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
                      <span className="text-[10px] font-normal block mt-0.5">Infuse SDE keywords</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleRunRewrite}
                  disabled={isRewriting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-[#a84c38] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isRewriting ? (
                    <span>Generating Enhanced Bullet...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Generate Improved Version</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rewrite Output Card */}
              {rewriteResult && (
                <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Enhanced Version</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rewriteResult.improvedBullet);
                        setCopiedBullet(true);
                        setTimeout(() => setCopiedBullet(false), 2000);
                      }}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-[#a84c38] hover:text-[#c45a44]"
                    >
                      {copiedBullet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedBullet ? 'Copied!' : 'Copy Bullet'}</span>
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">{rewriteResult.improvedBullet}</p>
                  
                  <p className="text-xs text-slate-400 pt-2 border-t border-slate-900">
                    <strong>Why this works:</strong> {rewriteResult.explanation}
                  </p>
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
                      <span className="text-slate-400">GitHub Stars</span>
                      <span className="text-white font-bold">38 Stars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Public Repositories</span>
                      <span className="text-white font-bold">14 Repos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Portfolio Rating</span>
                      <span className="text-emerald-400 font-bold">88 / 100</span>
                    </div>
                    <div className="pt-2 border-t border-slate-900 text-slate-300 leading-relaxed">
                      Verified activity in microservices, React, and TypeScript projects. GitHub connection status: Active.
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
                    <span>AI Mock Interview Question Generator</span>
                  </h3>
                  <p className="text-xs text-slate-400">Generates questions tailored to your parsed resume and target job description.</p>
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
                {(interviewQuestions.length > 0 ? interviewQuestions : [
                  {
                    id: 'q-1',
                    category: 'System & Domain Architecture' as const,
                    question: 'How would you architect a high-throughput microservices application handling 2M+ daily requests with zero downtime?',
                    difficulty: 'Hard' as const,
                    keyPointsToCover: ['Load balancing & API gateway setup', 'Database indexing & Redis caching strategies', 'Asynchronous task queues (RabbitMQ/BullMQ)', 'Circuit breaker pattern']
                  },
                  {
                    id: 'q-2',
                    category: 'Technical Core' as const,
                    question: 'Explain how you optimize PostgreSQL queries when dealing with large-scale tables, and when you choose Redis caching.',
                    difficulty: 'Medium' as const,
                    keyPointsToCover: ['EXPLAIN ANALYZE for query plans', 'B-Tree composite indexes', 'Cache eviction strategies (LRU)', 'Cache stampede prevention']
                  }
                ]).map((q, idx) => (
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
                ))}
              </div>
            </div>
            )
          )}

          {/* TAB 7: APPLICATIONS TRACKER */}
          {activeNav === 'Applications' && (
            <div className="bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
              <h3 className="text-xl font-serif font-bold text-white border-b border-slate-900 pb-4">Job Applications Tracker</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Applications</span>
                  <div className="text-2xl font-extrabold text-white mt-1">24 Submitted</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Active Pipelines</span>
                  <div className="text-2xl font-extrabold text-[#a84c38] mt-1">6 In-Progress</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Interviews Slated</span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">2 Scheduled</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3">Target Role</th>
                      <th className="py-3">Company</th>
                      <th className="py-3">Applied Date</th>
                      <th className="py-3">Pipeline Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {applications.map(app => (
                      <tr key={app.id} className="hover:bg-slate-950/20">
                        <td className="py-3 font-bold text-white">{app.role}</td>
                        <td className="py-3 text-slate-400">{app.company}</td>
                        <td className="py-3 text-slate-400">{app.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            app.status === 'Interviewing'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : app.status === 'Applied'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: LEADERBOARD & BADGES */}
          {activeNav === 'Leaderboard & Badges' && (
            <div className="bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>Regional & University Leaderboard</span>
                  </h3>
                  <p className="text-xs text-slate-400">Compete with fellow job seekers and earn badges by elevating your ATS resume score.</p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Your Rank</span>
                  <span className="text-xl font-extrabold text-amber-400">#1 Spot</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Role Score</th>
                      <th className="py-3 px-4">Badges Unlocked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="bg-indigo-950/20">
                      <td className="py-3 px-4 font-bold text-amber-400">#1</td>
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="avatar" className="w-6 h-6 rounded-full" />
                        <span>{user?.name || 'Alex Rivera'} (You)</span>
                      </td>
                      <td className="py-3 px-4">UC Berkeley</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">94 / 100</td>
                      <td className="py-3 px-4 flex gap-1">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">ATS Ninja</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Metric Machine</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-400">#2</td>
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100" alt="avatar" className="w-6 h-6 rounded-full" />
                        <span>Priya Sharma</span>
                      </td>
                      <td className="py-3 px-4">Northeastern Univ</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">91 / 100</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">ML Wizard</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3 px-4 font-bold text-slate-400">#3</td>
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="avatar" className="w-6 h-6 rounded-full" />
                        <span>Jordan Lee</span>
                      </td>
                      <td className="py-3 px-4">NYU Stern</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">89 / 100</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold">Growth Hacker</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: USER PROFILE SHELL */}
          {activeNav === 'Profile' && (
            <div className="bg-slate-900/50 border border-slate-900 p-6 sm:p-8 rounded-3xl space-y-6 animate-fadeIn">
              <h3 className="text-xl font-serif font-bold text-white border-b border-slate-900 pb-4">Career Command Profile</h3>
              
              <div className="space-y-4 text-xs max-w-lg">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={e => setProfileData(current => ({ ...current, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-[#a84c38]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={e => setProfileData(current => ({ ...current, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-[#a84c38]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">GitHub Profile</label>
                    <input
                      type="text"
                      value={profileData.github}
                      onChange={e => setProfileData(current => ({ ...current, github: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-[#a84c38]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-400 font-medium">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={profileData.linkedin}
                      onChange={e => setProfileData(current => ({ ...current, linkedin: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none focus:border-[#a84c38]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => alert("Profile updated locally! (Mock Action)")}
                    className="px-5 py-2.5 bg-[#a84c38] hover:bg-[#8f3f2d] font-bold text-xs text-white rounded-xl cursor-pointer"
                  >
                    Save Profile Settings
                  </button>
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
