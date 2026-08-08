import React, { useState, useEffect } from 'react';
import { AdminNotification, NotificationType } from '../types';
import { StorageService, safeStringify } from '../services/storage';
import {
  Bell,
  X,
  AlertTriangle,
  Trophy,
  Wrench,
  Megaphone,
  Sparkles,
  Info,
  CheckCircle2,
  ExternalLink,
  FileText
} from 'lucide-react';

interface InAppNotificationOverlayProps {
  userId?: string;
  userRole?: string;
  onOpenNotificationCenter?: () => void;
}

export const InAppNotificationOverlay: React.FC<InAppNotificationOverlayProps> = ({
  userId,
  userRole = 'student',
  onOpenNotificationCenter
}) => {
  const [activeNotifications, setActiveNotifications] = useState<AdminNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cbt_dismissed_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const syncNotifications = () => {
    const allNotifs = StorageService.getAdminNotifications();
    const currentDismissed: string[] = (() => {
      try {
        const stored = localStorage.getItem('cbt_dismissed_notifications');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();

    // Filter notifications that are published/sent/delivered, not dismissed
    const pending = allNotifs.filter((n) => {
      if (currentDismissed.includes(n.id)) return false;
      const isSentOrDelivered = n.status === 'Sent' || n.status === 'Delivered';
      if (!isSentOrDelivered) return false;

      // Check recipient targeting if applicable
      if (n.recipientGroup === 'Administrators' && userRole !== 'admin') return false;
      if (n.targetStudentIds && n.targetStudentIds.length > 0 && userId && !n.targetStudentIds.includes(userId)) {
        return false;
      }
      return true;
    });

    setActiveNotifications(pending);
  };

  useEffect(() => {
    syncNotifications();
    window.addEventListener('cbt_storage_change', syncNotifications);
    window.addEventListener('storage', syncNotifications);
    return () => {
      window.removeEventListener('cbt_storage_change', syncNotifications);
      window.removeEventListener('storage', syncNotifications);
    };
  }, [userId, userRole]);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('cbt_dismissed_notifications', safeStringify(updated));
    } catch {
      // ignore
    }

    // Also update read status in storage count if applicable
    const allNotifs = StorageService.getAdminNotifications();
    const updatedNotifs = allNotifs.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          totalRead: (n.totalRead || 0) + 1,
        };
      }
      return n;
    });
    StorageService.saveAdminNotifications(updatedNotifs);

    setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (activeNotifications.length === 0) return null;

  // Show top-most active notification
  const currentNotif = activeNotifications[0];

  const getTypeStyle = (type: NotificationType) => {
    switch (type) {
      case 'Announcement':
      case 'CBT Updates':
        return {
          bg: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: Megaphone,
          iconColor: 'text-indigo-400',
        };
      case 'Maintenance':
      case 'Warning':
      case 'Emergency':
        return {
          bg: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: Wrench,
          iconColor: 'text-amber-400',
        };
      case 'Subscription':
      case 'Payment':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-slate-700 text-slate-200',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Bell,
          iconColor: 'text-indigo-400',
        };
    }
  };

  const style = getTypeStyle(currentNotif.type);
  const IconComponent = style.icon;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full animate-bounce-in shadow-2xl pointer-events-auto">
      <div className={`p-5 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-3 relative overflow-hidden ${style.bg}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-md ${style.iconColor}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider border ${style.badge}`}>
                  {currentNotif.type}
                </span>
                {currentNotif.priority === 'Urgent' || currentNotif.priority === 'High' ? (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase animate-pulse">
                    Urgent
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                {currentNotif.sentDate ? new Date(currentNotif.sentDate).toLocaleString() : 'Just Now'}
              </span>
            </div>
          </div>

          {/* Close / Dismiss Button - DOES NOT DISAPPEAR AUTOMATICALLY */}
          <button
            onClick={() => handleDismiss(currentNotif.id)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Dismiss Notification"
            id="dismiss-notif-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-black text-white leading-snug">
            {currentNotif.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-1">
            {currentNotif.message}
          </p>
        </div>

        {/* Attachments if any */}
        {currentNotif.attachments && currentNotif.attachments.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attachment:</span>
            {currentNotif.attachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{att.name}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {activeNotifications.length > 1 ? (
            <span className="text-[10px] text-slate-400 font-bold">
              +{activeNotifications.length - 1} more unread
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold">Official Broadcast</span>
          )}

          <div className="flex items-center gap-2">
            {onOpenNotificationCenter && (
              <button
                onClick={onOpenNotificationCenter}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
              >
                Notification Center
              </button>
            )}
            <button
              onClick={() => handleDismiss(currentNotif.id)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-md transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
