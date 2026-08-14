import React, { useState } from 'react';
import { UserProfile } from '../types';
import brandLogo from '../assets/images/exact_acadet_cbt_logo_1786225425882.jpg';
import {
  GraduationCap,
  Sparkles,
  User,
  Shield,
  LogOut,
  Bell,
  Menu,
  X,
  ArrowLeft,
  CreditCard,
  BookOpen,
  Award,
  ChevronDown,
  Flame,
  AlertTriangle,
  AlertCircle,
  Crown,
  Users,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { getEffectiveStreak } from '../utils/streak';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: 'register' | 'login' | 'admin' | 'forgot') => void;
  onOpenSubscribe: () => void;
  onLogout: () => void;
  onSwitchRole?: (role: 'student' | 'admin') => void;
  onOpenEditProfile?: () => void;
  onOpenAbout?: () => void;
  onOpenFeaturesPdf?: () => void;
  onOpenNotificationCenter?: () => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  onOpenAuth,
  onOpenSubscribe,
  onLogout,
  onSwitchRole,
  onOpenEditProfile,
  onOpenAbout,
  onOpenFeaturesPdf,
  onOpenNotificationCenter,
  themeMode = 'dark',
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isLoggedIn = !!currentUser;
  const isPremium = currentUser?.subscription?.isPremium ?? false;
  const freeLimit = currentUser?.subscription?.freeLimit ?? 30;
  const questionsAttempted = currentUser?.subscription?.questionsAttemptedCount ?? 0;
  const remaining = Math.max(0, freeLimit - questionsAttempted);
  const planName = currentUser?.subscription?.plan || 'Free Trial';

  const limit80 = Math.floor(freeLimit * 0.8);
  const isAt80Percent = !isPremium && questionsAttempted >= limit80 && questionsAttempted < freeLimit;
  const isAt100Percent = !isPremium && questionsAttempted >= freeLimit;

  const notifications = [
    ...(isAt100Percent
      ? [
          {
            id: 'n-100',
            type: 'alert_100',
            title: '🚨 Free Trial Expired (100% Limit)',
            text: `You have completed all ${freeLimit} free questions. Subscribe to Premium for unlimited practice.`,
            isUrgent: true,
          },
        ]
      : []),
    ...(isAt80Percent
      ? [
          {
            id: 'n-80',
            type: 'alert_80',
            title: '⚠️ Free Trial Warning (80% Used)',
            text: `You have completed ${questionsAttempted}/${freeLimit} free practice questions (${remaining} remaining).`,
            isUrgent: true,
          },
        ]
      : []),
    {
      id: 'n1',
      type: 'info',
      title: 'Free Questions Counter',
      text: isPremium ? 'Unlimited CBT Access Unlocked' : `${remaining} free practice questions remaining`,
    },
    { id: 'n2', type: 'info', title: 'New Course Materials Added', text: 'GST101 & MTH101 past questions 2023/2024 published.' },
  ];

  return (
    <>
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b shadow-sm transition-colors duration-200 ${
        themeMode === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`} id="cbt-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate(isLoggedIn ? (currentUser?.role === 'admin' ? 'admin' : 'dashboard') : 'landing')} 
          className="flex items-center space-x-3 cursor-pointer group"
          id="navbar-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden border border-indigo-500/30">
            <img 
              src={brandLogo} 
              alt="Acadet CBT Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`font-extrabold text-lg tracking-tight transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                Acadet CBT MASTER
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 hidden lg:flex ${
                themeMode === 'light'
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                <Sparkles className={`w-3 h-3 ${themeMode === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`} />
                Sim
              </span>
            </div>
            <p className={`text-[10px] font-medium hidden sm:block ${
              themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Modern University Learning & CBT Practice Engine
            </p>
          </div>
        </div>

        {/* Desktop Main Navigation */}
        <nav className="hidden md:flex items-center space-x-1" id="desktop-nav-links">
          {isLoggedIn ? (
            <>
              {currentUser?.role === 'student' ? (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-dashboard"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('practice')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'practice' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-practice"
                  >
                    Practice Mode
                  </button>
                  <button
                    onClick={() => onNavigate('mock_cbt')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === 'mock_cbt' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-mock-cbt"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Mock CBT
                  </button>
                  <button
                    onClick={() => onNavigate('face_arena')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === 'face_arena' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold' : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                    }`}
                    id="nav-btn-face-arena"
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>🏆 Face Arena</span>
                  </button>
                  <button
                    onClick={() => onNavigate('community')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === 'community' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-community"
                  >
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Learning Community</span>
                  </button>
                  <button
                    onClick={() => onNavigate('materials')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'materials' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-materials"
                  >
                    Study Materials
                  </button>
                  <button
                    onClick={() => onNavigate('leaderboard')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'leaderboard' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-leaderboard"
                  >
                    Leaderboard
                  </button>
                  <button
                    onClick={() => onNavigate('performance')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'performance' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-performance"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => onNavigate('bookmarks')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'bookmarks' ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    id="nav-btn-bookmarks"
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => onOpenAbout && onOpenAbout()}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-300 hover:text-white hover:bg-slate-800 transition-colors"
                    id="nav-btn-about-acadet"
                  >
                    About Acadet
                  </button>
                  <button
                    onClick={() => onNavigate('founder')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === 'founder'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                    id="nav-btn-founder-student"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Founder</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === 'admin' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    id="nav-btn-admin-panel"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    Admin Portal
                  </button>
                  <button
                    onClick={() => onOpenAbout && onOpenAbout()}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-300 hover:text-white hover:bg-slate-800 transition-colors"
                    id="nav-btn-about-admin"
                  >
                    About Acadet
                  </button>
                  <button
                    onClick={() => onNavigate('founder')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      activeTab === 'founder'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                    id="nav-btn-founder-admin"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Founder</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('landing')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'landing' ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
                }`}
                id="nav-btn-home"
              >
                Home
              </button>
              <button
                onClick={() => {
                  onNavigate('landing');
                  setTimeout(() => {
                    document.getElementById('about-acadet-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-300 hover:text-white"
                id="nav-btn-about"
              >
                About Acadet
              </button>
              <button
                onClick={() => onNavigate('founder')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                  activeTab === 'founder'
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30 font-bold'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
                id="nav-btn-founder"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Founder</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('landing');
                  setTimeout(() => {
                    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white"
                id="nav-btn-features"
              >
                Features
              </button>
              <button
                onClick={() => {
                  onNavigate('landing');
                  setTimeout(() => {
                    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white"
                id="nav-btn-pricing"
              >
                Pricing
              </button>
            </>
          )}
        </nav>

        {/* Right Section Actions */}
        <div className="flex items-center space-x-3" id="navbar-actions">

          {/* Daily Study Streak Badge */}
          {isLoggedIn && currentUser?.role === 'student' && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
              title="Daily Study Streak"
              id="navbar-streak-pill"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{getEffectiveStreak(currentUser).streak}d Streak</span>
            </button>
          )}

          {/* Subscription Status Pill */}
          {isLoggedIn && currentUser?.role === 'student' && (
            <button
              onClick={onOpenSubscribe}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              id="subscription-pill-btn"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Full Access (100% Free)</span>
            </button>
          )}

          {/* Download Features PDF Button */}
          {onOpenFeaturesPdf && (
            <button
              onClick={onOpenFeaturesPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Download Platform Features PDF Document"
              id="navbar-features-pdf-btn"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Features PDF</span>
            </button>
          )}

          {/* Day / Night Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="px-2.5 py-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
              title={themeMode === 'light' ? 'Switch to Night Mode (Black Background)' : 'Switch to Day Mode (White Background)'}
              id="navbar-theme-toggle-btn"
            >
              {themeMode === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span className="text-xs font-bold text-amber-600 hidden sm:inline">Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                  <span className="text-xs font-bold text-indigo-300 hidden sm:inline">Night</span>
                </>
              )}
            </button>
          )}

          {/* Notifications Button */}
          {isLoggedIn && (
            <button
              onClick={() => {
                if (onOpenNotificationCenter) {
                  onOpenNotificationCenter();
                } else {
                  setNotificationsOpen(!notificationsOpen);
                }
              }}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors relative cursor-pointer"
              id="notification-bell-btn"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-indigo-300" />
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${
                isAt100Percent
                  ? 'bg-rose-500 animate-ping'
                  : isAt80Percent
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-indigo-500'
              }`}></span>
            </button>
          )}

          {/* User Auth or User Profile Menu */}
          {isLoggedIn && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-colors"
                id="user-profile-menu-btn"
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 divide-y divide-slate-700/80">
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {isPremium ? 'Premium Active' : 'Free Trial'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate(currentUser.role === 'admin' ? 'admin' : 'dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                      id="dropdown-item-dashboard"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      {currentUser.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
                    </button>
                    {currentUser.role === 'student' && (
                      <>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onOpenEditProfile) onOpenEditProfile();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                          id="dropdown-item-edit-profile"
                        >
                          <User className="w-4 h-4 text-emerald-400" />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenSubscribe();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                          id="dropdown-item-subscription"
                        >
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                          Subscription & Plans
                        </button>
                      </>
                    )}

                    {onOpenFeaturesPdf && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenFeaturesPdf();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-indigo-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                        id="dropdown-item-features-pdf"
                      >
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Download Features PDF
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-700 flex items-center gap-2"
                      id="dropdown-item-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2" id="guest-auth-actions">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                id="login-trigger-btn"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                id="register-trigger-btn"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-3" id="mobile-drawer">
          {isLoggedIn ? (
            <>
              {currentUser?.role === 'student' ? (
                <>
                  <button
                    onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { onNavigate('practice'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg"
                  >
                    Practice Mode
                  </button>
                  <button
                    onClick={() => { onNavigate('mock_cbt'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg"
                  >
                    Mock CBT Practice Engine
                  </button>
                  <button
                    onClick={() => { onNavigate('community'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-indigo-300 font-bold hover:bg-slate-800 rounded-lg"
                  >
                    Learning Community
                  </button>
                  <button
                    onClick={() => { onNavigate('leaderboard'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-amber-300 font-bold hover:bg-slate-800 rounded-lg"
                  >
                    🏆 Student Leaderboard
                  </button>
                  <button
                    onClick={() => { onNavigate('performance'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg"
                  >
                    Performance Analytics
                  </button>
                  <button
                    onClick={() => { onNavigate('bookmarks'); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg"
                  >
                    Saved Bookmarks
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-sm text-amber-300 hover:bg-slate-800 rounded-lg font-semibold"
                >
                  Admin Portal
                </button>
              )}
              <button
                onClick={() => { onNavigate('founder'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-amber-400 font-bold hover:bg-slate-800 rounded-lg"
              >
                🏆 Founder: Menmex
              </button>
              <button
                onClick={() => { onOpenSubscribe(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-indigo-400 hover:bg-slate-800 rounded-lg font-medium"
              >
                Subscription Plans
              </button>
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded-lg"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => { onNavigate('founder'); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold rounded-lg border border-amber-500/30 text-xs flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Founder: Menmex</span>
              </button>
              <button
                onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 text-xs"
              >
                Sign In
              </button>
              <button
                onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                className="w-full text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs"
              >
                Create Student Account / Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>

    {/* Centered Notifications Popup Modal (Outside header to ensure viewport centering) */}
    {notificationsOpen && (
      <div
        className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95"
        id="notifications-modal-overlay"
      >
        <div
          className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative text-left flex flex-col space-y-4 max-h-[85vh] my-auto"
          id="notifications-modal-content"
        >
          {/* Modal Top Navigation Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 z-10">
            {/* Top Left Back Arrow Button */}
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
              id="notifications-modal-back-btn"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back</span>
            </button>

            {/* Center Title */}
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight uppercase">
                Notifications ({notifications.length})
              </span>
            </div>

            {/* Top Right Cancel Button */}
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold border border-slate-700 cursor-pointer shadow-sm"
              id="notifications-modal-cancel-btn"
              title="Cancel / Close"
            >
              <span>Cancel</span>
              <X className="w-4 h-4 text-rose-400" />
            </button>
          </div>

          {/* Notifications List Content - Fully Scrollable */}
          <div className="overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar max-h-[65vh]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl text-xs border transition-all ${
                  n.type === 'alert_100'
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 shadow-md shadow-rose-900/20'
                    : n.type === 'alert_80'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 shadow-md shadow-amber-900/20'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm font-extrabold text-white">{n.title}</span>
                </div>
                <p className="text-slate-300 mt-2 leading-relaxed text-xs sm:text-sm">{n.text}</p>
                {(n.type === 'alert_80' || n.type === 'alert_100') && (
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      onOpenSubscribe();
                    }}
                    className="mt-3.5 w-full py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-200" />
                    Upgrade to Premium Plan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </>
  );
};
