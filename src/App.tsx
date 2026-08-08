import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  UserProfile,
  Question,
  University,
  Faculty,
  Department,
  Course,
  Topic,
  TestSessionResult,
  PaymentTransaction,
  SubscriptionPlan,
  SystemSettings
} from './types';
import { StorageService } from './services/storage';
import { ApiClient } from './services/apiClient';
import { recordPracticeActivity } from './utils/streak';

// Components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { PracticeMode } from './components/PracticeMode';
import { MockCbtMode } from './components/MockCbtMode';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { BookmarksView } from './components/BookmarksView';
import { LearningCommunityView } from './components/LearningCommunityView';
import { AdminDashboard } from './components/AdminDashboard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { StudyMaterialsView } from './components/StudyMaterialsView';
import { LeaderboardView } from './components/LeaderboardView';
import { EditProfileModal } from './components/EditProfileModal';
import { TrialAlertModal } from './components/TrialAlertModal';
import { AboutModal } from './components/AboutModal';
import { FeaturesPdfModal } from './components/FeaturesPdfModal';
import { MenCoreWidget } from './components/MenCoreWidget';
import { FaceArenaView } from './components/FaceArenaView';
import { InAppNotificationOverlay } from './components/InAppNotificationOverlay';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PaymentResultView } from './components/PaymentResultView';

export default function App() {
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState<boolean>(false);

  // Day / Night Theme Mode State
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cbt_theme_mode');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('cbt_theme_mode', themeMode);
    if (themeMode === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.add('dark');
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Application Data State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return StorageService.getUser() || null;
  });
  const [questions, setQuestions] = useState<Question[]>(StorageService.getQuestions());
  const [universities, setUniversities] = useState<University[]>(StorageService.getUniversities());
  const [faculties, setFaculties] = useState<Faculty[]>(StorageService.getFaculties());
  const [departments, setDepartments] = useState<Department[]>(StorageService.getDepartments());
  const [courses, setCourses] = useState<Course[]>(StorageService.getCourses());
  const [topics, setTopics] = useState<Topic[]>(StorageService.getTopics());
  const [testResults, setTestResults] = useState<TestSessionResult[]>(StorageService.getTestResults());
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(StorageService.getTransactions());
  const [plans, setPlans] = useState<SubscriptionPlan[]>(StorageService.getSubscriptionPlans());
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSystemSettings());

  // UI Navigation & Modals State
  const [activeTab, setActiveTab] = useState<string>(() => {
    const isPaymentReturn =
      window.location.pathname.includes('/payment') ||
      window.location.search.includes('reference=') ||
      window.location.search.includes('payment_ref=') ||
      window.location.search.includes('trxref=');
    if (isPaymentReturn) {
      return 'payment_result';
    }
    const savedUser = StorageService.getUser();
    if (savedUser) {
      return savedUser.role === 'admin' ? 'admin' : 'dashboard';
    }
    return 'landing';
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login' | 'admin' | 'forgot'>('register');
  const [subModalOpen, setSubModalOpen] = useState<boolean>(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState<boolean>(false);
  const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false);
  const [featuresPdfModalOpen, setFeaturesPdfModalOpen] = useState<boolean>(false);
  const [trialAlertState, setTrialAlertState] = useState<{
    isOpen: boolean;
    type: '80_percent' | '100_percent' | null;
    questionsUsed: number;
    freeLimit: number;
  }>({
    isOpen: false,
    type: null,
    questionsUsed: 0,
    freeLimit: 30,
  });
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);

  const handleOpenAuth = (mode: 'register' | 'login' | 'admin' | 'forgot' = 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Real-Time Data Architecture & Live Sync across all modules
  useEffect(() => {
    const syncAllData = () => {
      const refreshedUser = StorageService.getUser();
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      } else {
        setCurrentUser(null);
      }
      setQuestions(StorageService.getQuestions());
      setUniversities(StorageService.getUniversities());
      setFaculties(StorageService.getFaculties());
      setDepartments(StorageService.getDepartments());
      setCourses(StorageService.getCourses());
      setTopics(StorageService.getTopics());
      setTestResults(StorageService.getTestResults());
      setTransactions(StorageService.getTransactions());
      setPlans(StorageService.getSubscriptionPlans());
      setSettings(StorageService.getSystemSettings());
    };

    // Initial sync
    syncAllData();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const storedUsers = StorageService.getUsers();
        const matched = storedUsers.find(
          (u) => u.email?.toLowerCase() === firebaseUser.email?.toLowerCase() || u.googleUserId === firebaseUser.uid
        );
        if (matched) {
          setCurrentUser(matched);
          StorageService.saveUser(matched);
        }
      } else {
        const savedUser = StorageService.getUser();
        if (!savedUser) {
          setCurrentUser(null);
        }
      }
    });

    window.addEventListener('focus', syncAllData);
    window.addEventListener('storage', syncAllData);
    window.addEventListener('cbt_storage_change', syncAllData);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', syncAllData);
      window.removeEventListener('storage', syncAllData);
      window.removeEventListener('cbt_storage_change', syncAllData);
    };
  }, []);

  // Detect Squad Payment Return Redirect
  useEffect(() => {
    const isPaymentReturn =
      window.location.pathname.includes('/payment') ||
      window.location.search.includes('reference=') ||
      window.location.search.includes('payment_ref=') ||
      window.location.search.includes('trxref=');
    if (isPaymentReturn) {
      setActiveTab('payment_result');
    }
  }, []);

  // Automatic Navigation Protection & Homepage Determination
  useEffect(() => {
    if (activeTab === 'payment_result') return;

    if (currentUser) {
      // Authenticated User: Prevent returning to the visitor public landing page
      if (activeTab === 'landing') {
        setActiveTab(currentUser.role === 'admin' ? 'admin' : 'dashboard');
      }
      // Protect Admin Route
      if (activeTab === 'admin' && currentUser.role !== 'admin') {
        setActiveTab('dashboard');
      }
    } else {
      // Unauthenticated Visitor: Protect student and admin pages
      if (activeTab !== 'landing') {
        setActiveTab('landing');
      }
    }
  }, [currentUser, activeTab]);

  // Secure navigation guard
  const handleNavigate = (tab: string) => {
    if (tab === 'landing') {
      if (currentUser) {
        setActiveTab(currentUser.role === 'admin' ? 'admin' : 'dashboard');
      } else {
        setActiveTab('landing');
      }
      return;
    }

    if (!currentUser) {
      setRegistrationMessage("Please sign in or create an account to access " + (tab === 'dashboard' ? 'the Student Dashboard' : 'this feature') + ".");
      setTimeout(() => setRegistrationMessage(null), 5000);
      handleOpenAuth('login');
      setActiveTab('landing');
      return;
    }

    if (tab === 'admin') {
      if (currentUser.role !== 'admin') {
        setRegistrationMessage("Access Denied. Administrator privileges are required.");
        setTimeout(() => setRegistrationMessage(null), 6000);
        setActiveTab('dashboard');
        return;
      }
    }

    setActiveTab(tab);
  };

  const handleLogout = () => {
    signOut(auth).catch(() => {});
    localStorage.removeItem('cbt_admin_token');
    StorageService.clearUserSession();
    setCurrentUser(null);
    setActiveTab('landing');
  };

  // Sync state changes with StorageService
  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    StorageService.saveUser(updatedUser);
  };

  const handleUpdateQuestions = (newQs: Question[]) => {
    setQuestions(newQs);
    StorageService.saveQuestions(newQs);
  };

  const handleSaveResult = (result: TestSessionResult) => {
    const updated = [result, ...testResults];
    setTestResults(updated);
    StorageService.saveTestResults(updated);
    if (currentUser) {
      const updatedUser = recordPracticeActivity(currentUser);
      handleUpdateUser(updatedUser);
    }
  };

  const handleRecordQuestionAttempt = () => {
    if (!currentUser) return;
    const sysLimit = settings.subscription?.freeTrialQuestionLimit ?? 30;
    const warnThreshold = settings.subscription?.warningThreshold ?? 25;

    const sub = currentUser.subscription || {
      isPremium: false,
      plan: 'Free Trial',
      startDate: new Date().toISOString(),
      expiryDate: null,
      questionsAttemptedCount: 0,
      freeLimit: sysLimit,
    };
    if (sub.isPremium) return;

    const updatedCount = (sub.questionsAttemptedCount || 0) + 1;
    const limit = sysLimit;

    let updatedUser: UserProfile = {
      ...currentUser,
      subscription: {
        ...sub,
        freeLimit: limit,
        questionsAttemptedCount: updatedCount,
      },
    };
    updatedUser = recordPracticeActivity(updatedUser);
    handleUpdateUser(updatedUser);

    // Auto trigger alert modal notifications at warning threshold (25) and 100% threshold (30)
    if (updatedCount === warnThreshold) {
      setTrialAlertState({
        isOpen: true,
        type: '80_percent',
        questionsUsed: updatedCount,
        freeLimit: limit,
      });
    } else if (updatedCount >= limit) {
      setTrialAlertState({
        isOpen: true,
        type: '100_percent',
        questionsUsed: updatedCount,
        freeLimit: limit,
      });
      setSubModalOpen(true);
    }
  };

  const handlePurchaseMaterial = (materialId: string) => {
    if (!currentUser) return;
    const currentPurchased = currentUser.purchasedMaterialIds || [];
    if (!currentPurchased.includes(materialId)) {
      const updatedUser: UserProfile = {
        ...currentUser,
        purchasedMaterialIds: [...currentPurchased, materialId],
      };
      handleUpdateUser(updatedUser);
    }
  };

  const handlePaymentSuccess = (plan: SubscriptionPlan, tx: PaymentTransaction) => {
    if (!currentUser) return;

    // Update Transactions
    const updatedTxs = [tx, ...transactions];
    setTransactions(updatedTxs);
    StorageService.saveTransactions(updatedTxs);

    // Update User Subscription status to Premium
    const startDate = new Date().toISOString();
    const expiry = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();
    const sub = currentUser.subscription || {
      isPremium: false,
      plan: 'Free Trial',
      startDate: new Date().toISOString(),
      expiryDate: null,
      questionsAttemptedCount: 0,
      freeLimit: 30,
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      subscription: {
        ...sub,
        isPremium: true,
        plan: plan.name,
        startDate,
        expiryDate: expiry,
      },
    };
    handleUpdateUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Main Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'register')}
        onOpenSubscribe={() => setSubModalOpen(true)}
        onLogout={handleLogout}
        onOpenEditProfile={() => setEditProfileModalOpen(true)}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenFeaturesPdf={() => setFeaturesPdfModalOpen(true)}
        onOpenNotificationCenter={() => setIsNotifCenterOpen(true)}
        themeMode={themeMode}
        onToggleTheme={toggleThemeMode}
      />

      {/* Real-time In-App Persistent Pop-Up Notification Broadcast Overlay */}
      <InAppNotificationOverlay
        userId={currentUser?.id}
        userRole={currentUser?.role}
        onOpenNotificationCenter={() => setIsNotifCenterOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 py-6">
        
        {activeTab === 'landing' && (
          <LandingPage
            currentUser={currentUser}
            onStartPractice={() => {
              if (currentUser) {
                setActiveTab('practice');
              } else {
                handleOpenAuth('login');
              }
            }}
            onOpenAuth={(mode) => handleOpenAuth(mode || 'register')}
            onOpenSubscribe={() => setSubModalOpen(true)}
            plans={plans}
          />
        )}

        {activeTab === 'dashboard' && currentUser && (
          <StudentDashboard
            user={currentUser}
            results={testResults}
            courses={courses}
            onNavigate={handleNavigate}
            onOpenSubscribe={() => setSubModalOpen(true)}
            onOpenEditProfile={() => setEditProfileModalOpen(true)}
          />
        )}

        {activeTab === 'practice' && currentUser && (
          <PracticeMode
            user={currentUser}
            questions={questions}
            universities={universities}
            courses={courses}
            topics={topics}
            onUpdateUser={handleUpdateUser}
            onOpenSubscribe={() => setSubModalOpen(true)}
            onRecordQuestionAttempt={handleRecordQuestionAttempt}
            onNavigate={handleNavigate}
            onSaveResult={handleSaveResult}
          />
        )}

        {activeTab === 'mock_cbt' && currentUser && (
          <MockCbtMode
            user={currentUser}
            questions={questions}
            universities={universities}
            courses={courses}
            onSaveResult={handleSaveResult}
            onOpenSubscribe={() => setSubModalOpen(true)}
            onRecordQuestionAttempt={handleRecordQuestionAttempt}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'materials' && currentUser && (
          <StudyMaterialsView
            user={currentUser}
            onOpenSubscribe={() => setSubModalOpen(true)}
            onPurchaseMaterial={handlePurchaseMaterial}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'leaderboard' && currentUser && (
          <LeaderboardView
            currentUser={currentUser}
            onOpenSubscribe={() => setSubModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'performance' && currentUser && (
          <PerformanceAnalytics
            results={testResults}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'bookmarks' && currentUser && (
          <BookmarksView
            user={currentUser}
            questions={questions}
            onUpdateUser={handleUpdateUser}
            onStartPracticeWithQuestions={() => setActiveTab('practice')}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'community' && currentUser && (
          <LearningCommunityView
            currentUser={currentUser}
            universities={universities}
            courses={courses}
          />
        )}

        {activeTab === 'face_arena' && currentUser && (
          <FaceArenaView
            user={currentUser}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'payment_result' && (
          <PaymentResultView
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onNavigate={handleNavigate}
            onOpenSubscribe={() => setSubModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            universities={universities}
            faculties={faculties}
            departments={departments}
            courses={courses}
            topics={topics}
            questions={questions}
            transactions={transactions}
            plans={plans}
            settings={settings}
            onUpdateQuestions={handleUpdateQuestions}
            onUpdateUniversities={(data) => {
              setUniversities(data);
              StorageService.saveUniversities(data);
            }}
            onUpdateCourses={(data) => {
              setCourses(data);
              StorageService.saveCourses(data);
            }}
            onUpdateTopics={(data) => {
              setTopics(data);
              StorageService.saveTopics(data);
            }}
            onUpdateSettings={(data) => {
              setSettings(data);
              StorageService.saveSystemSettings(data);
            }}
            onUpdatePlans={(data) => {
              setPlans(data);
              StorageService.saveSubscriptionPlans(data);
            }}
            onNavigate={handleNavigate}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Acadet CBT MASTER. Created by Menmex with the support of Joyce and the video tutorial team. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button
              onClick={() => setAboutModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              About Acadet
            </button>
            <a
              href="https://whatsapp.com/channel/0029VbCkCtQ545urWwBmWM1Z"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              FACE ARENA WhatsApp Channel
            </a>
            <button
              onClick={() => handleNavigate(currentUser ? (currentUser.role === 'admin' ? 'admin' : 'dashboard') : 'landing')}
              className="hover:text-white cursor-pointer"
            >
              {currentUser ? 'Dashboard' : 'Home'}
            </button>
            <button onClick={() => setSubModalOpen(true)} className="hover:text-white cursor-pointer">Subscriptions</button>
            {!currentUser && (
              <a href="#faq" onClick={() => handleNavigate('landing')} className="hover:text-white cursor-pointer">FAQ</a>
            )}
          </div>
        </div>
      </footer>

      {/* Registration / System Notification Modal (Centered Middle of Screen) */}
      {registrationMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="public-notification-modal">
          <div className="bg-slate-900 border border-emerald-500/40 max-w-md w-full rounded-3xl p-6 shadow-2xl relative text-left flex flex-col space-y-4">
            
            {/* Top Navigation Bar with Back & Cancel Buttons */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setRegistrationMessage(null)}
                className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
                id="notification-back-btn"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back</span>
              </button>

              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                System Notification
              </span>

              <button
                onClick={() => setRegistrationMessage(null)}
                className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
                id="notification-cancel-btn"
                title="Cancel / Close"
              >
                <span>Cancel</span>
                <X className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {/* Notification Message Content */}
            <div className="flex items-start gap-3 pt-2">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white tracking-tight">CBT Master Notice</h3>
                <p className="text-xs text-slate-200 leading-relaxed">{registrationMessage}</p>
              </div>
            </div>

            {/* Action Dismiss Button */}
            <div className="pt-2">
              <button
                onClick={() => setRegistrationMessage(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="notification-dismiss-btn"
              >
                <CheckCircle2 className="w-4 h-4" />
                Continue
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        universities={universities}
        departments={departments}
        onLoginSuccess={(user, message) => {
          handleUpdateUser(user);
          const target = user.role === 'admin' ? 'admin' : 'dashboard';
          setActiveTab(target);
          setAuthModalOpen(false);
          if (message) {
            setRegistrationMessage(message);
            setTimeout(() => setRegistrationMessage(null), 8000);
          }
        }}
      />

      {/* Subscription Modal */}
      {currentUser && (
        <SubscriptionModal
          isOpen={subModalOpen}
          onClose={() => setSubModalOpen(false)}
          user={currentUser}
          plans={plans}
          onPaymentSuccess={handlePaymentSuccess}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Edit Profile Modal */}
      {currentUser && (
        <EditProfileModal
          isOpen={editProfileModalOpen}
          user={currentUser}
          onClose={() => setEditProfileModalOpen(false)}
          onSave={handleUpdateUser}
        />
      )}

      {/* Free Trial Alert Threshold Notification Modal */}
      <TrialAlertModal
        isOpen={trialAlertState.isOpen}
        alertType={trialAlertState.type}
        questionsUsed={trialAlertState.questionsUsed}
        freeLimit={trialAlertState.freeLimit}
        onClose={() => setTrialAlertState((prev) => ({ ...prev, isOpen: false }))}
        onOpenSubscribe={() => setSubModalOpen(true)}
      />

      {/* About Acadet Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />

      {/* Features PDF Modal */}
      <FeaturesPdfModal
        isOpen={featuresPdfModalOpen}
        onClose={() => setFeaturesPdfModalOpen(false)}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        userId={currentUser?.id}
        userRole={currentUser?.role}
      />

      {/* MenCore AI Assistant Widget (Powered by Menmex) */}
      <MenCoreWidget
        currentUser={currentUser}
        onNavigate={(view, tab) => {
          setActiveTab(view);
          if (view === 'dashboard' && tab === 'subscription') {
            setSubModalOpen(true);
          } else if (view === 'dashboard' && tab === 'profile') {
            setEditProfileModalOpen(true);
          }
        }}
        isAuthModalOpen={authModalOpen}
      />
    </div>
  );
}
