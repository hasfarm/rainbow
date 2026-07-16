import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import {
  fetchLeaves,
  leaveStatusColors,
  leaveStatusLabels,
  leaveTypeColors,
  leaveTypeIcons,
  leaveTypeLabels,
  type LeaveRecord,
  type LeaveStatus,
} from './api';
import { LeaveCard } from './components/LeaveCard';
import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

const statusTabs: { key: LeaveStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tat ca' },
  { key: 'pending', label: 'Cho duyet' },
  { key: 'approved', label: 'Da duyet' },
  { key: 'rejected', label: 'Tu choi' },
];

function formatDateRange(startDate: string, endDate: string, startTime: string | null, endTime: string | null): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInDays(end, start);

  if (startTime && endTime) {
    return `${format(start, 'dd/MM/yyyy', { locale: vi })} - ${startTime} -> ${endTime}`;
  }
  if (days === 0) {
    return format(start, 'dd/MM/yyyy', { locale: vi });
  }
  return `${format(start, 'dd/MM/yyyy', { locale: vi })} -> ${format(end, 'dd/MM/yyyy', { locale: vi })} (${days + 1} ngay)`;
}

export default function LeavePage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<LeaveStatus | 'all'>('all');
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLeaves([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const records = await fetchLeaves(activeTab);
        // Defense-in-depth: keep only records belonging to the current logged-in user.
        setLeaves(records.filter((item) => item.userId === user.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong the tai danh sach don nghi.');
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [activeTab, user?.id]);

  const filteredLeaves = useMemo(() => {
    return leaves;
  }, [leaves]);

  const pendingCount = leaves.filter((item) => item.status === 'pending').length;
  const approvedCount = leaves.filter((item) => item.status === 'approved').length;
  const remainingLeave = user?.annualLeave ?? 0;

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
            <i className="ri-arrow-left-line text-foreground-600"></i>
          </Link>
          <h1 className="text-lg font-heading font-bold text-foreground-950">Xin nghi phep</h1>
        </div>
        <Link
          to="/leave/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-add-line text-sm"></i>
          </span>
          Tao don
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-accent-600">{remainingLeave}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Ngay phep</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-secondary-600">{pendingCount}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Cho duyet</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 text-center">
          <p className="text-xl font-heading font-bold text-accent-600">{approvedCount}</p>
          <p className="text-[11px] text-foreground-500 mt-0.5">Da duyet</p>
        </div>
      </div>

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

      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-24"></div>
          <div className="skeleton h-24"></div>
          <div className="skeleton h-24"></div>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{error}</div>
      )}

      {!isLoading && !error && filteredLeaves.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="w-16 h-16 bg-background-100 rounded-2xl flex items-center justify-center mb-4">
            <i className="ri-calendar-check-line text-2xl text-foreground-300"></i>
          </span>
          <p className="text-sm text-foreground-500 mb-1">Chua co don nghi phep nao</p>
          <Link
            to="/leave/new"
            className="text-xs text-primary-500 font-medium hover:text-primary-600 transition-colors cursor-pointer mt-2"
          >
            + Tao don xin nghi moi
          </Link>
        </div>
      )}

      {!isLoading && !error && filteredLeaves.length > 0 && (
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
