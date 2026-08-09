import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
import { ApiClient } from '../services/apiClient';
import { StorageService } from '../services/storage';

interface PaymentSuccessViewProps {
  currentUser: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onNavigate: (tab: string) => void;
}

export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  currentUser,
  onUpdateUser,
  onNavigate,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [verified, setVerified] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    reference?: string;
    amount?: number;
    planName?: string;
  }>({});

  useEffect(() => {
    let isMounted = true;

    const verifyTransaction = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const ref =
          searchParams.get('reference') ||
          searchParams.get('transaction_ref') ||
          searchParams.get('trxref') ||
          searchParams.get('payment_ref');

        if (!ref) {
          // If no reference in URL, check if current user already has active subscription
          if (currentUser && currentUser.subscriptionStatus === 'active') {
            if (isMounted) {
              setVerified(true);
              setLoading(false);
              setPaymentDetails({
                planName: currentUser.subscriptionPlan || 'Premium Plan',
              });
            }
            return;
          }
          if (isMounted) {
            setErrorMsg('No payment transaction reference found in request.');
            setLoading(false);
          }
          return;
        }

        const res = await ApiClient.verifyPaymentByRef(ref);

        if (!isMounted) return;

        if (res && (res.success || res.status === 'success' || res.alreadyVerified)) {
          const activatedPlanName = res.planName || res.subscription?.plan || res.user?.subscriptionPlan || 'Premium Membership';
          const planAmount = res.amount || res.payment?.amount || 800;

          setVerified(true);
          setPaymentDetails({
            reference: ref,
            amount: planAmount,
            planName: activatedPlanName,
          });

          // Update local user profile
          const updatedUser: UserProfile = {
            ...(currentUser || StorageService.getUser() || {
              id: res.user?.userId || 'usr-student',
              name: res.user?.fullName || res.user?.name || 'Acadet Student',
              email: res.user?.email || 'student@acadet.cbt',
              role: 'student',
              universityId: 'uni-1',
              departmentId: 'dept-1',
              createdDate: new Date().toISOString(),
              bookmarks: [],
            }),
            subscriptionPlan: activatedPlanName,
            subscriptionStatus: 'active',
            subscription: {
              isPremium: true,
              plan: activatedPlanName,
              startDate: res.subscription?.startDate || new Date().toISOString(),
              expiryDate: res.subscription?.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString(),
              questionsAttemptedCount: 0,
              freeLimit: 999999,
            },
          };

          StorageService.saveUser(updatedUser);
          onUpdateUser(updatedUser);

          // Save transaction to local storage history
          StorageService.saveTransaction({
            id: ref,
            paymentId: ref,
            userId: updatedUser.id,
            userName: updatedUser.name || 'Acadet Student',
            userEmail: updatedUser.email,
            planName: activatedPlanName,
            amount: planAmount,
            date: new Date().toISOString(),
            status: 'Successful',
            reference: ref,
            gateway: 'Squad',
          });
        } else {
          setVerified(false);
          setErrorMsg(res?.error || 'Unable to verify payment with Squad Gateway. If payment was made, please contact support with your transaction reference.');
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || 'Network error while verifying Squad payment.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyTransaction();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {loading ? (
          <div className="py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifying Payment with Squad...</h2>
            <p className="text-sm text-slate-400">Please wait while we confirm your transaction securely.</p>
          </div>
        ) : verified ? (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30 inline-block">
                ⚡ Premium Membership Activated
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Payment Successful
              </h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Thank you for subscribing to AcadeCBT! Your premium subscription has been successfully verified and unlocked. Enjoy unlimited CBT practice, AI exam question generation, and past questions!
              </p>
            </div>

            {paymentDetails.reference && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs font-mono text-slate-300 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="text-emerald-400 font-bold">{paymentDetails.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subscription Plan:</span>
                  <span className="text-white font-bold">{paymentDetails.planName}</span>
                </div>
                {paymentDetails.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">₦{paymentDetails.amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate(currentUser?.role === 'admin' ? 'admin' : 'dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Go To Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Payment Verification Issue</h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                {errorMsg || 'We could not verify your Squad payment. Please verify your reference or try again.'}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Verification</span>
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Return To Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
