import React, { useState } from 'react';
import {
  TopicRequest,
  TopicCollectionConfig,
  TutorialVideo,
  University,
  Course,
  CommunityDiscussionPost,
  CommunityAnnouncement,
  LearningResourceItem,
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  MessageSquarePlus,
  MessageSquare,
  Bell,
  Video,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Download,
  BarChart3,
  Sparkles,
  Layers,
  GraduationCap,
  Building2,
  X,
  Youtube,
  Send,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface TopicRequestManagementModuleProps {
  universities: University[];
  courses: Course[];
}

export const TopicRequestManagementModule: React.FC<TopicRequestManagementModuleProps> = ({
  universities,
  courses,
}) => {
  const [requests, setRequests] = useState<TopicRequest[]>(() => StorageService.getTopicRequests());
  const [collectionConfig, setCollectionConfig] = useState<TopicCollectionConfig>(() =>
    StorageService.getTopicCollectionConfig()
  );
  const [videos, setVideos] = useState<TutorialVideo[]>(() => StorageService.getTutorialVideos());
  const [posts, setPosts] = useState<CommunityDiscussionPost[]>(() => StorageService.getCommunityPosts());
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>(() => StorageService.getCommunityAnnouncements());
  const [resources, setResources] = useState<LearningResourceItem[]>(() => StorageService.getLearningResources());

  const [activeSubTab, setActiveSubTab] = useState<
    'grouped' | 'all_requests' | 'videos' | 'discussions' | 'announcements' | 'resources' | 'analytics' | 'moderation'
  >('grouped');
  const [reports, setReports] = useState<any[]>(() => StorageService.getReports());

  // Publishing Status Filter
  const [approvalFilter, setApprovalFilter] = useState<'All' | 'Draft' | 'Approved' | 'Rejected' | 'Archived' | 'Hidden'>('All');

  // Search & Uni Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUni, setFilterUni] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Add/Edit Video Modal
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [videoYoutubeUrl, setVideoYoutubeUrl] = useState<string>('');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [videoCourseCode, setVideoCourseCode] = useState<string>('');
  const [videoTopic, setVideoTopic] = useState<string>('');
  const [videoUniId, setVideoUniId] = useState<string>('');
  const [videoPoints, setVideoPoints] = useState<string>('');
  const [videoFeatured, setVideoFeatured] = useState<boolean>(false);
  const [videoApprovalStatus, setVideoApprovalStatus] = useState<'Draft' | 'Approved' | 'Rejected' | 'Archived'>('Approved');
  const [videoVisibility, setVideoVisibility] = useState<'visible' | 'hidden'>('visible');

  // Announcement Modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');
  const [annCategory, setAnnCategory] = useState<'New Tutorial' | 'Academic Update' | 'CBT Notice' | 'Weekly Tip'>('Academic Update');
  const [annYoutubeLink, setAnnYoutubeLink] = useState<string>('');
  const [annPinned, setAnnPinned] = useState<boolean>(true);
  const [annApprovalStatus, setAnnApprovalStatus] = useState<'Draft' | 'Approved' | 'Rejected' | 'Archived'>('Approved');
  const [annVisibility, setAnnVisibility] = useState<'visible' | 'hidden'>('visible');

  // Learning Resource Modal
  const [showResourceModal, setShowResourceModal] = useState<boolean>(false);
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [resTitle, setResTitle] = useState<string>('');
  const [resDescription, setResDescription] = useState<string>('');
  const [resType, setResType] = useState<'PDF Summary' | 'Formula Sheet' | 'Revision Outline' | 'Diagram' | 'Past Q&A Note'>('PDF Summary');
  const [resFileUrl, setResFileUrl] = useState<string>('');
  const [resFileSize, setResFileSize] = useState<string>('1.2 MB');
  const [resUniName, setResUniName] = useState<string>('');
  const [resCourseCode, setResCourseCode] = useState<string>('');
  const [resLevel, setResLevel] = useState<string>('100 Level');
  const [resApprovalStatus, setResApprovalStatus] = useState<'Draft' | 'Approved' | 'Rejected' | 'Archived'>('Approved');
  const [resVisibility, setResVisibility] = useState<'visible' | 'hidden'>('visible');

  // Toggle Config Modal
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [closedMessage, setClosedMessage] = useState<string>(
    collectionConfig.closedMessage ||
      'Topic requests are currently closed. They will reopen after new tutorials have been prepared.'
  );

  const refreshData = () => {
    setRequests(StorageService.getTopicRequests());
    setCollectionConfig(StorageService.getTopicCollectionConfig());
    setVideos(StorageService.getTutorialVideos());
    setPosts(StorageService.getCommunityPosts());
    setAnnouncements(StorageService.getCommunityAnnouncements());
    setResources(StorageService.getLearningResources());
  };

  // Group similar topic requests by course code & normalized topic title
  const groupedTopicMap: Record<
    string,
    {
      topicKey: string;
      topicTitle: string;
      courseCode: string;
      courseTitle: string;
      universityName: string;
      totalCount: number;
      requestsList: TopicRequest[];
    }
  > = {};

  requests.forEach((req) => {
    const key = `${req.courseCode}-${req.topicTitle.toLowerCase().trim()}`;
    if (!groupedTopicMap[key]) {
      groupedTopicMap[key] = {
        topicKey: key,
        topicTitle: req.topicTitle,
        courseCode: req.courseCode,
        courseTitle: req.courseTitle,
        universityName: req.universityName,
        totalCount: 0,
        requestsList: [],
      };
    }
    groupedTopicMap[key].totalCount += req.requestCount || 1;
    groupedTopicMap[key].requestsList.push(req);
  });

  const sortedGroupedTopics = Object.values(groupedTopicMap).sort(
    (a, b) => b.totalCount - a.totalCount
  );

  // Status Handler
  const handleStatusChange = (id: string, newStatus: TopicRequest['status']) => {
    StorageService.updateTopicRequestStatus(id, newStatus);
    refreshData();
  };

  // Delete Request
  const handleDeleteRequest = (id: string) => {
    if (window.confirm('Are you sure you want to delete this topic request?')) {
      StorageService.deleteTopicRequest(id);
      refreshData();
    }
  };

  // Toggle Collection Status
  const handleSaveCollectionConfig = (isOpen: boolean) => {
    const updated: TopicCollectionConfig = {
      isOpen,
      closedMessage: closedMessage.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin',
    };
    StorageService.setTopicCollectionConfig(updated);
    setShowConfigModal(false);
    refreshData();
  };

  // Video Management
  const handleOpenVideoModal = (presetReq?: TopicRequest, existing?: TutorialVideo) => {
    if (existing) {
      setEditingVideoId(existing.id);
      setVideoTitle(existing.title);
      setVideoDescription(existing.description);
      setVideoYoutubeUrl(existing.youtubeUrl);
      setVideoThumbnailUrl(existing.thumbnailUrl);
      setVideoDuration(existing.durationMinutes);
      setVideoCourseCode(existing.courseCode);
      setVideoTopic(existing.topic);
      setVideoUniId(existing.universityId);
      setVideoPoints(existing.keyLearningPoints ? existing.keyLearningPoints.join('\n') : '');
      setVideoFeatured(existing.isFeatured);
      setVideoApprovalStatus(existing.approvalStatus || 'Approved');
      setVideoVisibility(existing.visibility || 'visible');
    } else if (presetReq) {
      setVideoTitle(`Tutorial: ${presetReq.topicTitle}`);
      setVideoCourseCode(presetReq.courseCode);
      setVideoTopic(presetReq.topicTitle);
      setVideoUniId(presetReq.universityId);
      setVideoDescription('');
      setVideoYoutubeUrl('');
      setVideoThumbnailUrl('');
      setVideoDuration(15);
      setVideoPoints('');
      setVideoFeatured(false);
      setVideoApprovalStatus('Approved');
      setVideoVisibility('visible');
      setEditingVideoId(null);
    } else {
      setVideoTitle('');
      setVideoCourseCode('');
      setVideoTopic('');
      setVideoUniId('');
      setVideoDescription('');
      setVideoYoutubeUrl('');
      setVideoThumbnailUrl('');
      setVideoDuration(15);
      setVideoPoints('');
      setVideoFeatured(false);
      setVideoApprovalStatus('Approved');
      setVideoVisibility('visible');
      setEditingVideoId(null);
    }
    setShowVideoModal(true);
  };

  const handleSaveVideoWithStatus = (
    e: React.FormEvent,
    status: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;

    let ytId = '';
    if (videoYoutubeUrl.includes('v=')) {
      ytId = videoYoutubeUrl.split('v=')[1]?.split('&')[0] || '';
    } else if (videoYoutubeUrl.includes('youtu.be/')) {
      ytId = videoYoutubeUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    }

    const pointsArray = videoPoints
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const targetUni = universities.find((u) => u.id === videoUniId);

    const videoObj: TutorialVideo = {
      id: editingVideoId || `vid-${Date.now()}`,
      title: videoTitle.trim(),
      description: videoDescription.trim(),
      thumbnailUrl:
        videoThumbnailUrl.trim() ||
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      youtubeUrl: videoYoutubeUrl.trim() || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: ytId || 'dQw4w9WgXcQ',
      universityId: videoUniId || 'uni-ful',
      universityName: targetUni?.name || 'Federal University',
      level: '100 Level',
      semester: 'First Semester',
      courseId: 'crs-1',
      courseCode: videoCourseCode || 'GEN101',
      courseTitle: videoTopic || 'General Study',
      topic: videoTopic || 'Academic Topic',
      durationMinutes: Number(videoDuration) || 15,
      keyLearningPoints: pointsArray.length > 0 ? pointsArray : ['Step-by-step CBT solutions', 'Anatomical/Mathematical breakdowns'],
      viewsCount: editingVideoId ? videos.find((v) => v.id === editingVideoId)?.viewsCount || 100 : 0,
      isFeatured: videoFeatured,
      approvalStatus: status,
      visibility: visibility,
      createdAt: new Date().toISOString(),
      createdByName: 'Joyce and video tutorial team',
    };

    StorageService.saveTutorialVideo(videoObj);
    setShowVideoModal(false);
    refreshData();
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    handleSaveVideoWithStatus(e, videoApprovalStatus, videoVisibility);
  };

  const handleUpdateVideoPublishing = (
    vid: TutorialVideo,
    approvalStatus: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    const updated = { ...vid, approvalStatus, visibility };
    StorageService.saveTutorialVideo(updated);
    refreshData();
  };

  // Announcement Management
  const handleOpenAnnouncementModal = (existing?: CommunityAnnouncement) => {
    if (existing) {
      setEditingAnnId(existing.id);
      setAnnTitle(existing.title);
      setAnnContent(existing.content);
      setAnnCategory(existing.category);
      setAnnYoutubeLink(existing.youtubeLink || '');
      setAnnPinned(existing.isPinned);
      setAnnApprovalStatus(existing.approvalStatus || 'Approved');
      setAnnVisibility(existing.visibility || 'visible');
    } else {
      setEditingAnnId(null);
      setAnnTitle('');
      setAnnContent('');
      setAnnCategory('Academic Update');
      setAnnYoutubeLink('');
      setAnnPinned(true);
      setAnnApprovalStatus('Approved');
      setAnnVisibility('visible');
    }
    setShowAnnouncementModal(true);
  };

  const handleSaveAnnouncementWithStatus = (
    e: React.FormEvent,
    status: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const annObj: CommunityAnnouncement = {
      id: editingAnnId || `ann-${Date.now()}`,
      title: annTitle.trim(),
      content: annContent.trim(),
      category: annCategory,
      authorName: 'Acadet Admin',
      youtubeLink: annYoutubeLink.trim() || undefined,
      createdAt: new Date().toISOString(),
      isPinned: annPinned,
      approvalStatus: status,
      visibility: visibility,
    };

    StorageService.saveCommunityAnnouncement(annObj);
    setShowAnnouncementModal(false);
    refreshData();
  };

  const handleUpdateAnnouncementPublishing = (
    ann: CommunityAnnouncement,
    approvalStatus: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    const updated = { ...ann, approvalStatus, visibility };
    StorageService.saveCommunityAnnouncement(updated);
    refreshData();
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('Delete this announcement permanently?')) {
      StorageService.deleteCommunityAnnouncement(id);
      refreshData();
    }
  };

  // Learning Resource Management
  const handleOpenResourceModal = (existing?: LearningResourceItem) => {
    if (existing) {
      setEditingResId(existing.id);
      setResTitle(existing.title);
      setResDescription(existing.description);
      setResType(existing.resourceType);
      setResFileUrl(existing.fileUrl);
      setResFileSize(existing.fileSize);
      setResUniName(existing.universityName);
      setResCourseCode(existing.courseCode);
      setResLevel(existing.level);
      setResApprovalStatus(existing.approvalStatus || 'Approved');
      setResVisibility(existing.visibility || 'visible');
    } else {
      setEditingResId(null);
      setResTitle('');
      setResDescription('');
      setResType('PDF Summary');
      setResFileUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
      setResFileSize('1.2 MB');
      setResUniName(universities[0]?.name || 'Federal University Lokoja (FUL)');
      setResCourseCode('GST101');
      setResLevel('100 Level');
      setResApprovalStatus('Approved');
      setResVisibility('visible');
    }
    setShowResourceModal(true);
  };

  const handleSaveResourceWithStatus = (
    e: React.FormEvent,
    status: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    e.preventDefault();
    if (!resTitle.trim()) return;

    const resObj: LearningResourceItem = {
      id: editingResId || `res-${Date.now()}`,
      title: resTitle.trim(),
      description: resDescription.trim(),
      resourceType: resType,
      fileUrl: resFileUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: resFileSize.trim() || '1.2 MB',
      universityName: resUniName,
      courseCode: resCourseCode.trim(),
      level: resLevel,
      approvalStatus: status,
      visibility: visibility,
      createdAt: new Date().toISOString(),
    };

    StorageService.saveLearningResource(resObj);
    setShowResourceModal(false);
    refreshData();
  };

  const handleUpdateResourcePublishing = (
    res: LearningResourceItem,
    approvalStatus: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    const updated = { ...res, approvalStatus, visibility };
    StorageService.saveLearningResource(updated);
    refreshData();
  };

  const handleDeleteResource = (id: string) => {
    if (window.confirm('Delete this learning resource permanently?')) {
      StorageService.deleteCommunityAnnouncement(id);
      refreshData();
    }
  };

  const handleUpdatePostPublishing = (
    post: CommunityDiscussionPost,
    approvalStatus: 'Draft' | 'Approved' | 'Rejected' | 'Archived',
    visibility: 'visible' | 'hidden'
  ) => {
    const updated: CommunityDiscussionPost = {
      ...post,
      approvalStatus,
      visibility,
      status: approvalStatus === 'Approved' ? 'Active' : (approvalStatus as any),
    };
    StorageService.saveCommunityPost(updated);
    refreshData();
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm('Delete this community post permanently?')) {
      StorageService.deleteCommunityPost(id);
      refreshData();
    }
  };

  const handleDeleteVideo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tutorial video?')) {
      StorageService.deleteTutorialVideo(id);
      refreshData();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Request ID', 'Student Name', 'University', 'Level', 'Semester', 'Course Code', 'Topic Title', 'Status', 'Date'],
      ...requests.map((r) => [
        r.id,
        `"${r.studentName}"`,
        `"${r.universityName}"`,
        r.level,
        r.semester,
        r.courseCode,
        `"${r.topicTitle}"`,
        r.status,
        new Date(r.createdAt).toLocaleDateString(),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Acadet_Topic_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Learning Community Management</span>
          </div>
          <h2 className="text-2xl font-black text-white">Topic Request & Tutorial Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor student requests, group high-demand course topics, manage video tutorials by Joyce and the video tutorial team, and toggle request collection windows.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleSaveCollectionConfig(!collectionConfig.isOpen)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              collectionConfig.isOpen
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {collectionConfig.isOpen ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Close Topic Collection</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Reopen Topic Collection</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleOpenVideoModal()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tutorial Video</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Requests</span>
          <p className="text-2xl font-black text-white">{requests.length}</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Grouped Topics</span>
          <p className="text-2xl font-black text-indigo-400">{sortedGroupedTopics.length}</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Published Videos</span>
          <p className="text-2xl font-black text-red-400">{videos.length}</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Collection Status</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                collectionConfig.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-sm font-bold text-slate-200">
              {collectionConfig.isOpen ? 'Open for Submissions' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('grouped')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'grouped'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>High-Demand Grouped Topics ({sortedGroupedTopics.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('all_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'all_requests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Individual Student Submissions ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('videos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'videos'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Tutorial Videos ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('discussions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'discussions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Articles & Discussions ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Announcements ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('resources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'resources'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Learning Resources ({resources.length})</span>
        </button>

        <button
          onClick={() => {
            setReports(StorageService.getReports());
            setActiveSubTab('analytics');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Community Analytics</span>
        </button>

        <button
          onClick={() => {
            setReports(StorageService.getReports());
            setActiveSubTab('moderation');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'moderation'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Moderation ({reports.length})</span>
        </button>
      </div>

      {/* View 1: Grouped Topics (Curriculum Demand) */}
      {activeSubTab === 'grouped' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Topic requests automatically grouped by course and topic title. High-demand topics are ranked at the top to help plan Joyce and the video tutorial team's upcoming video tutorials.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {sortedGroupedTopics.map((group, idx) => (
              <div
                key={group.topicKey}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                      Rank #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                      {group.courseCode}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">{group.universityName}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{group.topicTitle}</h3>

                  <p className="text-xs text-slate-400 italic">
                    Sample Challenge: "{group.requestsList[0]?.challengeDescription || 'Student request'}"
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400">{group.totalCount}</span>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Requests</span>
                  </div>

                  <button
                    onClick={() => handleOpenVideoModal(group.requestsList[0])}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Plan Tutorial</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 2: All Individual Requests Table */}
      {activeSubTab === 'all_requests' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Course & Topic</th>
                  <th className="p-3.5">University</th>
                  <th className="p-3.5">Challenge Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3.5">
                      <strong className="text-white block">{req.studentName}</strong>
                      <span className="text-[11px] text-slate-400">{req.studentEmail}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold text-[10px] mr-1.5">
                        {req.courseCode}
                      </span>
                      <strong className="text-slate-100">{req.topicTitle}</strong>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {req.universityName} • {req.level}
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-xs line-clamp-2">
                      {req.challengeDescription}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Tutorial Planned">Tutorial Planned</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Videos Management */}
      {activeSubTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Tutorial Videos Publishing Control</h3>
              <p className="text-xs text-slate-400">Approved videos automatically stream live to student devices in real-time.</p>
            </div>
            <button
              onClick={() => handleOpenVideoModal()}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tutorial Video</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((vid) => {
              const status = vid.approvalStatus || 'Approved';
              const isVis = vid.visibility !== 'hidden';
              return (
                <div
                  key={vid.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-300 font-bold border border-red-500/20 rounded">
                        {vid.courseCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'Approved' && isVis
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : status === 'Draft'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {status === 'Approved' && isVis ? 'Approved & Live' : !isVis ? 'Hidden' : status}
                        </span>
                        <span className="text-slate-400 text-[11px]">{vid.durationMinutes} mins</span>
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white">{vid.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{vid.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{vid.viewsCount || 0} views • {vid.likesCount || 0} likes</span>
                      <span>By {vid.createdByName || 'Joyce & Team'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdateVideoPublishing(vid, 'Approved', 'visible')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Approve & Publish
                        </button>
                      )}
                      {status !== 'Draft' && (
                        <button
                          onClick={() => handleUpdateVideoPublishing(vid, 'Draft', 'hidden')}
                          className="px-2.5 py-1 bg-amber-600/30 text-amber-200 hover:bg-amber-600/50 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Save Draft
                        </button>
                      )}
                      {status !== 'Rejected' && (
                        <button
                          onClick={() => handleUpdateVideoPublishing(vid, 'Rejected', 'hidden')}
                          className="px-2.5 py-1 bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateVideoPublishing(vid, vid.approvalStatus || 'Approved', isVis ? 'hidden' : 'visible')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        {isVis ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleOpenVideoModal(undefined, vid)}
                        className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(vid.id)}
                        className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-[11px] font-semibold cursor-pointer ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 3b: Articles & Discussions */}
      {activeSubTab === 'discussions' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-sm">Community Articles & Discussion Posts Moderation</h3>
            <p className="text-xs text-slate-400">Review student discussions or publish official admin academic articles.</p>
          </div>

          <div className="space-y-3">
            {posts.map((post) => {
              const status = post.approvalStatus || (post.status === 'Hidden' ? 'Draft' : 'Approved');
              const isVis = post.visibility !== 'hidden';
              return (
                <div key={post.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 rounded">
                        {post.courseCode}
                      </span>
                      <span className="text-slate-300 font-medium">By {post.authorName}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'Approved' && isVis
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {status === 'Approved' && isVis ? 'Approved & Live' : 'Draft / Restricted'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{post.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-3">{post.content}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-slate-500">{post.upvotes || 0} Upvotes • {post.repliesCount || 0} Replies</span>

                    <div className="flex items-center gap-1.5">
                      {status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdatePostPublishing(post, 'Approved', 'visible')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Approve Post
                        </button>
                      )}
                      {status !== 'Draft' && (
                        <button
                          onClick={() => handleUpdatePostPublishing(post, 'Draft', 'hidden')}
                          className="px-2.5 py-1 bg-amber-600/30 text-amber-200 hover:bg-amber-600/50 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Set Draft
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 3c: Announcements */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Community Announcements Control</h3>
              <p className="text-xs text-slate-400">Broadcast notices, weekly tips, and CBT exam updates to all students.</p>
            </div>
            <button
              onClick={() => handleOpenAnnouncementModal()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => {
              const status = ann.approvalStatus || 'Approved';
              const isVis = ann.visibility !== 'hidden';
              return (
                <div key={ann.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 rounded">
                      {ann.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'Approved' && isVis
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {status === 'Approved' && isVis ? 'Approved & Published' : 'Draft / Hidden'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{ann.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{ann.content}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-slate-500 text-xs">Posted by {ann.authorName}</span>
                    <div className="flex items-center gap-1.5">
                      {status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdateAnnouncementPublishing(ann, 'Approved', 'visible')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Approve & Publish
                        </button>
                      )}
                      {status !== 'Draft' && (
                        <button
                          onClick={() => handleUpdateAnnouncementPublishing(ann, 'Draft', 'hidden')}
                          className="px-2.5 py-1 bg-amber-600/30 text-amber-200 hover:bg-amber-600/50 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Set Draft
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenAnnouncementModal(ann)}
                        className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 3d: Learning Resources */}
      {activeSubTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Learning Resources Control</h3>
              <p className="text-xs text-slate-400">Manage PDF summary sheets, formula cheatsheets, and revision outlines.</p>
            </div>
            <button
              onClick={() => handleOpenResourceModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((res) => {
              const status = res.approvalStatus || 'Approved';
              const isVis = res.visibility !== 'hidden';
              return (
                <div key={res.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 rounded">
                        {res.courseCode} • {res.resourceType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          status === 'Approved' && isVis
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {status === 'Approved' && isVis ? 'Approved' : 'Draft'}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-base">{res.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{res.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-slate-500 text-xs">{res.fileSize} • {res.universityName}</span>
                    <div className="flex items-center gap-1.5">
                      {status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdateResourcePublishing(res, 'Approved', 'visible')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {status !== 'Draft' && (
                        <button
                          onClick={() => handleUpdateResourcePublishing(res, 'Draft', 'hidden')}
                          className="px-2.5 py-1 bg-amber-600/30 text-amber-200 hover:bg-amber-600/50 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Set Draft
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenResourceModal(res)}
                        className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="px-2.5 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 4: Community Analytics */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Requests</span>
              <p className="text-2xl font-extrabold text-white mt-1">{requests.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tutorials Uploaded</span>
              <p className="text-2xl font-extrabold text-red-400 mt-1">{videos.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Grouped Topics</span>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{sortedGroupedTopics.length}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Views</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {videos.reduce((sum, v) => sum + (v.viewsCount || 0), 0)}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Likes</span>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">
                {videos.reduce((sum, v) => sum + (v.likesCount || 0), 0)}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Community Members</span>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">1,240+</p>
            </div>
          </div>

          {/* Leaderboards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Requested Topics */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Most Requested Topics</span>
              </h3>
              <div className="space-y-2">
                {sortedGroupedTopics.slice(0, 5).map((gt, i) => (
                  <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">{gt.topicTitle}</strong>
                      <span className="text-slate-400 text-[11px]">{gt.courseCode} • {gt.universityName}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 rounded-full">
                      {gt.totalCount} Requests
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Viewed & Liked Tutorials */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-red-400" />
                <span>Most Popular Tutorial Videos</span>
              </h3>
              <div className="space-y-2">
                {[...videos].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 5).map((vid) => (
                  <div key={vid.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block truncate max-w-xs">{vid.title}</strong>
                      <span className="text-slate-400 text-[11px]">{vid.courseCode} • {vid.universityName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 font-bold block">{vid.viewsCount || 0} views</span>
                      <span className="text-rose-400 text-[10px]">{vid.likesCount || 0} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 5: Moderation Center */}
      {activeSubTab === 'moderation' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Moderate content reports submitted by students. Administrators can review flagged tutorial videos, dismiss invalid reports, or take down inappropriate content.
          </p>

          {reports.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-slate-200">No Content Reports Pending</p>
              <p className="text-xs">All community tutorial videos and topic requests are clean and compliant.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                      Flagged {rep.targetType}
                    </span>
                    <span className="text-slate-500 text-[11px]">{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{rep.targetTitle}</h4>
                  <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    "{rep.reason}"
                  </p>
                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span>Reported by: <strong className="text-slate-200">{rep.reportedByName}</strong></span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updated = reports.filter((r) => r.id !== rep.id);
                          setReports(updated);
                          StorageService.saveReports(updated);
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg cursor-pointer"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => {
                          if (rep.targetType === 'tutorial') {
                            StorageService.deleteTutorialVideo(rep.targetId);
                            setVideos(StorageService.getTutorialVideos());
                          }
                          const updated = reports.filter((r) => r.id !== rep.id);
                          setReports(updated);
                          StorageService.saveReports(updated);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Delete Flagged Content
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative space-y-5 shadow-2xl">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500" />
              <span>{editingVideoId ? 'Edit Tutorial Video' : 'Add New Tutorial Video'}</span>
            </h3>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tutorial Title *
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Muscles of the Upper Limb & Brachial Plexus Breakdown"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={videoCourseCode}
                    onChange={(e) => setVideoCourseCode(e.target.value)}
                    placeholder="e.g. ANA101"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  YouTube Video Link / URL *
                </label>
                <input
                  type="text"
                  value={videoYoutubeUrl}
                  onChange={(e) => setVideoYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Key Learning Points (One per line)
                </label>
                <textarea
                  rows={3}
                  value={videoPoints}
                  onChange={(e) => setVideoPoints(e.target.value)}
                  placeholder="Full origin & insertion muscle table&#10;Brachial plexus roots & trunks&#10;CBT past question solutions"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Brief description of what students will learn..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featChk"
                  checked={videoFeatured}
                  onChange={(e) => setVideoFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-600"
                />
                <label htmlFor="featChk" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Feature this video on Learning Community Feed
                </label>
              </div>

              <div className="pt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveVideoWithStatus(e, 'Draft', 'hidden')}
                  className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/30 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveVideoWithStatus(e, 'Approved', 'visible')}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative space-y-5 shadow-2xl">
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>{editingAnnId ? 'Edit Announcement' : 'Create Community Announcement'}</span>
            </h3>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. CBT Exam Timetable Announcement & Live Revision Schedule"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Academic Update">Academic Update</option>
                  <option value="CBT Exam Prep">CBT Exam Prep</option>
                  <option value="Live Stream">Live Stream</option>
                  <option value="Study Tip">Study Tip</option>
                  <option value="Community Notice">Community Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Content *
                </label>
                <textarea
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Full text details of the announcement for students..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional YouTube Link (Live stream / Explanation)
                </label>
                <input
                  type="text"
                  value={annYoutubeLink}
                  onChange={(e) => setAnnYoutubeLink(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveAnnouncementWithStatus(e, 'Draft', 'hidden')}
                  className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/30 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveAnnouncementWithStatus(e, 'Approved', 'visible')}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative space-y-5 shadow-2xl">
            <button
              onClick={() => setShowResourceModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
              <span>{editingResId ? 'Edit Learning Resource' : 'Add Learning Resource'}</span>
            </h3>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. GST101 General Studies Complete Summary PDF"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={resCourseCode}
                    onChange={(e) => setResCourseCode(e.target.value)}
                    placeholder="e.g. GST101"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PDF Summary">PDF Summary</option>
                    <option value="Formula Sheet">Formula Sheet</option>
                    <option value="Past Questions PDF">Past Questions PDF</option>
                    <option value="Diagram Sheet">Diagram Sheet</option>
                    <option value="Revision Checklist">Revision Checklist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  File URL *
                </label>
                <input
                  type="text"
                  value={resFileUrl}
                  onChange={(e) => setResFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={resDescription}
                  onChange={(e) => setResDescription(e.target.value)}
                  placeholder="Brief summary of what is inside this document..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveResourceWithStatus(e, 'Draft', 'hidden')}
                  className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/30 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveResourceWithStatus(e, 'Approved', 'visible')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
