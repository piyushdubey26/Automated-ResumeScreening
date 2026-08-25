import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, FileCheck2, Users, Check, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FeaturesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30 uppercase tracking-widest">
          Platform Architecture & Capabilities
        </span>
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Engineered for Maximum Candidate Impact</h1>
        <p className="text-slate-400 text-lg">Explore the granular scoring rubrics, JD matcher algorithms, recruiter screening, and platform controls powering ResumeAI.</p>
      </div>

      <div className="space-y-12">
        
        {/* Phase 1: Candidate Rubrics */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phase 1: Role-Specific Scoring Rubrics</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Unlike generic ATS checkers that rely on naive keyword counts, ResumeAI evaluates resumes against role-tailored JSON rubrics for Software Engineering, Data Science, Marketing, and Product Management.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Structure & Contact Formatting (20%)</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Quantified Achievements & Metrics (25%)</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Role-Specific Hard Skills (20%)</span></li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
            <span className="text-indigo-400 font-bold block">// shared/rubrics/sde.json</span>
            <pre className="text-slate-400 overflow-x-auto p-2 bg-slate-900 rounded-lg">
{`{
  "weights": { "structure": 0.2, "impact": 0.25, "skills": 0.2 },
  "keywords": ["data structures", "system design", "docker", "aws"],
  "penalties": { "tables": 5, "passiveVoice": 3 }
}`}
            </pre>
          </div>
        </div>

        {/* Phase 2: JD Matcher & AI Rewriter */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-300 font-bold">JD Match Engine Output</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">91% Match</span>
            </div>
            <div className="text-slate-400">
              <p>Matched Keywords: TypeScript, Node.js, Express, PostgreSQL, Docker, AWS</p>
              <p className="text-rose-400 mt-1">Missing Core Skills: GraphQL, Kubernetes</p>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phase 2: JD Matcher & AI Bullet Rewriter</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compare your resume against any target Job Description. The engine calculates keyword coverage, semantic embedding similarity, and impact gaps, while the AI Bullet Rewriter instantly elevates weak bullet points.
            </p>
          </div>
        </div>

        {/* Phase 3: Recruiter Bulk Screening */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phase 3: Recruiter Bulk Screening Dashboard</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Recruiters can post Job Descriptions and bulk-upload dozens of applicant resumes simultaneously. Candidates are automatically parsed, scored, ranked by match percentage, and organized into shortlists.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-slate-300 pb-2 border-b border-slate-800">
              <span>Candidate Name</span>
              <span>Match %</span>
              <span>Status</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 py-1">
              <span>Alex Rivera</span>
              <span className="text-emerald-400 font-bold">92%</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">Shortlisted</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 py-1">
              <span>David Chen</span>
              <span className="text-amber-400 font-bold">76%</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">Under Review</span>
            </div>
          </div>
        </div>

        {/* Phase 4: Platform & Governance Capabilities (Admin / Ecosystem) */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-amber-500/30 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
          <div className="order-2 md:order-1 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Platform Controls & Telemetry
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">System Active</span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">User & Role Management:</span>
                <span className="font-bold text-white">Candidate / Recruiter / Admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subscription Approvals:</span>
                <span className="font-bold text-emerald-400">Pro & Recruiter Tiers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Tokens & Usage Limits:</span>
                <span className="font-bold text-indigo-400">Monitored & Rate-limited</span>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phase 4: Platform Governance & Admin Controls</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Complete administrative control over user accounts, recruiter plan approvals, telemetry metrics, and AI model quotas. Platform administrators maintain oversight across candidate and recruiter ecosystems.
            </p>
          </div>
        </div>

      </div>

      {/* ROLE-AWARE CTA BAR */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 text-center space-y-4 shadow-2xl">
        <h3 className="text-xl font-bold text-white">Ready to experience ResumeAI?</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          {user?.userType === 'admin'
            ? 'You are signed in as a Platform Administrator. Access system metrics, user approvals, and pricing controls.'
            : user?.userType === 'recruiter'
            ? 'Screen applicants, post new job listings, and automate candidate rankings in Recruiter Hub.'
            : user?.userType === 'seeker'
            ? 'Score your resume, analyze skills gaps, and optimize bullet points in your Seeker Workspace.'
            : 'Join thousands of candidates and recruiters using AI-powered resume screening.'}
        </p>

        <div className="pt-2 flex justify-center">
          {user?.userType === 'admin' ? (
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-3 bg-[#a84c38] hover:bg-[#8e3f2e] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Open Admin Control Center</span>
            </button>
          ) : user?.userType === 'recruiter' ? (
            <button
              onClick={() => navigate('/recruiter')}
              className="px-6 py-3 bg-[#1d3848] hover:bg-[#294c60] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span>Open Recruiter Hub</span>
            </button>
          ) : user?.userType === 'seeker' ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-[#1d3848] hover:bg-[#294c60] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Open Seeker Workspace</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
