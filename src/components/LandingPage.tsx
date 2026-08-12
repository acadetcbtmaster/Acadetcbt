import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Users,
  Building2,
  ArrowRight,
  FileText,
  GraduationCap,
  Target,
  Eye,
  Heart,
  MessageSquare,
  ExternalLink,
  Quote,
  Swords,
  Video,
  Globe,
  Layers,
} from 'lucide-react';
import { SubscriptionPlan, UserProfile, QuickLinkItem, HomepageSection } from '../types';
import { StorageService } from '../services/storage';
import { ReferralLeaderboard } from './ReferralLeaderboard';

interface LandingPageProps {
  onStartPractice: () => void;
  onOpenAuth: (mode?: 'register' | 'login' | 'admin' | 'forgot') => void;
  onOpenSubscribe: () => void;
  plans: SubscriptionPlan[];
  currentUser?: UserProfile | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPractice,
  onOpenAuth,
  onOpenSubscribe,
  plans,
  currentUser,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Dynamic Interface Editor Content
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);

  useEffect(() => {
    const unsubLinks = StorageService.listenQuickLinks((links) => {
      setQuickLinks(links.filter((l) => l.status === 'active'));
    });

    const unsubSections = StorageService.listenHomepageSections((sections) => {
      setHomepageSections(sections.filter((s) => s.status === 'active'));
    });

    return () => {
      unsubLinks();
      unsubSections();
    };
  }, []);

  const renderQuickLinkIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Swords': return <Swords className="w-5 h-5 text-amber-400" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'FileText': return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-purple-400" />;
      case 'Video': return <Video className="w-5 h-5 text-rose-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-cyan-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Award': return <Award className="w-5 h-5 text-amber-500" />;
      default: return <Globe className="w-5 h-5 text-slate-400" />;
    }
  };

  const sampleQuestion = {
    q: 'GST101: Which of the following best exemplifies the subject-verb concord rule regarding proximity in "neither... nor"?',
    a: 'Neither the principal nor the teachers were present.',
    b: 'Neither the principal nor the teachers was present.',
    c: 'Neither the teachers nor the principal were present.',
    d: 'Neither the principal nor the teachers is present.',
    correct: 'a',
    explanation: 'According to the rule of proximity, when subjects are connected by "neither... nor", the verb agrees in number with the subject closer to it. Here "the teachers" is plural, requiring "were".',
  };

  const faqs = [
    {
      q: 'How does the free trial work?',
      a: 'Every newly registered student receives 30 free practice questions immediately. You can test practice mode and see full step-by-step explanations without entering any payment details.',
    },
    {
      q: 'Can administrators generate questions directly from PDF course outlines?',
      a: 'Yes! Administrators can upload course outlines, lecture notes, or PDF study materials into the Question Generator. The system automatically extracts topics and creates verified multiple-choice questions with answer keys and explanations.',
    },
    {
      q: 'Is the Mock CBT timer realistic to actual university CBT software?',
      a: 'Yes. The Mock CBT practice engine mimics authentic computer-based testing environments used by major universities (UNILAG, UI, ABU, OAU, CU) including countdown timers, question navigation palettes, mark for review, and auto-submission on timeout.',
    },
    {
      q: 'What payment methods are supported for Nigerian & International students?',
      a: 'We integrate with Paystack and Flutterwave, supporting Debit/Credit Cards, Bank Transfers, USSD codes, and Mobile Money with instant automatic activation.',
    },
    {
      q: 'Can our university or faculty be added to the database?',
      a: 'Absolutely. The platform is designed to scale across unlimited universities, faculties, departments, courses, and academic sessions.',
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-indigo-500 selection:text-white" id="landing-container">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden border-b border-slate-900" id="hero-section">
        {/* Ambient Glow background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>CBT Exam Practice Engine for Nigerian Universities</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
              Master Past Questions & <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">Course Material</span> Exams
            </h1>

            <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
              Practice verified university past questions, simulate timed CBT exams, generate custom questions from lecture notes, and get instant step-by-step explanations to score A’s.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={onStartPractice}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                id="hero-start-btn"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                Start Free Practice (30 Free Qs)
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="hero-register-btn"
              >
                Create Student Account
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-center p-2">
                <p className="text-2xl font-bold text-white">50,000+</p>
                <p className="text-xs text-slate-400 mt-1">Verified Questions</p>
              </div>
              <div className="text-center p-2">
                <p className="text-2xl font-bold text-indigo-400">98.4%</p>
                <p className="text-xs text-slate-400 mt-1">Pass Rate</p>
              </div>
              <div className="text-center p-2">
                <p className="text-2xl font-bold text-emerald-400">5+ Universities</p>
                <p className="text-xs text-slate-400 mt-1">UNILAG, UI, ABU & more</p>
              </div>
              <div className="text-center p-2">
                <p className="text-2xl font-bold text-purple-400">Instant Smart</p>
                <p className="text-xs text-slate-400 mt-1">Material Extraction</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Homepage Sections Managed via Admin Interface Editor */}
      {homepageSections.map((sec) => (
        <section key={sec.id} className="py-12 border-b border-slate-900 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Type: Announcement */}
            {sec.type === 'announcement' && (
              <div className={`p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-r ${sec.bgColor || 'from-indigo-950/70 via-purple-950/50 to-slate-950'} relative overflow-hidden shadow-2xl`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-3xl">
                    {sec.badge && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 mb-1">
                        {sec.badge}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{sec.title}</h2>
                    {sec.subtitle && <p className="text-sm font-semibold text-indigo-300">{sec.subtitle}</p>}
                    {sec.description && <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sec.description}</p>}
                  </div>
                  {sec.buttonText && (
                    <button
                      onClick={onStartPractice}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer"
                    >
                      {sec.buttonText}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Type: Quick Links */}
            {sec.type === 'quick_links' && quickLinks.length > 0 && (
              <div className="space-y-6">
                <div className="text-center max-w-2xl mx-auto">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Quick Portals & Resources
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">{sec.title}</h2>
                  {sec.subtitle && <p className="text-slate-400 text-xs sm:text-sm mt-1">{sec.subtitle}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {quickLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target={link.target || '_self'}
                      rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900/90 transition-all flex flex-col justify-between group shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                            {renderQuickLinkIcon(link.icon)}
                          </div>
                          {link.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {link.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                          <span>{link.title}</span>
                          {link.target === '_blank' && <ExternalLink className="w-3 h-3 text-slate-500" />}
                        </h3>
                        {link.description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{link.description}</p>}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Link</span>
                        <span>→</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Type: Featured Content / Banner */}
            {(sec.type === 'featured_content' || sec.type === 'ad_banner') && (
              <div className={`p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r ${sec.bgColor || 'from-slate-900 to-slate-950'} flex flex-col md:flex-row items-center gap-8 shadow-2xl`}>
                {sec.imageUrl && (
                  <img src={sec.imageUrl} alt={sec.title} className="w-full md:w-80 h-48 object-cover rounded-2xl border border-slate-800 shrink-0" />
                )}
                <div className="space-y-3 flex-1">
                  {sec.badge && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {sec.badge}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{sec.title}</h2>
                  {sec.subtitle && <p className="text-sm font-semibold text-indigo-300">{sec.subtitle}</p>}
                  {sec.description && <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sec.description}</p>}
                  {sec.buttonText && (
                    <button
                      onClick={onStartPractice}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md inline-block mt-2 cursor-pointer"
                    >
                      {sec.buttonText}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>
      ))}

      {/* Interactive Sample CBT Teaser */}
      <section className="py-16 bg-slate-900/40 border-b border-slate-900" id="sample-cbt-teaser">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Try It Live Right Now
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-3">Interactive Sample Question</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Test how immediate feedback works before signing up.</p>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <span className="text-xs font-semibold text-slate-400">GST101 • General Studies</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">Topic: Subject-Verb Concord</span>
            </div>

            <p className="text-slate-100 font-medium text-base mb-6">{sampleQuestion.q}</p>

            <div className="space-y-3 mb-6">
              {[
                { key: 'a', text: sampleQuestion.a },
                { key: 'b', text: sampleQuestion.b },
                { key: 'c', text: sampleQuestion.c },
                { key: 'd', text: sampleQuestion.d },
              ].map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrect = opt.key === sampleQuestion.correct;
                let btnStyle = 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:border-indigo-500/50';

                if (selectedAnswer) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-200';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSelectedAnswer(opt.key);
                      setShowExplanation(true);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span><strong className="uppercase mr-2 text-indigo-400">{opt.key})</strong> {opt.text}</span>
                    {selectedAnswer && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-indigo-300 mb-1">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Detailed Explanation Breakdown:
                </div>
                <p className="leading-relaxed">{sampleQuestion.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-b border-slate-900" id="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Everything You Need for Exam Success</h2>
            <p className="text-slate-400 text-sm mt-2">Built specifically to match official university CBT software standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Past Questions Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Access categorized past questions filtered by University, Faculty, Department, Course, Semester, and Academic Session.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Material Question Generator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lecturers and admins upload course materials or outlines; the generator extracts realistic multiple-choice questions with answer keys.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Timed Mock CBT</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authentic examination conditions with countdown timers, question grid palette, marked for review, and auto-submit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Detailed Explanations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never guess again. Every question includes a clear step-by-step reasoning breakdown explaining why the answer is right.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Performance Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identify weak topics, average scores, and learning progress trends to focus your study time effectively.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-University Scale</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supports UNILAG, UI, ABU, OAU, Covenant University, and easily expandable to any tertiary institution.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Subscription Pricing */}
      <section className="py-20 border-b border-slate-900" id="pricing-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/30">
              ⚡ Zero Payment Required
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-3 sm:text-4xl">100% Free Unlimited Access</h2>
            <p className="text-slate-300 text-sm mt-2">All past questions, CBT practice sessions, mock exams, study materials, and AI tools are 100% free for all students.</p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-900 p-8 sm:p-10 rounded-3xl border border-emerald-500/50 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Student Plan — ₦0 NGN</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Free Practice & Exams Forever
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto text-xs text-slate-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited CBT Practice Questions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full Timed Mock Exam Simulations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PDF Study Materials & Summaries</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant SMART Step-by-Step Explanations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Custom Question Generator</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MenCore AI Assistant Support</span>
              </div>
            </div>

            <button
              onClick={onStartPractice}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-400/30 inline-flex items-center gap-2"
            >
              <span>Start Practicing Now For Free</span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 border-b border-slate-900" id="faq-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Have questions before starting? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 text-sm font-semibold text-slate-200 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Acadet Section */}
      <section className="py-20 bg-slate-900/60 border-b border-slate-800 relative overflow-hidden" id="about-acadet-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Modern University Practice Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              About Acadet
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-emerald-400 mx-auto rounded-full"></div>
          </div>

          {/* About Text Content */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed shadow-xl">
            <p>
              Acadet is a modern university learning and CBT practice platform designed to help students prepare smarter, practice confidently, and achieve academic success. The platform provides organized course materials, practice questions, mock examinations, performance tracking, and interactive learning tools tailored to each university, level, semester, and course.
            </p>
            <p>
              Built with reliability, simplicity, and innovation in mind, Acadet offers a seamless learning experience where students can access quality academic resources, monitor their progress, and strengthen their knowledge through structured practice. Every feature is designed to deliver accurate, real-time content while providing a secure and user-friendly environment.
            </p>
            <p>
              Whether you're preparing for tests, examinations, or improving your understanding of a course, Acadet is built to support your academic journey every step of the way.
            </p>

            {/* Mission & Vision Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-lg">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <span>Our Mission</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  To make quality academic preparation accessible through smart technology, helping students learn efficiently, practice consistently, and perform with confidence.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <span>Our Vision</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  To become one of the leading digital learning and CBT platforms, empowering students with innovative educational tools that improve learning outcomes across universities.
                </p>
              </div>
            </div>

            {/* Creators & Support */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Created By</span>
                  <span className="text-xl font-extrabold text-white">Menmex</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">With the Support of</span>
                  <span className="text-xl font-extrabold text-white">Joyce & Video Tutorial Team</span>
                </div>
              </div>
            </div>

            {/* Inspiration Quote */}
            <blockquote className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border-l-4 border-indigo-500 p-5 rounded-r-2xl italic text-slate-200 text-sm leading-relaxed relative">
              <Quote className="w-8 h-8 text-indigo-500/20 absolute top-3 right-3" />
              "Great ideas become reality through collaboration, dedication, and a shared commitment to excellence. Acadet is a reflection of that vision—built to inspire learning, empower students, and shape academic success."
            </blockquote>

            {/* Social Media WhatsApp Link */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">FACE ARENA (( Media)) WhatsApp Channel</h4>
                  <p className="text-xs sm:text-sm text-slate-300">Follow the FACE ARENA (( Media)) channel on WhatsApp for real-time academic updates and study materials.</p>
                </div>
              </div>

              <a
                href="https://whatsapp.com/channel/0029VbCkCtQ545urWwBmWM1Z"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                id="landing-whatsapp-btn"
              >
                <span>Follow Channel on WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* Real-Time Referral Leaderboard Section */}
      <section className="py-16 bg-slate-950 relative" id="homepage-referral-leaderboard-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReferralLeaderboard
            currentUser={currentUser}
            title="Referral Leaderboard"
            idPrefix="homepage-referral-lb"
          />
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-center relative overflow-hidden" id="cta-footer">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Score A’s in Your Next CBT Exams?</h2>
          <p className="text-slate-300 text-sm mb-6">Join thousands of university students practicing past questions and course material tests.</p>
          <button
            onClick={onStartPractice}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all"
          >
            Start Free Practice Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Acadet CBT MASTER. Created by Menmex with the support of Joyce and the video tutorial team. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <a
              href="https://whatsapp.com/channel/0029VbCkCtQ545urWwBmWM1Z"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>FACE ARENA (( Media)) WhatsApp</span>
            </a>
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
