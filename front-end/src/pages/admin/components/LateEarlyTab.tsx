import { useState, useMemo } from 'react';
import { mockAttendance, getCheckIn, attendanceStatusLabels } from '@/mocks/attendance';
import { mockLeaves, leaveTypeLabels, leaveStatusLabels, leaveStatusColors, leaveTypeColors, leaveTypeIcons } from '@/mocks/leaves';
import { mockUsers } from '@/mocks/users';
import { exportToExcel } from '@/utils/excel';

interface ViolationItem {
  id: string;
  date: string;
  userId: string;
  type: 'late' | 'early_leave' | 'late_arrival_request' | 'early_departure_request';
  timeInfo: string;
  statusLabel: string;
  hasRequest: boolean;
  requestStatus?: string;
  reason?: string;
}

export default function LateEarlyTab() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'late' | 'early_leave'>('all');

  const getUser = (userId: string) => mockUsers.find((u) => u.id === userId);

  const violations = useMemo(() => {
    const items: ViolationItem[] = [];

    // From attendance records
    mockAttendance
      .filter((r) => r.status === 'late' || r.status === 'early_leave')
      .forEach((r) => {
        const checkIn = getCheckIn(r);
        const timeInfo = r.status === 'late'
          ? `Check-in: ${checkIn || '?'}`
          : `Về sớm`;
        items.push({
          id: `ATT-${r.id}`,
          date: r.date,
          userId: r.userId,
          type: r.status as 'late' | 'early_leave',
          timeInfo,
          statusLabel: attendanceStatusLabels[r.status],
          hasRequest: false,
        });
      });

    // From leave requests
    mockLeaves
      .filter((r) => r.type === 'late_arrival' || r.type === 'early_departure')
      .forEach((r) => {
        const isLate = r.type === 'late_arrival';
        items.push({
          id: `REQ-${r.id}`,
          date: r.startDate,
          userId: r.userId,
          type: isLate ? 'late_arrival_request' : 'early_departure_request',
          timeInfo: isLate ? `Dự kiến đến: ${r.startTime || '?'}` : `Dự kiến về: ${r.endTime || '?'}`,
          statusLabel: leaveTypeLabels[r.type],
          hasRequest: true,
          requestStatus: leaveStatusLabels[r.status],
          reason: r.reason,
        });
      });

    return items.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, []);

  const filtered = useMemo(() => {
    let list = [...violations];
    if (typeFilter === 'late') list = list.filter((v) => v.type === 'late' || v.type === 'late_arrival_request');
    if (typeFilter === 'early_leave') list = list.filter((v) => v.type === 'early_leave' || v.type === 'early_departure_request');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((v) => {
        const u = getUser(v.userId);
        return u?.name.toLowerCase().includes(q) || u?.department.toLowerCase().includes(q);
      });
    }
    return list;
  }, [violations, search, typeFilter]);

  const stats = {
    total: violations.length,
    late: violations.filter((v) => v.type === 'late' || v.type === 'late_arrival_request').length,
    early: violations.filter((v) => v.type === 'early_leave' || v.type === 'early_departure_request').length,
    withRequest: violations.filter((v) => v.hasRequest).length,
  };

  const handleExport = () => {
    const exportData = filtered.map((v) => {
      const u = getUser(v.userId);
      return {
        'Ngày': v.date,
        'Nhân viên': u?.name || '',
        'Phòng ban': u?.department || '',
        'Loại': typeLabels[v.type],
        'Thông tin': v.timeInfo,
        'Trạng thái đơn': v.hasRequest && v.requestStatus ? v.requestStatus : 'Không có đơn',
      };
    });
    exportToExcel(exportData, `di-tre-ve-som-${new Date().toISOString().slice(0, 10)}`);
  };

  const typeColors: Record<string, string> = {
    late: 'bg-primary-100 text-primary-700',
    early_leave: 'bg-secondary-100 text-secondary-700',
    late_arrival_request: 'bg-primary-100 text-primary-700',
    early_departure_request: 'bg-secondary-100 text-secondary-700',
  };

  const typeLabels: Record<string, string> = {
    late: 'Đi muộn',
    early_leave: 'Về sớm',
    late_arrival_request: 'Xin đi trễ',
    early_departure_request: 'Xin về sớm',
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Tổng vi phạm', value: stats.total, icon: 'ri-error-warning-line', color: 'bg-primary-500' },
          { label: 'Đi muộn', value: stats.late, icon: 'ri-time-line', color: 'bg-secondary-500' },
          { label: 'Về sớm', value: stats.early, icon: 'ri-walk-line', color: 'bg-foreground-400' },
          { label: 'Có đơn xin phép', value: stats.withRequest, icon: 'ri-file-list-line', color: 'bg-accent-500' },
        ].map((s) => (
          <div key={s.label} className="bg-background-50 border border-background-200/70 rounded-xl p-3 lg:p-4">
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <i className={`${s.icon} text-sm text-white`}></i>
              </span>
              <div>
                <p className="text-xs text-foreground-500">{s.label}</p>
                <p className="text-lg font-bold text-foreground-950">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, phòng ban..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'late' | 'early_leave')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="late">Đi muộn</option>
            <option value="early_leave">Về sớm</option>
          </select>
          <button
            onClick={handleExport}
            className="h-10 px-3 rounded-lg border border-accent-200/70 bg-accent-100 text-accent-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-accent-200 transition-colors flex items-center gap-1.5"
          >
            <i className="ri-download-line"></i>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background-100/50 border-b border-background-200/70">
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Ngày</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Nhân viên</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Phòng ban</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Loại</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Thông tin</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Trạng thái đơn</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const user = getUser(v.userId);
              return (
                <tr key={v.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground-900">{v.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={user?.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-sm font-medium text-foreground-900">{user?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-600">{user?.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${typeColors[v.type]}`}>
                      {typeLabels[v.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-700">{v.timeInfo}</td>
                  <td className="px-4 py-3">
                    {v.hasRequest && v.requestStatus ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${leaveStatusColors[v.requestStatus === 'Chờ duyệt' ? 'pending' : v.requestStatus === 'Đã duyệt' ? 'approved' : 'rejected']}`}>
                        {v.requestStatus}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                        Không có đơn
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-foreground-400">
            <i className="ri-error-warning-line text-2xl block mb-2"></i>
            Không có dữ liệu đi trễ / về sớm
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((v) => {
          const user = getUser(v.userId);
          return (
            <div key={v.id} className="bg-background-50 border border-background-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground-950">{user?.name}</p>
                    <p className="text-xs text-foreground-500">{user?.department}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[v.type]}`}>
                  {typeLabels[v.type]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-background-100 rounded-lg p-2">
                  <p className="text-foreground-500 mb-0.5">Ngày</p>
                  <p className="font-medium text-foreground-900">{v.date}</p>
                </div>
                <div className="bg-background-100 rounded-lg p-2">
                  <p className="text-foreground-500 mb-0.5">Trạng thái đơn</p>
                  <p className="font-medium text-foreground-900">
                    {v.hasRequest && v.requestStatus ? v.requestStatus : 'Không có đơn'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-foreground-600">{v.timeInfo}</p>
              {v.reason && <p className="text-xs text-foreground-500 mt-1 line-clamp-2">{v.reason}</p>}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-foreground-400">
            <i className="ri-error-warning-line text-2xl block mb-2"></i>
            Không có dữ liệu đi trễ / về sớm
          </div>
        )}
      </div>
    </div>
  );
}