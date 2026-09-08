import React from 'react';
import { 
  X, Bell, CheckCircle2, AlertTriangle, FileText, ShieldCheck, CheckCheck 
} from 'lucide-react';
import { PoeNotification } from '../../types';

interface PoeNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PoeNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function PoeNotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead
}: PoeNotificationsDrawerProps) {
  if (!isOpen) return null;

  const getIcon = (type: PoeNotification['type']) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'review_completed':
        return <CheckCircle2 className="w-4 h-4 text-teal-600" />;
      case 'revision_needed':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'verified':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'compliance_alert':
        return <AlertTriangle className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Portfolio Notifications</h3>
              <p className="text-[11px] text-slate-500">
                {notifications.filter(n => !n.isRead).length} unread updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllAsRead}
              className="px-2.5 py-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  notif.isRead
                    ? 'bg-white border-slate-200/80 opacity-75'
                    : 'bg-indigo-50/50 border-indigo-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-900 truncate block">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed mb-1.5">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>From: {notif.senderName}</span>
                      <span className="font-mono">
                        {new Date(notif.dateSent).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
