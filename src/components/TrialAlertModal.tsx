import React from 'react';
import { Crown, AlertTriangle, AlertCircle, X, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export interface TrialAlertModalProps {
  isOpen: boolean;
  alertType: '80_percent' | '100_percent' | null;
  questionsUsed: number;
  freeLimit: number;
  onClose: () => void;
  onOpenSubscribe: () => void;
}

export const TrialAlertModal: React.FC<TrialAlertModalProps> = ({
  isOpen,
  alertType,
  questionsUsed,
  freeLimit,
  onClose,
  onOpenSubscribe,
}) => {
  if (!isOpen || !alertType) return null;

  const is80 = alertType === '80_percent';
  const remaining = Math.max(0, freeLimit - questionsUsed);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={`bg-slate-900 border ${
          is80 ? 'border-amber-500/50' : 'border-rose-500/50'
        } rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center space-y-5`}
      >
        {/* Top Header Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Alert Notice
          </span>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-700 shadow-sm"
            title="Cancel / Close"
          >
            <span>Cancel</span>
            <X className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Icon Badge */}
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-xl ${
            is80
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-bounce'
          }`}
        >
          {is80 ? (
            <AlertTriangle className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>

        {/* Threshold Pill */}
        <div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              is80
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            {is80 ? '⚠️ 80% Free Trial Limit Warning' : '🚨 100% Free Trial Limit Reached'}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
            {is80 ? 'Free Trial Limit Warning' : 'Free Trial Completed'}
          </h2>
        </div>

        {/* Dynamic Alert Message */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          {is80 ? (
            <>
              <p className="text-amber-200 font-semibold bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl mb-2">
                You have {remaining} free practice questions left. Upgrade to Premium for unlimited access.
              </p>
              <div className="text-slate-400 text-xs">
                Completed <strong className="text-amber-400">{questionsUsed} of {freeLimit}</strong> free trial questions ({Math.round((questionsUsed / freeLimit) * 100)}% of quota).
              </div>
            </>
          ) : (
            <>
              <p className="text-amber-200 font-semibold bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl mb-2">
                You have exhausted your free trial. Upgrade to Premium to continue practicing.
              </p>
              <div className="text-slate-400 text-xs">
                Questions Used: <strong className="text-rose-400">{questionsUsed} / {freeLimit}</strong> • Remaining: <strong className="text-slate-300">0</strong>
              </div>
            </>
          )}
        </div>

        {/* Progress Visualizer Bar */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Free Trial Usage</span>
            <span className={is80 ? 'text-amber-400' : 'text-rose-400'}>
              {Math.min(100, Math.round((questionsUsed / freeLimit) * 100))}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                is80 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (questionsUsed / freeLimit) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenSubscribe();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="trial-alert-upgrade-btn"
          >
            <Crown className="w-4 h-4 text-amber-200" />
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          {is80 ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold cursor-pointer bg-slate-800/80 hover:bg-slate-800 rounded-xl"
              id="trial-alert-dismiss-btn"
            >
              Continue Free Trial ({remaining} questions left)
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
              id="trial-alert-close-btn"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
