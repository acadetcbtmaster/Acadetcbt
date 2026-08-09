import React, { useState } from 'react';
import { UserProfile, SubscriptionPlan } from '../types';
import {
  X,
  CheckCircle2,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  plans?: SubscriptionPlan[];
  onPaymentSuccess?: (plan: any, tx: any) => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await ApiClient.initiatePayment({
        planId: selectedPlan,
        amount: selectedPlan === 'premium-plus' ? 1500 : selectedPlan === 'premium-pro' ? 3500 : 800,
        email: user.email || 'student@acadet.cbt',
        userId: user.id || 'usr-student',
        userName: user.fullName || 'Acadet Student',
      });

      if (res && res.success && (res.checkoutUrl || res.paymentLink)) {
        const redirectUrl = res.checkoutUrl || res.paymentLink;
        window.location.href = redirectUrl;
      } else {
        setError(res?.error || 'Failed to initialize Squad payment. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Server error while contacting Squad Payment Gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="subscription-modal-wrapper">
      <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left flex flex-col space-y-6">
        
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
            <span>Squad Secured</span>
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
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Upgrade to AcadeCBT Premium
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Unlock unlimited CBT practice exams, SMART step-by-step explanations, PDF lecture notes, and MenCore AI assistant.
          </p>
        </div>

        {/* Plan Selectors */}
        <div className="space-y-3">
          <div
            onClick={() => setSelectedPlan('premium')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPlan === 'premium'
                ? 'bg-emerald-500/10 border-emerald-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Premium Membership (30-Day)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">POPULAR</span>
              </div>
              <p className="text-xs text-slate-400">Unlimited CBT practice & AI exam generator</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-400">₦800</span>
              <span className="text-[10px] text-slate-400 block">/ 30 days</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedPlan('premium-plus')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPlan === 'premium-plus'
                ? 'bg-emerald-500/10 border-emerald-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="text-sm font-bold text-white">Premium Plus (Semester)</div>
              <p className="text-xs text-slate-400">Full semester coverage with downloadable materials</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-400">₦1,500</span>
              <span className="text-[10px] text-slate-400 block">/ 60 days</span>
            </div>
          </div>
        </div>

        {/* Unlocked Benefits List */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Unlimited CBT Exams:</strong> Practice as many courses as you want.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>AI Exam Generator:</strong> Turn any PDF or lecture note into CBT questions.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Verified Solutions:</strong> Detailed step-by-step explanations.</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleInitiatePayment}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30 disabled:opacity-50"
          id="modal-pay-now-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Initiating Squad Payment...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 text-emerald-200" />
              <span>Subscribe & Pay Now (Squad)</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
