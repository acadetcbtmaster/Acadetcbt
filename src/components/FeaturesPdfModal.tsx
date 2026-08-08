import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Award,
  Video,
  Users,
  MessageSquare,
  BarChart3,
  Sliders,
  Cpu,
  Zap,
  Globe,
  Database,
  Layers,
  Lock,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FeaturesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeaturesPdfModal: React.FC<FeaturesPdfModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const documentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Function to handle browser print / save as PDF
  const handleNativePrint = () => {
    window.print();
  };

  // Function to handle direct PDF generation using jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    try {
      setIsGenerating(true);
      setDownloadProgress('Preparing document canvas...');

      const element = documentRef.current;
      
      // Capture the element using html2canvas with oklch color conversion in onclone
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = 1;
          testCanvas.height = 1;
          const ctx = testCanvas.getContext('2d');

          const convertColor = (val: string): string => {
            if (!val || typeof val !== 'string' || !val.includes('oklch')) return val;
            if (ctx) {
              try {
                ctx.fillStyle = '#000000';
                ctx.fillStyle = val;
                return ctx.fillStyle;
              } catch (e) {
                return '#4f46e5';
              }
            }
            return val;
          };

          // 1. Convert oklch in all <style> tags in cloned document
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
              styleTag.textContent = styleTag.textContent.replace(
                /oklch\([^)]+\)/gi,
                (match) => convertColor(match)
              );
            }
          });

          // 2. Convert oklch in computed styles & inline styles for all elements
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const comp = window.getComputedStyle(el);
              const colorProps = [
                'color',
                'background-color',
                'border-color',
                'border-top-color',
                'border-right-color',
                'border-bottom-color',
                'border-left-color',
                'outline-color',
                'fill',
                'stroke',
              ];
              colorProps.forEach((prop) => {
                const val = comp.getPropertyValue(prop);
                if (val && val.includes('oklch')) {
                  const converted = convertColor(val);
                  el.style.setProperty(prop, converted, 'important');
                }
              });

              const inlineStyle = el.getAttribute('style');
              if (inlineStyle && inlineStyle.includes('oklch')) {
                const cleanedInline = inlineStyle.replace(
                  /oklch\([^)]+\)/gi,
                  (match) => convertColor(match)
                );
                el.setAttribute('style', cleanedInline);
              }
            }
          });
        },
      });

      setDownloadProgress('Generating PDF pages...');
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      setDownloadProgress('Downloading file...');
      pdf.save('Acadet_CBT_Master_Features_Specification.pdf');
      setDownloadProgress('Download completed!');
      
      setTimeout(() => {
        setIsGenerating(false);
        setDownloadProgress('');
      }, 1500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback to print method if canvas capture fails
      setDownloadProgress('Capture fallback... Opening print dialog.');
      setTimeout(() => {
        setIsGenerating(false);
        window.print();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Acadet CBT Master — Platform Feature Catalog</span>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono rounded-full">PDF Document</span>
              </h2>
              <p className="text-xs text-slate-400">
                Official specifications, capabilities, and system features overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{downloadProgress || 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleNativePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-2"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-950 text-slate-200 space-y-6 print:p-0 print:bg-white print:text-black">
          
          {/* Document Container that gets exported to PDF */}
          <div
            ref={documentRef}
            className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-200 space-y-8 max-w-4xl mx-auto print:border-none print:shadow-none print:max-w-none print:rounded-none font-sans"
            id="pdf-document-root"
          >
            {/* Header Banner */}
            <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-700 font-black text-xl sm:text-2xl tracking-tight">
                  <GraduationCap className="w-8 h-8 text-indigo-600" />
                  <span>ACADET CBT MASTER</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  The Definitive Medical & Academic CBT Practice & Learning Ecosystem
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 border-l-2 sm:border-l-0 sm:border-r-2 border-indigo-600 pl-3 sm:pl-0 sm:pr-3">
                <p className="font-bold text-slate-800">Engineered by: <span className="text-indigo-600">Menmex</span></p>
                <p className="font-bold text-slate-800">Supported by: <span className="text-indigo-600">Joyce and the video tutorial team</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Version 3.5 — Published Specification</p>
              </div>
            </div>

            {/* Document Overview */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 sm:p-5 text-xs text-indigo-950 leading-relaxed space-y-2">
              <h3 className="font-extrabold text-sm text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Executive Platform Summary</span>
              </h3>
              <p>
                <strong>Acadet CBT Master</strong> is an advanced, multi-institutional Computer-Based Testing (CBT) practice platform and peer learning community designed for students in Nigerian tertiary health and science institutions (including <strong>FUAHSE, FUL, UNILAG, OAU, ABU, UI</strong>, and affiliated medical faculties). Built by <strong>Menmex</strong> with the support of <strong>Joyce and the video tutorial team</strong>, the platform combines real exam simulations, AI weakness detection, a community topic request engine, and video tutorials.
              </p>
            </div>

            {/* Feature Section 1 */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>1. Core Academic Architecture & Question Bank</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Multi-Institutional Hierarchy</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Organized by University (e.g. FUAHSE), Faculty (e.g. Allied Health Sciences), Department (Anatomy, Nursing, Radiography, MLS), Academic Level (100L–600L), and Semester.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Comprehensive Question Bank</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Thousands of verified past questions and high-yield original practice questions complete with detailed answer breakdowns, option explanations, and clinical notes.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Question Bookmark & Saved Library</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Students can bookmark tricky questions during CBT sessions or review, tag them by difficulty, and access dedicated review decks for focused revision.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>High-Yield Study Materials & Resources</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Downloadable PDF summary notes, anatomy relation tables, formula cheat sheets, and course syllabus guides available in the Learning Community.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Section 2 */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <span>2. CBT Practice Engine & Exam Simulation</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Standard CBT Practice Mode</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Custom study mode allowing students to choose course codes, question count, and untimed or timed mode with instant step-by-step explanations.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Official Mock CBT Simulator</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Strict examination conditions replicating official university computer-based tests, including live countdown timers, question flagging, and submit confirmations.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>On-Screen Scientific Calculator</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Integrated popup calculator accessible directly within CBT test sessions for calculation-heavy courses in Biostatistics, Physics, and Pharmacology.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Performance Analysis & Video Recommendations</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Post-test breakdown identifying weak areas and automatically linking students to step-by-step tutorial videos prepared by Joyce and the video tutorial team to fix learning gaps.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Section 3 */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>3. Learning Community & Topic Request Center</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Student Topic Request Center</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Students can submit difficult academic topics specifying University, Level, Course, Topic Name, and Description of what they find confusing.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Joyce & Video Tutorial Team Library</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Curated video masterclasses recorded by Joyce and the video tutorial team covering high-demand student requests, complete with embedded YouTube player, duration tags, and key points.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Academic Discussions & Peer Q&A</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Community forum where students post questions, upvote helpful answers, tag specific courses, and discuss past question solutions.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Community Announcements & Updates</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Pinned academic announcements, exam countdown reminders, release logs for new tutorials by Joyce and the video tutorial team, and platform updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Section 4 */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>4. Administrative Control & Grouped Analytics</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Grouped Demand Analytics</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Admin tools that group identical and similar student topic requests across institutions to pinpoint the highest demand topics needing tutorials by Joyce and the video tutorial team.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Topic Submission Collection Control</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Administrators can open or close topic request submissions with customized notices (e.g. "Topic submissions temporarily paused while Joyce and the video tutorial team record videos").
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>User & Role Access Management</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Full user administration with Role-Based Access Control (Super Admin, Content Manager, Student), student status toggles, and ban enforcement.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Voucher Engine & Subscription Billing</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Bulk voucher code generator, tier configurations (Free Trial, Monthly, Semester, Lifetime Access), and manual account activation controls.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Section 5 */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>5. Analytics, Leaderboards & Platform Infrastructure</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Student Analytics Dashboard</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Tracks time per question, average speed, historical accuracy per course, total questions attempted, and subject weakness heatmaps.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Global & University Leaderboards</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Competitive ranking system highlighting top performing students overall and filtered by specific universities and departments.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Study Streak & Gamification System</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Daily practice streak tracker, streak freeze protection, achievement badges, and milestone awards to maintain student consistency.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Security, Audit & Data Backups</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Full security logging, system health monitors, automated database backups, and instant JSON database restoration.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
              <div>
                <strong>Acadet CBT Master</strong> — Developed by <strong>Menmex</strong>, supported by <strong>Joyce and the video tutorial team</strong>.
              </div>
              <div className="font-mono text-slate-400">
                Official Platform Specification Sheet • Confidential & Academic Documentation
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 print:hidden">
          <p className="text-xs text-slate-400 hidden sm:block">
            Click <strong>Download PDF</strong> to export this complete feature catalog directly to your device.
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
