import React, { useState } from 'react';
import { sampleJDsText, recruiterApi } from '../services/api';
import type { RecruiterCandidate } from '../types';
import {
  FileCheck2,
  Sparkles,
  Eye
} from 'lucide-react';

export const RecruiterDashboardPage: React.FC = () => {
  const [jdTitle, setJdTitle] = useState('Senior Full Stack Engineer (SDE II)');
  const [targetRole, setTargetRole] = useState<'sde' | 'data-science' | 'marketing' | 'product-management'>('sde');
  const [jdText, setJdText] = useState(sampleJDsText.sde);

  // Get initial candidates dynamically from local storage database if available
  const getInitialCandidates = (): RecruiterCandidate[] => {
    let name = 'Alex Rivera';
    let email = 'alex.rivera@example.com';
    let score = 88;
    let text = 'Full Stack Engineer. Built Node.js, React, PostgreSQL, Docker, AWS microservices handling 2M+ requests.';

    try {
      const savedUserStr = localStorage.getItem('resumeai_user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.name && savedUser.name !== 'Recruiter Admin') {
          name = savedUser.name;
          email = savedUser.email;
        }
      }
    } catch (e) {}

    // Check if there is an uploaded resume in the database
    try {
      const savedDb = localStorage.getItem('resumeai_local_db');
      if (savedDb) {
        const db = JSON.parse(savedDb);
        if (db.resumes && db.resumes.length > 0) {
          // Get the last parsed resume
          const lastResume = db.resumes[db.resumes.length - 1];
          return [
            {
              id: lastResume.id,
              recruiterJobId: 'j-1',
              candidateName: lastResume.parsedSections.contact.name || name,
              candidateEmail: lastResume.parsedSections.contact.email || email,
              targetRole: lastResume.targetRole,
              resumeText: lastResume.rawText,
              overallScore: lastResume.score,
              jdMatchPct: lastResume.score >= 80 ? 92 : lastResume.score >= 65 ? 74 : 58,
              status: lastResume.score >= 80 ? 'Shortlisted' : lastResume.score >= 65 ? 'Under Review' : 'Rejected',
              appliedAt: lastResume.createdAt
            },
            { id: 'c-2', recruiterJobId: 'j-1', candidateName: 'Priya Sharma', candidateEmail: 'priya.sharma@example.com', targetRole: 'data-science', resumeText: 'Data Scientist in Python, PyTorch, SQL, Spark. Built BERT NLP models.', overallScore: 84, jdMatchPct: 86, status: 'Shortlisted', appliedAt: '2026-08-11T14:30:00Z' },
            { id: 'c-3', recruiterJobId: 'j-1', candidateName: 'David Chen', candidateEmail: 'david.chen@example.com', targetRole: 'sde', resumeText: 'Backend Developer in Python, Django, MySQL, AWS REST APIs.', overallScore: 76, jdMatchPct: 74, status: 'Under Review', appliedAt: '2026-08-10T09:15:00Z' },
            { id: 'c-4', recruiterJobId: 'j-1', candidateName: 'Maria Garcia', candidateEmail: 'maria.garcia@example.com', targetRole: 'sde', resumeText: 'Frontend Developer in Vue.js, HTML, CSS, Webpack.', overallScore: 64, jdMatchPct: 58, status: 'Rejected', appliedAt: '2026-08-09T16:45:00Z' }
          ];
        }
      }
    } catch (e) {}

    return [
      { id: 'c-1', recruiterJobId: 'j-1', candidateName: name, candidateEmail: email, targetRole: 'sde', resumeText: text, overallScore: score, jdMatchPct: 92, status: 'Shortlisted', appliedAt: '2026-08-12T10:00:00Z' },
      { id: 'c-2', recruiterJobId: 'j-1', candidateName: 'Priya Sharma', candidateEmail: 'priya.sharma@example.com', targetRole: 'data-science', resumeText: 'Data Scientist in Python, PyTorch, SQL, Spark. Built BERT NLP models.', overallScore: 84, jdMatchPct: 86, status: 'Shortlisted', appliedAt: '2026-08-11T14:30:00Z' },
      { id: 'c-3', recruiterJobId: 'j-1', candidateName: 'David Chen', candidateEmail: 'david.chen@example.com', targetRole: 'sde', resumeText: 'Backend Developer in Python, Django, MySQL, AWS REST APIs.', overallScore: 76, jdMatchPct: 74, status: 'Under Review', appliedAt: '2026-08-10T09:15:00Z' },
      { id: 'c-4', recruiterJobId: 'j-1', candidateName: 'Maria Garcia', candidateEmail: 'maria.garcia@example.com', targetRole: 'sde', resumeText: 'Frontend Developer in Vue.js, HTML, CSS, Webpack.', overallScore: 64, jdMatchPct: 58, status: 'Rejected', appliedAt: '2026-08-09T16:45:00Z' }
    ];
  };

  // Shortlist Candidates State
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>(getInitialCandidates);

  const [statusFilter, setStatusFilter] = useState<'all' | 'Shortlisted' | 'Under Review' | 'Rejected'>('all');
  const [isScreening, setIsScreening] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null);

  // Trigger Bulk Multi-Candidate Screening
  const handleBulkScreen = async () => {
    setIsScreening(true);
    try {
      const res = await recruiterApi.bulkScreen([], jdText, targetRole);
      setCandidates(res.shortlist);
    } finally {
      setIsScreening(false);
    }
  };

  // Update Status
  const handleStatusChange = (id: string, newStatus: 'Shortlisted' | 'Under Review' | 'Rejected') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const filteredCandidates = candidates.filter(c => {
    return statusFilter === 'all' || c.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* RECRUITER HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
            Recruiter Talent Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Multi-Candidate Resume Screening</h1>
          <p className="text-xs text-slate-400">Post job descriptions, bulk upload applicant resumes, and manage ranked shortlists.</p>
        </div>

        <button
          onClick={handleBulkScreen}
          disabled={isScreening}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-purple-600/30 transition-all flex items-center space-x-2 shrink-0"
        >
          {isScreening ? (
            <span>Screening Applicant Batch...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Run Automated Bulk Screening</span>
            </>
          )}
        </button>
      </div>

      {/* JOB DESCRIPTION CONFIG & CANDIDATE STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: JD Setup */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-purple-400" />
            <span>Active Job Posting</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Job Title</label>
            <input
              type="text"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Rubric Category</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="sde">Software Development Engineer (SDE)</option>
              <option value="data-science">Data Scientist / ML</option>
              <option value="marketing">Growth & Marketing</option>
              <option value="product-management">Product Management</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Job Description Text</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={8}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Candidate Screening Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base">Ranked Candidate Shortlist</h3>
              <p className="text-xs text-slate-400">Automated rank order by JD Match Percentage.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1 font-bold rounded ${statusFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>All ({candidates.length})</button>
              <button onClick={() => setStatusFilter('Shortlisted')} className={`px-2.5 py-1 font-bold rounded ${statusFilter === 'Shortlisted' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Shortlisted</button>
              <button onClick={() => setStatusFilter('Under Review')} className={`px-2.5 py-1 font-bold rounded ${statusFilter === 'Under Review' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}>Review</button>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Overall Score</th>
                  <th className="py-3 px-3">JD Match %</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white text-xs">{c.candidateName}</div>
                      <div className="text-[11px] text-slate-400">{c.candidateEmail}</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-200">
                      {c.overallScore} / 100
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`font-extrabold ${c.jdMatchPct >= 80 ? 'text-emerald-400' : c.jdMatchPct >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {c.jdMatchPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as any)}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-bold text-white focus:outline-none"
                      >
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 hover:text-white transition-colors"
                        title="View Resume Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Candidate Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedCandidate.candidateName}</h3>
                <p className="text-xs text-slate-400">{selectedCandidate.candidateEmail}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono text-slate-300">
              <span className="text-purple-400 font-bold block">// Resume Text Summary</span>
              <p>{selectedCandidate.resumeText}</p>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecruiterDashboardPage;
