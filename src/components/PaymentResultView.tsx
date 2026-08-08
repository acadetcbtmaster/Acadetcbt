import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface PaymentResultViewProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onNavigate: (tab: string) => void;
  onOpenSubscribe?: () => void;
}

export const PaymentResultView: React.FC<PaymentResultViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30 inline-block">
            ⚡ 100% Free Platform Access
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            All Features Are Unlocked & Free
          </h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Acadet CBT Master is completely free for all students. No payments or subscription fees are required. Enjoy unlimited practice, past questions, mock exams, and study materials!
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'dashboard') : 'landing')}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Go To Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
