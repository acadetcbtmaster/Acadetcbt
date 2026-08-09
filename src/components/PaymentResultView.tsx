import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { ApiClient } from '../services/apiClient';

interface PaymentResultViewProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onNavigate: (tab: string) => void;
  onOpenSubscribe?: () => void;
}

export const PaymentResultView: React.FC<PaymentResultViewProps> = ({
  currentUser,
  onUpdateUser,
  onNavigate,
  onOpenSubscribe,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [verified, setVerified] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    reference: string;
    amount?: number;
    planName?: string;
  } | null>(null);

  const hasVerified = useRef<boolean>(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const reference =
      searchParams.get('reference') ||
      searchParams.get('transaction_ref') ||
      searchParams.get('trxref') ||
      searchParams.get('payment_ref');

    if (!reference) {
      setLoading(false);
      return;
    }

    setPaymentDetails({ reference });

    const verifyTransaction = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await ApiClient.verifyPaymentByRef(reference);

        if (res && (res.success || res.status === 'success')) {
          setVerified(true);
          setPaymentDetails({
            reference,
            amount: res.amount || 800,
            planName: res.planName || 'Premium Plan',
          });

          if (currentUser) {
            const updated: UserProfile = {
              ...currentUser,
              subscriptionPlan: res.planName || 'Premium Membership',
              subscriptionStatus: 'active',
              subscription: {
                ...(currentUser.subscription || {
                  questionsAttemptedCount: 0,
                  freeLimit: 999999,
                  startDate: new Date().toISOString(),
                }),
                isPremium: true,
                plan: res.planName || 'Premium Membership',
                expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
              },
            };
            onUpdateUser(updated);
          }
        } else {
          setErrorMsg(res?.error || 'Payment verification could not be completed with Squad Gateway.');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error connecting to Squad Payment Verification server.');
      } finally {
        setLoading(false);
      }
    };

    verifyTransaction();
  }, []);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-white">Verifying Squad Payment...</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Please wait while we confirm your transaction reference with Squad Payment Gateway and activate your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {verified ? (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30 inline-block">
                ⚡ Payment Successful
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Subscription Activated!
              </h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Thank you for subscribing! Your payment has been verified on Squad Gateway. Unlimited access to CBT practice, past questions, and mock exams is now active.
              </p>
            </div>

            {paymentDetails && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs text-slate-300">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Transaction Reference:</span>
                  <span className="font-mono text-emerald-400 font-bold">{paymentDetails.reference}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Plan Name:</span>
                  <span className="font-bold text-white">{paymentDetails.planName || 'Premium Plan'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Amount Paid:</span>
                  <span className="font-bold text-emerald-400">₦{(paymentDetails.amount || 800).toLocaleString()}</span>
                </div>
              </div>
            )}
          </>
        ) : errorMsg ? (
          <>
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3.5 py-1 rounded-full border border-rose-500/30 inline-block">
                Verification Issue
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Payment Verification Failed
              </h1>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                {errorMsg}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30 inline-block">
                ⚡ Squad Payment Gateway
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                AcadeCBT Subscription Status
              </h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Experience seamless payment processing and unlock unlimited CBT practice questions, past papers, and AI explanations with Squad.
              </p>
            </div>
          </>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'dashboard') : 'landing')}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Go To Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onOpenSubscribe && !verified && (
            <button
              onClick={onOpenSubscribe}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-2xl transition-all border border-slate-700"
            >
              Try Subscribing Again
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

