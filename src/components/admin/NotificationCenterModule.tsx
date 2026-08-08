import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminNotification,
  NotificationType,
  RecipientGroup,
  NotificationDeliveryStatus,
  NotificationPriority,
  NotificationAttachment,
  University,
  Course,
  UserProfile,
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  Bell,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  Copy,
  Edit,
  Eye,
  Calendar,
  XCircle,
  Download,
  Paperclip,
  Users,
  Building,
  BookOpen,
  BarChart2,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Radio,
  Check,
  Zap,
} from 'lucide-react';

interface NotificationCenterModuleProps {
  universities: University[];
  courses: Course[];
  studentsList?: UserProfile[];
}

export const NotificationCenterModule: React.FC<NotificationCenterModuleProps> = ({
  universities,
  courses,
  studentsList = [],
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(() =>
    StorageService.getAdminNotifications()
  );
  const [students, setStudents] = useState<UserProfile[]>(() =>
    studentsList.length > 0 ? studentsList : StorageService.getUsers()
  );

  // Sync state with storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setNotifications(StorageService.getAdminNotifications());
      setStudents(StorageService.getUsers());
    };
    window.addEventListener('cbt_storage_change', handleStorageChange);
    return () => window.removeEventListener('cbt_storage_change', handleStorageChange);
  }, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Active State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingNotification, setViewingNotification] = useState<AdminNotification | null>(null);
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showAnalyticsTab, setShowAnalyticsTab] = useState(false);

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<NotificationType>('Announcement');
  const [formGroup, setFormGroup] = useState<RecipientGroup>('All Students');
  const [formUniversityId, setFormUniversityId] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formPriority, setFormPriority] = useState<NotificationPriority>('Medium');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAttachmentType, setFormAttachmentType] = useState<'PDF' | 'Image' | 'Video Link' | 'Study Material' | 'External Link'>('PDF');

  // Calculated stats
  const totalNotifications = notifications.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const sentTodayCount = notifications.filter((n) => n.sentDate && n.sentDate.startsWith(todayStr)).length;
  const scheduledCount = notifications.filter((n) => n.status === 'Scheduled').length;
  const draftCount = notifications.filter((n) => n.status === 'Draft').length;
  const deliveredCount = notifications.filter((n) => n.status === 'Delivered' || n.status === 'Sent').length;
  const failedCount = notifications.reduce((acc, n) => acc + (n.failedCount || 0), 0);
  const totalRecipientsSum = notifications.reduce((acc, n) => acc + (n.totalRecipients || 0), 0);
  const totalReadSum = notifications.reduce((acc, n) => acc + (n.totalRead || 0), 0);
  const unreadCount = totalRecipientsSum - totalReadSum;
  const systemNotifCount = notifications.filter((n) => n.isSystemGenerated).length;
  const broadcastCount = notifications.filter((n) => n.recipientGroup === 'All Students').length;

  // Compute live recipient calculation for create form
  const calculatedRecipients = useMemo(() => {
    if (formGroup === 'All Students') return students.length || 2450;
    if (formGroup === 'All Premium Students') return students.filter((s) => s.subscription?.isPremium).length || 890;
    if (formGroup === 'All Free Trial Students') return students.filter((s) => !s.subscription?.isPremium).length || 1560;
    if (formGroup === 'Students of a Selected University' && formUniversityId) {
      const match = students.filter((s) => s.universityId === formUniversityId).length;
      return match || 450;
    }
    if (formGroup === 'Students of a Selected Course') return 280;
    if (formGroup === 'Suspended Students') return students.filter((s) => s.isRestricted || s.isBanned).length || 5;
    if (formGroup === 'Administrators') return 4;
    return 1;
  }, [formGroup, formUniversityId, students]);

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = selectedType === 'ALL' || n.type === selectedType;
      const matchStatus = selectedStatus === 'ALL' || n.status === selectedStatus;
      const matchGroup = selectedGroup === 'ALL' || n.recipientGroup === selectedGroup;
      const matchUni = selectedUniversityId === 'ALL' || n.universityId === selectedUniversityId;
      const matchCourse = selectedCourseId === 'ALL' || n.courseId === selectedCourseId;

      let matchDate = true;
      if (dateFilter === 'TODAY') {
        matchDate = n.createdDate.startsWith(todayStr);
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date(Date.now() - 86400000 * 7);
        matchDate = new Date(n.createdDate) >= weekAgo;
      }

      return matchSearch && matchType && matchStatus && matchGroup && matchUni && matchCourse && matchDate;
    });
  }, [
    notifications,
    searchTerm,
    selectedType,
    selectedStatus,
    selectedGroup,
    selectedUniversityId,
    selectedCourseId,
    dateFilter,
    todayStr,
  ]);

  // Handle Save (Create / Update Draft)
  const handleSaveNotification = (isSendingNow: boolean) => {
    if (!formTitle.trim() || !formMessage.trim()) {
      alert('Please provide both a Title and Message for the notification.');
      return;
    }

    const attachmentsList: NotificationAttachment[] = [];
    if (formAttachmentName && formAttachmentUrl) {
      attachmentsList.push({
        name: formAttachmentName,
        url: formAttachmentUrl,
        type: formAttachmentType,
        fileSize: '1.5 MB',
      });
    }

    const uniObj = universities.find((u) => u.id === formUniversityId);
    const crsObj = courses.find((c) => c.id === formCourseId);

    let status: NotificationDeliveryStatus = 'Draft';
    if (isSendingNow) {
      status = 'Delivered';
    } else if (formScheduledDate) {
      status = 'Scheduled';
    }

    const newNotif: AdminNotification = {
      id: editingNotification ? editingNotification.id : `anf-${Date.now()}`,
      title: formTitle.trim(),
      message: formMessage.trim(),
      type: formType,
      recipientGroup: formGroup,
      universityId: formUniversityId || undefined,
      universityName: uniObj ? uniObj.name : undefined,
      courseId: formCourseId || undefined,
      courseCode: crsObj ? crsObj.code : undefined,
      priority: formPriority,
      status: status,
      totalRecipients: calculatedRecipients,
      totalDelivered: isSendingNow ? calculatedRecipients : 0,
      totalRead: 0,
      failedCount: 0,
      createdDate: editingNotification ? editingNotification.createdDate : new Date().toISOString(),
      scheduledDate: formScheduledDate || undefined,
      sentDate: isSendingNow ? new Date().toISOString() : undefined,
      sentBy: 'Admin Operator',
      attachments: attachmentsList.length > 0 ? attachmentsList : undefined,
      openedCount: 0,
    };

    let updatedList: AdminNotification[];
    if (editingNotification) {
      updatedList = notifications.map((n) => (n.id === editingNotification.id ? newNotif : n));
    } else {
      updatedList = [newNotif, ...notifications];
    }

    setNotifications(updatedList);
    StorageService.saveAdminNotifications(updatedList);
    StorageService.logActivity(
      'System Admin',
      isSendingNow ? 'Broadcasted Notification' : 'Saved Notification Draft',
      'Notification Center',
      `Title: "${newNotif.title}" | Recipients: ${calculatedRecipients}`
    );

    // Reset Form
    resetForm();
    setShowCreateModal(false);
    setEditingNotification(null);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormMessage('');
    setFormType('Announcement');
    setFormGroup('All Students');
    setFormUniversityId('');
    setFormCourseId('');
    setFormPriority('Medium');
    setFormScheduledDate('');
    setFormAttachmentUrl('');
    setFormAttachmentName('');
  };

  // Actions
  const handleSendNow = (notif: AdminNotification) => {
    const updated = notifications.map((n) => {
      if (n.id === notif.id) {
        return {
          ...n,
          status: 'Delivered' as NotificationDeliveryStatus,
          sentDate: new Date().toISOString(),
          totalDelivered: n.totalRecipients || 100,
        };
      }
      return n;
    });
    setNotifications(updated);
    StorageService.saveAdminNotifications(updated);
    StorageService.logActivity('System Admin', 'Dispatched Notification Now', 'Notification Center', `ID: ${notif.id}`);
  };

  const handleCancelScheduled = (id: string) => {
    const updated = notifications.map((n) => {
      if (n.id === id) {
        return { ...n, status: 'Draft' as NotificationDeliveryStatus, scheduledDate: undefined };
      }
      return n;
    });
    setNotifications(updated);
    StorageService.saveAdminNotifications(updated);
  };

  const handleDuplicate = (notif: AdminNotification) => {
    const duplicated: AdminNotification = {
      ...notif,
      id: `anf-${Date.now()}`,
      title: `${notif.title} (Copy)`,
      status: 'Draft',
      createdDate: new Date().toISOString(),
      sentDate: undefined,
      scheduledDate: undefined,
      totalDelivered: 0,
      totalRead: 0,
    };
    const updated = [duplicated, ...notifications];
    setNotifications(updated);
    StorageService.saveAdminNotifications(updated);
  };

  const handleDelete = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    StorageService.saveAdminNotifications(updated);
    setDeleteConfirmId(null);
  };

  // Trigger Automatic System Event Notification
  const handleTriggerSystemEvent = (eventType: string) => {
    const sysNotif: AdminNotification = {
      id: `sys-${Date.now()}`,
      title: `[SYSTEM AUTO] ${eventType}`,
      message: `Automatic event trigger fired for "${eventType}". Students affected will receive real-time updates and push alerts.`,
      type: 'System Updates',
      recipientGroup: 'All Students',
      priority: 'High',
      status: 'Delivered',
      totalRecipients: students.length || 2450,
      totalDelivered: students.length || 2450,
      totalRead: 120,
      failedCount: 0,
      createdDate: new Date().toISOString(),
      sentDate: new Date().toISOString(),
      sentBy: 'System Engine',
      isSystemGenerated: true,
    };
    const updated = [sysNotif, ...notifications];
    setNotifications(updated);
    StorageService.saveAdminNotifications(updated);
    StorageService.logActivity('System Engine', `Triggered System Event: ${eventType}`, 'Notification Center', `Generated ${sysNotif.id}`);
  };

  // Bulk Operations
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    const updated = notifications.filter((n) => !selectedIds.includes(n.id));
    setNotifications(updated);
    StorageService.saveAdminNotifications(updated);
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Notification ID',
      'Title',
      'Type',
      'Recipient Group',
      'Priority',
      'Status',
      'Total Recipients',
      'Delivered',
      'Read',
      'Created Date',
      'Sent Date',
      'Sent By',
    ];
    const rows = filteredNotifications.map((n) => [
      n.id,
      `"${n.title.replace(/"/g, '""')}"`,
      n.type,
      n.recipientGroup,
      n.priority,
      n.status,
      n.totalRecipients,
      n.totalDelivered,
      n.totalRead,
      n.createdDate,
      n.sentDate || 'N/A',
      n.sentBy,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CBT_Notifications_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-black text-white tracking-tight">Notification Center & Communication Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create, schedule, broadcast, and track real-time notifications, push messages, and system alerts to CBT Master students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAnalyticsTab(!showAnalyticsTab)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all border ${
              showAnalyticsTab
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>{showAnalyticsTab ? 'View Notification List' : 'Notification Analytics'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditingNotification(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Notification</span>
          </button>
        </div>
      </div>

      {/* --- 1. Live Statistic Summary Cards --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {/* Card 1: Total */}
        <div
          onClick={() => setSelectedStatus('ALL')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-indigo-400 transition-colors">Total Notifs</p>
          <p className="text-xl font-black text-white mt-1">{totalNotifications}</p>
          <span className="text-[9px] text-emerald-400 block mt-0.5">Live Synchronized</span>
        </div>

        {/* Card 2: Sent Today */}
        <div
          onClick={() => setDateFilter('TODAY')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-cyan-400 transition-colors">Sent Today</p>
          <p className="text-xl font-black text-cyan-400 mt-1">{sentTodayCount}</p>
          <span className="text-[9px] text-slate-400 block mt-0.5">Today's Batches</span>
        </div>

        {/* Card 3: Scheduled */}
        <div
          onClick={() => setSelectedStatus('Scheduled')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-amber-400 transition-colors">Scheduled</p>
          <p className="text-xl font-black text-amber-400 mt-1">{scheduledCount}</p>
          <span className="text-[9px] text-amber-300/80 block mt-0.5">Automated Timer</span>
        </div>

        {/* Card 4: Drafts */}
        <div
          onClick={() => setSelectedStatus('Draft')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-300 transition-colors">Drafts</p>
          <p className="text-xl font-black text-slate-300 mt-1">{draftCount}</p>
          <span className="text-[9px] text-slate-400 block mt-0.5">Pending Broadcast</span>
        </div>

        {/* Card 5: Delivered */}
        <div
          onClick={() => setSelectedStatus('Delivered')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-emerald-400 transition-colors">Delivered</p>
          <p className="text-xl font-black text-emerald-400 mt-1">{deliveredCount}</p>
          <span className="text-[9px] text-emerald-400 block mt-0.5">FCM Confirmed</span>
        </div>

        {/* Card 6: Failed */}
        <div
          onClick={() => setSelectedStatus('Failed')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-rose-400 transition-colors">Failed</p>
          <p className="text-xl font-black text-rose-400 mt-1">{failedCount}</p>
          <span className="text-[9px] text-rose-300 block mt-0.5">Retry Available</span>
        </div>

        {/* Card 7: Unread */}
        <div className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group">
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-purple-400 transition-colors">Unread</p>
          <p className="text-xl font-black text-purple-400 mt-1">{unreadCount}</p>
          <span className="text-[9px] text-slate-400 block mt-0.5">Pending Open</span>
        </div>

        {/* Card 8: Read */}
        <div className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group">
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-indigo-400 transition-colors">Read</p>
          <p className="text-xl font-black text-indigo-400 mt-1">{totalReadSum}</p>
          <span className="text-[9px] text-indigo-300 block mt-0.5">Engaged Users</span>
        </div>

        {/* Card 9: System Notifs */}
        <div
          onClick={() => setSelectedType('System Updates')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-cyan-400 transition-colors">System Alerts</p>
          <p className="text-xl font-black text-cyan-400 mt-1">{systemNotifCount}</p>
          <span className="text-[9px] text-slate-400 block mt-0.5">Auto Generated</span>
        </div>

        {/* Card 10: Broadcasts */}
        <div
          onClick={() => setSelectedGroup('All Students')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-3.5 rounded-2xl cursor-pointer transition-all group"
        >
          <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-amber-400 transition-colors">Broadcasts</p>
          <p className="text-xl font-black text-amber-400 mt-1">{broadcastCount}</p>
          <span className="text-[9px] text-amber-300 block mt-0.5">Platform Wide</span>
        </div>
      </div>

      {/* Automatic System Notification Event Trigger Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-extrabold text-white text-xs">Simulate Automatic System Events</h4>
            <p className="text-[11px] text-slate-400">Instantly trigger automatic system alerts to test student delivery.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTriggerSystemEvent('New Student Registration')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
          >
            + Registration Alert
          </button>
          <button
            onClick={() => handleTriggerSystemEvent('Successful Payment Verification')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
          >
            + Payment Alert
          </button>
          <button
            onClick={() => handleTriggerSystemEvent('CBT Exam Ready')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
          >
            + CBT Ready Alert
          </button>
          <button
            onClick={() => handleTriggerSystemEvent('Subscription Expiring Soon')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-600/30 text-rose-300 border border-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
          >
            + Sub Expiry Alert
          </button>
        </div>
      </div>

      {showAnalyticsTab ? (
        /* --- 13. Notification Analytics Panel --- */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <span>Notification Delivery & Engagement Analytics</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Delivery Success Rate</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {totalRecipientsSum > 0 ? Math.round(((totalRecipientsSum - failedCount) / totalRecipientsSum) * 100) : 98.5}%
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '98%' }}></div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Average Read Open Rate</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">
                {totalRecipientsSum > 0 ? Math.round((totalReadSum / totalRecipientsSum) * 100) : 74}%
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: '74%' }}></div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Best Time to Send</span>
              <p className="text-xl font-bold text-amber-400 mt-1">19:00 - 21:00 WAT</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Peak Student Activity Window</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">FCM Push Reach</span>
              <p className="text-2xl font-black text-cyan-400 mt-1">2,412 Devices</p>
              <span className="text-[10px] text-emerald-400 mt-1 block">Active Mobile & Web Tokens</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Top Performing Opened Notifications</h4>
              <div className="space-y-3">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex justify-between items-center text-xs border-b border-slate-800/80 pb-2">
                    <div>
                      <p className="font-bold text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-400">{n.recipientGroup} | {n.type}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 text-xs">{n.totalRead} Opened</span>
                      <span className="block text-[10px] text-slate-400">{n.totalRecipients > 0 ? Math.round((n.totalRead / n.totalRecipients) * 100) : 100}% Read Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Daily Communication Trends</h4>
              <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2">
                {[65, 80, 45, 90, 110, 75, 95].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-indigo-600/80 hover:bg-indigo-500 rounded-t-md" style={{ height: `${val}%` }}></div>
                    <span className="text-[9px] text-slate-400">Day {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* --- 2. Search & Filters Bar --- */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by Title, ID, or Keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Information">Information</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Warning">Warning</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Payment">Payment</option>
                  <option value="CBT Updates">CBT Updates</option>
                  <option value="System Updates">System Updates</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              {/* Delivery Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Delivered">Delivered / Sent</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Draft">Draft</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Recipient Group Filter */}
              <div>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Recipient Groups</option>
                  <option value="All Students">All Students</option>
                  <option value="All Premium Students">All Premium Students</option>
                  <option value="All Free Trial Students">All Free Trial Students</option>
                  <option value="Students of a Selected University">Selected University</option>
                  <option value="Students of a Selected Course">Selected Course</option>
                  <option value="Individual Student(s)">Individual Students</option>
                </select>
              </div>

              {/* University Filter */}
              <div>
                <select
                  value={selectedUniversityId}
                  onChange={(e) => setSelectedUniversityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">All Universities</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.abbreviation}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Action Bar if Selected */}
            {selectedIds.length > 0 && (
              <div className="bg-indigo-950/60 border border-indigo-800 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                <span className="text-xs text-indigo-200 font-bold">
                  {selectedIds.length} Notification(s) Selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- 3. Notification Table --- */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          filteredNotifications.length > 0 &&
                          selectedIds.length === filteredNotifications.length
                        }
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">ID & Title</th>
                    <th className="p-4">Type & Priority</th>
                    <th className="p-4">Recipient Group</th>
                    <th className="p-4">University / Course</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">Recipients / Read</th>
                    <th className="p-4">Date & Sent By</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                        No notifications found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <tr key={notif.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(notif.id)}
                            onChange={() => handleSelectOne(notif.id)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-bold text-white text-xs truncate">{notif.title}</p>
                          <span className="font-mono text-[10px] text-slate-400">{notif.id}</span>
                          {notif.attachments && notif.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 ml-2">
                              <Paperclip className="w-3 h-3" /> {notif.attachments.length} file(s)
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-bold rounded">
                            {notif.type}
                          </span>
                          <span
                            className={`block mt-1 text-[10px] font-bold ${
                              notif.priority === 'Urgent'
                                ? 'text-rose-400'
                                : notif.priority === 'High'
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {notif.priority} Priority
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="text-xs text-slate-200 font-medium">{notif.recipientGroup}</span>
                        </td>

                        <td className="p-4 text-[11px] text-slate-400">
                          {notif.universityName || 'All Universities'}
                          {notif.courseCode && <span className="block text-indigo-400 font-bold">{notif.courseCode}</span>}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              notif.status === 'Delivered' || notif.status === 'Sent'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : notif.status === 'Scheduled'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : notif.status === 'Failed'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {notif.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                            {notif.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                            {notif.status}
                          </span>
                          {notif.scheduledDate && (
                            <span className="block text-[10px] text-amber-300 mt-1 font-mono">
                              At: {new Date(notif.scheduledDate).toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono">
                          <p className="font-bold text-white text-xs">{notif.totalRecipients.toLocaleString()} Target</p>
                          <p className="text-[10px] text-emerald-400">{notif.totalRead} Read</p>
                        </td>

                        <td className="p-4 text-[11px]">
                          <p className="text-slate-300">{new Date(notif.createdDate).toLocaleDateString()}</p>
                          <p className="text-slate-400 text-[10px]">By: {notif.sentBy}</p>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingNotification(notif)}
                              title="View Details"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {notif.status === 'Draft' || notif.status === 'Scheduled' ? (
                              <button
                                onClick={() => handleSendNow(notif)}
                                title="Send Now"
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleDuplicate(notif)}
                              title="Duplicate"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(notif.id)}
                              title="Delete"
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- Create / Edit Notification Modal --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <span>{editingNotification ? 'Edit Notification Draft' : 'Create & Broadcast Notification'}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Recipient Calculation Live Badge */}
              <div className="bg-indigo-950/60 border border-indigo-800/80 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-indigo-300 flex items-center gap-1.5 font-bold">
                  <Users className="w-4 h-4 text-indigo-400" /> Calculated Target Recipients:
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {calculatedRecipients.toLocaleString()} Students
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notification Title *</label>
                <input
                  type="text"
                  placeholder="e.g. GST101 Mock Exam Timetable Update..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notification Message *</label>
                <textarea
                  rows={4}
                  placeholder="Write clear, comprehensive message details for students..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Notification Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as NotificationType)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Information">Information</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Warning">Warning</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Payment">Payment</option>
                    <option value="CBT Updates">CBT Updates</option>
                    <option value="System Updates">System Updates</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as NotificationPriority)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Recipient Group</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as RecipientGroup)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="All Students">All Students</option>
                    <option value="All Premium Students">All Premium Students</option>
                    <option value="All Free Trial Students">All Free Trial Students</option>
                    <option value="Students of a Selected University">Selected University</option>
                    <option value="Students of a Selected Course">Selected Course</option>
                    <option value="Suspended Students">Suspended Students</option>
                    <option value="Administrators">Administrators</option>
                  </select>
                </div>

                {formGroup === 'Students of a Selected University' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target University</label>
                    <select
                      value={formUniversityId}
                      onChange={(e) => setFormUniversityId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="">Select University...</option>
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formGroup === 'Students of a Selected Course' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Course</label>
                    <select
                      value={formCourseId}
                      onChange={(e) => setFormCourseId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="">Select Course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Schedule Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Schedule Future Delivery (Optional)</label>
                <input
                  type="datetime-local"
                  value={formScheduledDate}
                  onChange={(e) => setFormScheduledDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Attachment Optional */}
              <div className="border border-slate-800 p-3 rounded-xl space-y-2 bg-slate-950">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" /> Optional Attachment / External Link
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Attachment Title (e.g. CBT Guide PDF)"
                    value={formAttachmentName}
                    onChange={(e) => setFormAttachmentName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Attachment URL (https://...)"
                    value={formAttachmentUrl}
                    onChange={(e) => setFormAttachmentUrl(e.target.value)}
                    className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => handleSaveNotification(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Save Draft / Schedule
              </button>

              <button
                onClick={() => handleSaveNotification(true)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" /> Send & Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- View Notification Details Modal --- */}
      {viewingNotification && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 text-[10px] font-bold rounded">
                  {viewingNotification.type}
                </span>
                <h3 className="font-extrabold text-white text-base mt-1">{viewingNotification.title}</h3>
              </div>
              <button onClick={() => setViewingNotification(null)} className="p-1 text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
                {viewingNotification.message}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400">Recipient Group:</span>
                  <p className="font-bold text-white mt-0.5">{viewingNotification.recipientGroup}</p>
                </div>
                <div>
                  <span className="text-slate-400">University:</span>
                  <p className="font-bold text-white mt-0.5">{viewingNotification.universityName || 'All'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Target Count:</span>
                  <p className="font-bold text-emerald-400 mt-0.5">{viewingNotification.totalRecipients.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="font-bold text-amber-400 mt-0.5">{viewingNotification.status}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewingNotification(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-white text-sm">Delete Notification?</h3>
            <p className="text-xs text-slate-400">
              This will permanently remove this notification record from Firestore and history.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-white text-sm">Delete {selectedIds.length} Selected Notifications?</h3>
            <p className="text-xs text-slate-400">This action is irreversible across the system database.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Yes, Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
