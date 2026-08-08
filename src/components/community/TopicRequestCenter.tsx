import React, { useState } from 'react';
import {
  University,
  Course,
  TopicRequest,
  TopicCollectionConfig,
  UserProfile,
} from '../../types';
import { StorageService } from '../../services/storage';
import { ACADEMIC_LEVELS, ACADEMIC_SEMESTERS } from '../../utils/academicStructure';
import {
  MessageSquarePlus,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Building2,
  GraduationCap,
  Layers,
  HelpCircle,
  Video,
  Check,
  Info
} from 'lucide-react';

interface TopicRequestCenterProps {
  currentUser: UserProfile | null;
  universities: University[];
  courses: Course[];
  collectionConfig: TopicCollectionConfig;
  onRefreshData: () => void;
  onNavigateToTutorials: () => void;
}

export const TopicRequestCenter: React.FC<TopicRequestCenterProps> = ({
  currentUser,
  universities,
  courses,
  collectionConfig,
  onRefreshData,
  onNavigateToTutorials,
}) => {
  const [selectedUniId, setSelectedUniId] = useState<string>(
    currentUser?.universityId || universities[0]?.id || ''
  );
  const [selectedLevel, setSelectedLevel] = useState<string>('100 Level');
  const [selectedSemester, setSelectedSemester] = useState<string>('First Semester');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [challengeDescription, setChallengeDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter courses by university, level, semester
  const availableCourses = courses.filter((c) => {
    const uniMatch = !selectedUniId || c.universityId === selectedUniId;
    const levelMatch = !selectedLevel || c.level === selectedLevel;
    const semMatch = !selectedSemester || c.semester === selectedSemester;
    return uniMatch && levelMatch && semMatch;
  });

  const selectedUni = universities.find((u) => u.id === selectedUniId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Get student's past requests
  const allRequests = StorageService.getTopicRequests();
  const myRequests = allRequests.filter(
    (r) => currentUser && (r.studentId === currentUser.id || r.studentEmail === currentUser.email)
  );

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('Please log in to submit a topic request.');
      return;
    }

    if (!collectionConfig.isOpen) {
      setErrorMessage('Topic collection is currently closed by the admin.');
      return;
    }

    if (!selectedUniId) {
      setErrorMessage('Please select your university.');
      return;
    }

    if (!selectedCourseId || !selectedCourse) {
      setErrorMessage('Please select a course.');
      return;
    }

    if (!topicTitle.trim()) {
      setErrorMessage('Please enter the title of the difficult topic.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newRequest: TopicRequest = {
        id: `req-${Date.now()}`,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        universityId: selectedUniId,
        universityName: selectedUni?.name || 'Selected University',
        level: selectedLevel,
        semester: selectedSemester,
        courseId: selectedCourse.id,
        courseCode: selectedCourse.code,
        courseTitle: selectedCourse.title,
        topicTitle: topicTitle.trim(),
        challengeDescription: challengeDescription.trim() || 'Student requested video tutorial and CBT solution breakdown for this topic.',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        requestCount: 1,
      };

      StorageService.saveTopicRequest(newRequest);
      setSuccessMessage('Your topic request has been submitted successfully to the Acadet tutorial production team!');
      setTopicTitle('');
      setChallengeDescription('');
      setIsSubmitting(false);
      onRefreshData();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred while submitting your request. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Learning Voice</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Topic Request Center
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Struggling with a difficult topic in Anatomy, Mathematics, General Studies, or Chemistry? Submit your request here! Topics with high demand are prioritized by Joyce and the video tutorial team for dedicated video tutorials and CBT practice breakdowns.
          </p>
        </div>
      </div>

      {/* Topic Collection Status Warning Banner (If Closed) */}
      {!collectionConfig.isOpen ? (
        <div className="bg-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-bold text-amber-200">
              Topic Requests Are Currently Closed
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              "{collectionConfig.closedMessage || 'Topic requests are currently closed. They will reopen after new tutorials have been prepared.'}"
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateToTutorials}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Explore Existing Tutorial Videos</span>
            </button>
          </div>
        </div>
      ) : (
        /* Topic Request Form */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Submit a Difficult Topic Request</h3>
              <p className="text-xs text-slate-400">Tell us what you find difficult so Joyce and the video tutorial team can prepare step-by-step video tutorials.</p>
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-6">
            {/* Row 1: University, Level, Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>University *</span>
                </label>
                <select
                  value={selectedUniId}
                  onChange={(e) => {
                    setSelectedUniId(e.target.value);
                    setSelectedCourseId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select University</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.shortName} - {uni.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Level *</span>
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setSelectedCourseId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Semester *</span>
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedCourseId('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                >
                  {ACADEMIC_SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Course *</span>
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Course --</option>
                {availableCourses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    {crs.code} - {crs.title}
                  </option>
                ))}
              </select>
              {availableCourses.length === 0 && (
                <p className="text-xs text-amber-400 mt-1">
                  No courses found for this university, level, and semester filter.
                </p>
              )}
            </div>

            {/* Topic Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Topic Title *</span>
              </label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. Muscles of the Upper Limb, Born-Haber Cycle, Grammatical Concord"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Describe Challenge */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Describe Your Challenge *
              </label>
              <textarea
                rows={4}
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder='e.g. "I struggle with understanding origin and insertion of forearm muscles and their nerve innervation pathways during CBT questions."'
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
              ></textarea>
            </div>

            {/* Example helper note */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Example Submission Format:
              </span>
              <p>Course: Human Anatomy (ANA101) • Topic: Muscles of the Upper Limb</p>
              <p className="italic text-slate-500">
                Challenge: "I don't understand the origin and insertion of the muscles and nerve supplies."
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting to Acadet Team...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Topic Request</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* My Submitted Requests History */}
      {myRequests.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>My Submitted Topic Requests</span>
          </h3>

          <div className="space-y-3">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                      {req.courseCode}
                    </span>
                    <span className="text-white font-bold text-sm sm:text-base">
                      {req.topicTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{req.challengeDescription}</p>
                  <div className="text-[11px] text-slate-500">
                    {req.universityName} • {req.level} • {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      req.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : req.status === 'Tutorial Planned'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : req.status === 'In Review'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
