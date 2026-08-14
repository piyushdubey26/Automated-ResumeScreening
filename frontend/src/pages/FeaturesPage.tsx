import React from 'react';
import { Target, FileCheck2, Users, Check } from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30 uppercase tracking-widest">
          Platform Architecture & Capabilities
        </span>
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Engineered for Maximum Candidate Impact</h1>
        <p className="text-slate-400 text-lg">Explore the granular scoring rubrics, JD matcher algorithms, and recruiter tools powering ResumeAI.</p>
      </div>

      <div className="space-y-12">
        
        {/* Feature 1 */}
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

        {/* Feature 2 */}
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

        {/* Feature 3 */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Phase 4: Recruiter Bulk Screening Dashboard</h2>
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

      </div>
    </div>
  );
};

export default FeaturesPage;
