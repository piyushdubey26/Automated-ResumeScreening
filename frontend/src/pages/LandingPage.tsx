import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, Search, Users, Shield, Sparkles, Upload } from 'lucide-react';
import { sampleResumesText, resumeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ResumeRecord } from '../types';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Public Demo Sample state (for logged-out visitors)
  const [demoRole, setDemoRole] = useState<'sde' | 'ds' | 'marketing'>('sde');
  const [demoText, setDemoText] = useState(sampleResumesText.sde);
  const [demoScore, setDemoScore] = useState<number | null>(88);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Authenticated Seeker Real Resume Data (scoped to user.id)
  const [userResumeRecord, setUserResumeRecord] = useState<ResumeRecord | null>(null);

  useEffect(() => {
    if (user && user.userType === 'seeker') {
      let active = true;

      // 1. Instant Cache Hydration (<5ms)
      const cached = localStorage.getItem(`resumeai_cache_resume_${user.id}`);
      if (cached) {
        try {
          setUserResumeRecord(JSON.parse(cached));
        } catch {}
      }

      // 2. Fetch latest from API
      const syncResume = () => {
        resumeApi.getLatest()
          .then(res => {
            if (active && res && res.resume) {
              setUserResumeRecord(res.resume);
              localStorage.setItem(`resumeai_cache_resume_${user.id}`, JSON.stringify(res.resume));
            }
          })
          .catch(() => {
            if (active && !cached) {
              setUserResumeRecord(null);
            }
          });
      };

      syncResume();

      window.addEventListener('resumeai-subscription-updated', syncResume);
      window.addEventListener('resumeai-user-updated', syncResume);
      window.addEventListener('resumeai-resume-updated', syncResume);

      return () => {
        active = false;
        window.removeEventListener('resumeai-subscription-updated', syncResume);
        window.removeEventListener('resumeai-user-updated', syncResume);
        window.removeEventListener('resumeai-resume-updated', syncResume);
      };
    } else {
      setUserResumeRecord(null);
    }
  }, [user]);

  const handleSelectSample = (role: 'sde' | 'ds' | 'marketing') => {
    setDemoRole(role);
    setDemoText(sampleResumesText[role]);
  };

  const handleTestScore = async () => {
    setIsEvaluating(true);
    try {
      const res = await resumeApi.uploadAndParse(demoText, 'Demo_Resume.pdf', demoRole);
      setDemoScore(res.resume.score);
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── 0. AUTH LOADING SKELETON ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-[#a84c38] border-t-transparent rounded-full animate-spin"></div>
          <span>Loading ResumeAI Workspace...</span>
        </div>
      </div>
    );
  }

  const isSeeker = isAuthenticated && user?.userType === 'seeker';
  const isRecruiterMode = isAuthenticated && user?.userType === 'recruiter';
  const isAdmin = isAuthenticated && user?.userType === 'admin';

  return (
    <main className="landing-page min-h-screen bg-[#f8f7f3] dark:bg-slate-950 text-[#1d2b3a] dark:text-slate-100">
      
      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
        
        {/* Left Hero Content */}
        <div className="lg:col-span-7 lg:pt-7">
          <p className="mb-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a84c38]">
            <span className="h-px w-8 bg-[#a84c38]" />
            {isAdmin
              ? "Platform Administration & Governance"
              : isRecruiterMode
              ? "Resume Screening that saves time"
              : "Resume guidance that speaks plainly"}
          </p>

          {/* Role-Aware Greeting */}
          {isAuthenticated && (
            <p className="mb-4 text-sm font-semibold text-[#a84c38] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Welcome back, {user?.name}. Your {isAdmin ? "Admin" : isRecruiterMode ? "Hiring" : "Career"} workspace is ready.</span>
            </p>
          )}
          
          <h1 className="max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.045em] text-[#172735] dark:text-white sm:text-6xl lg:text-7xl">
            {isAdmin ? (
              <>ResumeAI 2.0 Ecosystem <em className="font-normal text-[#a84c38]">Control Center.</em></>
            ) : isRecruiterMode ? (
              <>Find the right candidates before the first <em className="font-normal text-[#a84c38]">interview.</em></>
            ) : (
              <>A clearer path from resume to <em className="font-normal text-[#a84c38]">interview.</em></>
            )}
          </h1>
          
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#58636b] dark:text-slate-350">
            {isAdmin
              ? "Monitor system metrics, approve user subscription upgrades, manage platform access, and audit AI usage caps."
              : isRecruiterMode 
              ? "Upload a job description, let ResumeAI analyze your applicants, rank them, explain why, and surface the people worth interviewing."
              : "Upload your resume, check your score, compare it with a job description, and improve the areas that matter."}
          </p>
          
          <div className="mt-9 flex flex-wrap gap-3 sm:items-center">
            {isAdmin ? (
              <>
                <button 
                  onClick={() => navigate('/admin')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#a84c38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8e3f2e] cursor-pointer shadow-lg shadow-[#a84c38]/20"
                >
                  <Shield className="h-4 w-4" />
                  <span>Open Admin Control Center</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] dark:border-slate-800 px-4 py-3 text-sm font-semibold text-[#294452] dark:text-slate-200 transition hover:bg-slate-800/40 cursor-pointer"
                >
                  View Seeker Experience
                </button>
                <button 
                  onClick={() => navigate('/recruiter')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] dark:border-slate-800 px-4 py-3 text-sm font-semibold text-[#294452] dark:text-slate-200 transition hover:bg-slate-800/40 cursor-pointer"
                >
                  View Recruiter Experience
                </button>
              </>
            ) : isRecruiterMode ? (
              <>
                <button 
                  onClick={() => navigate('/recruiter', { state: { openCreateJob: true } })} 
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1d3848] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294c60] cursor-pointer shadow-md"
                >
                  + Create a Job
                </button>
                <button 
                  onClick={() => navigate('/recruiter')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] dark:border-slate-800 px-5 py-3 text-sm font-semibold text-[#294452] dark:text-slate-200 transition hover:border-[#7d8c8f] hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
                >
                  Open Recruiter Hub
                </button>
                <button 
                  onClick={() => navigate('/features')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-3 text-sm font-semibold text-[#58636b] dark:text-slate-400 transition hover:text-white cursor-pointer"
                >
                  Explore Features
                </button>
              </>
            ) : isSeeker ? (
              <>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#a84c38] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#8e3f2e] cursor-pointer shadow-lg shadow-[#a84c38]/20"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload / Review Resume →</span>
                </button>
                <button 
                  onClick={() => navigate('/features')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] dark:border-slate-800 px-5 py-3 text-sm font-semibold text-[#294452] dark:text-slate-200 transition hover:border-[#7d8c8f] hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
                >
                  Explore Features
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/register')} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1d3848] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294c60] cursor-pointer shadow-md">Review a resume <ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => navigate('/register')} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] dark:border-slate-800 px-5 py-3 text-sm font-semibold text-[#294452] dark:text-slate-200 transition hover:border-[#7d8c8f] hover:bg-white dark:hover:bg-slate-900 cursor-pointer">I’m hiring <Users className="h-4 w-4" /></button>
              </>
            )}
          </div>
          
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#59676d] dark:text-slate-400">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#a84c38]" />
              {isRecruiterMode ? "Instant match scores" : "Tailored to four career paths"}
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#a84c38]" />
              {isRecruiterMode ? "Explainable AI reasoning" : "Actionable, not vague"}
            </span>
          </div>
        </div>
        
        {/* Right Hero Card Section */}
        <div className="relative lg:col-span-5">
          <div className="absolute -left-3 top-7 h-full w-full border border-[#d8d3c8] dark:border-slate-800" />
          <div className="relative bg-[#fffefa] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-[0_20px_45px_rgba(34,48,53,0.10)] sm:p-7 rounded-2xl">
            
            {/* 1. LOGGED-IN SEEKER HERO CARD */}
            {isSeeker ? (
              userResumeRecord ? (
                /* Authenticated Seeker WITH Resume */
                <div>
                  <div className="flex items-start justify-between border-b border-[#e7e2d9] dark:border-slate-800 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84c38]">Your Resume Health</p>
                      <h2 className="mt-1 font-serif text-2xl text-[#1d2b3a] dark:text-white">
                        {user.name}'s Resume
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                        Target Role: {userResumeRecord.targetRole.replace('-', ' ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#e6eee9] dark:bg-emerald-950/80 px-3 py-1 text-xs font-bold text-[#35634c] dark:text-emerald-300 border border-emerald-500/30">
                      Analyzed & Scored
                    </span>
                  </div>

                  <div className="grid grid-cols-[96px_1fr] gap-6 py-7 items-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-[#d9e6df] dark:border-emerald-800/40 text-3xl font-bold text-[#234a40] dark:text-emerald-400 bg-slate-950">
                      {userResumeRecord.score}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#243642] dark:text-slate-200">
                        {userResumeRecord.score >= 80 ? "Your resume is in strong shape for this role." : "Needs targeted improvements."}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#687278] dark:text-slate-400">
                        Evaluated against {userResumeRecord.targetRole.toUpperCase()} rubric. Click below to view feedback cards and missing skills.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#e7e2d9] dark:border-slate-800 pt-5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Impact & Metrics</span>
                      <strong className="text-white font-bold">{userResumeRecord.scoreBreakdown.impact}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Role Hard Skills</span>
                      <strong className="text-amber-400 font-bold">{userResumeRecord.scoreBreakdown.skills}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ATS Readability</span>
                      <strong className="text-indigo-400 font-bold">{userResumeRecord.scoreBreakdown.ats}%</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full mt-6 py-3 bg-[#a84c38] hover:bg-[#8e3f2e] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer text-center"
                  >
                    View Detailed Feedback in Workspace →
                  </button>
                </div>
              ) : (
                /* Authenticated Seeker WITHOUT Resume */
                <div>
                  <div className="flex items-start justify-between border-b border-[#e7e2d9] dark:border-slate-800 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84c38]">Resume Review</p>
                      <h2 className="mt-1 font-serif text-2xl text-[#1d2b3a] dark:text-white">Your Candidate Workspace</h2>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                      Setup Needed
                    </span>
                  </div>

                  <div className="grid grid-cols-[96px_1fr] gap-6 py-7 items-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-slate-700 text-2xl font-bold text-slate-400 bg-slate-950">
                      —
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#243642] dark:text-slate-200">Your resume hasn't been analyzed yet.</p>
                      <p className="mt-2 text-xs leading-5 text-[#687278] dark:text-slate-400">
                        Upload your resume to get your personalized score, ATS feedback, and improvement suggestions.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-[#e7e2d9] dark:border-slate-800 pt-5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Resume Score</span>
                      <strong className="text-slate-400">Not calculated</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Job Matches</span>
                      <strong className="text-slate-400">0 matches</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Applications Tracked</span>
                      <strong className="text-slate-400">0 applications</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full mt-6 py-3 bg-[#a84c38] hover:bg-[#8e3f2e] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Resume Now</span>
                  </button>
                </div>
              )
            ) : isRecruiterMode ? (
              /* 2. LOGGED-IN RECRUITER HERO CARD */
              <div>
                <div className="flex items-start justify-between border-b border-[#e7e2d9] dark:border-slate-800 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a84c38]">Recruiter Workspace</p>
                    <h2 className="mt-1 font-serif text-xl text-[#1d2b3a] dark:text-white">Active Hiring Pipelines</h2>
                  </div>
                  <span className="rounded-full bg-[#e6eee9] dark:bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-[#35634c] dark:text-emerald-300 border border-emerald-500/30">
                    Recruiter Mode
                  </span>
                </div>
                <div className="py-6 space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-medium">Active Job Postings</span>
                      <strong className="text-white font-bold text-sm">1 Active Job</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-medium">Screened Candidates</span>
                      <strong className="text-emerald-400 font-bold text-sm">0 Candidates</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Shortlisted Talent</span>
                      <strong className="text-amber-400 font-bold text-sm">0 Shortlisted</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/recruiter')}
                    className="w-full py-3 bg-[#1d3848] hover:bg-[#294c60] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer text-center"
                  >
                    Open Recruiter Hub →
                  </button>
                </div>
              </div>
            ) : isAdmin ? (
              /* 3. LOGGED-IN ADMIN HERO CARD */
              <div>
                <div className="flex items-start justify-between border-b border-[#e7e2d9] dark:border-slate-800 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-500">Platform Administrator</p>
                    <h2 className="mt-1 font-serif text-xl text-[#1d2b3a] dark:text-white">Ecosystem Overview</h2>
                  </div>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                    Admin Active
                  </span>
                </div>
                <div className="py-6 space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-medium">Monthly Recurring Revenue</span>
                      <strong className="text-emerald-400 font-bold text-sm">$12,842</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="text-slate-400 font-medium">Active Accounts</span>
                      <strong className="text-indigo-400 font-bold text-sm">1,102 Users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Pending Upgrades</span>
                      <strong className="text-amber-400 font-bold text-sm">Action Required</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full py-3 bg-[#a84c38] hover:bg-[#8e3f2e] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer text-center"
                  >
                    Go to Admin Dashboard →
                  </button>
                </div>
              </div>
            ) : (
              /* 4. LOGGED-OUT PUBLIC MARKETING HERO CARD (Maya Chen 86) */
              <>
                <div className="flex items-start justify-between border-b border-[#e7e2d9] pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84c38]">Sample Resume Review</p>
                    <h2 className="mt-1 font-serif text-2xl text-[#1d2b3a]">Maya Chen · Product Designer</h2>
                  </div>
                  <span className="rounded-full bg-[#e6eee9] px-3 py-1 text-xs font-bold text-[#35634c]">Strong match</span>
                </div>
                <div className="grid grid-cols-[96px_1fr] gap-6 py-7">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-[#d9e6df] text-3xl font-bold text-[#234a40]">86</div>
                  <div>
                    <p className="text-sm font-semibold text-[#243642]">You’re in good shape for this role.</p>
                    <p className="mt-2 text-sm leading-6 text-[#687278]">The experience is relevant. Add one outcome to the first project and make your research methods easier to spot.</p>
                  </div>
                </div>
                <div className="space-y-3 border-t border-[#e7e2d9] pt-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#53616a]"><span className="h-2 w-2 rounded-full bg-[#4d8b68]" />Relevant experience</span>
                    <strong>Excellent</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#53616a]"><span className="h-2 w-2 rounded-full bg-[#d19b4f]" />Evidence of impact</span>
                    <strong>Worth improving</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[#53616a]"><span className="h-2 w-2 rounded-full bg-[#4d8b68]" />Core skills</span>
                    <strong>Excellent</strong>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* ── 3-STEP FLOW SECTION ─────────────────────────────────────────────────── */}
      <section className="border-y border-[#ded9cf] dark:border-slate-800 bg-[#efeee8] dark:bg-slate-900/60">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#d9d4ca] dark:divide-slate-800 px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          {[
            ['01', 'Choose a target', 'Select a role rubric that fits the job you want next.'],
            ['02', 'Get the useful details', 'See what reads well, what is missing, and where to focus.'],
            ['03', 'Apply with confidence', 'Keep a sharper resume and compare it to the job description.']
          ].map(([number, title, text]) => (
            <div key={number} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
              <span className="text-xs font-bold tracking-[0.16em] text-[#a84c38]">{number}</span>
              <h3 className="mt-4 font-serif text-2xl text-[#1d2b3a] dark:text-white">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#667177] dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAMPLE RESUME DEMO SECTION (LOGGED-OUT OR EXPLICITLY LABELED DEMO) ──── */}
      {!isAuthenticated ? (
        /* Logged-out Public Sample Section */
        <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a84c38]">Try a sample</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-[#1d2b3a] dark:text-white">See a review in context.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#667177] dark:text-slate-400">
              Edit the sample or switch roles. We’ll run it through the same scoring flow used in the dashboard.
            </p>
          </div>

          <div className="border border-[#d8d3c8] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_12px_30px_rgba(34,48,53,0.06)] sm:p-6 rounded-2xl">
            <div className="flex flex-col gap-4 border-b border-[#e6e1d8] dark:border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#a84c38]" />
                <div>
                  <h3 className="font-semibold dark:text-white text-sm">Test a sample resume</h3>
                  <p className="text-xs text-[#69747a] dark:text-slate-400">Pick a role, then run a quick review.</p>
                </div>
              </div>

              <div className="flex rounded-md bg-[#f1f0eb] dark:bg-slate-800 p-1">
                {(['sde', 'ds', 'marketing'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => handleSelectSample(role)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      demoRole === role ? 'bg-white dark:bg-slate-700 text-[#1d3848] dark:text-white shadow-sm' : 'text-[#69747a] dark:text-slate-400'
                    }`}
                  >
                    {role === 'sde' ? 'Engineering' : role === 'ds' ? 'Data science' : 'Marketing'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_200px]">
              <textarea
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                rows={9}
                className="w-full resize-none border border-[#d8d3c8] dark:border-slate-800 bg-[#fcfbf8] dark:bg-slate-950 p-4 font-mono text-xs leading-5 text-[#40515b] dark:text-slate-300 outline-none transition focus:border-[#577683]"
              />
              
              <aside className="flex flex-col justify-between border border-[#d8d3c8] dark:border-slate-800 bg-[#f7f6f1] dark:bg-slate-950 p-5 rounded-xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#68757a] dark:text-slate-400">Review score</p>
                  <p className="mt-3 font-serif text-6xl text-[#1d3848] dark:text-white">{demoScore ?? '—'}</p>
                  <p className="mt-1 text-xs text-[#68757a] dark:text-slate-500">out of 100</p>
                  <div className="mt-6 border-t border-[#ded9cf] dark:border-slate-800 pt-4 text-xs leading-6 text-[#59676d] dark:text-slate-400">
                    <p>Looks for relevant skills, clear structure, and evidence of impact.</p>
                  </div>
                </div>

                <button
                  onClick={handleTestScore}
                  disabled={isEvaluating}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[#a84c38] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#8d3d2d] disabled:opacity-60 cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  {isEvaluating ? 'Reviewing…' : 'Review sample'}
                </button>
              </aside>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[#69747a] dark:text-slate-400">
            Want the full set of tools? <Link className="font-semibold text-[#a84c38] underline decoration-[#d9ad9e] underline-offset-4" to="/features">Explore what’s included</Link>.
          </p>
        </section>
      ) : (
        /* Logged-in Users: Interactive Demo Sandbox explicitly labeled */
        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
              Interactive Demo Sandbox
            </span>
            <h3 className="text-base font-bold text-white">Want to test sample resumes?</h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              You are currently signed in as <strong>{user?.name}</strong>. Visit your personal Candidate Workspace to parse and score your own resume.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-[#a84c38] hover:bg-[#8e3f2e] text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                Go to My Seeker Workspace →
              </button>
            </div>
          </div>
        </section>
      )}

    </main>
  );
};

export default LandingPage;
