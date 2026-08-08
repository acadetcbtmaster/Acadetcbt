import React from 'react';
import { UserProfile, SubscriptionPlan, PaymentTransaction } from '../types';
import {
  X,
  CheckCircle2,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  plans: SubscriptionPlan[];
  onPaymentSuccess: (plan: SubscriptionPlan, tx: PaymentTransaction) => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="subscription-modal-wrapper">
      <div className="bg-slate-900 border border-emerald-500/40 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left flex flex-col space-y-6">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="sub-modal-back-btn"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back</span>
          </button>

          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>100% Free Access</span>
          </span>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
            id="sub-modal-close-btn"
          >
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-9 h-9 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            No Payment Required!
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Payment gateways and subscription requirements have been completely removed.
            Every student has <strong className="text-emerald-400 font-bold">100% Unlimited Free Access</strong> to all features across Acadet CBT Master.
          </p>
        </div>

        {/* Unlocked Benefits List */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Unlimited CBT Practice & Mock Exams:</strong> No trial limits.</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>All Past Questions & Answers:</strong> Step-by-step SMART explanations included.</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>PDF Study Materials & Guides:</strong> Instant free downloads.</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>AI Question Generator & MenCore AI:</strong> Fully unlocked.</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Zero Fees or Cards:</strong> 100% free forever for all Nigerian students.</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          id="modal-continue-free-btn"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>Continue Practicing For Free</span>
        </button>

      </div>
    </div>
  );
};
