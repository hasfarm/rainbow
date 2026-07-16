import React from 'react';
import { useState, useMemo, useRef } from 'react';
import { mockLeaves, leaveTypeLabels, leaveStatusLabels, leaveStatusColors, leaveTypeColors, leaveTypeIcons } from '@/mocks/leaves';
import { mockUsers } from '@/mocks/users';
import { exportToExcel, importFromExcel } from '@/utils/excel';
import type { LeaveStatus, LeaveType, LeaveRecord } from '@/mocks/leaves';

export default function LeavesTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LeaveType | 'all'>('all');
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leavesData, setLeavesData] = useState<LeaveRecord[]>(mockLeaves);

  const getUser = (userId: string) => mockUsers.find((u) => u.id === userId);

  const filtered = useMemo(() => {
    let list = [...leavesData];
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const u = getUser(r.userId);
        return (
          u?.name.toLowerCase().includes(q) ||
          leaveTypeLabels[r.type].toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        );
      });
    }
    return list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [search, statusFilter, typeFilter, leavesData]);

  const stats = {
    total: leavesData.length,
    pending: leavesData.filter((r) => r.status === 'pending').length,
    approved: leavesData.filter((r) => r.status === 'approved').length,
    rejected: leavesData.filter((r) => r.status === 'rejected').length,
  };

  const handleExport = () => {
    const exportData = filtered.map((r) => {
      const u = getUser(r.userId);
      return {
        'Mã đơn': r.id,
        'Nhân viên': u?.name || '',
        'Loại': leaveTypeLabels[r.type],
        'Ngày bắt đầu': r.startDate,
        'Ngày kết thúc': r.endDate,
        'Giờ bắt đầu': r.startTime || '',
        'Giờ kết thúc': r.endTime || '',
        'Lý do': r.reason,
        'Trạng thái': leaveStatusLabels[r.status],
        'Người duyệt': r.approvedBy || '',
      };
    });
    exportToExcel(exportData, `nghi-phep-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file);
      const newRecords: LeaveRecord[] = imported.map((row: Record<string, unknown>, idx: number) => ({
        id: `LEAVE-IMP-${Date.now()}-${idx}`,
        userId: String(row['userId'] || row['userid'] || ''),
        type: 'annual_leave' as LeaveType,
        startDate: String(row['Ngày bắt đầu'] || row['startDate'] || ''),
        endDate: String(row['Ngày kết thúc'] || row['endDate'] || ''),
        startTime: null,
        endTime: null,
        reason: String(row['Lý do'] || row['reason'] || ''),
        status: 'pending' as LeaveStatus,
        createdAt: new Date().toISOString(),
        approvedBy: null,
        rejectedReason: null,
        handoverTo: null,
        handoverNote: null,
        approver: null,
      })).filter((r) => r.userId && r.startDate);
      if (newRecords.length === 0) {
        setImportMsg({ type: 'error', text: 'File không có dữ liệu hợp lệ. Vui lòng kiểm tra cột userId và Ngày bắt đầu.' });
        return;
      }
      setLeavesData((prev) => [...newRecords, ...prev]);
      setImportMsg({ type: 'success', text: `Đã import thành công ${newRecords.length} đơn nghỉ phép.` });
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
          { label: 'Tổng đơn', value: stats.total, icon: 'ri-file-list-line', color: 'bg-primary-500' },
          { label: 'Chờ duyệt', value: stats.pending, icon: 'ri-hourglass-line', color: 'bg-secondary-500' },
          { label: 'Đã duyệt', value: stats.approved, icon: 'ri-check-line', color: 'bg-accent-500' },
          { label: 'Từ chối', value: stats.rejected, icon: 'ri-close-line', color: 'bg-foreground-400' },
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
        {importMsg && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 mb-3 ${importMsg.type === 'success' ? 'text-accent-700 bg-accent-100' : 'text-red-700 bg-red-100'}`}>
            <i className={importMsg.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
            {importMsg.text}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã đơn, loại..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'all')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as LeaveType | 'all')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            {Object.entries(leaveTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="h-10 px-3 rounded-lg border border-accent-200/70 bg-accent-100 text-accent-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-accent-200 transition-colors flex items-center gap-1.5"
            >
              <i className="ri-download-line"></i>
              <span>Export</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3 rounded-lg border border-secondary-200/70 bg-secondary-100 text-secondary-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-secondary-200 transition-colors flex items-center gap-1.5"
            >
              <i className="ri-upload-line"></i>
              <span>Import</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background-100/50 border-b border-background-200/70">
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Mã đơn</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Nhân viên</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Loại</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Thời gian</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Lý do</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Trạng thái</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Người duyệt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((leave) => {
              const user = getUser(leave.userId);
              const timeText = leave.startTime
                ? `${leave.startDate} ${leave.startTime}${leave.endTime ? ` - ${leave.endTime}` : ''}`
                : `${leave.startDate} → ${leave.endDate}`;
              return (
                <tr key={leave.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-foreground-700">{leave.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={user?.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-sm font-medium text-foreground-900">{user?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${leaveTypeColors[leave.type]}`}>
                      <i className={leaveTypeIcons[leave.type]}></i>
                      {leaveTypeLabels[leave.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-700">{timeText}</td>
                  <td className="px-4 py-3 text-sm text-foreground-600 max-w-[200px] truncate">{leave.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${leaveStatusColors[leave.status]}`}>
                      {leaveStatusLabels[leave.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-600">{leave.approvedBy || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-foreground-400">
            <i className="ri-file-list-3-line text-2xl block mb-2"></i>
            Không có đơn nghỉ phép phù hợp
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((leave) => {
          const user = getUser(leave.userId);
          const timeText = leave.startTime
            ? `${leave.startDate} ${leave.startTime}${leave.endTime ? ` - ${leave.endTime}` : ''}`
            : `${leave.startDate} → ${leave.endDate}`;
          return (
            <div key={leave.id} className="bg-background-50 border border-background-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground-950">{user?.name}</p>
                    <p className="text-xs text-foreground-500">{leave.id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${leaveStatusColors[leave.status]}`}>
                  {leaveStatusLabels[leave.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${leaveTypeColors[leave.type]}`}>
                  <i className={leaveTypeIcons[leave.type]}></i>
                  {leaveTypeLabels[leave.type]}
                </span>
                <span className="text-xs text-foreground-500">{timeText}</span>
              </div>
              <p className="text-xs text-foreground-600 line-clamp-2">{leave.reason}</p>
              {leave.approvedBy && (
                <p className="text-xs text-foreground-500 mt-1.5">Duyệt bởi: {leave.approvedBy}</p>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-foreground-400">
            <i className="ri-file-list-3-line text-2xl block mb-2"></i>
            Không có đơn nghỉ phép phù hợp
          </div>
        )}
      </div>
    </div>
  );
}