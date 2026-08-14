import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sampleResumesText, sampleJDsText, resumeApi, jobApi } from '../services/api';
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
  Info
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'analysis' | 'jd-match' | 'ai-rewrite' | 'portfolio' | 'interview' | 'gamification'>('analysis');

  // Tab 1 State: Resume Upload & Analysis
  const [targetRole, setTargetRole] = useState<'sde' | 'data-science' | 'marketing' | 'product-management'>('sde');
  const [resumeInput, setResumeInput] = useState(sampleResumesText.sde);
  const [resumeRecord, setResumeRecord] = useState<ResumeRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'high' | 'medium' | 'success'>('all');

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

  // Handle Load Sample Resume
  const handleLoadSampleResume = (role: 'sde' | 'ds' | 'marketing') => {
    setTargetRole(role === 'ds' ? 'data-science' : role);
    setResumeInput(sampleResumesText[role]);
  };

  // Run Resume Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await resumeApi.uploadAndParse(resumeInput, 'My_Resume.pdf', targetRole);
      setResumeRecord(res.resume);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run JD Matching
  const handleRunJDMatch = async () => {
    setIsMatching(true);
    try {
      const res = await jobApi.matchJD(resumeInput, jdInput, targetRole);
      setJdMatchResult(res);
    } finally {
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
      const res = await resumeApi.generateMockInterview(targetRole, resumeInput, jdInput);
      setInterviewQuestions(res.questions);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  // Filter feedback cards
  const filteredFeedback = resumeRecord?.feedback.filter(fb => {
    if (feedbackFilter === 'all') return true;
    return fb.severity === feedbackFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30">
              Seeker Control Center
            </span>
            <span className="text-xs text-slate-400">Target Role: <strong className="text-white capitalize">{targetRole}</strong></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome back, {user?.name || 'Alex Rivera'}</h1>
          <p className="text-xs text-slate-400">Analyze your resume, calculate JD match %, rewrite weak bullet points, and generate mock interview questions.</p>
        </div>

        {/* User Badges & Points */}
        <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
          <div className="text-center px-3 border-r border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Points</span>
            <span className="font-extrabold text-amber-400 text-sm">1,450 XP</span>
          </div>
          <div className="flex items-center space-x-1.5">
            {user?.badges?.map((badge, idx) => (
              <span key={idx} className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                {badge}
              </span>
            )) || <span className="text-slate-400 text-[10px]">ATS Ninja</span>}
          </div>
        </div>
      </div>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Resume Score & Feedback</span>
        </button>

        <button
          onClick={() => setActiveTab('jd-match')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'jd-match' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-purple-400" />
          <span>2. JD Matcher & Skills Gap</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-rewrite')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'ai-rewrite' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>3. AI Bullet Rewriter</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'portfolio' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>4. Portfolio & Learning</span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'interview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-pink-400" />
          <span>5. AI Mock Interview</span>
        </button>

        <button
          onClick={() => setActiveTab('gamification')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'gamification' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-900/60 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>6. Leaderboard & Badges</span>
        </button>
      </div>

      {/* TAB 1 CONTENT: RESUME SCORE & FEEDBACK */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Target Rubric & Text</h3>
              <div className="flex items-center space-x-1">
                <button onClick={() => handleLoadSampleResume('sde')} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white">SDE</button>
                <button onClick={() => handleLoadSampleResume('ds')} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white">DS</button>
                <button onClick={() => handleLoadSampleResume('marketing')} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white">MKT</button>
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Resume Document Text</label>
              <textarea
                value={resumeInput}
                onChange={(e) => setResumeInput(e.target.value)}
                rows={12}
                placeholder="Paste your resume text here..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <span>Parsing & Evaluating...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Analyze Against {targetRole.toUpperCase()} Rubric</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Score Breakdown & Feedback Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Score Summary Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:border-r md:border-slate-800 pr-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Role Score</span>
                <div className="mt-2 text-5xl font-extrabold text-white">
                  {resumeRecord ? resumeRecord.score : 86} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Strong SDE Alignment
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

            {/* Actionable Feedback Cards */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="font-bold text-white text-base">Actionable Feedback Cards</h3>
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button onClick={() => setFeedbackFilter('all')} className={`px-2.5 py-1 text-[11px] font-bold rounded ${feedbackFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>All</button>
                  <button onClick={() => setFeedbackFilter('high')} className={`px-2.5 py-1 text-[11px] font-bold rounded ${feedbackFilter === 'high' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>High Priority</button>
                  <button onClick={() => setFeedbackFilter('medium')} className={`px-2.5 py-1 text-[11px] font-bold rounded ${feedbackFilter === 'medium' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>Warnings</button>
                  <button onClick={() => setFeedbackFilter('success')} className={`px-2.5 py-1 text-[11px] font-bold rounded ${feedbackFilter === 'success' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Strengths</button>
                </div>
              </div>

              {filteredFeedback.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                  No feedback cards matching selected filter.
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

      {/* TAB 2 CONTENT: JD MATCHER & SKILLS GAP */}
      {activeTab === 'jd-match' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Job Description Input */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Paste Target Job Description (JD)</h3>
              <div className="flex items-center space-x-1">
                <button onClick={() => setJdInput(sampleJDsText.sde)} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white">SDE JD</button>
                <button onClick={() => setJdInput(sampleJDsText.ds)} className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white">DS JD</button>
              </div>
            </div>

            <textarea
              value={jdInput}
              onChange={(e) => setJdInput(e.target.value)}
              rows={14}
              placeholder="Paste Job Description text here..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleRunJDMatch}
              disabled={isMatching}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2"
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
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6">
            <div className="text-center p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Job Match Percentage</span>
              <div className="text-5xl font-extrabold text-purple-400">
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
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 font-semibold">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="font-bold text-white">Actionable Recommendations:</h4>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  {(jdMatchResult ? jdMatchResult.recommendations : [
                    'Explicitly incorporate missing target skills: GraphQL, Kubernetes into your Skills or Experience section.',
                    'Align your resume summary headline directly with the Senior Full Stack Engineer title.'
                  ]).map((rec, idx) => (
                    <li key={idx} className="leading-relaxed">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3 CONTENT: AI BULLET REWRITER */}
      {activeTab === 'ai-rewrite' && (
        <div className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
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
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    focusMode === 'quantify' ? 'bg-indigo-600 border-indigo-500 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-amber-300 font-extrabold">1. Quantify Impact</span>
                  <span className="text-[10px] font-normal block mt-0.5">Embed metrics & ROI</span>
                </button>

                <button
                  onClick={() => setFocusMode('action')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    focusMode === 'action' ? 'bg-indigo-600 border-indigo-500 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-indigo-300 font-extrabold">2. Action Verbs</span>
                  <span className="text-[10px] font-normal block mt-0.5">Architected, Scaled</span>
                </button>

                <button
                  onClick={() => setFocusMode('concise')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    focusMode === 'concise' ? 'bg-indigo-600 border-indigo-500 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-emerald-300 font-extrabold">3. Trim Filler</span>
                  <span className="text-[10px] font-normal block mt-0.5">Crisp ATS phrasing</span>
                </button>

                <button
                  onClick={() => setFocusMode('role-aligned')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    focusMode === 'role-aligned' ? 'bg-indigo-600 border-indigo-500 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="block text-purple-300 font-extrabold">4. Role Alignment</span>
                  <span className="text-[10px] font-normal block mt-0.5">Infuse SDE keywords</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleRunRewrite}
              disabled={isRewriting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
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
                  className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
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
      )}

      {/* TAB 4 CONTENT: PORTFOLIO & LEARNING RECOMMENDATIONS */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
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
              <div className="pt-2 border-t border-slate-900 text-slate-300">
                Verified activity in microservices, React, and TypeScript projects.
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white text-base">Curated Learning Paths</h3>
            <p className="text-xs text-slate-400">Targeted course recommendations to fill identified skill gaps.</p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-white font-bold">
                  <span>GraphQL & Microservices Architecture</span>
                  <span className="text-indigo-400">6 Hours</span>
                </div>
                <p className="text-slate-400 text-[11px]">Educative.io / Coursera</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-white font-bold">
                  <span>Kubernetes Deployment & DevOps Pipelines</span>
                  <span className="text-indigo-400">10 Hours</span>
                </div>
                <p className="text-slate-400 text-[11px]">Udemy / LinkedIn Learning</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5 CONTENT: AI MOCK INTERVIEW */}
      {activeTab === 'interview' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
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
              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
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

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 text-xs space-y-1">
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
      )}

      {/* TAB 6 CONTENT: GAMIFICATION & LEADERBOARD */}
      {activeTab === 'gamification' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Regional & University Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-400">Compete with fellow job seekers and earn badges by elevating your ATS resume score.</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Your Rank</span>
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
              <tbody className="divide-y divide-slate-850 text-slate-300">
                <tr className="bg-indigo-950/30">
                  <td className="py-3 px-4 font-bold text-amber-400">#1</td>
                  <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="avatar" className="w-6 h-6 rounded-full" />
                    <span>Alex Rivera (You)</span>
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

    </div>
  );
};

export default DashboardPage;
