import React, { useState, useEffect } from 'react';
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
import { StorageService } from '../services/storage';

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
  plans: propsPlans,
}) => {
  const allPlans = (propsPlans && propsPlans.length > 0) ? propsPlans : StorageService.getSubscriptionPlans();
  const activePlans = allPlans.filter((p) => p.active !== false && p.status !== 'Inactive' && p.status !== 'Disabled');

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedGateway, setSelectedGateway] = useState<'squad' | 'korapay'>('squad');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentChosenPlan =
    activePlans.find((p) => p.id === selectedPlanId) ||
    activePlans.find((p) => p.popular) ||
    activePlans[0];

  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);

    const amount = currentChosenPlan ? currentChosenPlan.price : 800;
    const planId = currentChosenPlan ? currentChosenPlan.id : 'premium';
    const planName = currentChosenPlan ? currentChosenPlan.name : 'Premium Membership';
    const durationDays = currentChosenPlan ? currentChosenPlan.durationDays : 30;

    console.log(`[Payment Debug Log - Frontend]`);
    console.log(`- Selected Plan Price: ₦${amount}`);
    console.log(`- Duration Days: ${durationDays}`);
    console.log(`- Gateway Name: ${selectedGateway.toUpperCase()}`);
    console.log(`- Amount Sent To Gateway: ₦${amount}`);
    console.log(`- Plan ID: ${planId} (${planName})`);

    try {
      const res = await ApiClient.initiatePayment({
        provider: selectedGateway,
        gateway: selectedGateway,
        planId,
        planName,
        amount,
        durationDays,
        email: (user.email && user.email.includes('@') && !user.email.endsWith('.cbt')) ? user.email : 'student@gmail.com',
        userId: user.id || 'usr-student',
        userName: user.fullName || user.name || 'Acadet Student',
      });

      if (res && res.success && (res.checkoutUrl || res.paymentLink)) {
        const redirectUrl = res.checkoutUrl || res.paymentLink;
        window.location.href = redirectUrl;
      } else {
        const extraDetails = res?.details && typeof res.details === 'object' 
          ? Object.values(res.details).flat().join(' ') 
          : (typeof res?.details === 'string' ? res.details : '');
        const errorMsg = res?.error || `Failed to initialize ${selectedGateway === 'korapay' ? 'KoraPay' : 'Squad'} payment. Please try again.`;
        setError(extraDetails ? `${errorMsg} (${extraDetails})` : errorMsg);
      }
    } catch (err: any) {
      setError(err?.message || `Server error while contacting ${selectedGateway === 'korapay' ? 'KoraPay' : 'Squad'} Payment Gateway.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto" id="subscription-modal-wrapper">
      <div className="bg-slate-900 border border-slate-800 max-w-lg w-full max-h-[90vh] rounded-3xl p-5 sm:p-8 shadow-2xl relative text-left flex flex-col space-y-5 overflow-y-auto my-auto">
        
        {/* Top Header Navigation Bar with Back & Cancel Buttons */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-200 hover:text-white rounded-xl bg-slate-800/90 hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm active:scale-95"
            id="sub-modal-back-btn"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Back</span>
          </button>

          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
            <span>Squad Secured</span>
          </span>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-200 hover:text-white rounded-xl bg-slate-800/90 hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm active:scale-95"
            id="sub-modal-close-btn"
            title="Cancel and Exit"
          >
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Cancel</span>
          </button>
        </div>

        {/* Modal Main Header */}
        <div className="text-center space-y-2 shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            Upgrade to Premium Access
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Unlock unlimited CBT practice exams, SMART step-by-step explanations, PDF lecture notes, and MenCore AI assistant.
          </p>
        </div>

        {/* Dynamic Plan Selectors configured from Admin Panel */}
        <div className="space-y-3 shrink-0 max-h-60 overflow-y-auto pr-1">
          {activePlans.length === 0 ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 text-center">
              No subscription plans currently available.
            </div>
          ) : (
            activePlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                  id={`plan-card-${plan.id}`}
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>{plan.name}</span>
                      {plan.popular && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                          POPULAR
                        </span>
                      )}
                    </div>
                    {plan.features && plan.features.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {plan.features.slice(0, 2).join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-lg font-black text-emerald-400">
                      ₦{plan.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      / {plan.durationDays} days
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unlocked Benefits List for Selected Plan */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-200 shrink-0">
          {currentChosenPlan && currentChosenPlan.features && currentChosenPlan.features.length > 0 ? (
            currentChosenPlan.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Payment Summary */}
        {currentChosenPlan && (
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between shrink-0 shadow-lg shadow-emerald-500/5">
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                Payment Summary
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                {currentChosenPlan.name}
              </h4>
              <span className="text-xs text-slate-400 font-medium">
                {currentChosenPlan.durationDays} Days Access
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                ₦{currentChosenPlan.price.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Payment Gateway Selection */}
        <div className="space-y-2 shrink-0">
          <label className="text-xs font-bold text-slate-300 block">
            Select Payment Gateway:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedGateway('squad')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedGateway === 'squad'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
              id="gateway-select-squad"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-white">Pay with Squad</span>
                {selectedGateway === 'squad' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Cards, Bank Transfer, USSD</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGateway('korapay')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedGateway === 'korapay'
                  ? 'bg-purple-500/15 border-purple-500 text-white shadow-md shadow-purple-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
              id="gateway-select-korapay"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-white">Pay with KoraPay</span>
                {selectedGateway === 'korapay' && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Cards, Virtual Account, Mobile Money</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bottom Action Footer with Pay, Back, and Cancel Buttons */}
        <div className="space-y-2.5 pt-2 shrink-0">
          <button
            onClick={handleInitiatePayment}
            disabled={loading || !currentChosenPlan}
            className={`w-full py-3.5 ${
              selectedGateway === 'korapay'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20 border-purple-400/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20 border-emerald-400/30'
            } text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border disabled:opacity-50 active:scale-[0.98]`}
            id="modal-pay-now-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span>Initiating {selectedGateway === 'korapay' ? 'KoraPay' : 'Squad'} Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 text-white/80" />
                <span>
                  Pay ₦{currentChosenPlan ? currentChosenPlan.price.toLocaleString() : '800'} Now ({selectedGateway === 'korapay' ? 'KoraPay' : 'Squad'})
                </span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              id="sub-modal-footer-back-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              id="sub-modal-footer-cancel-btn"
            >
              <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

