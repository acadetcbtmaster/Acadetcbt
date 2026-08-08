import React, { useState } from 'react';
import { LearningResourceItem } from '../../types';
import {
  FileText,
  Download,
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface LearningResourcesSectionProps {
  resources: LearningResourceItem[];
}

export const LearningResourcesSection: React.FC<LearningResourcesSectionProps> = ({ resources }) => {
  const [search, setSearch] = useState<string>('');

  const filtered = resources.filter(
    (r) =>
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Featured Learning Resources</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            High-Yield Academic Resources
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Download PDF summary tables, formula cheat sheets, revision outlines, and diagram maps prepared by the Acadet educator team to boost your CBT exam performance.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources, course code, topic..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                  {res.courseCode}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{res.fileSize}</span>
              </div>

              <h3 className="text-base font-bold text-white line-clamp-2">{res.title}</h3>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{res.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">{res.universityName}</span>
              <a
                href={res.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
