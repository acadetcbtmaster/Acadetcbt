import React, { useState } from 'react';
import { TutorialVideo, Course, University } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Video,
  Play,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Clock,
  Sparkles,
  BookOpen,
  GraduationCap,
  Building2,
  CheckCircle2,
  X,
  Youtube,
  Share2,
  Heart,
  Bookmark,
  BookmarkCheck,
  Flag,
  Check,
  Send,
  AlertTriangle
} from 'lucide-react';

interface TutorialVideosSectionProps {
  videos: TutorialVideo[];
  courses: Course[];
  universities: University[];
  onRefreshData: () => void;
  selectedPreviewVideo?: TutorialVideo | null;
  onClearPreviewVideo?: () => void;
}

export const TutorialVideosSection: React.FC<TutorialVideosSectionProps> = ({
  videos,
  courses,
  universities,
  onRefreshData,
  selectedPreviewVideo: initialPreviewVideo = null,
  onClearPreviewVideo,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUniversity, setFilterUniversity] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [activePreviewVideo, setActivePreviewVideo] = useState<TutorialVideo | null>(
    initialPreviewVideo
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [reportingVideo, setReportingVideo] = useState<TutorialVideo | null>(null);
  const [reportReason, setReportReason] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleLike = (vidId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = StorageService.toggleLikeVideo(vidId);
    showToast(res.isLiked ? 'Tutorial liked!' : 'Tutorial unliked.');
    onRefreshData();
  };

  const handleToggleSave = (vidId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = StorageService.toggleSaveVideo(vidId);
    showToast(isSaved ? 'Tutorial saved to bookmarks!' : 'Tutorial removed from bookmarks.');
    onRefreshData();
  };

  const handleShareVideo = (vid: TutorialVideo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = vid.youtubeUrl || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Tutorial link copied to clipboard!');
    } else {
      showToast('Sharing link: ' + shareUrl);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingVideo || !reportReason.trim()) return;

    StorageService.submitReport({
      targetType: 'tutorial',
      targetId: reportingVideo.id,
      targetTitle: reportingVideo.title,
      reason: reportReason.trim(),
      reportedBy: 'usr-student-current',
      reportedByName: 'Current Student',
    });

    setReportingVideo(null);
    setReportReason('');
    showToast('Report submitted successfully to administrators for review.');
  };

  // Filter videos
  const filteredVideos = videos.filter((vid) => {
    const matchesSearch =
      !searchQuery ||
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUni = !filterUniversity || vid.universityId === filterUniversity;
    const matchesCourse = !filterCourse || vid.courseCode === filterCourse || vid.courseId === filterCourse;

    return matchesSearch && matchesUni && matchesCourse;
  });

  const handleOpenPreview = (vid: TutorialVideo) => {
    StorageService.incrementVideoViews(vid.id);
    setActivePreviewVideo(vid);
    onRefreshData();
  };

  const handleClosePreview = () => {
    setActivePreviewVideo(null);
    if (onClearPreviewVideo) {
      onClearPreviewVideo();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Youtube className="w-4 h-4" />
            <span>Academic Video Tutorials</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Tutorial Videos
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Prepared by Joyce and the video tutorial team with step-by-step breakdowns for difficult university CBT topics. Watch quick in-app previews, study key points, and continue on YouTube for full tutorials.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic, course code, title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* University Filter */}
        <div>
          <select
            value={filterUniversity}
            onChange={(e) => setFilterUniversity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.shortName} - {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter */}
        <div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Video className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Tutorial Videos Found</h3>
          <p className="text-xs max-w-md mx-auto">
            Try adjusting your search query or filters. You can also submit a request in the Topic Request Center!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((vid) => (
            <div
              key={vid.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all flex flex-col group shadow-lg"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => handleOpenPreview(vid)}>
                <img
                  src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80'}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-bold tracking-wider flex items-center gap-1 backdrop-blur-sm">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>{vid.durationMinutes || 15} mins</span>
                </span>

                {/* Featured Badge */}
                {vid.isFeatured && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              {/* Video Info Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400">
                    <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                      {vid.courseCode}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 truncate">{vid.universityName}</span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-2 hover:text-indigo-300 transition-colors cursor-pointer" onClick={() => handleOpenPreview(vid)}>
                    {vid.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {vid.description}
                  </p>
                </div>

                {/* Key Learning Points */}
                {vid.keyLearningPoints && vid.keyLearningPoints.length > 0 && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Focus Areas:</span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {vid.keyLearningPoints.slice(0, 2).map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Stats & Student Interactions Bar */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{vid.viewsCount || 0} views</span>
                      </span>
                      <span>By <strong className="text-slate-200">{vid.createdByName || 'Joyce & Video Tutorial Team'}</strong></span>
                    </div>

                    {/* Like, Save, Share, Report Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleLike(vid.id, e)}
                        className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                          Array.isArray(vid.likedBy) && vid.likedBy.includes('usr-student-current')
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                        title="Like Tutorial"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            Array.isArray(vid.likedBy) && vid.likedBy.includes('usr-student-current')
                              ? 'fill-rose-500 text-rose-500'
                              : ''
                          }`}
                        />
                        <span className="text-[10px] font-bold">{vid.likesCount || 0}</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleSave(vid.id, e)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          Array.isArray(vid.savedBy) && vid.savedBy.includes('usr-student-current')
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                        title="Save Bookmark"
                      >
                        {Array.isArray(vid.savedBy) && vid.savedBy.includes('usr-student-current') ? (
                          <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleShareVideo(vid, e)}
                        className="p-1.5 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
                        title="Share Tutorial"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportingVideo(vid);
                        }}
                        className="p-1.5 rounded-lg bg-slate-950 text-slate-500 border border-slate-800 hover:border-red-500/40 hover:text-red-400 transition-colors cursor-pointer"
                        title="Report Inappropriate Content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleOpenPreview(vid)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Watch Preview
                    </button>
                    <a
                      href={vid.youtubeUrl || 'https://whatsapp.com/channel/0029VbCkCtQ545urWwBmWM1Z'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>YouTube</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Content Reporting Modal */}
      {reportingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setReportingVideo(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Report Inappropriate Content</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{reportingVideo.title}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Reason for Reporting</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this video contains inappropriate or inaccurate academic content..."
                  rows={4}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingVideo(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {activePreviewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative space-y-6 shadow-2xl my-8">
            <button
              onClick={handleClosePreview}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player / Embedded Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5">
                  <Youtube className="w-4 h-4" />
                  <span>Tutorial Video Preview</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {activePreviewVideo.courseCode} • {activePreviewVideo.durationMinutes} minutes
                </span>
              </div>

              {/* Video Player Box */}
              <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl">
                {activePreviewVideo.youtubeVideoId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activePreviewVideo.youtubeVideoId}?autoplay=1&rel=0`}
                    title={activePreviewVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={activePreviewVideo.thumbnailUrl}
                      alt={activePreviewVideo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl">
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </div>
                      <p className="text-sm font-bold text-white max-w-md">
                        Watch Full Tutorial on YouTube Channel
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {activePreviewVideo.title}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {activePreviewVideo.description}
              </p>
            </div>

            {/* Key Learning Points */}
            {activePreviewVideo.keyLearningPoints && activePreviewVideo.keyLearningPoints.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Key Learning Points Covered in this Tutorial:
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  {activePreviewVideo.keyLearningPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Created by <strong className="text-white">{activePreviewVideo.createdByName || 'Joyce & Video Tutorial Team'}</strong> for {activePreviewVideo.universityName}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleClosePreview}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer w-full sm:w-auto"
                >
                  Close Preview
                </button>
                <a
                  href={activePreviewVideo.youtubeUrl || 'https://whatsapp.com/channel/0029VbCkCtQ545urWwBmWM1Z'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  <span>Watch Full Tutorial on YouTube</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
