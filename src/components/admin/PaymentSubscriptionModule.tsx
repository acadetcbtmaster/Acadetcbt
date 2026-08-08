import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Eye,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Building2,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Check,
  X,
  Bell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  UserProfile,
  SubscriptionPlan,
  PaymentTransaction,
  University,
  Course,
  AppNotification,
} from '../../types';
import { StorageService } from '../../services/storage';

interface PaymentSubscriptionModuleProps {
  students: UserProfile[];
  plans: SubscriptionPlan[];
  universities: University[];
  courses: Course[];
  onUpdateStudents: (updated: UserProfile[]) => void;
  onUpdatePlans: (updated: SubscriptionPlan[]) => void;
}

export const PaymentSubscriptionModule: React.FC<PaymentSubscriptionModuleProps> = ({
  students,
  plans,
  universities,
  courses,
  onUpdateStudents,
  onUpdatePlans,
}) => {
  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'transactions' | 'pending_verifications' | 'plans' | 'analytics'>('transactions');

  // Transactions State
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => StorageService.getTransactions());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedGatewayFilter, setSelectedGatewayFilter] = useState('all');
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState('all');

  // Bulk Selection
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Modals & Active Selections
  const [viewProofTx, setViewProofTx] = useState<PaymentTransaction | null>(null);
  const [proofZoom, setProofZoom] = useState(1);

  const [rejectTx, setRejectTx] = useState<PaymentTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [extendStudent, setExtendStudent] = useState<UserProfile | null>(null);
  const [extensionDays, setExtensionDays] = useState(30);
  const [extensionPlanName, setExtensionPlanName] = useState('30-Day Premium');

  // Plan Management Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 1500,
    currency: 'NGN',
    durationDays: 30,
    features: ['Unlimited CBT Practice Tests', 'SMART Diagnostic Analysis', 'Downloadable PDF Summaries'],
    popular: false,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast Notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync state with storage events
  useEffect(() => {
    const handleStorageChange = () => {
      setTransactions(StorageService.getTransactions());
    };
    window.addEventListener('cbt_storage_change', handleStorageChange);
    return () => window.removeEventListener('cbt_storage_change', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- REVENUE & METRICS COMPUTATIONS ---
  const metrics = useMemo(() => {
    const totalRev = transactions
      .filter((t) => t.status === 'Successful')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalCount = transactions.length;
    const successfulCount = transactions.filter((t) => t.status === 'Successful').length;
    const pendingCount = transactions.filter((t) => t.status === 'Pending').length;
    const failedCount = transactions.filter((t) => t.status === 'Failed').length;
    const refundedCount = transactions.filter((t) => t.status === 'Refunded').length;

    const premiumSubsCount = students.filter((s) => s.subscription?.isPremium).length;
    const freeTrialCount = students.length - premiumSubsCount;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = now.getTime() - 86400000 * 7;
    const monthStart = now.getTime() - 86400000 * 30;

    const todayRev = transactions
      .filter((t) => t.status === 'Successful' && new Date(t.date).getTime() >= todayStart)
      .reduce((sum, t) => sum + t.amount, 0);

    const weekRev = transactions
      .filter((t) => t.status === 'Successful' && new Date(t.date).getTime() >= weekStart)
      .reduce((sum, t) => sum + t.amount, 0);

    const monthRev = transactions
      .filter((t) => t.status === 'Successful' && new Date(t.date).getTime() >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalRev,
      totalCount,
      successfulCount,
      pendingCount,
      failedCount,
      refundedCount,
      premiumSubsCount,
      freeTrialCount,
      todayRev,
      weekRev,
      monthRev,
    };
  }, [transactions, students]);

  // --- FILTERED TRANSACTIONS ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Tab filter
      if (activeSubTab === 'pending_verifications' && tx.status !== 'Pending') {
        return false;
      }

      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        tx.userName.toLowerCase().includes(searchLower) ||
        tx.userEmail.toLowerCase().includes(searchLower) ||
        tx.reference.toLowerCase().includes(searchLower) ||
        (tx.paymentId && tx.paymentId.toLowerCase().includes(searchLower)) ||
        (tx.universityName && tx.universityName.toLowerCase().includes(searchLower));

      // Plan
      const matchesPlan = selectedPlanFilter === 'all' || tx.planName === selectedPlanFilter;

      // Status
      const matchesStatus =
        selectedStatusFilter === 'all' || tx.status.toLowerCase() === selectedStatusFilter.toLowerCase();

      // Gateway
      const matchesGateway =
        selectedGatewayFilter === 'all' || tx.gateway.toLowerCase() === selectedGatewayFilter.toLowerCase();

      // University
      const matchesUni =
        selectedUniversityFilter === 'all' ||
        (tx.universityName && tx.universityName.includes(selectedUniversityFilter));

      return matchesSearch && matchesPlan && matchesStatus && matchesGateway && matchesUni;
    });
  }, [
    transactions,
    activeSubTab,
    searchTerm,
    selectedPlanFilter,
    selectedStatusFilter,
    selectedGatewayFilter,
    selectedUniversityFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // --- PAYMENT VERIFICATION & APPROVAL HANDLER ---
  const handleApprovePayment = (tx: PaymentTransaction) => {
    setIsProcessing(true);

    setTimeout(() => {
      // 1. Update Transaction
      const durationDays = tx.planName.includes('14') ? 14 : tx.planName.includes('365') ? 365 : 30;
      const expiryDateISO = new Date(Date.now() + 86400000 * durationDays).toISOString();

      const updatedTx: PaymentTransaction = {
        ...tx,
        status: 'Successful',
        paymentDate: new Date().toISOString(),
        expiryDate: expiryDateISO,
        handledByAdmin: 'System Admin',
      };

      const newTxList = transactions.map((t) => (t.id === tx.id ? updatedTx : t));
      setTransactions(newTxList);
      StorageService.saveTransactions(newTxList);

      // 2. Activate Premium Subscription for Student
      const targetStudent = students.find((s) => s.id === tx.userId || s.email === tx.userEmail);
      if (targetStudent) {
        const updatedStudents = students.map((s) => {
          if (s.id === targetStudent.id) {
            return {
              ...s,
              subscription: {
                isPremium: true,
                plan: tx.planName,
                expiryDate: expiryDateISO,
              },
            };
          }
          return s;
        });
        onUpdateStudents(updatedStudents);
        StorageService.saveUsers(updatedStudents);
      }

      // 3. Send Notification to Student
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: tx.userId,
        userName: tx.userName,
        title: '🎉 Payment Verified & Premium Activated!',
        message: `Your payment of ₦${tx.amount.toLocaleString()} for ${tx.planName} has been verified! Premium features are now unlocked until ${new Date(
          expiryDateISO
        ).toLocaleDateString()}.`,
        type: 'subscription',
        date: new Date().toISOString(),
        read: false,
      };
      StorageService.addNotification(notif);

      // 4. Log Activity
      StorageService.logActivity(
        'System Admin',
        `Approved Payment Reference ${tx.reference}`,
        'Payment Management',
        `Verified payment of ₦${tx.amount} and activated ${tx.planName} for student ${tx.userName}.`
      );

      setIsProcessing(false);
      setViewProofTx(null);
      showToast(`✅ Payment reference ${tx.reference} verified! Premium subscription activated for ${tx.userName}.`);
    }, 400);
  };

  // --- REJECT PAYMENT HANDLER ---
  const handleConfirmReject = () => {
    if (!rejectTx) return;
    setIsProcessing(true);

    setTimeout(() => {
      const updatedTx: PaymentTransaction = {
        ...rejectTx,
        status: 'Failed',
        rejectionReason: rejectionReason || 'Payment receipt/proof could not be verified by admin.',
        handledByAdmin: 'System Admin',
      };

      const newTxList = transactions.map((t) => (t.id === rejectTx.id ? updatedTx : t));
      setTransactions(newTxList);
      StorageService.saveTransactions(newTxList);

      // Send rejection notification
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: rejectTx.userId,
        userName: rejectTx.userName,
        title: '⚠️ Payment Proof Verification Declined',
        message: `Your payment proof for ${rejectTx.planName} was declined. Reason: ${rejectionReason || 'Receipt invalid or unreadable'}. Please upload a clear receipt or contact support.`,
        type: 'payment',
        date: new Date().toISOString(),
        read: false,
      };
      StorageService.addNotification(notif);

      StorageService.logActivity(
        'System Admin',
        `Rejected Payment Reference ${rejectTx.reference}`,
        'Payment Management',
        `Declined payment proof for ${rejectTx.userName}. Reason: ${rejectionReason}`
      );

      setIsProcessing(false);
      setRejectTx(null);
      setRejectionReason('');
      setViewProofTx(null);
      showToast(`❌ Payment proof for ${rejectTx.userName} declined and student notified.`);
    }, 400);
  };

  // --- EXTEND SUBSCRIPTION HANDLER ---
  const handleExecuteExtension = () => {
    if (!extendStudent) return;
    setIsProcessing(true);

    setTimeout(() => {
      const currentExpiry = extendStudent.subscription?.expiryDate
        ? new Date(extendStudent.subscription.expiryDate).getTime()
        : Date.now();
      const newExpiryISO = new Date(Math.max(Date.now(), currentExpiry) + extensionDays * 86400000).toISOString();

      const updatedStudents = students.map((s) => {
        if (s.id === extendStudent.id) {
          return {
            ...s,
            subscription: {
              isPremium: true,
              plan: extensionPlanName,
              expiryDate: newExpiryISO,
            },
          };
        }
        return s;
      });

      onUpdateStudents(updatedStudents);
      StorageService.saveUsers(updatedStudents);

      // Notify student
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: extendStudent.id,
        userName: extendStudent.name,
        title: '🎁 Subscription Duration Extended!',
        message: `An administrator extended your CBT Premium pass by ${extensionDays} days! New Expiry Date: ${new Date(
          newExpiryISO
        ).toLocaleDateString()}.`,
        type: 'subscription',
        date: new Date().toISOString(),
        read: false,
      };
      StorageService.addNotification(notif);

      StorageService.logActivity(
        'System Admin',
        `Extended Subscription for ${extendStudent.name}`,
        'Subscription Management',
        `Added ${extensionDays} days to ${extendStudent.name}'s subscription.`
      );

      setIsProcessing(false);
      setExtendStudent(null);
      showToast(`🎉 Subscription for ${extendStudent.name} extended by ${extensionDays} days!`);
    }, 400);
  };

  // --- CANCEL SUBSCRIPTION HANDLER ---
  const handleCancelSubscription = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (confirm(`Are you sure you want to cancel the active subscription for ${student.name}?`)) {
      const updatedStudents = students.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            subscription: {
              isPremium: false,
              plan: 'Cancelled',
              expiryDate: new Date().toISOString(),
            },
          };
        }
        return s;
      });

      onUpdateStudents(updatedStudents);
      StorageService.saveUsers(updatedStudents);

      StorageService.logActivity(
        'System Admin',
        `Cancelled Subscription for ${student.name}`,
        'Subscription Management',
        `Cancelled active premium pass for user ID ${studentId}.`
      );

      showToast(`Subscription for ${student.name} cancelled.`);
    }
  };

  // --- PLAN FORM HANDLERS ---
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPlans: SubscriptionPlan[];

    if (editingPlan) {
      updatedPlans = plans.map((p) =>
        p.id === editingPlan.id ? { ...p, ...planForm } : p
      );
      showToast(`Subscription Plan "${planForm.name}" updated successfully.`);
    } else {
      const newPlan: SubscriptionPlan = {
        id: `plan-${Date.now()}`,
        ...planForm,
        status: 'Active',
      };
      updatedPlans = [...plans, newPlan];
      showToast(`New Subscription Plan "${planForm.name}" created!`);
    }

    onUpdatePlans(updatedPlans);
    StorageService.saveSubscriptionPlans(updatedPlans);
    setIsPlanModalOpen(false);
    setEditingPlan(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Payment ID',
      'Reference',
      'Student Name',
      'Email',
      'University',
      'Plan Name',
      'Amount (NGN)',
      'Gateway',
      'Status',
      'Payment Date',
    ];

    const rows = filteredTransactions.map((t) => [
      t.paymentId || t.id,
      `"${t.reference}"`,
      `"${t.userName}"`,
      `"${t.userEmail}"`,
      `"${t.universityName || 'FUL'}"`,
      `"${t.planName}"`,
      t.amount,
      `"${t.gateway}"`,
      `"${t.status}"`,
      `"${new Date(t.date).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CBT_Payment_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Payment transactions exported to CSV!');
  };

  return (
    <div className="space-y-6" id="payment-subscription-admin-module">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* --- Top Header & Revenue Metrics --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Financial Operations Center
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Automated Verification Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Payment & Subscription Management</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Monitor live platform subscriptions, review student bank transfer proofs, extend access duration, and manage pricing tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveSubTab('pending_verifications')}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer relative"
          >
            <Clock className="w-4 h-4" />
            <span>Pending Verifications</span>
            {metrics.pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {metrics.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Transactions (CSV)</span>
          </button>
        </div>
      </div>

      {/* --- 1. Real-Time Revenue Summary Cards --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="revenue-summary-cards">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue</span>
          <p className="text-xl font-black text-emerald-400 mt-1">₦{metrics.totalRev.toLocaleString()}</p>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">All-time platform earnings</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Revenue</span>
          <p className="text-xl font-black text-white mt-1">₦{metrics.todayRev.toLocaleString()}</p>
          <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">↑ Live Daily Earnings</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Premium Subscribers</span>
          <p className="text-xl font-black text-indigo-300 mt-1">{metrics.premiumSubsCount}</p>
          <span className="text-[9px] text-indigo-400 font-medium mt-0.5 block">Active paying students</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Review</span>
          <p className="text-xl font-black text-amber-400 mt-1">{metrics.pendingCount}</p>
          <span className="text-[9px] text-amber-300 font-bold mt-0.5 block">Awaiting verification</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Successful Payments</span>
          <p className="text-xl font-black text-emerald-300 mt-1">{metrics.successfulCount}</p>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">Verified & completed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Free Trial Users</span>
          <p className="text-xl font-black text-slate-400 mt-1">{metrics.freeTrialCount}</p>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">Standard access users</span>
        </div>
      </div>

      {/* --- Navigation Subtabs --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'transactions' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>All Transactions ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pending_verifications')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSubTab === 'pending_verifications' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Proofs ({metrics.pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'plans' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Subscription Plans ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'analytics' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Revenue Analytics</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1 & 2: TRANSACTIONS / PENDING VERIFICATIONS */}
      {(activeSubTab === 'transactions' || activeSubTab === 'pending_verifications') && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search student, transaction ref, email, or university..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedPlanFilter}
                  onChange={(e) => setSelectedPlanFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">All Subscription Plans</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (₦{p.price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending Review</option>
                  <option value="failed">Failed / Declined</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>
                  {activeSubTab === 'pending_verifications'
                    ? 'Pending Bank Transfer Receipts & Verifications'
                    : 'Payment History & Subscriptions Log'}
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                Total Records: <strong>{filteredTransactions.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Reference & Payment ID</th>
                    <th className="p-4">Student Details</th>
                    <th className="p-4">Plan & Amount</th>
                    <th className="p-4">Gateway / Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment Date</th>
                    <th className="p-4 text-right">Action Operations</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No transaction records match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <p className="font-mono font-bold text-white text-xs">{tx.reference}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{tx.paymentId || tx.id}</p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white text-xs">{tx.userName}</p>
                          <p className="text-[11px] text-slate-400">{tx.userEmail}</p>
                          <p className="text-[10px] text-indigo-400 font-medium">
                            {tx.universityName || 'Federal University Lokoja'}
                          </p>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 block w-fit">
                            {tx.planName}
                          </span>
                          <p className="font-black text-emerald-400 text-sm mt-1">₦{tx.amount.toLocaleString()}</p>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold text-[10px]">
                            {tx.gateway}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              tx.status === 'Successful'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {tx.status === 'Successful' && <CheckCircle2 className="w-3 h-3" />}
                            {tx.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {tx.status === 'Failed' && <XCircle className="w-3 h-3" />}
                            {tx.status}
                          </span>
                        </td>

                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          {tx.proofUrl && (
                            <button
                              onClick={() => {
                                setViewProofTx(tx);
                                setProofZoom(1);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                            >
                              View Proof
                            </button>
                          )}

                          {tx.status === 'Pending' && (
                            <button
                              onClick={() => handleApprovePayment(tx)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                            >
                              Verify & Activate
                            </button>
                          )}

                          {tx.status === 'Pending' && (
                            <button
                              onClick={() => setRejectTx(tx)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 cursor-pointer"
                            >
                              Decline
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-xl border border-slate-800 text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-xl border border-slate-800 text-xs cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Direct Student Access Extension Control */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Direct Student Access & Subscription Duration Control</span>
            </h3>
            <p className="text-xs text-slate-400">
              Grant custom days, extend access for students manually, or cancel active premium passes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.slice(0, 4).map((std) => (
                <div key={std.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white text-xs">{std.name}</p>
                    <p className="text-[11px] text-slate-400">{std.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${std.subscription?.isPremium ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {std.subscription?.plan || 'Free Trial'}
                      </span>
                      {std.subscription?.expiryDate && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Expires: {new Date(std.subscription.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setExtendStudent(std);
                        setExtensionDays(30);
                        setExtensionPlanName(std.subscription?.plan && std.subscription.plan !== 'Free Trial' ? std.subscription.plan : '30-Day Premium');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-all text-center"
                    >
                      + Extend Duration
                    </button>
                    {std.subscription?.isPremium && (
                      <button
                        onClick={() => handleCancelSubscription(std.id)}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-[11px] rounded-lg cursor-pointer text-center"
                      >
                        Cancel Sub
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SUBSCRIPTION PLANS MANAGEMENT */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Configured Subscription Plans</h3>
              <p className="text-xs text-slate-400">Set pricing tiers, features, and durations for student passes.</p>
            </div>

            <button
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({
                  name: '',
                  price: 1500,
                  currency: 'NGN',
                  durationDays: 30,
                  features: ['Unlimited CBT Practice Tests', 'SMART Diagnostic Analysis', 'Downloadable Summaries'],
                  popular: false,
                });
                setIsPlanModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
                {p.popular && (
                  <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase rounded-full">
                    Popular Tag
                  </span>
                )}

                <div>
                  <h4 className="text-lg font-black text-white">{p.name}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400">₦{p.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {p.durationDays} Days</span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Included Features:</span>
                    {p.features.map((feat, i) => (
                      <p key={i} className="text-xs text-slate-300 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active Plan
                  </span>
                  <button
                    onClick={() => {
                      setEditingPlan(p);
                      setPlanForm({
                        name: p.name,
                        price: p.price,
                        currency: p.currency,
                        durationDays: p.durationDays,
                        features: p.features,
                        popular: !!p.popular,
                      });
                      setIsPlanModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: REVENUE ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span>Revenue Gateway Distribution</span>
              </h3>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1 font-bold">
                    <span>Paystack Online Payments</span>
                    <span className="text-emerald-400">65% (₦{(metrics.totalRev * 0.65).toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1 font-bold">
                    <span>Bank Transfer Verification</span>
                    <span className="text-indigo-400">25% (₦{(metrics.totalRev * 0.25).toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1 font-bold">
                    <span>Flutterwave Integration</span>
                    <span className="text-purple-400">10% (₦{(metrics.totalRev * 0.10).toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-800 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>Top Subscribed Universities</span>
              </h3>
              <div className="divide-y divide-slate-800 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Federal University Lokoja (FUL)</p>
                    <p className="text-[11px] text-slate-400">420 Premium Subscriptions</p>
                  </div>
                  <span className="text-emerald-400 font-extrabold text-sm">₦520,000</span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Federal Univ. FUAHSE Enugu</p>
                    <p className="text-[11px] text-slate-400">280 Premium Subscriptions</p>
                  </div>
                  <span className="text-emerald-400 font-extrabold text-sm">₦340,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT PROOF VIEWER MODAL --- */}
      {viewProofTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-white">Payment Proof Viewer</h3>
                <p className="text-xs text-slate-400 font-mono">Reference: {viewProofTx.reference}</p>
              </div>

              <button
                onClick={() => setViewProofTx(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
              <img
                src={viewProofTx.proofUrl}
                alt="Bank Transfer Receipt Proof"
                className="max-h-[300px] object-contain rounded-xl shadow-lg transition-transform"
                style={{ transform: `scale(${proofZoom})` }}
              />

              <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setProofZoom((z) => Math.max(0.8, z - 0.2))}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(proofZoom * 100)}%</span>
                <button
                  onClick={() => setProofZoom((z) => Math.min(2, z + 0.2))}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Verification Controls */}
            {viewProofTx.status === 'Pending' && (
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setRejectTx(viewProofTx)}
                  className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 cursor-pointer"
                >
                  Decline Proof
                </button>

                <button
                  onClick={() => handleApprovePayment(viewProofTx)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  Approve & Activate Premium
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DECLINE REASON MODAL --- */}
      {rejectTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Decline Payment Proof</h3>
            <p className="text-xs text-slate-400">Specify why the payment proof was invalid to inform the student.</p>

            <textarea
              rows={3}
              placeholder="e.g. Transaction reference code not found or illegible receipt image..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectTx(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXTEND DURATION MODAL --- */}
      {extendStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Extend Premium Access for {extendStudent.name}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Select Days to Add</label>
                <select
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value={7}>+ 7 Days Access</option>
                  <option value={14}>+ 14 Days Access</option>
                  <option value={30}>+ 30 Days Access (1 Month)</option>
                  <option value={90}>+ 90 Days Access (3 Months)</option>
                  <option value={365}>+ 365 Days Access (1 Year)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setExtendStudent(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteExtension}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                Execute Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT PLAN MODAL --- */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Premium Pass"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Subscription Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
