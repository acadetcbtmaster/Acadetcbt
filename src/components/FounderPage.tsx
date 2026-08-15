import React, { useEffect } from 'react';
import brandLogo from '../assets/images/exact_acadet_cbt_logo_1786225425882.jpg';
import {
  GraduationCap,
  Sparkles,
  Award,
  Globe,
  Code2,
  Share2,
  Video,
  ClipboardCheck,
  Megaphone,
  Wifi,
  Compass,
  CheckCircle2,
  Mail,
  ExternalLink,
  ArrowLeft,
  BookOpen,
  Users,
  ShieldCheck,
  Target,
  Eye,
  Heart,
  Youtube,
  MessageSquare,
  Building2,
  Cpu,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

import { UserProfile } from '../types';

interface FounderPageProps {
  onNavigateHome?: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigate?: (tab: string) => void;
  onOpenSubscribe?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  currentUser?: UserProfile | null;
  themeMode?: 'dark' | 'light';
}

export const FounderPage: React.FC<FounderPageProps> = ({
  onNavigateHome,
  onNavigateTab,
  onNavigate,
  onOpenSubscribe,
  onOpenAuth,
  currentUser,
  themeMode = 'dark',
}) => {
  const handleGoBack = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (onNavigate) {
      onNavigate(currentUser ? 'dashboard' : 'landing');
    } else {
      window.location.href = '/';
    }
  };
  // Update document title, dynamic meta, and structured data for SEO & Knowledge Graph
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Menmex – Founder of Acadet CBT Master';

    // Set canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://acadetcbt.website/founder';

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (metaDesc) {
      metaDesc.content =
        'Meet Menmex, the visionary Founder, Creator, and Lead Developer of Acadet CBT Master. Computer Science student at Federal University Lokoja, digital solutions architect, and educational technologist.';
    }

    // Inject JSON-LD into document.head
    const structuredDataId = 'founder-jsonld-schema';
    let scriptTag = document.getElementById(structuredDataId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = structuredDataId;
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: 'Menmex',
          alternateName: 'Menmex',
          url: 'https://acadetcbt.website/founder',
          jobTitle: 'Founder, Website Developer & Digital Solutions Architect',
          description:
            'Founder of Acadet CBT Master, Computer Science student at Federal University Lokoja, Website Developer, Social Media Manager, Digital Content Creator, Online Registration Expert, Advertising & Promotion Specialist, Internet Solutions Provider, and Life Coach.',
          alumniOf: {
            '@type': 'CollegeOrUniversity',
            name: 'Federal University Lokoja',
            url: 'https://fulokoja.edu.ng',
          },
          worksFor: {
            '@type': 'EducationalOrganization',
            name: 'Acadet CBT Master',
            url: 'https://acadetcbt.website',
          },
          sameAs: [
            'https://youtube.com/@acadetcbtmaster',
            'https://whatsapp.com/channel/0029VbD0s0Y7oQhXIlLM4c3K',
            'https://acadetcbt.website/founder',
          ],
          knowsAbout: [
            'Computer Science',
            'Web Development',
            'CBT Examination Systems',
            'Educational Technology',
            'Digital Marketing',
            'Social Media Management',
            'Online Registration',
            'Advertising & Promotion',
            'Life Coaching',
          ],
        },
      });
      document.head.appendChild(scriptTag);
    }

    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      document.title = originalTitle;
      const el = document.getElementById(structuredDataId);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  const roles = [
    {
      title: 'Founder of Acadet CBT Master',
      icon: Award,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
      description: 'Visionary architect and product lead behind the modern university CBT simulation platform.',
    },
    {
      title: 'Website Developer & Builder',
      icon: Code2,
      color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30',
      description: 'Full-stack software engineer crafting performant, scalable, and secure web applications.',
    },
    {
      title: 'Social Media Manager',
      icon: Share2,
      color: 'from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30',
      description: 'Strategic digital brand builder growing active academic and student communities.',
    },
    {
      title: 'Digital Content Creator',
      icon: Video,
      color: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30',
      description: 'Producing educational tutorials, CBT breakdowns, exam strategies, and video masterclasses.',
    },
    {
      title: 'Online Registration Expert',
      icon: ClipboardCheck,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
      description: 'Specialist in higher institution portals, university registrations, and student verification.',
    },
    {
      title: 'Advertising & Promotion Specialist',
      icon: Megaphone,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
      description: 'Designing high-conversion marketing campaigns, campus outreach, and student awareness drives.',
    },
    {
      title: 'Internet Solutions Provider',
      icon: Wifi,
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30',
      description: 'Delivering end-to-end technical consulting, networking, cloud setup, and web infrastructure.',
    },
    {
      title: 'Life Coach',
      icon: Compass,
      color: 'from-teal-500/20 to-teal-600/10 text-teal-400 border-teal-500/30',
      description: 'Mentoring youth and university students on personal development, study discipline, and tech careers.',
    },
  ];

  const majorProjects = [
    {
      name: 'Acadet CBT Master',
      category: 'Flagship EdTech Platform',
      status: 'Live & Active',
      description:
        'A comprehensive university learning and Computer Based Test (CBT) practice engine featuring real-time timed mock exams, past questions, course syllabus tracking, and performance analytics.',
      highlights: [
        'Organized university course hierarchies & past questions',
        'Realistic CBT mock exam interface with timer & instant grading',
        'Comprehensive performance analytics & review breakdown',
        'Secure multi-tier role authorization & payment integrations',
      ],
      link: 'https://acadetcbt.website',
    },
    {
      name: 'MenCore AI Academic Assistant',
      category: 'Intelligent Study Engine',
      status: 'Integrated',
      description:
        'A specialized AI study companion engineered directly into Acadet CBT Master to generate step-by-step academic explanations, analyze student weaknesses, and offer personalized study paths.',
      highlights: [
        'Real-time contextual question explanation and concept breakdown',
        'Adaptive difficulty calibration based on student practice data',
        'Automated question curation and syllabus mapping',
      ],
      link: '#',
    },
    {
      name: 'Acadet Face Arena',
      category: 'Competitive Peer Testing',
      status: 'Live',
      description:
        'A real-time competitive examination arena where students challenge peers across departments and universities in fast-paced timed quiz showdowns with live leaderboards.',
      highlights: [
        'Real-time peer testing & leaderboard rankings',
        'Speed and accuracy metrics for competitive preparedness',
        'Campus-wide championship tournaments',
      ],
      link: '#',
    },
    {
      name: 'AcadetCBT Learning HUB & YouTube',
      category: 'Multimedia Educational Network',
      status: 'Active Community',
      description:
        'An educational multimedia ecosystem on YouTube and WhatsApp providing video tutorials, exam walkthroughs, past question breakdowns, and daily study updates to thousands of students.',
      highlights: [
        'Free video tutorials covering core university courses',
        'Direct student support and academic advisement',
        'Collaborative study groups and verified academic updates',
      ],
      link: 'https://youtube.com/@acadetcbtmaster?si=Z05Z-87Vtar00lsr',
    },
  ];

  const technicalSkills = [
    { name: 'Full-Stack Web Architecture', level: 96, category: 'Engineering' },
    { name: 'TypeScript, React & Node.js', level: 95, category: 'Engineering' },
    { name: 'CBT Examination Engine Design', level: 98, category: 'EdTech' },
    { name: 'Cloud Firestore & Security Rules', level: 92, category: 'Cloud' },
    { name: 'SEO & Structured Data (JSON-LD)', level: 94, category: 'SEO' },
    { name: 'Social Media Management & Growth', level: 90, category: 'Marketing' },
    { name: 'Digital Content Creation & Video', level: 92, category: 'Media' },
    { name: 'Student Mentorship & Life Coaching', level: 95, category: 'Leadership' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 sm:py-10 selection:bg-indigo-500 selection:text-white" id="founder-page-container">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer shadow-sm group"
            id="founder-back-to-home-btn"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Acadet Home</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-300">Official Founder Profile</span>
          </div>
        </div>

        {/* Hero Section: Menmex Founder Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Founder Avatar & Key Stats */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-slate-900 border-2 border-indigo-400/60 overflow-hidden flex items-center justify-center p-2 shadow-2xl">
                  <img
                    src={brandLogo}
                    alt="Menmex – Founder of Acadet CBT Master"
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <h1 className="mt-5 text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                Menmex
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 inline-flex items-center justify-center text-xs font-bold" title="Verified Founder">
                  ✓
                </span>
              </h1>

              <p className="text-sm font-bold text-indigo-400 mt-1">
                Founder, Creator & Lead Architect
              </p>

              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Federal University Lokoja</span>
              </div>

              <div className="flex items-center gap-3 mt-5">
                <a
                  href="https://youtube.com/@acadetcbtmaster?si=Z05Z-87Vtar00lsr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors shadow-sm"
                  title="Acadet CBT Master YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://whatsapp.com/channel/0029VbD0s0Y7oQhXIlLM4c3K"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors shadow-sm"
                  title="AcadetCBT Learning HUB WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
                <a
                  href="mailto:admin@menmex.ng"
                  className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors shadow-sm"
                  title="Contact Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Founder Summary & Statements */}
            <div className="lg:col-span-8 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Founder Authority & Leadership Spotlight</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Empowering University Students Through Innovative Educational Technology
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                <strong className="text-white font-semibold">Menmex</strong> is a visionary Nigerian technologist, Computer Science scholar at <strong className="text-indigo-300 font-semibold">Federal University Lokoja</strong>, full-stack software engineer, and the <strong className="text-emerald-300 font-semibold">Founder and Creator of Acadet CBT Master</strong>.
              </p>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Driven by a deep passion for digital transformation and student academic excellence, Menmex built Acadet CBT Master to bridge the gap between traditional learning and modern computer-based examination success for university students nationwide.
              </p>

              {/* Quick Profile Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Institution</span>
                  <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">FULokoja</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Discipline</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-400 mt-0.5 block">Computer Science</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Platform</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 block">Acadet CBT Master</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Focus</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5 block">EdTech & AI</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Professional Biography & Founder Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Professional Biography */}
          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Professional Biography</h3>
                  <p className="text-xs text-slate-400">Academic Background & Digital Leadership</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                As a Computer Science student at <strong className="text-white">Federal University Lokoja (FULokoja)</strong>, Menmex combines rigorous theoretical foundations in algorithms, software engineering, and database architectures with hands-on enterprise product engineering.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                Beyond his role as the lead developer of Acadet CBT Master, Menmex serves as an internet solutions provider, online registration expert, social media strategist, and life coach. His multifaceted expertise has enabled him to design student-centric digital systems that solve real operational bottlenecks in Nigerian higher education.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                His leadership philosophy centers on accessible technology, relentless discipline, and mentorship—guiding fellow students to master both computer science concepts and practical examinations.
              </p>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Federal University Lokoja, Nigeria</span>
                <span className="text-[11px] text-slate-400 block">Department of Computer Science • Faculty of Science</span>
              </div>
            </div>
          </div>

          {/* Founder Story */}
          <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">The Founder Story</h3>
                  <p className="text-xs text-slate-400">How Acadet CBT Master Was Born</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                The inspiration for Acadet CBT Master arose from a critical observation on Nigerian university campuses: thousands of ambitious students faced severe anxiety and suboptimal test outcomes due to lack of realistic computer-based exam practice and fragmented study resources.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                Recognizing this urgent need, Menmex architected Acadet CBT Master from the ground up—building a simulated CBT environment that mirrors official university examination interfaces, with authentic timed sessions, detailed instant performance analytics, and structured course past questions.
              </p>

              <p className="text-slate-300 text-sm leading-relaxed">
                With the valuable collaboration of Joyce and the video tutorial team, the platform evolved into a comprehensive digital learning hub incorporating video walkthroughs, AI-driven explanations, and real-time student community discussions.
              </p>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Collaborative Impact</span>
                <span className="text-[11px] text-slate-400 block">Supported by Joyce and the dedicated Acadet Tutorial Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Vision & Mission */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mission */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">The Founder's Mission</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              To make quality academic preparation and university-grade CBT practice easily accessible to every student through intuitive, robust, and smart technology—enabling learners to study systematically, master past examination questions, and test with supreme confidence.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/30 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">The Founder's Vision</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              To position Acadet CBT Master as Africa's most reliable, trusted, and impactful digital learning and examination preparation ecosystem, establishing benchmarks in academic excellence, AI-powered study analytics, and student success.
            </p>
          </div>
        </section>

        {/* Section 3: Professional Roles & Areas of Authority */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Disciplinary Professional Roles</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Roles & Areas of Professional Expertise
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Menmex brings together high-level software engineering, digital marketing, student guidance, and internet operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r, idx) => {
              const IconComp = r.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-3 transition-all hover:scale-[1.02] shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} border flex items-center justify-center shadow-inner`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">{r.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Verified Role</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Major Projects & Key Innovations */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Portfolio of Impact</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Major Projects & Technological Innovations
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Key platforms and educational systems developed and managed by Menmex.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {majorProjects.map((proj, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xl transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {proj.category}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {proj.status}
                    </span>
                  </div>

                  <h4 className="text-lg sm:text-xl font-bold text-white">{proj.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{proj.description}</p>

                  <div className="space-y-1.5 pt-2">
                    {proj.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {proj.link !== '#' && (
                  <div className="pt-3 border-t border-slate-800">
                    <a
                      href={proj.link}
                      target={proj.link.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Explore Project</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Technical Skills & Competencies */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Skills & Core Expertise</h3>
              <p className="text-xs text-slate-400">Engineering, Architecture, Content Strategy & Leadership</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Founder Technical Profile
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalSkills.map((skill, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{skill.name}</span>
                  <span className="text-indigo-400 font-semibold">{skill.level}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Connect & Official Contacts */}
        <section className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Connect Directly with Menmex
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Have questions regarding Acadet CBT Master, university study strategies, digital solutions, or technical partnerships? Reach out through official verified channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* YouTube */}
            <a
              href="https://youtube.com/@acadetcbtmaster?si=Z05Z-87Vtar00lsr"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-950/30 border border-red-500/40 hover:bg-red-950/50 p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group cursor-pointer shadow-lg"
              id="founder-youtube-card-btn"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <Youtube className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white">YouTube Masterclasses</span>
              <span className="text-[11px] text-slate-400">@acadetcbtmaster</span>
              <span className="text-xs text-red-400 font-semibold flex items-center gap-1 pt-1">
                Subscribe & Learn <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            {/* WhatsApp Hub */}
            <a
              href="https://whatsapp.com/channel/0029VbD0s0Y7oQhXIlLM4c3K"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-950/30 border border-emerald-500/40 hover:bg-emerald-950/50 p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group cursor-pointer shadow-lg"
              id="founder-whatsapp-card-btn"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white">AcadetCBT Learning HUB</span>
              <span className="text-[11px] text-slate-400">Official WhatsApp Channel</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                Join Community <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            {/* Email */}
            <a
              href="mailto:admin@menmex.ng"
              className="bg-sky-950/30 border border-sky-500/40 hover:bg-sky-950/50 p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group cursor-pointer shadow-lg"
              id="founder-email-card-btn"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white">Official Correspondence</span>
              <span className="text-[11px] text-slate-400">admin@menmex.ng</span>
              <span className="text-xs text-sky-400 font-semibold flex items-center gap-1 pt-1">
                Send Inquiries <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGoBack}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              id="founder-cta-start-practice-btn"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Acadet CBT Master</span>
            </button>
            {onOpenSubscribe && (
              <button
                onClick={onOpenSubscribe}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-all cursor-pointer"
                id="founder-cta-subscribe-btn"
              >
                <span>View Subscription Plans</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
