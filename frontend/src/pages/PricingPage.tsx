import React, { useState } from 'react';
import { Check, Clock3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

const LOCAL_DB_KEY = 'resumeai_local_db';

export const PricingPage: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const [notice, setNotice] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const requestPro = async (tier = 'Job Seeker Pro') => {
    if (!user) { await demoLogin('seeker'); setNotice('You’re signed in. Select Pro again to send your request.'); return; }
    if (user.userType !== 'seeker') { setNotice('Pro is available for job seeker accounts.'); return; }
    const updated: User = { ...user, plan: 'pro', subscriptionStatus: 'pending', subscriptionRequestedAt: new Date().toISOString() };
    const saved = localStorage.getItem(LOCAL_DB_KEY);
    const db = saved ? JSON.parse(saved) : { users: [], resumes: [] };
    const index = db.users.findIndex((item: User) => item.id === user.id || item.email === user.email);
    if (index >= 0) db.users[index] = updated; else db.users.push(updated);
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
    localStorage.setItem('resumeai_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('resumeai-subscription-updated'));
    setNotice(`Your ${tier} request is pending admin approval. You will keep Free access until it is approved.`);
  };
  const status = user?.subscriptionStatus;
  const isRecruiter = user?.userType === 'recruiter';
  const isSeeker = user?.userType === 'seeker';

  return <main className="min-h-screen bg-[#f8f7f3] dark:bg-slate-950 px-5 py-16 text-[#1d2b3a] dark:text-slate-100 sm:px-8 lg:py-24">
    <div className="mx-auto max-w-6xl">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a84c38]">Simple plans, clear access</p>
        <h1 className="mt-4 font-serif text-5xl tracking-[-.04em] sm:text-6xl text-[#1d2b3a] dark:text-[#f4eee5]">Choose the support you need.</h1>
        <p className="mt-5 text-lg leading-8 text-[#607078] dark:text-slate-400">No confusing credits. The Pro request is reviewed by an administrator before paid access is activated.</p>
      </div>
      {notice && <div className="mt-8 flex items-start gap-3 border border-[#d9c8b5] bg-[#fff7ee] p-4 text-sm text-[#6d4c2d]"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
      <div className={`mt-12 grid gap-5 ${isRecruiter && user ? 'mx-auto max-w-xl' : isSeeker && user ? 'lg:grid-cols-3' : 'lg:grid-cols-3'}`}>
        {(!isRecruiter || !user) && <>
          <Plan id="free" selected={selectedPlan === 'free'} onSelect={setSelectedPlan} eyebrow="For students" name="Free" price="$0" period="forever" description="A solid starting point for checking the fundamentals." features={['5 resume reviews each month', 'Engineering and data science rubrics', 'Clear, actionable feedback', 'Profile links and projects']} action={<a href="/dashboard" className="plan-button-secondary">Start with Free</a>} />
          <Plan id="pro" selected={selectedPlan === 'pro'} onSelect={setSelectedPlan} eyebrow="For active applicants" name="Job Seeker Pro" price="$12" period="per month" description="Everything you need to tailor each application with confidence." features={['Unlimited resume reviews', 'All four role rubrics', 'JD match and skills-gap reports', 'Bullet rewriter and mock interviews', 'Profile links and projects']} action={<button onClick={() => requestPro()} className="plan-button-primary">{status === 'approved' ? 'Pro is active' : status === 'pending' ? 'Approval pending' : 'Request Pro access'}</button>} />
          {isSeeker && <Plan id="career-max" selected={selectedPlan === 'career-max'} onSelect={setSelectedPlan} eyebrow="For ambitious candidates" name="Career Max" price="$49" period="per month" description="A complete application workspace for candidates targeting their next big role." features={['Everything in Job Seeker Pro', 'Unlimited resume and JD comparisons', 'Portfolio, GitHub, LinkedIn and coding links', 'Priority feedback and recruiter-ready exports', 'Advanced mock interview practice']} action={<button onClick={() => requestPro('Career Max')} className="plan-button-primary">{status === 'approved' ? 'Career Max active' : status === 'pending' ? 'Approval pending' : 'Request Career Max'}</button>} />}
        </>}
        {(!isSeeker || !user) && <Plan id="recruiter" selected={selectedPlan === 'recruiter'} onSelect={setSelectedPlan} eyebrow="For hiring teams" name="Recruiter" price="$49" period="per month" description="A focused workspace for screening and prioritising applicants." features={['Bulk resume uploads', 'Candidate ranking and filters', 'Exportable shortlists']} action={<a href="/recruiter" className="plan-button-secondary">Go to recruiter hub</a>} />}
      </div>
      <div className="mt-10 flex items-start gap-3 border-t border-[#ded9cf] dark:border-slate-800 pt-6 text-sm text-[#667177] dark:text-slate-400"><ShieldCheck className="h-5 w-5 shrink-0 text-[#4d8b68]" /><p><strong className="text-[#304954] dark:text-slate-200">Admin approval:</strong> when a seeker requests Pro, the request appears in the Admin dashboard. An admin can approve or decline it; the plan state is saved in this demo’s browser data.</p></div>
    </div>
  </main>;
};

const Plan: React.FC<{ id: string; selected: boolean; onSelect: (id: string) => void; eyebrow: string; name: string; price: string; period: string; description: string; features: string[]; action: React.ReactNode }> = ({ id, selected, onSelect, eyebrow, name, price, period, description, features, action }) => <section role="button" tabIndex={0} aria-pressed={selected} onClick={() => onSelect(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(id); }} className={`plan-card flex min-h-[470px] cursor-pointer flex-col border p-7 ${selected ? 'plan-card-selected' : 'plan-card-default'}`}><p className="text-xs font-bold uppercase tracking-[.14em] text-[#a84c38]">{eyebrow}</p><h2 className="mt-4 font-serif text-3xl">{name}</h2><div className="mt-5 flex items-end gap-2"><span className="font-serif text-6xl tracking-[-.05em]">{price}</span><span className="mb-2 text-sm text-[#69747a]">{period}</span></div><p className="mt-6 min-h-12 text-sm leading-6 text-[#607078]">{description}</p><ul className="mt-7 space-y-3 text-sm text-[#465961]">{features.map(feature => <li key={feature} className="flex gap-2"><Check className={`h-4 w-4 shrink-0 ${selected ? 'text-[#a84c38]' : 'text-[#4d8b68]'}`} />{feature}</li>)}</ul><div className="mt-auto pt-8">{action}</div></section>;

export default PricingPage;
