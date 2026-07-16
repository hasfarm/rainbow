import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { OverviewTab } from './components/OverviewTab';
import { UsersTab } from './components/UsersTab';
import { DepartmentsTab } from './components/DepartmentsTab';
import AttendanceTab from './components/AttendanceTab';
import LeavesTab from './components/LeavesTab';
import OvertimeTab from './components/OvertimeTab';
import LateEarlyTab from './components/LateEarlyTab';
import NotificationsTab from './components/NotificationsTab';
import { mockSystemSettings, mockDepartments } from '@/mocks/admin';

type AdminTab = 'overview' | 'users' | 'departments' | 'attendance' | 'leaves' | 'overtime' | 'late_early' | 'notifications' | 'settings';

const tabs: { key: AdminTab; icon: string; label: string }[] = [
  { key: 'overview', icon: 'ri-dashboard-line', label: 'Tổng quan' },
  { key: 'users', icon: 'ri-team-line', label: 'Nhân viên' },
  { key: 'departments', icon: 'ri-building-2-line', label: 'Phòng ban' },
  { key: 'attendance', icon: 'ri-time-line', label: 'Chấm công' },
  { key: 'leaves', icon: 'ri-calendar-check-line', label: 'Nghỉ phép' },
  { key: 'overtime', icon: 'ri-increase-decrease-line', label: 'Tăng ca' },
  { key: 'late_early', icon: 'ri-error-warning-line', label: 'Trễ / Sớm' },
  { key: 'notifications', icon: 'ri-notification-3-line', label: 'Thông báo' },
  { key: 'settings', icon: 'ri-settings-3-line', label: 'Cài đặt' },
];

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLabel = tabs.find((t) => t.key === activeTab)?.label || '';

  const SidebarNav = () => (
    <>
      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-background-200/70">
        <Link to="/dashboard" className="flex items-center gap-2.5 cursor-pointer group">
          <span className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="ri-shield-check-line text-lg text-white"></i>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold text-foreground-950 whitespace-nowrap">Admin Panel</p>
            <p className="text-[11px] text-foreground-500 truncate">{user?.name}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-900'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                isActive ? 'bg-primary-500 text-white' : 'bg-background-100 text-foreground-500'
              }`}>
                <i className={tab.icon}></i>
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-background-200/70">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line"></i>
          <span>Về Dashboard</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="lg:flex lg:h-[calc(100vh-0px)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:min-h-screen lg:border-r lg:border-background-200/70 lg:bg-background-50 lg:flex-shrink-0">
        <SidebarNav />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer">
              <i className="ri-arrow-left-line text-foreground-600"></i>
            </Link>
            <div>
              <h1 className="text-lg font-heading font-bold text-foreground-950">Quản trị hệ thống</h1>
              <p className="text-xs text-foreground-500">{user?.name} · {user?.position}</p>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex items-center gap-1 bg-background-100 rounded-full p-1 mb-5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-background-50 text-foreground-950'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <i className={`${tab.icon} text-sm`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-background-200/70 bg-background-50 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-heading font-bold text-foreground-950">{activeLabel}</h1>
            <p className="text-xs text-foreground-500">{user?.name} · {user?.position}</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs text-foreground-500 hover:text-foreground-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-background-100 cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Content area */}
        <div className="px-4 lg:px-8 py-4 lg:py-6 page-enter">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'departments' && <DepartmentsTab />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'leaves' && <LeavesTab />}
          {activeTab === 'overtime' && <OvertimeTab />}
          {activeTab === 'late_early' && <LateEarlyTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState(mockSystemSettings);
  const [saved, setSaved] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState<string | null>(null);
  const [newDeptId, setNewDeptId] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateDeptHours = (deptId: string, field: 'startTime' | 'endTime', value: string) => {
    setSettings((prev) => ({
      ...prev,
      departmentWorkHours: prev.departmentWorkHours.map((d) =>
        d.departmentId === deptId ? { ...d, [field]: value } : d,
      ),
    }));
  };

  const availableDepartments = mockDepartments.filter(
    (d) => !settings.departmentWorkHours.some((h) => h.departmentId === d.id),
  );

  const addDeptWorkHour = () => {
    if (!newDeptId) return;
    const dept = mockDepartments.find((d) => d.id === newDeptId);
    if (!dept) return;
    const newEntry = {
      departmentId: dept.id,
      departmentName: dept.name,
      startTime: settings.workStartTime,
      endTime: settings.workEndTime,
    };
    setSettings((prev) => ({
      ...prev,
      departmentWorkHours: [...prev.departmentWorkHours, newEntry],
    }));
    setNewDeptId('');
    setShowAddDeptModal(false);
  };

  const deleteDeptWorkHour = (deptId: string) => {
    setSettings((prev) => ({
      ...prev,
      departmentWorkHours: prev.departmentWorkHours.filter((d) => d.departmentId !== deptId),
    }));
    setDeleteDeptConfirm(null);
  };

  const resetDeptWorkHour = (deptId: string) => {
    setSettings((prev) => ({
      ...prev,
      departmentWorkHours: prev.departmentWorkHours.map((d) =>
        d.departmentId === deptId
          ? { ...d, startTime: settings.workStartTime, endTime: settings.workEndTime }
          : d,
      ),
    }));
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors";
  const labelClass = "text-xs font-medium text-foreground-600 mb-1.5 block";
  const sectionClass = "bg-background-50 border border-background-200/70 rounded-xl p-4 lg:p-5";

  const getTotalHours = (start: string, end: string) => {
    const s = new Date(`2000-01-01T${start}`);
    const e = new Date(`2000-01-01T${end}`);
    return ((e.getTime() - s.getTime()) / (1000 * 60 * 60)).toFixed(1);
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Settings grid - 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Company info */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <i className="ri-building-line text-sm text-primary-500"></i>
            </span>
            <h3 className="text-sm font-heading font-semibold text-foreground-950">Thông tin công ty</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Tên công ty</label>
              <input type="text" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Địa chỉ</label>
              <input type="text" value={settings.companyAddress} onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Điện thoại</label>
                <input type="text" value={settings.companyPhone} onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={settings.companyEmail} onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Work schedule */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-sm text-accent-600"></i>
            </span>
            <h3 className="text-sm font-heading font-semibold text-foreground-950">Giờ làm việc mặc định</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Giờ vào</label>
                <input type="time" value={settings.workStartTime} onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Giờ về</label>
                <input type="time" value={settings.workEndTime} onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Ngày làm việc</label>
              <div className="flex flex-wrap gap-2">
                {settings.workDays.map((day) => (
                  <span key={day} className="text-xs bg-accent-100 text-accent-700 px-2.5 py-1 rounded-full">{day}</span>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Số phút đi trễ tối đa</label>
              <input type="number" value={settings.maxLateMinutes} onChange={(e) => setSettings({ ...settings, maxLateMinutes: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Department work hours */}
        <div className={`${sectionClass} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <i className="ri-building-2-line text-sm text-primary-500"></i>
              </span>
              <div>
                <h3 className="text-sm font-heading font-semibold text-foreground-950">Giờ làm việc theo bộ phận</h3>
                <p className="text-xs text-foreground-500 mt-0.5">{settings.departmentWorkHours.length} bộ phận đã cấu hình</p>
              </div>
            </div>
            {availableDepartments.length > 0 && (
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="h-9 px-3 bg-primary-500 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs font-medium hover:bg-primary-600 transition-colors"
              >
                <i className="ri-add-line"></i>
                <span>Thêm bộ phận</span>
              </button>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-hidden rounded-lg border border-background-200/70">
            <table className="w-full">
              <thead>
                <tr className="bg-background-100/50 border-b border-background-200/70">
                  <th className="text-left text-xs font-semibold text-foreground-600 px-5 py-3">Phòng ban</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-5 py-3">Giờ bắt đầu</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-5 py-3">Giờ kết thúc</th>
                  <th className="text-left text-xs font-semibold text-foreground-600 px-5 py-3">Tổng giờ</th>
                  <th className="text-right text-xs font-semibold text-foreground-600 px-5 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {settings.departmentWorkHours.map((dept) => {
                  const hours = getTotalHours(dept.startTime, dept.endTime);
                  const isDefault = dept.startTime === settings.workStartTime && dept.endTime === settings.workEndTime;
                  return (
                    <tr key={dept.departmentId} className="border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="ri-building-2-line text-sm text-accent-600"></i>
                          </span>
                          <div>
                            <span className="text-sm font-medium text-foreground-950">{dept.departmentName}</span>
                            {!isDefault && (
                              <span className="ml-2 text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full">Khác mặc định</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={dept.startTime}
                          onChange={(e) => updateDeptHours(dept.departmentId, 'startTime', e.target.value)}
                          className="h-9 px-2 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="time"
                          value={dept.endTime}
                          onChange={(e) => updateDeptHours(dept.departmentId, 'endTime', e.target.value)}
                          className="h-9 px-2 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-foreground-600">{hours} giờ</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!isDefault && (
                            <button
                              onClick={() => resetDeptWorkHour(dept.departmentId)}
                              title="Reset về giờ mặc định"
                              className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-secondary-100 transition-colors"
                            >
                              <i className="ri-restart-line text-sm text-foreground-500"></i>
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteDeptConfirm(dept.departmentId)}
                            title="Xóa cấu hình"
                            className="w-8 h-8 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                          >
                            <i className="ri-delete-bin-line text-sm text-foreground-500"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {settings.departmentWorkHours.length === 0 && (
              <div className="text-center py-10 text-sm text-foreground-400">
                <i className="ri-building-2-line text-2xl block mb-2"></i>
                Chưa có bộ phận nào được cấu hình giờ làm việc riêng
              </div>
            )}
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden space-y-3">
            {settings.departmentWorkHours.map((dept) => {
              const hours = getTotalHours(dept.startTime, dept.endTime);
              const isDefault = dept.startTime === settings.workStartTime && dept.endTime === settings.workEndTime;
              return (
                <div key={dept.departmentId} className="p-3 rounded-lg border border-background-200/70 bg-background-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-building-2-line text-sm text-accent-600"></i>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground-950">{dept.departmentName}</p>
                        <p className="text-xs text-foreground-500">{hours} giờ/ngày {!isDefault && '· Khác mặc định'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isDefault && (
                        <button
                          onClick={() => resetDeptWorkHour(dept.departmentId)}
                          className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-secondary-100 transition-colors"
                        >
                          <i className="ri-restart-line text-xs text-foreground-500"></i>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteDeptConfirm(dept.departmentId)}
                        className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <i className="ri-delete-bin-line text-xs text-foreground-500"></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-foreground-500 mb-1 block">Bắt đầu</label>
                      <input
                        type="time"
                        value={dept.startTime}
                        onChange={(e) => updateDeptHours(dept.departmentId, 'startTime', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                      />
                    </div>
                    <span className="text-xs text-foreground-400 pt-4">-</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-foreground-500 mb-1 block">Kết thúc</label>
                      <input
                        type="time"
                        value={dept.endTime}
                        onChange={(e) => updateDeptHours(dept.departmentId, 'endTime', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {settings.departmentWorkHours.length === 0 && (
              <div className="text-center py-8 text-sm text-foreground-400">
                <i className="ri-building-2-line text-2xl block mb-2"></i>
                Chưa có bộ phận nào được cấu hình giờ làm việc riêng
              </div>
            )}
          </div>
        </div>

        {/* Overtime rates */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
              <i className="ri-increase-decrease-line text-sm text-secondary-600"></i>
            </span>
            <h3 className="text-sm font-heading font-semibold text-foreground-950">Hệ số tăng ca</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Ngày thường</label>
              <input type="number" step="0.1" value={settings.overtimeRate} onChange={(e) => setSettings({ ...settings, overtimeRate: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cuối tuần</label>
              <input type="number" step="0.1" value={settings.overtimeWeekendRate} onChange={(e) => setSettings({ ...settings, overtimeWeekendRate: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ngày lễ</label>
              <input type="number" step="0.1" value={settings.overtimeHolidayRate} onChange={(e) => setSettings({ ...settings, overtimeHolidayRate: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Leave settings */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-check-line text-sm text-accent-600"></i>
            </span>
            <h3 className="text-sm font-heading font-semibold text-foreground-950">Chế độ nghỉ phép</h3>
          </div>
          <div>
            <label className={labelClass}>Số ngày phép năm mặc định</label>
            <input type="number" value={settings.annualLeaveDefault} onChange={(e) => setSettings({ ...settings, annualLeaveDefault: Number(e.target.value) })} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-8 h-11 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-all duration-200 ${
            saved ? 'bg-accent-500 text-white' : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <i className="ri-check-line"></i>
              Đã lưu thành công
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <i className="ri-save-line"></i>
              Lưu cài đặt
            </span>
          )}
        </button>
      </div>

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowAddDeptModal(false); setNewDeptId(''); }}></div>
          <div className="relative bg-background-50 rounded-2xl w-[90%] max-w-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <i className="ri-add-line text-sm text-primary-500"></i>
              </span>
              <h3 className="text-sm font-heading font-semibold text-foreground-950">Thêm bộ phận mới</h3>
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground-600 mb-1.5 block">Chọn phòng ban</label>
              <select
                value={newDeptId}
                onChange={(e) => setNewDeptId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="">-- Chọn phòng ban --</option>
                {availableDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {availableDepartments.length === 0 && (
                <p className="text-xs text-foreground-500 mt-2">Tất cả phòng ban đã được cấu hình.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowAddDeptModal(false); setNewDeptId(''); }}
                className="flex-1 h-10 rounded-lg border border-background-200/70 text-sm font-medium text-foreground-600 cursor-pointer whitespace-nowrap hover:bg-background-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={addDeptWorkHour}
                disabled={!newDeptId}
                className="flex-1 h-10 rounded-lg bg-primary-500 text-white text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteDeptConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteDeptConfirm(null)}></div>
          <div className="relative bg-background-50 rounded-2xl w-[90%] max-w-sm p-5">
            <div className="text-center mb-4">
              <span className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
              </span>
              <h3 className="text-base font-heading font-semibold text-foreground-950">Xác nhận xóa</h3>
              <p className="text-sm text-foreground-500 mt-1">
                Bộ phận này sẽ quay về sử dụng giờ làm việc mặc định chung. Bạn có chắc muốn xóa cấu hình riêng?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleteDeptConfirm(null)} className="flex-1 h-10 rounded-lg border border-background-200/70 text-sm font-medium text-foreground-600 cursor-pointer whitespace-nowrap hover:bg-background-100 transition-colors">Hủy</button>
              <button onClick={() => deleteDeptWorkHour(deleteDeptConfirm)} className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-red-600 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}