import React from 'react';
import { Check } from 'lucide-react';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30 uppercase tracking-widest">
          Transparent Plans
        </span>
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Plans Built for Students & Recruiters</h1>
        <p className="text-slate-400 text-lg">Choose the tier that aligns with your job hunt or recruiting workflow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Tier 1 */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Student / Free</span>
            <div className="text-4xl font-extrabold text-white mt-2">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></div>
            <p className="text-slate-400 text-xs mt-3">Essential role scoring and basic ATS checks for students.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>5 Resume Scans / month</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>SDE & Data Science Rubrics</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Actionable Feedback Cards</span></li>
            </ul>
          </div>
          <a href="/dashboard" className="w-full py-3 text-center bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition-colors">
            Get Started Free
          </a>
        </div>

        {/* Tier 2 (Highlighted) */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border-2 border-indigo-500 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-indigo-950">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-full shadow">
            Most Popular
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Job Seeker Pro</span>
            <div className="text-4xl font-extrabold text-white mt-2">$12 <span className="text-xs font-normal text-slate-400">/ month</span></div>
            <p className="text-slate-400 text-xs mt-3">Full suite with JD matching, AI bullet rewriter, and mock interview prep.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Unlimited Resume Scans</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>All 4 Role Rubrics (SDE, DS, Marketing, PM)</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Unlimited JD Match & Gap Reports</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>AI Bullet Point Rewriter</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>AI Mock Interview Generator</span></li>
            </ul>
          </div>
          <a href="/dashboard" className="w-full py-3 text-center bg-indigo-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors">
            Start Seeker Pro Trial
          </a>
        </div>

        {/* Tier 3 */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Recruiter / Team</span>
            <div className="text-4xl font-extrabold text-white mt-2">$49 <span className="text-xs font-normal text-slate-400">/ month</span></div>
            <p className="text-slate-400 text-xs mt-3">Bulk multi-candidate screening, JD posting, and ranked shortlists.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Bulk Resume Upload & Screening</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Candidate Ranking & Match % Filter</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /> <span>Recruiter Shortlist Export</span></li>
            </ul>
          </div>
          <a href="/recruiter" className="w-full py-3 text-center bg-purple-600 rounded-xl text-xs font-bold text-white hover:bg-purple-500 transition-colors">
            Access Recruiter Hub
          </a>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
