import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  University,
  Course,
  TopicRequest,
  TutorialVideo,
  CommunityDiscussionPost,
  LearningResourceItem,
  CommunityAnnouncement,
  TopicCollectionConfig
} from '../types';
import { StorageService } from '../services/storage';
import { isContentApprovedAndVisible } from '../lib/communityUtils';
import { TopicRequestCenter } from './community/TopicRequestCenter';
import { TutorialVideosSection } from './community/TutorialVideosSection';
import { CommunityDiscussionsSection } from './community/CommunityDiscussionsSection';
import { LearningResourcesSection } from './community/LearningResourcesSection';
import { CommunityAnnouncementsSection } from './community/CommunityAnnouncementsSection';

// ... (keep icon imports)
import {
  Users,
  MessageSquarePlus,
  Video,
  MessageSquare,
  Bell,
  FileSpreadsheet,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  TrendingUp,
  Heart,
  Youtube,
  GraduationCap
} from 'lucide-react';

interface LearningCommunityViewProps {
  currentUser: UserProfile | null;
  universities: University[];
  courses: Course[];
  initialTab?: 'feed' | 'topic_requests' | 'tutorials' | 'discussions' | 'announcements' | 'resources';
  initialPreviewVideo?: TutorialVideo | null;
  onNavigate?: (tab: string) => void;
}

export const LearningCommunityView: React.FC<LearningCommunityViewProps> = ({
  currentUser,
  universities,
  courses,
  initialTab = 'feed',
  initialPreviewVideo = null,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'feed' | 'topic_requests' | 'tutorials' | 'discussions' | 'announcements' | 'resources'
  >(initialTab);

  const [topicRequests, setTopicRequests] = useState<TopicRequest[]>(() => StorageService.getTopicRequests());
  const [collectionConfig, setCollectionConfig] = useState<TopicCollectionConfig>(() => StorageService.getTopicCollectionConfig());
  const [videos, setVideos] = useState<TutorialVideo[]>(() => StorageService.getTutorialVideos());
  const [posts, setPosts] = useState<CommunityDiscussionPost[]>(() => StorageService.getCommunityPosts());
  const [resources, setResources] = useState<LearningResourceItem[]>(() => StorageService.getLearningResources());
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(() => StorageService.getCommunityAnnouncements());

  const [previewVideo, setPreviewVideo] = useState<TutorialVideo | null>(initialPreviewVideo);

  const refreshCommunityData = () => {
    setTopicRequests(StorageService.getTopicRequests());
    setCollectionConfig(StorageService.getTopicCollectionConfig());
    setVideos(StorageService.getTutorialVideos());
    setPosts(StorageService.getCommunityPosts());
    setResources(StorageService.getLearningResources());
    setAnnouncements(StorageService.getCommunityAnnouncements());
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshCommunityData();
    };
    window.addEventListener('cbt_storage_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('cbt_storage_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filter approved and visible items for students (admins can see draft items in admin panel)
  const isAdmin = currentUser?.role === 'admin';
  const visibleVideos = isAdmin ? videos : videos.filter(isContentApprovedAndVisible);
  const visiblePosts = isAdmin ? posts : posts.filter(isContentApprovedAndVisible);
  const visibleResources = isAdmin ? resources : resources.filter(isContentApprovedAndVisible);
  const visibleAnnouncements = isAdmin ? announcements : announcements.filter(isContentApprovedAndVisible);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto" id="learning-community-container">
      
      {/* Top Header Controls: Back Arrow (Top Left) & Cancel X Button (Top Right) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('dashboard');
            }
          }}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
          id="community-top-back-btn"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('dashboard');
            }
          }}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="community-top-cancel-btn"
          title="Cancel / Close Community Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Acadet Interactive Learning Space</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Learning Community
            </h1>
            <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
              Connect with fellow students, submit difficult course topics, watch video tutorials by Joyce and the video tutorial team, join academic discussions, and access high-yield learning resources.
            </p>
          </div>

          {/* Creators Badge */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2 shrink-0 max-w-xs">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Acadet Educator Network</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Created by <strong className="text-white">Menmex</strong> with tutorial masterclasses prepared by <strong className="text-indigo-300">Joyce and the video tutorial team</strong>.
            </p>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('feed')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Community Feed</span>
          </button>

          <button
            onClick={() => setActiveSubTab('topic_requests')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'topic_requests'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Topic Request Center</span>
            {topicRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold">
                {topicRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('tutorials')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'tutorials'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Tutorial Videos</span>
            {videos.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                {videos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('discussions')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'discussions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Academic Discussions</span>
          </button>

          <button
            onClick={() => setActiveSubTab('announcements')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'announcements'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Announcements</span>
          </button>

          <button
            onClick={() => setActiveSubTab('resources')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Learning Resources</span>
          </button>
        </div>
      </div>

      {/* Main Tab Router */}
      {activeSubTab === 'feed' && (
        <div className="space-y-8">
          {/* Top Banner Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Topic Request CTA Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Struggling with a Topic?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Submit topics you find difficult. High demand topics are selected for step-by-step video tutorials.
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('topic_requests')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <span>Request a Topic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tutorial Videos Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Watch Tutorial Previews</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Explore masterclass video lessons prepared by Joyce and the video tutorial team for Anatomy, Calculus, Concord, and Chemistry.
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('tutorials')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
              >
                <span>Explore Video Tutorials</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Academic Discussions Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Academic Discussions</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ask study questions, share mnemonics, discuss past CBT questions, and interact with peers.
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('discussions')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
              >
                <span>Join Discussions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Featured Video Tutorials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-red-400" />
                <span>Featured Tutorial Videos</span>
              </h3>
              <button
                onClick={() => setActiveSubTab('tutorials')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View All Videos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleVideos.slice(0, 2).map((vid) => (
                <div
                  key={vid.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                      {vid.courseCode}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{vid.durationMinutes} mins</span>
                  </div>

                  <h4 className="text-base font-bold text-white">{vid.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{vid.description}</p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">By {vid.createdByName || 'Joyce & Video Tutorial Team'}</span>
                    <button
                      onClick={() => {
                        setPreviewVideo(vid);
                        setActiveSubTab('tutorials');
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Preview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Pinned Announcements */}
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Latest Announcements</span>
            </h3>

            <CommunityAnnouncementsSection announcements={visibleAnnouncements} />
          </div>
        </div>
      )}

      {activeSubTab === 'topic_requests' && (
        <TopicRequestCenter
          currentUser={currentUser}
          universities={universities}
          courses={courses}
          collectionConfig={collectionConfig}
          onRefreshData={refreshCommunityData}
          onNavigateToTutorials={() => setActiveSubTab('tutorials')}
        />
      )}

      {activeSubTab === 'tutorials' && (
        <TutorialVideosSection
          videos={visibleVideos}
          courses={courses}
          universities={universities}
          onRefreshData={refreshCommunityData}
          selectedPreviewVideo={previewVideo}
          onClearPreviewVideo={() => setPreviewVideo(null)}
        />
      )}

      {activeSubTab === 'discussions' && (
        <CommunityDiscussionsSection
          posts={visiblePosts}
          currentUser={currentUser}
          courses={courses}
          onRefreshData={refreshCommunityData}
        />
      )}

      {activeSubTab === 'announcements' && (
        <CommunityAnnouncementsSection announcements={visibleAnnouncements} />
      )}

      {activeSubTab === 'resources' && (
        <LearningResourcesSection resources={visibleResources} />
      )}
    </div>
  );
};
