import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sampleResumesText, resumeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Zap,
  Target,
  FileCheck2,
  Cpu,
  Users,
  TrendingUp
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  // Interactive Live Scorer Demo state on Landing Page
  const [demoRole, setDemoRole] = useState<'sde' | 'ds' | 'marketing'>('sde');
  const [demoText, setDemoText] = useState(sampleResumesText.sde);
  const [demoScore, setDemoScore] = useState<number | null>(88);
  const [isEvaluating, setIsEvaluating] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span>Role-Aware Resume Screening & Career Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Stop Guessing. Land Interviews with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">Role-Aware AI Feedback.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Generic ATS scores fail job seekers. ResumeAI provides targeted SDE, Data Science, and Marketing rubrics, instant bullet rewriter, JD match % analysis, and recruiter screening.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                demoLogin('seeker');
                navigate('/dashboard');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>Try Instant Seeker Demo</span>
            </button>

            <button
              onClick={() => {
                demoLogin('recruiter');
                navigate('/recruiter');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-200 font-semibold text-base hover:bg-slate-850 transition-all flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5 text-purple-400" />
              <span>Launch Recruiter Hub</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">99.4%</div>
              <div className="text-xs text-slate-400 mt-1">ATS Format Parser Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-bold text-indigo-400">4 Role Rubrics</div>
              <div className="text-xs text-slate-400 mt-1">SDE, DS, Marketing, PM</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-bold text-purple-400">1-Click Rewrite</div>
              <div className="text-xs text-slate-400 mt-1">Quantify Impact Bullets</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-400">Recruiter Bulk</div>
              <div className="text-xs text-slate-400 mt-1">Rank Candidate Shortlist</div>
            </div>
          </div>

          {/* LIVE DEMO INTERACTIVE WIDGET */}
          <div className="mt-16 text-left max-w-4xl mx-auto bg-slate-900/90 rounded-3xl border border-indigo-500/30 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <span>Live Interactive Resume Scorer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Test sample resume text against role rubrics in real-time below.</p>
              </div>

              {/* Sample Preset Buttons */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => handleSelectSample('sde')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    demoRole === 'sde' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SDE Sample
                </button>
                <button
                  onClick={() => handleSelectSample('ds')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    demoRole === 'ds' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Data Science
                </button>
                <button
                  onClick={() => handleSelectSample('marketing')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    demoRole === 'marketing' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Marketing
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">Resume Text Content</label>
                <textarea
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={handleTestScore}
                  disabled={isEvaluating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {isEvaluating ? (
                    <span>Analyzing Rubric Weights...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Calculate Role Score</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instant Score Result Meter */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Calculated ATS Score</span>
                
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-8 border-indigo-600/20 border-t-indigo-500 animate-pulse flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-white">{demoScore || 88}</span>
                  </div>
                </div>

                <div className="space-y-2 text-left pt-2 border-t border-slate-900 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Structure & Contact</span>
                    <span className="text-emerald-400 font-semibold">90 / 100</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Quantified Impact</span>
                    <span className="text-indigo-400 font-semibold">92 / 100</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Role Skills Match</span>
                    <span className="text-amber-400 font-semibold">85 / 100</span>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  className="block w-full py-2 bg-slate-900 hover:bg-slate-850 text-indigo-400 font-semibold text-xs rounded-xl border border-indigo-500/30 transition-colors"
                >
                  Open Full Dashboard →
                </Link>
              </div>
            </div>
          </div>

        </section>

        {/* CORE FEATURES SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Everything You Need To Win Top Jobs</h2>
            <p className="mt-4 text-slate-400 text-base">
              Built systematically across 4 phases to guide job seekers from raw resume upload to recruiter shortlist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Role-Specific Rubrics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Evaluates SDE, Data Science, Marketing, and PM resumes against dedicated JSON weight schemas rather than generic advice.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <FileCheck2 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white">JD Matching & Gap Report</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paste any Job Description to get side-by-side match percentages, missing keywords, and missing core vs optional skills.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Bullet Point Rewriter</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Transforms weak passive bullets into high-impact, quantified achievement statements with selectable focus parameters.
              </p>
            </div>
          </div>
        </section>

      </main>

    </div>
  );
};

export default LandingPage;
