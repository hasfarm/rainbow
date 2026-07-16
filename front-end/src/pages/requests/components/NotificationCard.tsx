import { type NotificationItem, priorityLabels, priorityColors } from '../api';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationCardProps {
  notification: NotificationItem;
}

function formatTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return format(date, 'dd/MM/yyyy', { locale: vi });
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700 border border-green-200' },
  rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-700 border border-red-200' },
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const { type, title, content, senderName, senderPosition, date, isRead, priority, relatedStatus } = notification;

  return (
    <div className={`relative bg-background-50 border rounded-xl p-4 transition-colors duration-200 cursor-pointer ${
      isRead
        ? 'border-background-200/70 hover:border-background-300'
        : 'border-primary-200/60 bg-primary-50/40 hover:border-primary-300'
    }`}>
      {/* Unread dot */}
      {!isRead && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary-500 rounded-full" />
      )}

      {type === 'announcement' ? (
        /* Announcement card */
        <div>
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
              <i className="ri-megaphone-line text-lg text-primary-500"></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className={`text-sm font-heading font-semibold truncate ${isRead ? 'text-foreground-800' : 'text-foreground-950'}`}>
                  {title}
                </h3>
                {priority !== 'normal' && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${priorityColors[priority]}`}>
                    {priorityLabels[priority]}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-foreground-500">
                {senderName} · {senderPosition}
              </p>
            </div>
          </div>
          <p className={`text-xs leading-relaxed line-clamp-3 ${isRead ? 'text-foreground-500' : 'text-foreground-700'}`}>
            {content}
          </p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-background-200/50">
            <span className="text-[10px] text-foreground-400">
              <i className="ri-time-line mr-0.5"></i>{formatTime(date)}
            </span>
            <span className="text-[10px] text-foreground-400">
              <i className="ri-group-line mr-0.5"></i>Toàn thể nhân viên
            </span>
          </div>
        </div>
      ) : (
        /* Private message card */
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-background-200 flex items-center justify-center shrink-0">
            {notification.senderAvatar ? (
              <img src={notification.senderAvatar} alt={senderName} className="w-full h-full object-cover" />
            ) : (
              <i className="ri-user-line text-foreground-400"></i>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-heading font-semibold ${isRead ? 'text-foreground-800' : 'text-foreground-950'}`}>
                  {senderName}
                </span>
                {priority === 'important' && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${priorityColors[priority]}`}>
                    {priorityLabels[priority]}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-foreground-400 whitespace-nowrap ml-2">{formatTime(date)}</span>
            </div>
            <p className="text-[11px] text-foreground-500 mb-1">{senderPosition}</p>
            <p className={`text-xs leading-relaxed line-clamp-2 ${isRead ? 'text-foreground-500' : 'text-foreground-700'}`}>
              {content}
            </p>
            {relatedStatus && statusConfig[relatedStatus] && (
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[relatedStatus].className}`}>
                  <i className={relatedStatus === 'approved' ? 'ri-checkbox-circle-line' : relatedStatus === 'rejected' ? 'ri-close-circle-line' : 'ri-time-line'}></i>
                  {statusConfig[relatedStatus].label}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}