import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockTimeOffs, timeOffTypeLabels, timeOffTypeIcons, timeOffTypeColors, timeOffStatusLabels, timeOffStatusColors, timeOffSubTypeLabels, type TimeOffStatus } from '@/mocks/timeoff';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusTabs: { key: TimeOffStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE, dd/MM/yyyy', { locale: vi });
}

export default function TimeOffPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<TimeOffStatus | 'all'>('all');

  const userTimeOffs = mockTimeOffs.filter((t) => t.userId === user?.id);
  const filteredTimeOffs = activeTab === 'all'
    ? userTimeOffs
    : userTimeOffs.filter((t) => t.status === activeTab);

  const pendingCount = userTimeOffs.filter((t) => t.status === 'pending').length;
  const approvedCount = userTimeOffs.filter((t) => t.status === 'approved').length;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Đi trễ / Về sớm</h1>
        </div>
        <Link
          to="/timeoff/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-sm"></i>
          </span>
          Tạo đơn
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-secondary-600">{pendingCount}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Chờ duyệt</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-accent-600">{approvedCount}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Đã duyệt</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TimeOff list */}
      {filteredTimeOffs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-time-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">
            {activeTab === 'all' ? 'Chưa có đơn đi trễ / về sớm nào' : `Không có đơn nào ở trạng thái "${statusTabs.find(t => t.key === activeTab)?.label}"`}
          </p>
          <Link
            to="/timeoff/new"
            className="text-xs text-primary-500 font-medium hover:text-primary-600 transition-colors cursor-pointer mt-2"
          >
            + Tạo đơn mới
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTimeOffs.map((item) => {
            const formattedDate = formatDate(item.date);
            const typeIcon = timeOffTypeIcons[item.type];
            const typeLabel = timeOffTypeLabels[item.type];
            const typeColor = timeOffTypeColors[item.type];
            const statusLabel = timeOffStatusLabels[item.status];
            const statusColor = timeOffStatusColors[item.status];

            return (
              <div
                key={item.id}
                className="bg-background-50 border border-background-200/70 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-9 h-9 ${typeColor.split(' ')[0]} rounded-lg flex items-center justify-center shrink-0`}>
                      <i className={`${typeIcon} text-base ${typeColor.split(' ')[1]}`}></i>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground-950">{typeLabel}</p>
                      <p className="text-[11px] text-foreground-500 capitalize">{formattedDate}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusColor} whitespace-nowrap`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="space-y-1.5 mb-2.5">
                  {item.type === 'late_arrival' && item.expectedTime && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <i className="ri-login-box-line text-accent-500"></i>
                      </span>
                      <span className="text-foreground-600">Check-in dự kiến lúc</span>
                      <span className="font-semibold text-accent-600">{item.expectedTime}</span>
                    </div>
                  )}
                  {item.type === 'early_departure' && item.expectedTime && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <i className="ri-logout-box-line text-secondary-500"></i>
                      </span>
                      <span className="text-foreground-600">Check-out dự kiến lúc</span>
                      <span className="font-semibold text-secondary-600">{item.expectedTime}</span>
                    </div>
                  )}
                  {item.type === 'women_policy' && item.subType && item.expectedTime && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <i className={item.subType === 'late' ? 'ri-login-box-line text-accent-500' : 'ri-logout-box-line text-secondary-500'}></i>
                      </span>
                      <span className="text-foreground-600">{timeOffSubTypeLabels[item.subType]} — Chế độ phụ nữ</span>
                      <span className="font-semibold text-primary-600">{item.expectedTime}</span>
                    </div>
                  )}
                  {item.type === 'women_policy' && !item.subType && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <i className="ri-calendar-line text-primary-500"></i>
                      </span>
                      <span className="text-foreground-600">Nghỉ cả ngày</span>
                    </div>
                  )}
                  {item.approver && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <i className="ri-user-star-line text-foreground-400"></i>
                      </span>
                      <span className="text-foreground-500">Người duyệt: {item.approver}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-foreground-600 leading-relaxed line-clamp-2 mb-2">{item.reason}</p>

                {item.status === 'rejected' && item.rejectedReason && (
                  <div className="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 mt-2">
                    <p className="text-[11px] text-primary-700">
                      <span className="font-semibold">Lý do từ chối: </span>
                      {item.rejectedReason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}