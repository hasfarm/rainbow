import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockOvertimes, overtimeStatusLabels, overtimeStatusColors, overtimeStatusIcons, type OvertimeStatus, type OvertimeType } from '@/mocks/overtimes';
import { OvertimeCard } from './components/OvertimeCard';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

function getWeightMultiplier(type: OvertimeType): number {
  if (type === 'weekend') return 2;
  if (type === 'holiday') return 3;
  return 1;
}

const statusTabs: { key: OvertimeStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
];

function formatDateAndTime(dateStr: string, startTime: string, endTime: string) {
  const date = parseISO(dateStr);
  const dayOfWeek = format(date, 'EEEE', { locale: vi });
  const formattedDate = format(date, 'dd/MM/yyyy', { locale: vi });
  return {
    dateDisplay: `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} - ${formattedDate}`,
    timeDisplay: `${startTime} → ${endTime}`,
  };
}

export default function OvertimePage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<OvertimeStatus | 'all'>('all');

  const userOvertimes = mockOvertimes.filter((o) => o.userId === user?.id);
  const filteredOvertimes = activeTab === 'all'
    ? userOvertimes
    : userOvertimes.filter((o) => o.status === activeTab);

  const pendingCount = userOvertimes.filter((o) => o.status === 'pending').length;
  const approvedCount = userOvertimes.filter((o) => o.status === 'approved').length;
  const totalWeightedHours = userOvertimes
    .filter((o) => o.status === 'approved')
    .reduce((sum, o) => sum + o.hours * getWeightMultiplier(o.overtimeType), 0);

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Tăng ca</h1>
        </div>
        <Link
          to="/overtime/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-sm"></i>
          </span>
          Tạo phiếu
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-accent-600">{totalWeightedHours}h</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Tổng giờ quy đổi</p>
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

      {/* Overtime list */}
      {filteredOvertimes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-time-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">
            {activeTab === 'all' ? 'Chưa có phiếu tăng ca nào' : `Không có phiếu nào ở trạng thái "${statusTabs.find(t => t.key === activeTab)?.label}"`}
          </p>
          <Link
            to="/overtime/new"
            className="text-xs text-primary-500 font-medium hover:text-primary-600 transition-colors cursor-pointer mt-2"
          >
            + Tạo phiếu tăng ca mới
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOvertimes.map((ot) => {
            const { dateDisplay, timeDisplay } = formatDateAndTime(ot.date, ot.startTime, ot.endTime);
            return (
              <OvertimeCard
                key={ot.id}
                id={ot.id}
                dateDisplay={dateDisplay}
                timeDisplay={timeDisplay}
                hours={ot.hours}
                overtimeType={ot.overtimeType}
                reason={ot.reason}
                statusIcon={overtimeStatusIcons[ot.status]}
                statusLabel={overtimeStatusLabels[ot.status]}
                statusColor={overtimeStatusColors[ot.status]}
                rejectReason={ot.rejectReason}
                approverName={ot.approverName}
                approver2Name={ot.approver2Name}
                department={user?.department}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}