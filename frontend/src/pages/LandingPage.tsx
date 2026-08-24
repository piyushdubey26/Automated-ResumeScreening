import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, Search, Users } from 'lucide-react';
import { sampleResumesText, resumeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();
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
    } finally { setIsEvaluating(false); }
  };

  const isRecruiterMode = user?.userType === 'recruiter';

  return (
    <main className="landing-page min-h-screen bg-[#f8f7f3] text-[#1d2b3a]">
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="lg:col-span-7 lg:pt-7">
          <p className="mb-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a84c38]">
            <span className="h-px w-8 bg-[#a84c38]" />
            {isRecruiterMode ? "Resume Screening that saves time" : "Resume guidance that speaks plainly"}
          </p>
          {isAuthenticated && <p className="mb-5 text-sm text-[#5e6870]">Welcome back, {user?.name}. Your hiring overview is ready.</p>}
          
          <h1 className="max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.045em] text-[#172735] sm:text-6xl lg:text-7xl">
            {isRecruiterMode ? (
              <>Find the right candidates before the first <em className="font-normal text-[#a84c38]">interview.</em></>
            ) : (
              <>A clearer path from resume to <em className="font-normal text-[#a84c38]">interview.</em></>
            )}
          </h1>
          
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#58636b]">
            {isRecruiterMode 
              ? "Upload a job description, let ResumeAI analyze your applicants, rank them, explain why, and surface the people worth interviewing."
              : "Get a practical read on your resume, see how it fits a role, and improve the parts that matter before you apply."}
          </p>
          
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isRecruiterMode ? (
              <>
                <button 
                  onClick={() => navigate('/recruiter', { state: { openCreateJob: true } })} 
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1d3848] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294c60] cursor-pointer"
                >
                  + Create a Job
                </button>
                <button 
                  onClick={() => navigate('/recruiter')} 
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] px-5 py-3 text-sm font-semibold text-[#294452] transition hover:border-[#7d8c8f] hover:bg-white cursor-pointer"
                >
                  View Candidates
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { demoLogin('seeker'); navigate('/dashboard'); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1d3848] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294c60] cursor-pointer">Review a resume <ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => { demoLogin('recruiter'); navigate('/recruiter'); }} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#cfcac0] px-5 py-3 text-sm font-semibold text-[#294452] transition hover:border-[#7d8c8f] hover:bg-white cursor-pointer">I’m hiring <Users className="h-4 w-4" /></button>
              </>
            )}
          </div>
          
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#59676d]">
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
        
        <div className="relative lg:col-span-5">
          <div className="absolute -left-3 top-7 h-full w-full border border-[#d8d3c8]" />
          <div className="relative bg-[#fffefa] p-5 shadow-[0_20px_45px_rgba(34,48,53,0.10)] sm:p-7">
            {isRecruiterMode ? (
              /* Recruiter Hero Review Card showing AI screening */
              <div>
                <div className="flex items-start justify-between border-b border-[#e7e2d9] pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a84c38]">AI Screening</p>
                    <h2 className="mt-1 font-serif text-xl text-[#1d2b3a]">Senior Frontend Engineer</h2>
                  </div>
                  <span className="rounded-full bg-[#e6eee9] px-2.5 py-0.5 text-xs font-bold text-[#35634c]">142 applications</span>
                </div>
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f7f6f1] border border-[#d8d3c8]/50">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-[#a84c38]">#1</span>
                        <strong className="text-sm text-[#1d2b3a]">Aarav Sharma</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">React · Next.js · TypeScript · AWS</p>
                      <p className="text-[10px] text-slate-400">5 years experience</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#234a40] block">96%</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#35634c] bg-[#e6eee9] px-1.5 py-0.5 rounded">Strong Match</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f7f6f1]/60 border border-[#d8d3c8]/30">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-450">#2</span>
                        <strong className="text-sm text-[#1d2b3a]">Priya Mehta</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">React · TypeScript · Node.js</p>
                      <p className="text-[10px] text-slate-400">4 years experience</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#234a40] block">91%</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#35634c] bg-[#e6eee9] px-1.5 py-0.5 rounded">Strong Match</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#f7f6f1]/30 border border-[#d8d3c8]/20">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-400">#3</span>
                        <strong className="text-sm text-[#1d2b3a]">Rahul Verma</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">React · JavaScript · AWS</p>
                      <p className="text-[10px] text-slate-400">3 years experience</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#a06d28] block">87%</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-[#a06d28] bg-[#fbf3e6] px-1.5 py-0.5 rounded">Review</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Original Candidate Review Card */
              <>
                <div className="flex items-start justify-between border-b border-[#e7e2d9] pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a84c38]">Resume review</p>
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
      <section className="border-y border-[#ded9cf] bg-[#efeee8]"><div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#d9d4ca] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">{[['01', 'Choose a target', 'Select a role rubric that fits the job you want next.'], ['02', 'Get the useful details', 'See what reads well, what is missing, and where to focus.'], ['03', 'Apply with confidence', 'Keep a sharper resume and compare it to the job description.']].map(([number, title, text]) => <div key={number} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0"><span className="text-xs font-bold tracking-[0.16em] text-[#a84c38]">{number}</span><h3 className="mt-4 font-serif text-2xl text-[#1d2b3a]">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#667177]">{text}</p></div>)}</div></section>
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:py-28"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a84c38]">Try a sample</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-[#1d2b3a]">See a review in context.</h2></div><p className="max-w-sm text-sm leading-6 text-[#667177]">Edit the sample or switch roles. We’ll run it through the same scoring flow used in the dashboard.</p></div><div className="border border-[#d8d3c8] bg-white p-4 shadow-[0_12px_30px_rgba(34,48,53,0.06)] sm:p-6"><div className="flex flex-col gap-4 border-b border-[#e6e1d8] pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-[#a84c38]" /><div><h3 className="font-semibold">Test a sample resume</h3><p className="text-xs text-[#69747a]">Pick a role, then run a quick review.</p></div></div><div className="flex rounded-md bg-[#f1f0eb] p-1">{(['sde', 'ds', 'marketing'] as const).map(role => <button key={role} onClick={() => handleSelectSample(role)} className={`rounded px-3 py-1.5 text-xs font-semibold transition ${demoRole === role ? 'bg-white text-[#1d3848] shadow-sm' : 'text-[#69747a]'}`}>{role === 'sde' ? 'Engineering' : role === 'ds' ? 'Data science' : 'Marketing'}</button>)}</div></div><div className="mt-5 grid gap-5 lg:grid-cols-[1fr_200px]"><textarea value={demoText} onChange={(e) => setDemoText(e.target.value)} rows={9} className="w-full resize-none border border-[#d8d3c8] bg-[#fcfbf8] p-4 font-mono text-xs leading-5 text-[#40515b] outline-none transition focus:border-[#577683]" /><aside className="flex flex-col justify-between border border-[#d8d3c8] bg-[#f7f6f1] p-5"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#68757a]">Review score</p><p className="mt-3 font-serif text-6xl text-[#1d3848]">{demoScore ?? '—'}</p><p className="mt-1 text-xs text-[#68757a]">out of 100</p><div className="mt-6 border-t border-[#ded9cf] pt-4 text-xs leading-6 text-[#59676d]"><p>Looks for relevant skills, clear structure, and evidence of impact.</p></div></div><button onClick={handleTestScore} disabled={isEvaluating} className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[#a84c38] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#8d3d2d] disabled:opacity-60"><Search className="h-3.5 w-3.5" />{isEvaluating ? 'Reviewing…' : 'Review sample'}</button></aside></div></div><p className="mt-6 text-center text-sm text-[#69747a]">Want the full set of tools? <Link className="font-semibold text-[#a84c38] underline decoration-[#d9ad9e] underline-offset-4" to="/features">Explore what’s included</Link>.</p></section>
    </main>
  );
};

export default LandingPage;
