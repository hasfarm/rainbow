import { useState, useMemo, useRef } from 'react';
import { mockOvertimes, overtimeTypeLabels, overtimeStatusLabels, overtimeStatusColors, overtimeTypeColors, overtimeTypeIcons } from '@/mocks/overtimes';
import { mockUsers } from '@/mocks/users';
import { exportToExcel, importFromExcel } from '@/utils/excel';
import type { OvertimeStatus, OvertimeType, OvertimeRecord } from '@/mocks/overtimes';
import type React from 'react';

export default function OvertimeTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<OvertimeType | 'all'>('all');
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [overtimeData, setOvertimeData] = useState<OvertimeRecord[]>(mockOvertimes);

  const getUser = (userId: string) => mockUsers.find((u) => u.id === userId);

  const filtered = useMemo(() => {
    let list = [...overtimeData];
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter((r) => r.overtimeType === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const u = getUser(r.userId);
        return (
          u?.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        );
      });
    }
    return list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [search, statusFilter, typeFilter, overtimeData]);

  const totalHours = overtimeData
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.hours, 0);

  const stats = {
    total: overtimeData.length,
    pending: overtimeData.filter((r) => r.status === 'pending').length,
    approved: overtimeData.filter((r) => r.status === 'approved').length,
    totalHours: totalHours.toFixed(1),
  };

  const handleExport = () => {
    const exportData = filtered.map((r) => {
      const u = getUser(r.userId);
      return {
        'Mã đơn': r.id,
        'Nhân viên': u?.name || '',
        'Ngày': r.date,
        'Loại': overtimeTypeLabels[r.overtimeType],
        'Bắt đầu': r.startTime,
        'Kết thúc': r.endTime,
        'Số giờ': r.hours,
        'Trạng thái': overtimeStatusLabels[r.status],
        'Lý do': r.reason,
      };
    });
    exportToExcel(exportData, `tang-ca-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file);
      const newRecords: OvertimeRecord[] = imported.map((row: Record<string, unknown>, idx: number) => ({
        id: `OT-IMP-${Date.now()}-${idx}`,
        userId: String(row['userId'] || row['userid'] || ''),
        date: String(row['Ngày'] || row['date'] || ''),
        startTime: String(row['Bắt đầu'] || row['startTime'] || '17:30'),
        endTime: String(row['Kết thúc'] || row['endTime'] || '19:30'),
        hours: Number(row['Số giờ'] || row['hours'] || 2),
        overtimeType: 'regular' as OvertimeType,
        reason: String(row['Lý do'] || row['reason'] || ''),
        status: 'pending' as OvertimeStatus,
        approverId: null,
        approverName: null,
        approver2Id: null,
        approver2Name: null,
        createdAt: new Date().toISOString(),
        rejectReason: null,
      })).filter((r) => r.userId && r.date);
      if (newRecords.length === 0) {
        setImportMsg({ type: 'error', text: 'File không có dữ liệu hợp lệ. Vui lòng kiểm tra cột userId và Ngày.' });
        return;
      }
      setOvertimeData((prev) => [...newRecords, ...prev]);
      setImportMsg({ type: 'success', text: `Đã import thành công ${newRecords.length} đơn tăng ca.` });
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
          { label: 'Tổng đơn', value: stats.total, icon: 'ri-time-line', color: 'bg-primary-500' },
          { label: 'Chờ duyệt', value: stats.pending, icon: 'ri-hourglass-line', color: 'bg-secondary-500' },
          { label: 'Đã duyệt', value: stats.approved, icon: 'ri-check-line', color: 'bg-accent-500' },
          { label: 'Tổng giờ TC', value: stats.totalHours, icon: 'ri-increase-decrease-line', color: 'bg-foreground-400' },
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
              placeholder="Tìm theo tên, mã đơn, lý do..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OvertimeStatus | 'all')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as OvertimeType | 'all')}
            className="h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="regular">Ngày thường</option>
            <option value="weekend">Cuối tuần</option>
            <option value="holiday">Ngày lễ</option>
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
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Ngày</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Loại</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Thời gian</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Số giờ</th>
              <th className="text-left text-xs font-semibold text-foreground-600 px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ot) => {
              const user = getUser(ot.userId);
              return (
                <tr key={ot.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-foreground-700">{ot.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={user?.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <span className="text-sm font-medium text-foreground-900">{user?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-700">{ot.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${overtimeTypeColors[ot.overtimeType]}`}>
                      <i className={overtimeTypeIcons[ot.overtimeType]}></i>
                      {overtimeTypeLabels[ot.overtimeType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-700">{ot.startTime} - {ot.endTime}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground-900">{ot.hours}h</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${overtimeStatusColors[ot.status]}`}>
                      {overtimeStatusLabels[ot.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-foreground-400">
            <i className="ri-time-line text-2xl block mb-2"></i>
            Không có đơn tăng ca phù hợp
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((ot) => {
          const user = getUser(ot.userId);
          return (
            <div key={ot.id} className="bg-background-50 border border-background-200/70 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-foreground-950">{user?.name}</p>
                    <p className="text-xs text-foreground-500">{ot.id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${overtimeStatusColors[ot.status]}`}>
                  {overtimeStatusLabels[ot.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${overtimeTypeColors[ot.overtimeType]}`}>
                  <i className={overtimeTypeIcons[ot.overtimeType]}></i>
                  {overtimeTypeLabels[ot.overtimeType]}
                </span>
                <span className="text-xs text-foreground-500">{ot.date}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-600">{ot.startTime} - {ot.endTime}</span>
                <span className="font-semibold text-foreground-900">{ot.hours} giờ</span>
              </div>
              <p className="text-xs text-foreground-600 line-clamp-2 mt-1.5">{ot.reason}</p>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-foreground-400">
            <i className="ri-time-line text-2xl block mb-2"></i>
            Không có đơn tăng ca phù hợp
          </div>
        )}
      </div>
    </div>
  );
}