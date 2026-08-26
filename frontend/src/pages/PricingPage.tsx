import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock3, ShieldCheck, Shield, Settings, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLANS, type PricingPlan } from '../data/plans';
import { authApi } from '../services/api';

export const PricingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal dialog state
  const [modalConfig, setModalConfig] = useState<{
    type: 'cancel_12' | 'cancel_49' | 'switch_12_to_49' | 'switch_49_to_12' | null;
    currentPlanName: string;
    targetPlanName?: string;
  }>({ type: null, currentPlanName: '' });

  const isAdmin = user?.userType === 'admin' || user?.email === 'admin@resumeai.com' || user?.email === 'piyushdubey447@gmail.com';
  const isSeeker = user?.userType === 'seeker';
  const isRecruiter = user?.userType === 'recruiter';

  const fetchSubscriptionData = async () => {
    if (user) {
      try {
        const subRes = await authApi.getSubscription().catch(() => null);
        if (subRes && subRes.subscription) {
          setActiveSub(subRes.subscription);
        } else {
          setActiveSub(null);
        }

        const reqRes = await authApi.getSubscriptionRequests().catch(() => null);
        if (reqRes && reqRes.requests) {
          const pending = reqRes.requests.find((r: any) => r.status === 'pending');
          setPendingRequest(pending || null);
        } else {
          setPendingRequest(null);
        }
      } catch (err) {
        console.error('Failed to load subscription data:', err);
      }
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  // Current plan helpers
  const activePlanId = user?.plan || 'free';
  const isProActive = (activePlanId === 'job_seeker_pro' || activePlanId === 'pro') && activeSub && activeSub.status === 'active';
  const isMaxActive = activePlanId === 'career-max' && activeSub && activeSub.status === 'active';
  const isFreeActive = !isProActive && !isMaxActive;

  const requestPro = async (tier = 'Job Seeker Pro') => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.userType !== 'seeker') {
      setNotice('Pro plans are available for candidate accounts.');
      return;
    }
    const targetPlanId = tier === 'Career Max' ? 'career-max' : 'job_seeker_pro';
    
    setIsProcessing(true);
    try {
      const res = await authApi.requestSubscriptionUpgrade(targetPlanId);
      setPendingRequest(res.request);
      setNotice(`Upgrade request for ${tier} submitted successfully! Your request is waiting for administrator approval.`);
      
      await refreshUser();
      await fetchSubscriptionData();
      window.dispatchEvent(new Event('resumeai-subscription-updated'));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to submit upgrade request.';
      setNotice(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execution of cancellation
  const handleConfirmCancellation = async () => {
    setIsProcessing(true);
    try {
      await authApi.cancelSubscription();
      await refreshUser();
      await fetchSubscriptionData();
      window.dispatchEvent(new Event('resumeai-subscription-updated'));
      setNotice('Subscription / pending request cancelled successfully. Your plan is unlocked.');
      setModalConfig({ type: null, currentPlanName: '' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to cancel subscription.';
      setNotice(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execution of plan switch (Cancel existing -> Upgrade to new)
  const handleConfirmSwitch = async (targetPlanId: string, targetTierName: string) => {
    setIsProcessing(true);
    try {
      // Step A: Cancel current active subscription
      await authApi.cancelSubscription();
      // Step B: Submit upgrade request for new target plan
      const res = await authApi.requestSubscriptionUpgrade(targetPlanId);
      setPendingRequest(res.request);
      
      await refreshUser();
      await fetchSubscriptionData();
      window.dispatchEvent(new Event('resumeai-subscription-updated'));
      setNotice(`Plan switch requested! Current subscription cancelled and upgrade request for ${targetTierName} submitted.`);
      setModalConfig({ type: null, currentPlanName: '' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to switch subscription plan.';
      setNotice(errorMsg);
    } finally {
      setIsProcessing(false);
    }
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

      // Check if there is an active pending subscription action
      const hasPendingAction = !!pendingRequest && pendingRequest.status === 'pending';
      const pendingPlanId = pendingRequest ? (pendingRequest.requestedPlan === 'job_seeker_pro' || pendingRequest.requestedPlan === 'pro' ? 'pro' : 'career-max') : null;

      // STRICT ACTION LOCK: If another plan action is pending, block all non-pending plan buttons!
      if (hasPendingAction && plan.id !== pendingPlanId) {
        return (
          <button
            disabled
            className="w-full py-2.5 bg-slate-900/90 border border-slate-800/80 text-slate-500 font-semibold text-[11px] rounded-xl cursor-not-allowed opacity-60 text-center"
          >
            Unavailable while another subscription is pending
          </button>
        );
      }

      // FREE PLAN CARD
      if (plan.id === 'free') {
        if (isFreeActive) {
          return (
            <button disabled className="w-full py-2.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-xs rounded-xl cursor-default">
              Current Plan
            </button>
          );
        }
        if (isProActive) {
          return (
            <button
              disabled={isProcessing}
              onClick={() => setModalConfig({ type: 'cancel_12', currentPlanName: 'Job Seeker Pro ($12)' })}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel $12
            </button>
          );
        }
        if (isMaxActive) {
          return (
            <button
              disabled={isProcessing}
              onClick={() => setModalConfig({ type: 'cancel_49', currentPlanName: 'Career Max ($49)' })}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel $49
            </button>
          );
        }
      }

      // $12 PLAN CARD (JOB SEEKER PRO)
      if (plan.id === 'pro') {
        const isPending = hasPendingAction && pendingPlanId === 'pro';

        if (isPending) {
          return (
            <div className="space-y-2">
              <span className="block text-center text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 py-1.5 rounded-xl animate-pulse">
                Waiting for Confirmation
              </span>
              <button
                disabled={isProcessing}
                onClick={handleConfirmCancellation}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{isProcessing ? 'Cancelling...' : 'Cancel Subscription'}</span>
              </button>
            </div>
          );
        }

        if (isProActive) {
          return (
            <button disabled className="w-full py-2.5 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-xs rounded-xl cursor-default">
              Current Plan
            </button>
          );
        }

        if (isMaxActive) {
          return (
            <button
              disabled={isProcessing}
              onClick={() => setModalConfig({ type: 'switch_49_to_12', currentPlanName: 'Career Max ($49)', targetPlanName: 'Job Seeker Pro ($12)' })}
              className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel $49 to Switch
            </button>
          );
        }

        return (
          <button
            disabled={isProcessing}
            onClick={() => requestPro('Job Seeker Pro')}
            className="w-full py-2.5 bg-[#a84c38] hover:bg-[#8e3f2e] text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Upgrade to $12
          </button>
        );
      }

      // $49 PLAN CARD (CAREER MAX)
      if (plan.id === 'career-max') {
        const isPending = hasPendingAction && pendingPlanId === 'career-max';

        if (isPending) {
          return (
            <div className="space-y-2">
              <span className="block text-center text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 py-1.5 rounded-xl animate-pulse">
                Waiting for Confirmation
              </span>
              <button
                disabled={isProcessing}
                onClick={handleConfirmCancellation}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{isProcessing ? 'Cancelling...' : 'Cancel Subscription'}</span>
              </button>
            </div>
          );
        }
        
        if (isMaxActive) {
          return (
            <button disabled className="w-full py-2.5 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-xs rounded-xl cursor-default">
              Current Plan
            </button>
          );
        }

        if (isProActive) {
          return (
            <button
              disabled={isProcessing}
              onClick={() => setModalConfig({ type: 'switch_12_to_49', currentPlanName: 'Job Seeker Pro ($12)', targetPlanName: 'Career Max ($49)' })}
              className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel $12 to Switch
            </button>
          );
        }

        return (
          <button
            disabled={isProcessing}
            onClick={() => requestPro('Career Max')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Upgrade to $49
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

                {plan.id === 'free' && user && isSeeker && (
                  <div className="mt-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex justify-between items-center font-bold text-white mb-1">
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider">Current Usage</span>
                      <span className={((user.monthlyUsage || 0) >= 5 && isFreeActive) ? "text-rose-400 font-extrabold" : "text-emerald-400 font-bold"}>
                        {isFreeActive ? `${user.monthlyUsage || 0} / 5 used` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {!isFreeActive
                        ? 'Unlimited access on your active plan'
                        : (user.monthlyUsage || 0) >= 5
                        ? 'Limit reached for this month'
                        : `${Math.max(0, 5 - (user.monthlyUsage || 0))} reviews remaining`}
                    </div>
                  </div>
                )}

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

      {/* SAFE PLAN TRANSITION CONFIRMATION MODAL */}
      {modalConfig.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">
                  {modalConfig.type.startsWith('switch') ? 'Switch Subscription Plan' : 'Confirm Subscription Cancellation'}
                </h3>
                <span className="text-xs text-slate-400 block">Single Active Plan Safeguard</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">
                You currently have an active <span className="text-amber-300 font-bold">{modalConfig.currentPlanName}</span> subscription.
              </p>
              <p className="text-slate-400 leading-relaxed">
                {modalConfig.type === 'cancel_12' && 'Cancel your $12 subscription before switching to the Free plan.'}
                {modalConfig.type === 'cancel_49' && 'Cancel your $49 subscription before switching to the Free plan.'}
                {modalConfig.type === 'switch_12_to_49' && 'Cancel your current $12 subscription before switching to the $49 plan.'}
                {modalConfig.type === 'switch_49_to_12' && 'Cancel your current $49 subscription before switching to the $12 plan.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                disabled={isProcessing}
                onClick={() => setModalConfig({ type: null, currentPlanName: '' })}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {modalConfig.type === 'cancel_12' || modalConfig.type === 'switch_12_to_49' ? 'Keep $12 Plan' : 'Keep $49 Plan'}
              </button>

              {modalConfig.type === 'cancel_12' && (
                <button
                  disabled={isProcessing}
                  onClick={handleConfirmCancellation}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cancel $12 Subscription</span>
                </button>
              )}

              {modalConfig.type === 'cancel_49' && (
                <button
                  disabled={isProcessing}
                  onClick={handleConfirmCancellation}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cancel $49 Subscription</span>
                </button>
              )}

              {modalConfig.type === 'switch_12_to_49' && (
                <button
                  disabled={isProcessing}
                  onClick={() => handleConfirmSwitch('career-max', 'Career Max ($49)')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cancel $12 & Switch to $49</span>
                </button>
              )}

              {modalConfig.type === 'switch_49_to_12' && (
                <button
                  disabled={isProcessing}
                  onClick={() => handleConfirmSwitch('job_seeker_pro', 'Job Seeker Pro ($12)')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cancel $49 & Switch to $12</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PricingPage;
