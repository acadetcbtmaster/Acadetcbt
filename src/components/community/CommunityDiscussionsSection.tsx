import React, { useState } from 'react';
import { CommunityDiscussionPost, CommunityReply, UserProfile, Course } from '../../types';
import { StorageService } from '../../services/storage';
import {
  MessageSquare,
  ThumbsUp,
  Flag,
  Send,
  ShieldAlert,
  Plus,
  BookOpen,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  X
} from 'lucide-react';

interface CommunityDiscussionsSectionProps {
  posts: CommunityDiscussionPost[];
  currentUser: UserProfile | null;
  courses: Course[];
  onRefreshData: () => void;
}

export const CommunityDiscussionsSection: React.FC<CommunityDiscussionsSectionProps> = ({
  posts,
  currentUser,
  courses,
  onRefreshData,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCourseCode, setNewCourseCode] = useState<string>('');
  const [newTopic, setNewTopic] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setNotification('Please log in to post a question.');
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      setNotification('Title and description are required.');
      return;
    }

    const newPost: CommunityDiscussionPost = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUniversity: currentUser.universityId || 'University Student',
      authorLevel: '100 Level',
      courseCode: newCourseCode || 'GEN101',
      courseTitle: newCourseCode ? 'Academic Course' : 'General Academic Discussion',
      topic: newTopic || 'Academic Question',
      title: newTitle.trim(),
      content: newContent.trim(),
      upvotes: 1,
      upvotedBy: [currentUser.id],
      repliesCount: 0,
      isReported: false,
      createdAt: new Date().toISOString(),
      status: 'Active',
    };

    StorageService.saveCommunityPost(newPost);
    setNewTitle('');
    setNewCourseCode('');
    setNewTopic('');
    setNewContent('');
    setShowCreateModal(false);
    onRefreshData();

    setNotification('Discussion post created successfully!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpvote = (postId: string) => {
    if (!currentUser) {
      setNotification('Please log in to upvote posts.');
      return;
    }
    StorageService.upvoteCommunityPost(postId, currentUser.id);
    onRefreshData();
  };

  const handleSendReply = (postId: string) => {
    if (!currentUser) {
      setNotification('Please log in to reply.');
      return;
    }
    if (!replyText.trim()) return;

    const reply: CommunityReply = {
      id: `rep-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'admin' ? 'admin' : 'student',
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    StorageService.saveCommunityReply(reply);
    setReplyText('');
    onRefreshData();
  };

  const handleReportPost = (postId: string) => {
    if (!currentUser) {
      setNotification('Please log in to report posts.');
      return;
    }
    if (!reportReason.trim()) return;

    StorageService.reportCommunityPost(postId, reportReason.trim(), currentUser.id);
    setReportPostId(null);
    setReportReason('');
    setNotification('Post reported for admin moderation review.');
    setTimeout(() => setNotification(null), 4000);
    onRefreshData();
  };

  return (
    <div className="space-y-8">
      {/* Rules & Moderation Notice Banner */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Academic Community Rules</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm">
              Keep discussions strictly academic. No unrelated content, spam, or offensive language. Admin moderation is enabled to keep Acadet focused on learning.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ask Academic Question</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Discussion Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No Academic Discussions Yet</h3>
            <p className="text-xs">Be the first student to ask a question or share a study tip!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            const replies = isExpanded ? StorageService.getCommunityReplies(post.id) : [];
            const hasUpvoted = currentUser ? post.upvotedBy.includes(currentUser.id) : false;

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 transition-all shadow-lg"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{post.authorName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {post.authorLevel}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                      {post.courseCode}
                    </span>
                    <button
                      onClick={() => setReportPostId(post.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Report inappropriate post"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Footer Controls: Upvotes & Replies Toggle */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        hasUpvoted
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                      <span>{post.upvotes} Upvotes</span>
                    </button>

                    <button
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 cursor-pointer font-semibold"
                    >
                      <MessageCircle className="w-4 h-4 text-indigo-400" />
                      <span>{post.repliesCount || replies.length || 0} Replies</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Replies Section */}
                {isExpanded && (
                  <div className="pt-4 border-t border-slate-800 space-y-4 bg-slate-950/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Replies</h5>

                    <div className="space-y-3">
                      {replies.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No replies yet. Be the first to help out!</p>
                      ) : (
                        replies.map((rep) => (
                          <div key={rep.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                                {rep.authorName}
                                {rep.authorRole === 'admin' && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold">
                                    Educator
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500">{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">{rep.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Input Box */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write an academic response..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(post.id);
                        }}
                      />
                      <button
                        onClick={() => handleSendReply(post.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Discussion Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative space-y-6 shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Ask an Academic Question</span>
              </h3>
              <p className="text-xs text-slate-400">Share your challenge or ask for study tips from fellow students.</p>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discussion Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mnemonic for remembering cranial nerve functions?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. ANA101"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Cranial Nerves"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Question / Content *
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Describe your question or study topic in detail..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportPostId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Flag className="w-5 h-5" />
              <span>Report Inappropriate Content</span>
            </h4>
            <p className="text-xs text-slate-300">
              Report posts violating academic guidelines (offensive language, non-academic spam, harassment).
            </p>

            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="State reason for report..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            ></textarea>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReportPostId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReportPost(reportPostId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
