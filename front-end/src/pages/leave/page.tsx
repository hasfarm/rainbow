import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockLeaves, leaveTypeLabels, leaveTypeIcons, leaveTypeColors, leaveStatusLabels, leaveStatusColors, type LeaveStatus } from '@/mocks/leaves';
import { LeaveCard } from './components/LeaveCard';
import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusTabs: { key: LeaveStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

function formatDateRange(startDate: string, endDate: string, startTime: string | null, endTime: string | null): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start);

  if (startTime && endTime) {
    return `${format(start, 'dd/MM/yyyy', { locale: vi })} - ${startTime} → ${endTime}`;
  }
  if (startTime) {
    return `${format(start, 'dd/MM/yyyy', { locale: vi })} - đến lúc ${startTime}`;
  }
  if (endTime) {
    return `${format(start, 'dd/MM/yyyy', { locale: vi })} - về lúc ${endTime}`;
  }
  if (days === 0) {
    return format(start, 'dd/MM/yyyy', { locale: vi });
  }
  return `${format(start, 'dd/MM/yyyy', { locale: vi })} → ${format(end, 'dd/MM/yyyy', { locale: vi })} (${days + 1} ngày)`;
}

export default function LeavePage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<LeaveStatus | 'all'>('all');

  const userLeaves = mockLeaves.filter((l) => l.userId === user?.id);
  const filteredLeaves = activeTab === 'all'
    ? userLeaves
    : userLeaves.filter((l) => l.status === activeTab);

  const pendingCount = userLeaves.filter((l) => l.status === 'pending').length;
  const approvedCount = userLeaves.filter((l) => l.status === 'approved').length;
  const remainingLeave = user?.annualLeave ?? 0;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Xin nghỉ phép</h1>
        </div>
        <Link
          to="/leave/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-sm"></i>
          </span>
          Tạo đơn
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-accent-600">{remainingLeave}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Ngày phép</p>
        </div>
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

      {/* Leave list */}
      {filteredLeaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-calendar-check-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">
            {activeTab === 'all' ? 'Chưa có đơn nghỉ phép nào' : `Không có đơn nào ở trạng thái "${statusTabs.find(t => t.key === activeTab)?.label}"`}
          </p>
          <Link
            to="/leave/new"
            className="text-xs text-primary-500 font-medium hover:text-primary-600 transition-colors cursor-pointer mt-2"
          >
            + Tạo đơn xin nghỉ mới
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredLeaves.map((leave) => (
            <LeaveCard
              key={leave.id}
              id={leave.id}
              typeIcon={leaveTypeIcons[leave.type]}
              typeLabel={leaveTypeLabels[leave.type]}
              typeColor={leaveTypeColors[leave.type]}
              dateDisplay={formatDateRange(leave.startDate, leave.endDate, leave.startTime, leave.endTime)}
              reason={leave.reason}
              status={leave.status}
              statusLabel={leaveStatusLabels[leave.status]}
              statusColor={leaveStatusColors[leave.status]}
              rejectedReason={leave.rejectedReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}