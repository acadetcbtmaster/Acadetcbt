import {
  MenCoreSettings,
  MenCoreKnowledgeItem,
  MenCoreConversationLog,
  MenCoreAnnouncementItem,
  UserProfile,
  MenCoreNavigationTarget
} from '../types';
import { StorageService, safeStringify, sanitizeForJSON } from './storage';

const STORAGE_KEY_SETTINGS = 'cbt_mencore_settings_v1';
const STORAGE_KEY_KB = 'cbt_mencore_kb_v1';
const STORAGE_KEY_LOGS = 'cbt_mencore_logs_v1';
const STORAGE_KEY_ANNOUNCEMENTS = 'cbt_mencore_announcements_v1';

export const DEFAULT_MENCORE_SETTINGS: MenCoreSettings = {
  isEnabled: true,
  showOnAuthPages: false,
  maintenanceMode: false,
  onlineStatus: 'online',
  name: 'MenCore',
  subtitle: 'Powered by Menmex',
  tagline: 'Your Intelligent CBT Companion',
  welcomeMessage:
    "👋 Welcome to Acadet CBT Master.\n\nI'm MenCore, powered by Menmex.\n\nI can help you understand every feature inside this platform, guide you through the website, explain subscriptions, payments, study tools, and platform updates.\n\nI only answer questions related to Acadet CBT Master.\nAcademic and course-related assistance is currently disabled until enabled by the administrator.",
  typingSpeed: 15,
  responseSpeed: 'instant',
  maxConversationLength: 50,
  avatarUrl: '/mencore-logo.svg',
  themeColor: 'indigo',
  glowingAnimation: true,
  restrictedReplyMessage:
    "I'm MenCore, powered by Menmex.\n\nI only provide assistance related to Acadet CBT Master.\nAcademic assistance has not yet been enabled by the administrator.",
  permissions: {
    websiteFeatures: true,
    platformNavigation: true,
    premiumPlans: true,
    payments: true,
    notifications: true,
    accountRecovery: true,
    studyMaterials: true,
    community: true,
    analytics: true,
    academicQuestions: false,
    courseQuestions: false,
    universityQuestions: false,
    cbtQuestions: false,
    generalAI: false,
  },
};

export const DEFAULT_MENCORE_KNOWLEDGE_BASE: MenCoreKnowledgeItem[] = [
  {
    id: 'kb-start-cbt',
    title: 'How do I start CBT?',
    category: 'CBT & Practice',
    keywords: ['start cbt', 'how do i start cbt', 'begin test', 'take exam', 'start test', 'begin cbt', 'take test'],
    answer:
      "To start a CBT test on Acadet CBT Master:\n\n1. From your Student Dashboard, select your Target University, Academic Level, and Course.\n2. Choose 'Practice Mode' for timed/untimed practice with instant answers, or 'Mock CBT' for a real exam simulation.\n3. Select your desired topic or full syllabus and click 'Start CBT'.\n\nYou can start right away from your Dashboard!",
    navigationTarget: { label: 'Open Practice Mode', view: 'dashboard' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-where-practice',
    title: 'Where is Practice Mode?',
    category: 'CBT & Practice',
    keywords: ['where is practice mode', 'find practice mode', 'practice mode location', 'practice cbt'],
    answer:
      "Practice Mode is located on your primary Student Dashboard. It allows you to attempt questions with immediate feedback, detailed answer explanations, and customizable time limits.",
    navigationTarget: { label: 'Open Practice Mode', view: 'dashboard' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-how-subscribe',
    title: 'How do I subscribe?',
    category: 'Subscriptions & Payments',
    keywords: ['how do i subscribe', 'how to subscribe', 'subscribe', 'buy premium', 'upgrade to premium', 'purchase subscription', 'where can i subscribe', 'how can i subscribe'],
    answer:
      "Acadet CBT Master is 100% FREE for all students!\n\nAll subscription requirements and payment gateways have been removed. Every student automatically enjoys full, unlimited access to past questions, CBT practice, mock exams, PDF study materials, and MenCore AI features with zero payments required.",
    navigationTarget: { label: 'Open Subscription Page', view: 'dashboard', tab: 'subscription' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-reset-password',
    title: 'How do I reset my password?',
    category: 'Account & Profile',
    keywords: ['how do i reset my password', 'reset password', 'forgot password', 'change password', 'recover account', 'password hint'],
    answer:
      "If you forgot your password, you can use your Password Hint on the login screen. Once logged in, you can update your security settings and password inside your Profile modal.",
    navigationTarget: { label: 'Open Account Profile', view: 'dashboard', tab: 'profile' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-where-profile',
    title: 'Where is my profile?',
    category: 'Account & Profile',
    keywords: ['where is my profile', 'my profile', 'edit profile', 'view profile', 'account settings', 'update profile'],
    answer:
      "Your Profile is accessible from the top-right corner of your Dashboard. Clicking your name or avatar opens the Profile & Account Settings where you can view your university, department, level, and active subscription plan.",
    navigationTarget: { label: 'Open Profile Settings', view: 'dashboard', tab: 'profile' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-premium-benefits',
    title: 'What are Premium benefits?',
    category: 'Subscriptions & Payments',
    keywords: ['what are premium benefits', 'premium benefits', 'why subscribe', 'advantages of premium', 'premium features', 'paid features'],
    answer:
      "Acadet CBT Master Premium members enjoy:\n\n• Unlimited daily question attempts across all courses\n• Full access to Timed and Untimed Practice Mode & Exam Simulation Mock CBT\n• Comprehensive AI-supported answer explanations & study notes\n• Free access to downloadable Study Material PDFs\n• Performance Analytics & progress tracking\n• Priority support and learning community access",
    navigationTarget: { label: 'Open Subscription Page', view: 'dashboard', tab: 'subscription' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-upload-payment-proof',
    title: 'How do I upload payment proof?',
    category: 'Subscriptions & Payments',
    keywords: ['how do i upload payment proof', 'upload receipt', 'payment proof', 'transfer receipt', 'bank transfer verification'],
    answer:
      "After making a bank transfer for your subscription:\n\n1. Open the Subscription Page from your Dashboard.\n2. Select your plan and click 'I have made payment'.\n3. Enter your transaction reference number or sender name, and upload a screenshot of your bank receipt.\n4. Our automated system and administrators will verify your payment and activate your Premium status.",
    navigationTarget: { label: 'Open Subscription Page', view: 'dashboard', tab: 'subscription' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-view-results',
    title: 'How do I view my results?',
    category: 'CBT & Practice',
    keywords: ['how do i view my results', 'view results', 'cbt results', 'past results', 'test history', 'check scores', 'exam scores'],
    answer:
      "Your CBT results are automatically saved after every test. You can view your full result breakdown, subject scores, time spent, and detailed question corrections anytime in the Results & History view.",
    navigationTarget: { label: 'View CBT Results', view: 'results' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-mock',
    title: 'Explain Mock CBT.',
    category: 'CBT & Practice',
    keywords: ['explain mock cbt', 'what is mock cbt', 'mock test', 'mock exam', 'exam simulation'],
    answer:
      "Mock CBT is a full exam simulation designed to mirror real university CBT examinations (FUL & FUAHSE). It features a strict timer, randomized questions from past exams and standard curricula, and real exam conditions to prepare you for actual exam day.",
    navigationTarget: { label: 'Open Mock CBT Mode', view: 'dashboard' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-practice',
    title: 'Explain Practice Mode.',
    category: 'CBT & Practice',
    keywords: ['explain practice mode', 'what is practice mode', 'practice cbt mode', 'study practice'],
    answer:
      "Practice Mode allows you to study at your own pace. You can toggle between timed or untimed practice, select specific course topics, receive immediate correct answer highlights, and read detailed explanations after each question.",
    navigationTarget: { label: 'Open Practice Mode', view: 'dashboard' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-materials',
    title: 'Explain Study Materials.',
    category: 'Study Tools & Community',
    keywords: ['explain study materials', 'what are study materials', 'where are study materials', 'download pdfs', 'course notes', 'study materials'],
    answer:
      "Study Materials are located in the Dashboard. Our Study Materials library contains official lecture summaries, past question PDFs, revision outlines, formula sheets, and video tutorials curated for your university and department.",
    navigationTarget: { label: 'Open Study Materials', view: 'study-materials' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-community',
    title: 'Explain Community.',
    category: 'Study Tools & Community',
    keywords: ['explain community', 'what is community', 'learning community', 'student forum', 'discuss questions'],
    answer:
      "The Acadet CBT Master Learning Community is an interactive space where students from Federal University Lokoja (FUL) and Federal University of Allied Health Sciences (FUAHSE) discuss course topics, ask academic questions, upvote helpful answers, and collaborate.",
    navigationTarget: { label: 'Open Community', view: 'community' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-leaderboard',
    title: 'Explain Leaderboard.',
    category: 'Study Tools & Community',
    keywords: ['explain leaderboard', 'what is leaderboard', 'rankings', 'top students', 'explain leaderboards', 'high scores'],
    answer:
      "The Leaderboard showcases top-performing students across universities and departments based on CBT scores, consistency, and daily study streaks. Compete with peers and earn recognition for academic excellence!",
    navigationTarget: { label: 'Open Leaderboard', view: 'leaderboard' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-streak',
    title: 'Explain Daily Streak.',
    category: 'Platform Features',
    keywords: ['explain daily streak', 'what is daily streak', 'streak count', 'study streak', 'daily practice'],
    answer:
      "Your Daily Streak counts the number of consecutive days you have practiced at least one CBT session or study set on Acadet CBT Master. Maintaining a streak builds discipline and boosts your ranking on the Leaderboard.",
    navigationTarget: { label: 'Open Practice Mode', view: 'dashboard' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-admin',
    title: 'Explain Admin Dashboard.',
    category: 'Platform Features',
    keywords: ['explain admin dashboard', 'admin dashboard', 'admin panel', 'super admin', 'admin features'],
    answer:
      "The Admin Dashboard is a comprehensive management control center for system administrators. It includes 21 dedicated management modules for Students, Universities, Courses, Questions, Payments, Study Materials, Notifications, Analytics, and the MenCore AI Management System.",
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-notifications',
    title: 'Explain Notifications.',
    category: 'Platform Features',
    keywords: ['explain notifications', 'what are notifications', 'notification bell', 'announcements', 'alerts'],
    answer:
      "The Notification system delivers real-time platform updates, exam reminders, new study material announcements, and administrator broadcasts directly to your dashboard bell and MenCore widget.",
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-updates',
    title: 'Explain Recent Updates.',
    category: 'Platform Features',
    keywords: ['explain recent updates', 'recent updates', 'what is new', 'changelog', 'explain new features', 'new features'],
    answer:
      "Recent Updates to Acadet CBT Master include:\n\n• MenCore AI Assistant (Powered by Menmex) for instant platform guidance\n• Multimodal Smart Question Generator supporting PDF/photo uploads\n• Enhanced FUL & FUAHSE course curricula and past question banks\n• Real-time Learning Community & video tutorials integration",
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-settings',
    title: 'Explain Account Settings.',
    category: 'Account & Profile',
    keywords: ['explain account settings', 'account settings', 'update account', 'edit details', 'change university'],
    answer:
      "Account Settings allow you to update your profile information, change your university or department selection, edit your email or phone number, and review your subscription validity.",
    navigationTarget: { label: 'Open Account Settings', view: 'dashboard', tab: 'profile' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-plans',
    title: 'Explain Subscription Plans.',
    category: 'Subscriptions & Payments',
    keywords: ['explain subscription plans', 'subscription plans', 'plans available', 'pricing plans', 'how much is premium', 'price'],
    answer:
      "Acadet CBT Master offers three flexible plans:\n\n1. Free Trial Plan: Try 15 questions per course daily at no cost.\n2. 14-Day Premium (₦1,000): Unlimited CBT access, mock tests, and downloads for 2 weeks.\n3. 30-Day Premium (₦1,500): Unlimited CBT access, mock tests, and full study materials for an entire month.",
    navigationTarget: { label: 'Open Subscription Page', view: 'dashboard', tab: 'subscription' },
    isPinned: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-trial',
    title: 'Explain Trial Mode.',
    category: 'Subscriptions & Payments',
    keywords: ['explain trial mode', 'trial mode', 'free trial', 'is it free', 'free plan'],
    answer:
      "Trial Mode gives every registered student immediate free access to test the platform. In Trial Mode, you can practice up to 15 questions per day per course. Upgrade to Premium anytime to unlock unlimited CBT practice.",
    navigationTarget: { label: 'Open Subscription Page', view: 'dashboard', tab: 'subscription' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-analytics',
    title: 'Explain Performance Analytics.',
    category: 'CBT & Practice',
    keywords: ['explain performance analytics', 'performance analytics', 'my progress', 'analytics chart', 'score statistics'],
    answer:
      "Performance Analytics provide visual charts and insights into your academic strengths and areas for improvement. Track your average score per course, speed per question, attempt history, and readiness for exams.",
    navigationTarget: { label: 'Open Performance Analytics', view: 'analytics' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-bookmarks',
    title: 'Explain Bookmarks.',
    category: 'CBT & Practice',
    keywords: ['explain bookmarks', 'what are bookmarks', 'bookmarks', 'explain saved questions', 'saved questions'],
    answer:
      "Bookmarks (or Saved Questions) let you flag difficult or important CBT questions during practice. You can review all your saved questions later in your Bookmarks center to reinforce your revision.",
    navigationTarget: { label: 'Open Bookmarks', view: 'bookmarks' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-badges',
    title: 'Explain Achievement Badges.',
    category: 'Platform Features',
    keywords: ['explain achievement badges', 'achievement badges', 'badges', 'medals', 'rewards'],
    answer:
      "Achievement Badges are earned as you hit key milestones on Acadet CBT Master—such as completing 5 CBT tests, maintaining a 7-day study streak, or scoring 90% in a Mock CBT session.",
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-tutorials',
    title: 'Explain Tutorials.',
    category: 'Study Tools & Community',
    keywords: ['explain tutorials', 'tutorials', 'video tutorials', 'video lessons', 'joyce tutorials'],
    answer:
      "Tutorials include high-yield video lectures and step-by-step problem solving videos produced by our academic tutorial team to help you master complex course topics.",
    navigationTarget: { label: 'Open Study Materials', view: 'study-materials' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-explain-discussions',
    title: 'Explain Community Discussions.',
    category: 'Study Tools & Community',
    keywords: ['explain community discussions', 'community discussions', 'forum discussions', 'ask question forum'],
    answer:
      "Community Discussions allow students to post questions, share exam tips, and receive peer or tutor answers within the learning community.",
    navigationTarget: { label: 'Open Community', view: 'community' },
    isPinned: false,
    updatedAt: new Date().toISOString(),
  },
];

export const RESTRICTED_TOPICS_KEYWORDS = [
  'who is the president',
  'president',
  'teach me biology',
  'what is photosynthesis',
  'photosynthesis',
  'solve mathematics',
  'explain chemistry',
  'what is jamb',
  'who founded nigeria',
  'who founded',
  'capital of',
  'solve this equation',
  'calculate the velocity',
  'write an essay',
  'who won the election',
  'governor of',
  'what is the meaning of life',
];

export class MenCoreService {
  public static getSettings(): MenCoreSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_MENCORE_SETTINGS,
          ...parsed,
          permissions: {
            ...DEFAULT_MENCORE_SETTINGS.permissions,
            ...(parsed.permissions || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Could not load MenCore settings:', e);
    }
    return DEFAULT_MENCORE_SETTINGS;
  }

  public static saveSettings(settings: MenCoreSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, safeStringify(settings));
    } catch (e) {
      console.warn('Could not save MenCore settings:', e);
    }
  }

  public static getKnowledgeBase(): MenCoreKnowledgeItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KB);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load MenCore KB:', e);
    }
    return DEFAULT_MENCORE_KNOWLEDGE_BASE;
  }

  public static saveKnowledgeBase(items: MenCoreKnowledgeItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_KB, safeStringify(items));
    } catch (e) {
      console.warn('Could not save MenCore KB:', e);
    }
  }

  public static getLogs(): MenCoreConversationLog[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load MenCore logs:', e);
    }
    return [];
  }

  public static saveLog(log: MenCoreConversationLog): void {
    try {
      const logs = MenCoreService.getLogs();
      const updated = [log, ...logs].slice(0, 500); // Keep last 500 logs
      localStorage.setItem(STORAGE_KEY_LOGS, safeStringify(updated));
    } catch (e) {
      console.warn('Could not save MenCore log:', e);
    }
  }

  public static updateLogFeedback(logId: string, wasHelpful: boolean, starRating?: number): void {
    try {
      const logs = MenCoreService.getLogs();
      const updated = logs.map((l) => (l.id === logId ? { ...l, wasHelpful, starRating } : l));
      localStorage.setItem(STORAGE_KEY_LOGS, safeStringify(updated));
    } catch (e) {
      console.warn('Could not update log feedback:', e);
    }
  }

  public static deleteLog(logId: string): void {
    try {
      const logs = MenCoreService.getLogs();
      const updated = logs.filter((l) => l.id !== logId);
      localStorage.setItem(STORAGE_KEY_LOGS, safeStringify(updated));
    } catch (e) {
      console.warn('Could not delete log:', e);
    }
  }

  public static clearLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch (e) {
      console.warn('Could not clear logs:', e);
    }
  }

  public static getAnnouncements(): MenCoreAnnouncementItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load announcements:', e);
    }
    return [
      {
        id: 'anc-welcome-1',
        title: '🔔 New Feature Added!',
        content: 'Practice Mode now supports unlimited questions and instant explanations.',
        createdAt: new Date().toISOString(),
        isActive: true,
        badgeCount: 1,
      },
    ];
  }

  public static saveAnnouncements(items: MenCoreAnnouncementItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, safeStringify(items));
    } catch (e) {
      console.warn('Could not save announcements:', e);
    }
  }

  /**
   * Main AI answer resolution engine for MenCore
   */
  public static queryMenCore(
    questionText: string,
    userProfile?: UserProfile | null
  ): {
    answer: string;
    navigationTarget?: MenCoreNavigationTarget;
    questionType: 'platform' | 'navigation' | 'subscription' | 'academic' | 'restricted' | 'other';
    unanswered: boolean;
  } {
    const settings = MenCoreService.getSettings();
    const queryLower = questionText.trim().toLowerCase();

    const allowGeneralKnowledge =
      settings.permissions.generalAI ||
      settings.permissions.academicQuestions ||
      settings.permissions.courseQuestions ||
      settings.permissions.cbtQuestions;

    // 1. Check Restricted Topics
    const isRestrictedTopic = RESTRICTED_TOPICS_KEYWORDS.some((kw) => queryLower.includes(kw));

    if (isRestrictedTopic && !allowGeneralKnowledge) {
      return {
        answer: settings.restrictedReplyMessage,
        questionType: 'restricted',
        unanswered: false,
      };
    }

    // 2. Search built-in Knowledge Base
    const kb = MenCoreService.getKnowledgeBase();

    // Exact or strong keyword match
    let bestMatch = kb.find((item) => {
      // check keywords
      const hitKeyword = item.keywords.some((kw) => queryLower.includes(kw) || kw.includes(queryLower));
      const hitTitle = item.title.toLowerCase().includes(queryLower) || queryLower.includes(item.title.toLowerCase());
      return hitKeyword || hitTitle;
    });

    // Secondary semantic check for common phrases
    if (!bestMatch) {
      if (queryLower.includes('subscribe') || queryLower.includes('payment') || queryLower.includes('premium') || queryLower.includes('price')) {
        bestMatch = kb.find((i) => i.id === 'kb-how-subscribe' || i.id === 'kb-explain-plans');
      } else if (queryLower.includes('start cbt') || queryLower.includes('exam') || queryLower.includes('practice')) {
        bestMatch = kb.find((i) => i.id === 'kb-start-cbt' || i.id === 'kb-explain-practice');
      } else if (queryLower.includes('material') || queryLower.includes('pdf') || queryLower.includes('notes')) {
        bestMatch = kb.find((i) => i.id === 'kb-explain-materials');
      } else if (queryLower.includes('community') || queryLower.includes('forum')) {
        bestMatch = kb.find((i) => i.id === 'kb-explain-community');
      } else if (queryLower.includes('leaderboard') || queryLower.includes('rank')) {
        bestMatch = kb.find((i) => i.id === 'kb-explain-leaderboard');
      } else if (queryLower.includes('password') || queryLower.includes('login') || queryLower.includes('recover')) {
        bestMatch = kb.find((i) => i.id === 'kb-reset-password');
      } else if (queryLower.includes('result') || queryLower.includes('score')) {
        bestMatch = kb.find((i) => i.id === 'kb-view-results');
      }
    }

    if (bestMatch && !isRestrictedTopic) {
      let qType: 'platform' | 'navigation' | 'subscription' | 'academic' | 'other' = 'platform';
      if (bestMatch.navigationTarget) qType = 'navigation';
      if (bestMatch.category === 'Subscriptions & Payments') qType = 'subscription';

      return {
        answer: bestMatch.answer,
        navigationTarget: bestMatch.navigationTarget,
        questionType: qType,
        unanswered: false,
      };
    }

    // 3. General Knowledge Mode (when enabled by Admin)
    const hasAcademicTerm = [
      'define',
      'what is',
      'who is',
      'explain',
      'solve',
      'calculate',
      'biology',
      'chemistry',
      'physics',
      'anatomy',
      'jamb',
      'waec',
      'history',
      'president',
      'capital',
      'math',
      'equation',
    ].some((w) => queryLower.includes(w));

    if (allowGeneralKnowledge && (hasAcademicTerm || isRestrictedTopic || !bestMatch)) {
      let generalAnswer = '';
      if (queryLower.includes('photosynthesis')) {
        generalAnswer = "🌿 **Photosynthesis Explanation**\n\nPhotosynthesis is the process used by plants, algae, and green bacteria to synthesize glucose from carbon dioxide and water using sunlight.\n\n• **Chemical Equation**: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂\n• Occurs inside the chloroplasts containing chlorophyll.";
      } else if (queryLower.includes('president') && queryLower.includes('nigeria')) {
        generalAnswer = "🇳🇬 **General Knowledge**\n\nThe President of the Federal Republic of Nigeria is His Excellency Bola Ahmed Tinubu, who assumed office on May 29, 2023.";
      } else if (queryLower.includes('jamb') || queryLower.includes('utme')) {
        generalAnswer = "🎓 **JAMB / UTME Information**\n\nThe Joint Admissions and Matriculation Board (JAMB) conducts the Unified Tertiary Matriculation Examination (UTME) required for entry into Nigerian universities, polytechnics, and colleges of education.";
      } else {
        generalAnswer = `🤖 **MenCore General AI Companion**\n\n*General Knowledge Assistance is currently ENABLED by the administrator.*\n\nRegarding your question: **"${questionText}"**\n\nMenCore has processed your query using general academic knowledge. For course-specific CBT past questions, visit your Student Dashboard or Practice Mode to attempt practice tests!`;
      }

      return {
        answer: generalAnswer,
        questionType: 'academic',
        unanswered: false,
      };
    }

    if (hasAcademicTerm && !allowGeneralKnowledge) {
      return {
        answer: settings.restrictedReplyMessage,
        questionType: 'restricted',
        unanswered: false,
      };
    }

    // Unanswered platform question -> log for smart suggestions
    return {
      answer:
        "I'm MenCore, powered by Menmex.\n\nI couldn't find an exact answer for your query in our current Acadet CBT Master knowledge base. Our administrators have been notified so this topic can be added!\n\nYou can explore your Dashboard, Practice Mode, Study Materials, or Learning Community for more platform tools.",
      questionType: 'other',
      unanswered: true,
    };
  }

  /**
   * Async AI answer resolution engine for MenCore (Queries Gemini AI when General Knowledge is enabled)
   */
  public static async queryMenCoreAsync(
    questionText: string,
    userProfile?: UserProfile | null
  ): Promise<{
    answer: string;
    navigationTarget?: MenCoreNavigationTarget;
    questionType: 'platform' | 'navigation' | 'subscription' | 'academic' | 'restricted' | 'other';
    unanswered: boolean;
  }> {
    const settings = MenCoreService.getSettings();
    const allowGeneralKnowledge =
      settings.permissions.generalAI ||
      settings.permissions.academicQuestions ||
      settings.permissions.courseQuestions ||
      settings.permissions.cbtQuestions;

    // First check exact platform/navigation/subscription knowledge base matches
    const syncRes = MenCoreService.queryMenCore(questionText, userProfile);
    if (syncRes.questionType === 'platform' || syncRes.questionType === 'navigation' || syncRes.questionType === 'subscription') {
      return syncRes;
    }

    // If general knowledge mode is enabled, query Gemini AI
    if (allowGeneralKnowledge) {
      try {
        const response = await fetch('/api/ai/mencore-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: safeStringify({ questionText, userProfile: userProfile ? sanitizeForJSON(userProfile) : null }),
        });
        const data = await response.json();
        if (data.success && data.answer) {
          return {
            answer: data.answer,
            questionType: 'academic',
            unanswered: false,
          };
        }
      } catch (e) {
        console.warn('MenCore Gemini AI Chat API call fallback:', e);
      }
    }

    return syncRes;
  }
}
