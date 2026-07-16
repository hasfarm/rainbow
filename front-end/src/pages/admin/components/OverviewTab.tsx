import { mockAdminStats, mockAdminAuditLog, mockDepartments } from '@/mocks/admin';
import { mockLeaves } from '@/mocks/leaves';
import { mockOvertimes } from '@/mocks/overtimes';
import { mockTimeOffs } from '@/mocks/timeoff';
import { useState } from 'react';

export function OverviewTab() {
  const [showLogs, setShowLogs] = useState(false);

  const totalPending =
    mockLeaves.filter((l) => l.status === 'pending').length +
    mockOvertimes.filter((o) => o.status === 'pending').length +
    mockTimeOffs.filter((t) => t.status === 'pending').length;

  const statsCards = [
    { icon: 'ri-team-line', label: 'Tổng nhân viên', value: mockAdminStats.totalEmployees, color: 'bg-primary-500' },
    { icon: 'ri-building-2-line', label: 'Phòng ban', value: mockAdminStats.totalDepartments, color: 'bg-accent-500' },
    { icon: 'ri-user-follow-line', label: 'Đi làm hôm nay', value: mockAdminStats.activeToday, color: 'bg-accent-600' },
    { icon: 'ri-timer-line', label: 'Chờ duyệt', value: totalPending, color: 'bg-secondary-500' },
  ];

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Stats grid - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-background-50 border border-background-200/70 rounded-xl p-4 lg:p-5 hover:border-background-300/60 transition-colors">
            <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-3">
              <span className={`w-9 h-9 lg:w-10 lg:h-10 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <i className={`${stat.icon} text-base lg:text-lg text-white`}></i>
              </span>
              <div className="lg:mt-1">
                <p className="text-xl lg:text-2xl font-heading font-bold text-foreground-950">{stat.value}</p>
                <p className="text-xs text-foreground-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Body section - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Left column: Payroll + Audit log */}
        <div className="space-y-4 lg:space-y-5">
          {/* Lương tháng */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 lg:p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-lg text-primary-500"></i>
              </span>
              <div>
                <span className="text-sm font-semibold text-foreground-950">Tổng quỹ lương tháng</span>
                <p className="text-xs text-foreground-500">Tháng 06/2026</p>
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-heading font-bold text-foreground-950">
              {mockAdminStats.monthlyPayroll.toLocaleString('vi-VN')} đ
            </p>
          </div>

          {/* Nhật ký hoạt động */}
          <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between p-4 lg:p-5 cursor-pointer hover:bg-background-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center">
                  <i className="ri-history-line text-lg text-secondary-600"></i>
                </span>
                <span className="text-sm font-semibold text-foreground-950">Nhật ký hoạt động</span>
              </div>
              {showLogs ? (
                <i className="ri-arrow-up-s-line text-foreground-400"></i>
              ) : (
                <i className="ri-arrow-down-s-line text-foreground-400"></i>
              )}
            </button>
            {showLogs && (
              <div className="px-4 lg:px-5 pb-4 lg:pb-5 space-y-2 max-h-72 overflow-y-auto border-t border-background-200/70 pt-3">
                {mockAdminAuditLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-background-200/70 last:border-0">
                    <span className="w-2 h-2 rounded-full bg-secondary-400 mt-2 flex-shrink-0"></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground-900">
                        <span className="font-semibold">{log.userName}</span>
                        <span className="text-foreground-500"> — {log.action}</span>
                      </p>
                      <p className="text-[10px] text-foreground-400 mt-1">{log.timestamp}</p>
                    </div>
                    <span className="text-[10px] text-foreground-400 flex-shrink-0">{log.ip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Departments */}
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 lg:p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-foreground-950">Phòng ban</span>
            <span className="text-xs bg-background-100 text-foreground-600 px-2.5 py-1 rounded-full">{mockDepartments.length} phòng</span>
          </div>
          <div className="space-y-1">
            {mockDepartments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-background-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-building-2-line text-sm text-accent-600"></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground-900">{dept.name}</p>
                    <p className="text-[11px] text-foreground-500 truncate">{dept.managerName}</p>
                  </div>
                </div>
                <span className="text-xs bg-background-100 text-foreground-600 px-2 py-1 rounded-full whitespace-nowrap">{dept.totalEmployees} NV</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}