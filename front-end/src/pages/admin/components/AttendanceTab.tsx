import React from 'react';
import { useState, useMemo, useRef } from 'react';
import { mockAttendance, getCheckIn, getCheckOut, attendanceStatusLabels } from '@/mocks/attendance';
import { mockUsers } from '@/mocks/users';
import { exportToExcel, importFromExcel } from '@/utils/excel';
import AttendanceCalendarView from './AttendanceCalendarView';
import type { AttendanceRecord } from '@/mocks/attendance';

type FilterStatus = 'all' | 'on_time' | 'late' | 'early_leave' | 'absent';

const statusColors: Record<string, string> = {
  on_time: 'bg-accent-100 text-accent-700',
  late: 'bg-primary-100 text-primary-700',
  early_leave: 'bg-secondary-100 text-secondary-700',
  absent: 'bg-foreground-100 text-foreground-700',
};

const statusIcons: Record<string, string> = {
  on_time: 'ri-check-line',
  late: 'ri-time-line',
  early_leave: 'ri-walk-line',
  absent: 'ri-close-line',
};

export default function AttendanceTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(mockAttendance);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const getUser = (userId: string) => mockUsers.find((u) => u.id === userId);

  const attendanceUsers = useMemo(() => {
    const userIds = [...new Set(mockAttendance.map((r) => r.userId))];
    return userIds.map((uid) => mockUsers.find((u) => u.id === uid)).filter(Boolean) as typeof mockUsers;
  }, []);

  const departments = useMemo(() => {
    return [...new Set(mockUsers.map((u) => u.department))].sort();
  }, []);

  const filtered = useMemo(() => {
    let list = [...attendanceData];
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (dateFilter) list = list.filter((r) => r.date === dateFilter);
    if (userFilter) list = list.filter((r) => r.userId === userFilter);
    if (deptFilter) {
      list = list.filter((r) => {
        const u = getUser(r.userId);
        return u?.department === deptFilter;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const u = getUser(r.userId);
        return (
          u?.name.toLowerCase().includes(q) ||
          u?.department.toLowerCase().includes(q) ||
          r.date.includes(q)
        );
      });
    }
    return list.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [search, statusFilter, dateFilter, userFilter, deptFilter, attendanceData]);

  const today = '2026-07-15';
  const todayRecords = attendanceData.filter((r) => r.date === today);

  const stats = {
    total: todayRecords.length,
    onTime: todayRecords.filter((r) => r.status === 'on_time').length,
    late: todayRecords.filter((r) => r.status === 'late').length,
    absent: todayRecords.filter((r) => r.status === 'absent').length,
  };

  const handleExport = () => {
    const exportData = filtered.map((r) => {
      const u = getUser(r.userId);
      const checkIn = getCheckIn(r);
      const checkOut = getCheckOut(r);
      return {
        'Ngày': r.date,
        'Nhân viên': u?.name || '',
        'Phòng ban': u?.department || '',
        'Check-in': checkIn || '',
        'Check-out': checkOut || '',
        'Trạng thái': attendanceStatusLabels[r.status],
        'IP': r.ipAddress || '',
      };
    });
    exportToExcel(exportData, `cham-cong-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleCalendarExport = () => {
    // Export all attendance data for current filtered users in calendar format
    const exportData = filtered.map((r) => {
      const u = getUser(r.userId);
      const checkIn = getCheckIn(r);
      const checkOut = getCheckOut(r);
      return {
        'Ngày': r.date,
        'Nhân viên': u?.name || '',
        'Phòng ban': u?.department || '',
        'Check-in': checkIn || '',
        'Check-out': checkOut || '',
        'Trạng thái': attendanceStatusLabels[r.status],
        'IP': r.ipAddress || '',
      };
    });
    exportToExcel(exportData, `bang-cham-cong-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file);
      const newRecords: AttendanceRecord[] = imported.map((row: Record<string, unknown>, idx: number) => {
        const checkInVal = String(row['Check-in'] || row['check-in'] || row['checkin'] || '');
        const checkOutVal = String(row['Check-out'] || row['check-out'] || row['checkout'] || '');
        const punches = [];
        if (checkInVal) punches.push({ time: checkInVal, photo: null });
        if (checkOutVal) punches.push({ time: checkOutVal, photo: null });
        return {
          id: `ATT-IMP-${Date.now()}-${idx}`,
          userId: String(row['userId'] || row['userid'] || ''),
          date: String(row['Ngày'] || row['date'] || ''),
          punches,
          status: 'on_time' as const,
          ipAddress: null,
        };
      }).filter((r) => r.date && r.userId);
      if (newRecords.length === 0) {
        setImportMsg({ type: 'error', text: 'File không có dữ liệu hợp lệ. Vui lòng kiểm tra cột Ngày và userId.' });
        return;
      }
      setAttendanceData((prev) => [...newRecords, ...prev]);
      setImportMsg({ type: 'success', text: `Đã import thành công ${newRecords.length} bản ghi chấm công.` });
    } catch {
      setImportMsg({ type: 'error', text: 'Lỗi đọc file. Vui lòng kiểm tra định dạng Excel.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMsg(null), 3000);
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Check-in hôm nay', value: stats.total, icon: 'ri-user-received-line', color: 'bg-primary-500' },
          { label: 'Đúng giờ', value: stats.onTime, icon: 'ri-check-double-line', color: 'bg-accent-500' },
          { label: 'Đi muộn', value: stats.late, icon: 'ri-time-line', color: 'bg-secondary-500' },
          { label: 'Vắng mặt', value: stats.absent, icon: 'ri-close-line', color: 'bg-foreground-400' },
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

      {/* View Toggle + Filters */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-3 lg:p-4 space-y-3">
        {/* Import message toast */}
        {importMsg && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 ${importMsg.type === 'success' ? 'text-accent-700 bg-accent-100' : 'text-red-700 bg-red-100'}`}>
            <i className={importMsg.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
            {importMsg.text}
          </div>
        )}

        {/* View mode tabs */}
        <div className="flex items-center gap-2 border-b border-background-200/70 pb-3">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            <i className="ri-list-check"></i>
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-primary-500 text-white'
                : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            <i className="ri-table-line"></i>
            Bảng công
          </button>
          <span className="flex-1"></span>
          <button
            onClick={viewMode === 'calendar' ? handleCalendarExport : handleExport}
            className="h-9 px-3 rounded-lg border border-accent-200/70 bg-accent-100 text-accent-700 text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-accent-200 transition-colors flex items-center gap-1.5"
          >
            <i className="ri-download-line"></i>
            <span>Export</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3 rounded-lg border border-secondary-200/70 bg-secondary-100 text-secondary-700 text-xs font-medium cursor-pointer whitespace-nowrap hover:bg-secondary-200 transition-colors flex items-center gap-1.5"
          >
            <i className="ri-upload-line"></i>
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="">Tất cả nhân viên</option>
            {attendanceUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="on_time">Đúng giờ</option>
            <option value="late">Đi muộn</option>
            <option value="early_leave">Về sớm</option>
            <option value="absent">Vắng mặt</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
          />
          <div className="relative flex-1 min-w-[180px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, ngày..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <AttendanceCalendarView userFilter={userFilter} deptFilter={deptFilter} search={search} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-background-100/50 border-b border-background-200/70">
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Ngày</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Nhân viên</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Phòng ban</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Check-in</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Check-out</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Trạng thái</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const user = getUser(record.userId);
                  const checkIn = getCheckIn(record);
                  const checkOut = getCheckOut(record);
                  return (
                    <tr key={record.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground-900">{record.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={user?.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <span className="text-sm font-medium text-foreground-900">{user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground-600">{user?.department}</td>
                      <td className="px-4 py-3 text-sm text-foreground-900">{checkIn || '-'}</td>
                      <td className="px-4 py-3 text-sm text-foreground-900">{checkOut || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[record.status]}`}>
                          <i className={statusIcons[record.status]}></i>
                          {attendanceStatusLabels[record.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground-500 font-mono">{record.ipAddress || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-sm text-foreground-400">
                <i className="ri-calendar-line text-2xl block mb-2"></i>
                Không có dữ liệu chấm công phù hợp
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((record) => {
              const user = getUser(record.userId);
              const checkIn = getCheckIn(record);
              const checkOut = getCheckOut(record);
              return (
                <div key={record.id} className="bg-background-50 border border-background-200/70 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-foreground-950">{user?.name}</p>
                        <p className="text-xs text-foreground-500">{user?.department}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[record.status]}`}>
                      <i className={statusIcons[record.status]}></i>
                      {attendanceStatusLabels[record.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background-100 rounded-lg p-2">
                      <p className="text-foreground-500 mb-0.5">Ngày</p>
                      <p className="font-medium text-foreground-900">{record.date}</p>
                    </div>
                    <div className="bg-background-100 rounded-lg p-2">
                      <p className="text-foreground-500 mb-0.5">Check-in</p>
                      <p className="font-medium text-foreground-900">{checkIn || '-'}</p>
                    </div>
                    <div className="bg-background-100 rounded-lg p-2">
                      <p className="text-foreground-500 mb-0.5">Check-out</p>
                      <p className="font-medium text-foreground-900">{checkOut || '-'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-sm text-foreground-400">
                <i className="ri-calendar-line text-2xl block mb-2"></i>
                Không có dữ liệu chấm công phù hợp
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}