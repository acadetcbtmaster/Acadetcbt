import React from 'react';
import { CommunityAnnouncement } from '../../types';
import { Bell, Sparkles, Pin, ExternalLink, Calendar, Youtube } from 'lucide-react';

interface CommunityAnnouncementsSectionProps {
  announcements: CommunityAnnouncement[];
}

export const CommunityAnnouncementsSection: React.FC<CommunityAnnouncementsSectionProps> = ({ announcements }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Bell className="w-4 h-4" />
            <span>Community Announcements</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Academic News & Updates
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Stay updated with the latest video tutorial releases, university CBT exam schedule updates, and study tips from the Acadet team.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`bg-slate-900 border rounded-2xl p-6 space-y-3 transition-all shadow-lg relative ${
              ann.isPinned ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900' : 'border-slate-800'
            }`}
          >
            {ann.isPinned && (
              <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3 text-amber-400" />
                <span>Pinned</span>
              </span>
            )}

            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                {ann.category}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>

            <h3 className="text-lg font-bold text-white">{ann.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {ann.content}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
              <span>Published by <strong className="text-white">{ann.authorName}</strong></span>

              {ann.youtubeLink && (
                <a
                  href={ann.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>Watch Tutorial Video</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
