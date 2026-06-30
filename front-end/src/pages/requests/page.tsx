import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockNotifications, type Notification } from '@/mocks/notifications';
import { NotificationCard } from './components/NotificationCard';

type TabKey = 'announcement' | 'private';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'announcement', label: 'Thông báo chung', icon: 'ri-megaphone-line' },
  { key: 'private', label: 'Tin nhắn riêng', icon: 'ri-chat-3-line' },
];

export default function RequestsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<TabKey>('announcement');

  const userAnnouncements = mockNotifications.filter((n) => n.type === 'announcement');
  const userPrivateMessages = mockNotifications.filter(
    (n) => n.type === 'private' && n.recipientId === user?.id,
  );

  const unreadAnnouncements = userAnnouncements.filter((n) => !n.isRead).length;
  const unreadPrivate = userPrivateMessages.filter((n) => !n.isRead).length;

  const activeNotifications: Notification[] =
    activeTab === 'announcement' ? userAnnouncements : userPrivateMessages;

  const handleCardClick = (notif: Notification) => {
    // In a real app this would mark as read and navigate to detail
    void notif;
  };

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Thông báo</h1>
        </div>
        <button
          type="button"
          className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0"
          title="Đánh dấu tất cả đã đọc"
        >
          <i className="ri-check-double-line text-foreground-500"></i>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-background-100 rounded-full p-1 mb-5">
        {tabs.map((tab) => {
          const unreadCount = tab.key === 'announcement' ? unreadAnnouncements : unreadPrivate;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-background-50 text-foreground-950'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <i className={tab.icon}></i>
              </span>
              {tab.label}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state header info */}
      {activeTab === 'announcement' && (
        <div className="bg-accent-50 border border-accent-200/60 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2.5">
            <span className="w-7 h-7 bg-accent-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <i className="ri-information-line text-sm text-accent-600"></i>
            </span>
            <div>
              <p className="text-xs font-semibold text-accent-800 mb-0.5">Thông báo từ Ban Giám đốc</p>
              <p className="text-[11px] text-accent-700/80 leading-relaxed">
                Các thông báo quan trọng từ Ban Giám đốc và các phòng ban gửi đến toàn thể nhân viên công ty.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification list */}
      {activeNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className={`${activeTab === 'announcement' ? 'ri-megaphone-line' : 'ri-chat-3-line'} text-2xl text-foreground-300`}></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">
            {activeTab === 'announcement'
              ? 'Không có thông báo chung nào'
              : 'Không có tin nhắn riêng nào'}
          </p>
          <p className="text-xs text-foreground-400">
            {activeTab === 'announcement'
              ? 'Các thông báo mới từ BGD sẽ hiển thị ở đây'
              : 'Tin nhắn riêng từ quản lý và đồng nghiệp sẽ hiển thị ở đây'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeNotifications.map((notif) => (
            <div key={notif.id} onClick={() => handleCardClick(notif)}>
              <NotificationCard notification={notif} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}