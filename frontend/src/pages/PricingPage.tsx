import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock3, ShieldCheck, Shield, Settings, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLANS, type PricingPlan } from '../data/plans';
import type { User } from '../types';

const LOCAL_DB_KEY = 'resumeai_local_db';

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isAdmin = user?.userType === 'admin' || user?.email === 'admin@resumeai.com' || user?.email === 'piyushdubey447@gmail.com';
  const isSeeker = user?.userType === 'seeker';
  const isRecruiter = user?.userType === 'recruiter';
  const status = user?.subscriptionStatus;

  const requestPro = async (tier = 'Job Seeker Pro') => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.userType !== 'seeker') {
      setNotice('Pro plans are available for candidate accounts.');
      return;
    }
    const targetPlanId = tier === 'Career Max' ? 'career-max' : 'pro';
    const updated: User = {
      ...user,
      plan: targetPlanId,
      subscriptionStatus: 'pending',
      subscriptionRequestedAt: new Date().toISOString()
    };
    const saved = localStorage.getItem(LOCAL_DB_KEY);
    const db = saved ? JSON.parse(saved) : { users: [], resumes: [] };
    const index = db.users.findIndex((item: User) => item.id === user.id || item.email === user.email);
    if (index >= 0) db.users[index] = updated;
    else db.users.push(updated);
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
    localStorage.setItem('resumeai_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('resumeai-subscription-updated'));
    setNotice(`Your ${tier} request is pending admin approval. You will maintain Free access until approved.`);
  };

  const getPlanButton = (plan: PricingPlan) => {
    // 1. Admin Role: Admin is not a subscriber, shows management action
    if (isAdmin) {
      return (
        <button
          onClick={() => navigate('/admin')}
          className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-all flex items-center justify-center space-x-1 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Manage Plan Configuration</span>
        </button>
      );
    }

    // 2. Unauthenticated Visitor
    if (!user) {
      return (
        <button
          onClick={() => navigate('/register')}
          className="w-full py-2.5 bg-[#a84c38] hover:bg-[#8e3f2e] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1 cursor-pointer"
        >
          <span>{plan.id === 'free' ? 'Get Started Free' : plan.id === 'recruiter' ? 'Start Hiring' : 'Start Plan'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      );
    }

    // 3. Candidate (Seeker)
    if (isSeeker) {
      if (plan.targetRole === 'recruiter' || plan.targetRole === 'enterprise') {
        return (
          <span className="block text-center text-xs text-slate-500 py-2 italic">
            Available for Employer & Recruiter accounts
          </span>
        );
      }

      if (plan.id === 'free') {
        return (
          <button disabled className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl cursor-default">
            {user.plan === 'free' || !user.plan ? 'Current Active Plan' : 'Basic Tier Included'}
          </button>
        );
      }

      if (plan.id === 'pro') {
        const isCurrentActive = (user.plan === 'pro') && (status === 'approved' || status === 'active');
        const isPending = (user.plan === 'pro') && status === 'pending';
        return (
          <button
            onClick={() => !isCurrentActive && !isPending && requestPro('Job Seeker Pro')}
            disabled={isCurrentActive || isPending}
            className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
              isCurrentActive
                ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
                : isPending
                ? 'bg-amber-950/80 border border-amber-700/60 text-amber-300'
                : 'bg-[#a84c38] hover:bg-[#8e3f2e] text-white'
            }`}
          >
            {isCurrentActive ? 'Pro Active' : isPending ? 'Approval Pending' : 'Request Pro Access ($12/mo)'}
          </button>
        );
      }

      if (plan.id === 'career-max') {
        const isCurrentActive = (user.plan === 'career-max') && (status === 'approved' || status === 'active');
        const isPending = (user.plan === 'career-max') && status === 'pending';
        return (
          <button
            onClick={() => !isCurrentActive && !isPending && requestPro('Career Max')}
            disabled={isCurrentActive || isPending}
            className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
              isCurrentActive
                ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
                : isPending
                ? 'bg-amber-950/80 border border-amber-700/60 text-amber-300'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isCurrentActive ? 'Career Max Active' : isPending ? 'Approval Pending' : 'Request Career Max ($49/mo)'}
          </button>
        );
      }
    }

    // 4. Recruiter
    if (isRecruiter) {
      if (plan.targetRole === 'seeker') {
        return (
          <span className="block text-center text-xs text-slate-500 py-2 italic">
            Candidate plan
          </span>
        );
      }
      if (plan.id === 'recruiter') {
        return (
          <button
            onClick={() => navigate('/recruiter')}
            className="w-full py-2.5 bg-purple-950/80 border border-purple-700/60 text-purple-300 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Recruiter Hub Active
          </button>
        );
      }
      if (plan.id === 'enterprise') {
        return (
          <button
            onClick={() => navigate('/recruiter')}
            className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            Contact Sales for Enterprise
          </button>
        );
      }
    }

    return (
      <button
        onClick={() => navigate('/register')}
        className="w-full py-2.5 bg-[#a84c38] hover:bg-[#8e3f2e] text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
      >
        Get Started
      </button>
    );
  };

  const visiblePlans = PLANS.filter((plan) => {
    if (!user || isAdmin) return true;
    if (isSeeker) return plan.targetRole === 'seeker';
    if (isRecruiter) return plan.targetRole === 'recruiter' || plan.targetRole === 'enterprise';
    return true;
  });

  return (
    <main className="min-h-screen bg-[#f8f7f3] dark:bg-slate-950 px-5 py-16 text-[#1d2b3a] dark:text-slate-100 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl space-y-10">
        
        {/* ADMIN-ONLY CONTROLS BANNER */}
        {isAdmin && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/40 space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">ADMIN CONTROLS</span>
                  <h3 className="text-lg font-serif font-bold text-white">Platform Subscription Management</h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Open Admin Control Center</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block font-semibold text-[10px] uppercase">Active Seekers (Pro)</span>
                <span className="text-base font-bold text-white">1,420 Subscriptions</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block font-semibold text-[10px] uppercase">Active Recruiters</span>
                <span className="text-base font-bold text-purple-400">480 Accounts</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block font-semibold text-[10px] uppercase">Pending Approvals</span>
                <span className="text-base font-bold text-amber-400">12 Requests</span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a84c38]">
            {isSeeker ? 'Candidate Plans & Pricing' : isRecruiter ? 'Recruiter & Employer Plans' : 'Simple plans, clear access'}
          </p>
          <h1 className="font-serif text-5xl tracking-[-.04em] sm:text-6xl text-[#1d2b3a] dark:text-[#f4eee5]">Choose the support you need.</h1>
          <p className="text-lg leading-8 text-[#607078] dark:text-slate-400">
            {isSeeker
              ? 'Showing tailored candidate plans for your Seeker workspace.'
              : isRecruiter
              ? 'Showing employer screening plans for your Recruiter workspace.'
              : 'No confusing credits. Subscriptions are processed with transparent, predictable billing and role entitlements.'}
          </p>
        </div>

        {notice && (
          <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-300 rounded-2xl">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* PLAN CATALOG CARDS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visiblePlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            return (
              <section
                key={plan.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedPlan(plan.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedPlan(plan.id); }}
                className={`plan-card flex min-h-[490px] cursor-pointer flex-col border p-7 rounded-3xl transition-all ${
                  isSelected ? 'plan-card-selected border-[#a84c38] shadow-xl' : 'plan-card-default border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-[#a84c38]">{plan.eyebrow}</p>
                  {isAdmin && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {plan.activeSubscribersCount} subs
                    </span>
                  )}
                </div>

                <h2 className="mt-4 font-serif text-3xl text-white">{plan.name}</h2>
                
                <div className="mt-5 flex items-end gap-2">
                  <span className="font-serif text-5xl tracking-[-.05em] text-white">{plan.price}</span>
                  <span className="mb-2 text-xs text-slate-400">{plan.period}</span>
                </div>

                <p className="mt-5 min-h-12 text-xs leading-5 text-slate-400">{plan.description}</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex gap-2 items-start">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isSelected ? 'text-[#a84c38]' : 'text-emerald-400'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6 border-t border-slate-850">
                  {getPlanButton(plan)}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 flex items-start gap-3 border-t border-[#ded9cf] dark:border-slate-800 pt-6 text-sm text-[#667177] dark:text-slate-400">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#4d8b68]" />
          <p>
            <strong className="text-[#304954] dark:text-slate-200">Role & Plan Architecture:</strong> Candidate, Recruiter, and Admin access is enforced strictly at the route and API level. Administrators manage subscriptions and access permissions directly via the Admin Control Center.
          </p>
        </div>
      </div>
    </main>
  );
};

export default PricingPage;
