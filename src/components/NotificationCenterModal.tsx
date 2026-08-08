import React, { useState, useEffect } from 'react';
import { AdminNotification, NotificationType } from '../types';
import { StorageService, safeStringify } from '../services/storage';
import {
  Bell,
  X,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  Megaphone,
  Wrench,
  CheckCircle2,
  FileText,
  ExternalLink,
  Sparkles,
  Inbox
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userRole?: string;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  userId,
  userRole = 'student'
}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cbt_dismissed_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const loadNotifications = () => {
    const allNotifs = StorageService.getAdminNotifications();
    const currentDismissed: string[] = (() => {
      try {
        const stored = localStorage.getItem('cbt_dismissed_notifications');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();

    // Filter relevant notifications
    const relevant = allNotifs.filter((n) => {
      const isSentOrDelivered = n.status === 'Sent' || n.status === 'Delivered';
      if (!isSentOrDelivered) return false;
      if (n.recipientGroup === 'Administrators' && userRole !== 'admin') return false;
      if (n.targetStudentIds && n.targetStudentIds.length > 0 && userId && !n.targetStudentIds.includes(userId)) {
        return false;
      }
      return true;
    });

    setNotifications(relevant);
    setDismissedIds(currentDismissed);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('cbt_storage_change', loadNotifications);
    return () => window.removeEventListener('cbt_storage_change', loadNotifications);
  }, []);

  if (!isOpen) return null;

  const handleDismissOne = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('cbt_dismissed_notifications', safeStringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDismissAll = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    try {
      localStorage.setItem('cbt_dismissed_notifications', safeStringify(updated));
    } catch {
      // ignore
    }
  };

  const filtered = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    
    if (typeFilter === 'unread') {
      return matchesSearch && !dismissedIds.includes(n.id);
    }
    if (typeFilter !== 'all') {
      return matchesSearch && n.type === typeFilter;
    }
    return matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !dismissedIds.includes(n.id)).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black text-xs rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stay updated with official announcements, FaceArena challenges, and system notices.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only ({unreadCount})</option>
              <option value="Announcement">Announcements</option>
              <option value="CBT Updates">CBT Updates</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Warning">Warnings</option>
            </select>

            {unreadCount > 0 && (
              <button
                onClick={handleDismissAll}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-400">No notifications found.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You're all caught up! New challenge alerts and updates will appear here in real-time.
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const isRead = dismissedIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isRead
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      : 'bg-slate-950/90 border-indigo-500/30 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase border ${
                        n.type === 'Announcement' || n.type === 'CBT Updates'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : n.type === 'Maintenance'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {n.type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {n.sentDate ? new Date(n.sentDate).toLocaleString() : 'Recent'}
                      </span>
                    </div>

                    {!isRead && (
                      <button
                        onClick={() => handleDismissOne(n.id)}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{n.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{n.message}</p>

                  {n.attachments && n.attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      {n.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{att.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold">
            Total Notifications: {notifications.length}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            Close Center
          </button>
        </div>

      </div>
    </div>
  );
};
