import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getReferralLink } from '../utils/referrals';
import {
  Share2,
  Copy,
  Check,
  Users,
  Award,
  ExternalLink,
  Sparkles,
  UserCheck,
  Link as LinkIcon,
  HelpCircle,
} from 'lucide-react';

interface ReferralSectionProps {
  user: UserProfile;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ user }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const code = user.referralCode || 'CBT8XK92';
  const link = getReferralLink(code);
  const successfulCount = user.successfulReferrals ?? 0;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6" id="referral-dashboard-section">
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Referral Tracking System
              </h2>
              <span className="text-[10px] uppercase font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Invite friends and classmates to practice CBT questions on CBT Master using your permanent referral link.
            </p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Referral Code Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Your Referral Code
            </span>
            <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
              <span className="text-lg font-mono font-extrabold text-indigo-400 tracking-wider">
                {code}
              </span>
              <button
                onClick={handleCopyCode}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copiedCode
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
                title="Copy Referral Code"
                id="copy-referral-code-btn"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Friends can enter this code during registration.
          </p>
        </div>

        {/* Referral Link Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Your Referral Link
            </span>
            <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
              <span className="text-xs font-mono text-slate-300 truncate max-w-[180px] sm:max-w-[200px]">
                {link}
              </span>
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
                title="Copy Referral Link"
                id="copy-referral-link-btn"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Clicking this link auto-fills your code on the sign-up page.
          </p>
        </div>

        {/* Successful Referrals Count */}
        <div className="bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Successful Referrals
            </span>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {successfulCount}
            </span>
            <span className="text-xs text-slate-400 ml-2">Registered Users</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Real-time referral count sync
          </p>
        </div>
      </div>

      {/* Info Notice Box */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3 relative z-10">
        <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-white text-xs">How Referral Tracking Works</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Every user receives a permanent, unique referral code upon registration. Share your link or code with classmates. When someone creates an account using your code, your Successful Referrals count increases automatically in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};
