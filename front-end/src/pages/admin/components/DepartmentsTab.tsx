import { mockDepartments } from '@/mocks/admin';
import { mockUsers, roleLabels } from '@/mocks/users';
import { useState } from 'react';
import { exportToExcel } from '@/utils/excel';

export function DepartmentsTab() {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const toggleDept = (id: string) => {
    setExpandedDept((prev) => (prev === id ? null : id));
  };

  const handleExport = () => {
    const exportData = mockDepartments.map((d) => ({
      'Mã PB': d.id,
      'Tên phòng ban': d.name,
      'Quản lý': d.managerName,
      'Số nhân viên': d.totalEmployees,
      'Mô tả': d.description,
    }));
    exportToExcel(exportData, `danh-sach-phong-ban-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <span className="text-xs text-foreground-500">{mockDepartments.length} phòng ban</span>
        <button
          onClick={handleExport}
          className="h-9 px-3 rounded-lg border border-accent-200/70 bg-accent-100 text-accent-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-accent-200 transition-colors flex items-center gap-1.5"
        >
          <i className="ri-download-line"></i>
          <span>Export</span>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {mockDepartments.map((dept) => {
          const members = mockUsers.filter((u) => u.department === dept.name);
          const isExpanded = expandedDept === dept.id;

          return (
            <div key={dept.id} className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden hover:border-background-300/60 transition-colors">
              <button
                onClick={() => toggleDept(dept.id)}
                className="w-full flex items-center justify-between p-4 lg:p-5 cursor-pointer hover:bg-background-100/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-building-2-line text-base text-accent-600"></i>
                  </span>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-foreground-950">{dept.name}</p>
                    <p className="text-xs text-foreground-500 truncate">
                      {dept.managerName} · {dept.totalEmployees} thành viên
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-background-100 text-foreground-600 px-2 py-1 rounded-full">{members.length} NV</span>
                  {isExpanded ? (
                    <i className="ri-arrow-up-s-line text-foreground-400"></i>
                  ) : (
                    <i className="ri-arrow-down-s-line text-foreground-400"></i>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 lg:px-5 pb-4 lg:pb-5 border-t border-background-200/70 pt-3">
                  <p className="text-xs text-foreground-500 mb-4 leading-relaxed">{dept.description}</p>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-background-100/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <i className="ri-user-line text-sm text-primary-500"></i>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground-900">
                            {member.name}
                            {member.id === dept.managerId && (
                              <span className="ml-1.5 text-[10px] bg-secondary-100 text-secondary-700 px-1.5 py-0.5 rounded-full">Quản lý</span>
                            )}
                          </p>
                          <p className="text-[11px] text-foreground-500 truncate">{member.position} · {member.email}</p>
                        </div>
                        <span className="text-[10px] bg-background-100 text-foreground-600 px-1.5 py-0.5 rounded-full flex-shrink-0">{roleLabels[member.role]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}