import React from 'react';
import { X, GraduationCap, Target, Eye, Heart, MessageSquare, ExternalLink, Sparkles, Quote, Award } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" id="about-acadet-modal">
      <div className="bg-slate-900 border border-indigo-500/30 max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden relative my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Acadet CBT MASTER
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  Official
                </span>
              </h2>
              <p className="text-xs text-slate-400">About the Platform & Academic Vision</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            id="close-about-modal-btn"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
          
          {/* About Acadet Paragraphs */}
          <section className="space-y-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              About Acadet
            </h3>
            <p>
              Acadet is a modern university learning and CBT practice platform designed to help students prepare smarter, practice confidently, and achieve academic success. The platform provides organized course materials, practice questions, mock examinations, performance tracking, and interactive learning tools tailored to each university, level, semester, and course.
            </p>
            <p>
              Built with reliability, simplicity, and innovation in mind, Acadet offers a seamless learning experience where students can access quality academic resources, monitor their progress, and strengthen their knowledge through structured practice. Every feature is designed to deliver accurate, real-time content while providing a secure and user-friendly environment.
            </p>
            <p>
              Whether you're preparing for tests, examinations, or improving your understanding of a course, Acadet is built to support your academic journey every step of the way.
            </p>
          </section>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Our Mission */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Target className="w-4 h-4" />
                <span>Our Mission</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                To make quality academic preparation accessible through smart technology, helping students learn efficiently, practice consistently, and perform with confidence.
              </p>
            </div>

            {/* Our Vision */}
            <div className="bg-cyan-950/30 border border-cyan-500/30 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Eye className="w-4 h-4" />
                <span>Our Vision</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                To become one of the leading digital learning and CBT platforms, empowering students with innovative educational tools that improve learning outcomes across universities.
              </p>
            </div>
          </div>

          {/* Created By & Supported By */}
          <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Created By</span>
                <span className="text-base font-extrabold text-white">Menmex</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">With the Support of</span>
                <span className="text-base font-extrabold text-white">Joyce & Video Tutorial Team</span>
              </div>
            </div>
          </div>

          {/* Quote Block */}
          <blockquote className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border-l-4 border-indigo-500 p-4 rounded-r-2xl italic text-slate-300 text-xs leading-relaxed relative">
            <Quote className="w-6 h-6 text-indigo-500/30 absolute top-2 right-2" />
            "Great ideas become reality through collaboration, dedication, and a shared commitment to excellence. Acadet is a reflection of that vision—built to inspire learning, empower students, and shape academic success."
          </blockquote>

          {/* Social Media Link */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Official WhatsApp Channel</h4>
                <p className="text-xs text-slate-400">Follow the FACE ARENA (( Media)) channel on WhatsApp</p>
              </div>
            </div>

            <a
              href="https://whatsapp.com/channel/0029VbCkCtQ545urWwBmWM1Z"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
              id="whatsapp-channel-btn"
            >
              <span>Join Channel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            id="about-close-btn"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
