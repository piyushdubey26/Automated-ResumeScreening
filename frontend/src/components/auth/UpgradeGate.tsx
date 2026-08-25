import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { FEATURE_GATE_INFO, type FeatureKey } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';

interface UpgradeGateProps {
  featureKey: FeatureKey;
  customMessage?: string;
  reason?: 'upgrade_required' | 'limit_reached' | 'unauthenticated' | 'wrong_role';
}

export const UpgradeGate: React.FC<UpgradeGateProps> = ({ featureKey, customMessage, reason = 'upgrade_required' }) => {
  const { user } = useAuth();
  const info = FEATURE_GATE_INFO[featureKey] || {
    featureKey,
    title: 'Premium Feature',
    description: 'Upgrade your subscription plan to unlock full access to this tool.',
    requiredPlanName: 'Job Seeker Pro',
    badgeText: '✦ PRO FEATURE'
  };

  const isLimitReached = reason === 'limit_reached';

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/90 border border-amber-500/30 p-8 rounded-3xl space-y-6 shadow-2xl text-center relative overflow-hidden backdrop-blur-md animate-fadeIn">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#a84c38]/15 rounded-full filter blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-[#a84c38]/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
          {isLimitReached ? (
            <ShieldAlert className="w-7 h-7 text-amber-400" />
          ) : (
            <Sparkles className="w-7 h-7 text-amber-400" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold tracking-widest uppercase">
          <Lock className="w-3 h-3 mr-1" />
          {info.badgeText}
        </span>
        
        <h2 className="font-serif text-2xl font-bold text-white mt-3">
          {isLimitReached ? 'Monthly Review Limit Reached' : info.title}
        </h2>
        
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          {customMessage || (isLimitReached
            ? `You have used your 5 free monthly resume reviews. Upgrade to ${info.requiredPlanName} for unlimited reviews and advanced AI tools.`
            : `${info.description} Available with ${info.requiredPlanName}.`
          )}
        </p>
      </div>

      {user && (
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 inline-block">
          Current Plan: <strong className="text-white uppercase font-bold">{user.plan || 'Free'}</strong>
          {user.subscriptionStatus === 'pending' && <span className="ml-2 text-amber-400 font-medium">(Approval Pending)</span>}
        </div>
      )}

      <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/pricing"
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 via-[#a84c38] to-[#8e3f2e] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#a84c38]/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <span>Upgrade to {info.requiredPlanName}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/features"
          className="w-full sm:w-auto px-5 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl transition-all text-center"
        >
          Learn About Features
        </Link>
      </div>
    </div>
  );
};

export default UpgradeGate;
