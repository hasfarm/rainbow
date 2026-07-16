import { mockUsers, roleLabels, statusLabels, employmentTypeLabels, calcSeniority, type User, type UserRole, type Gender, type EmployeeStatus, type EmploymentType } from '@/mocks/users';
import { mockDepartments } from '@/mocks/admin';
import { useState, useRef } from 'react';
import { exportToExcel, importFromExcel } from '@/utils/excel';

const departmentOptions = ['Tất cả', ...mockDepartments.map((d) => d.name)];
const roleOptions: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả vai trò' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'accountant', label: 'Kế toán trưởng' },
  { value: 'accountant_specialist', label: 'Chuyên viên KT' },
  { value: 'hr', label: 'Nhân sự' },
  { value: 'deputy_warehouse', label: 'Phó kho' },
  { value: 'warehouse_staff', label: 'Nhân viên kho' },
  { value: 'warehouse_manager', label: 'Quản lý kho' },
];
const statusOptions: { value: EmployeeStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang làm' },
  { value: 'inactive', label: 'Đã nghỉ' },
];
const empTypeOptions: { value: EmploymentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả phân loại' },
  { value: 'official', label: 'Chính thức' },
  { value: 'probation', label: 'Thử việc' },
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  role: 'staff' as UserRole,
  password: '',
  gender: 'Nam' as Gender,
  birthDate: '',
  status: 'active' as EmployeeStatus,
  employmentType: 'official' as EmploymentType,
  title: '',
  startDate: '',
  officialDate: '',
  specialization: '',
  jobPosition: '',
};

export function UsersTab() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('Tất cả');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [empTypeFilter, setEmpTypeFilter] = useState<EmploymentType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ ...emptyForm });

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'Tất cả' || u.department === deptFilter;
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchEmpType = empTypeFilter === 'all' || u.employmentType === empTypeFilter;
    return matchSearch && matchDept && matchRole && matchStatus && matchEmpType;
  });

  const handleExport = () => {
    const exportData = filtered.map((u) => ({
      'Mã NV': u.id,
      'Họ tên': u.name,
      'Giới tính': u.gender,
      'Ngày sinh': u.birthDate,
      'Email': u.email,
      'SĐT': u.phone,
      'Phòng ban': u.department,
      'Chức danh': u.title,
      'Vị trí công việc': u.jobPosition,
      'Vai trò': roleLabels[u.role],
      'Trạng thái': statusLabels[u.status],
      'Phân loại': employmentTypeLabels[u.employmentType],
      'Ngày bắt đầu': u.startDate,
      'Ngày chính thức': u.officialDate,
      'Khu vực / Chuyên môn': u.specialization,
      'Thâm niên': calcSeniority(u.startDate, '2026-07-15'),
      'Phép năm': u.annualLeave,
    }));
    exportToExcel(exportData, `danh-sach-nhan-vien-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file);
      const newUsers: User[] = imported.map((row: Record<string, unknown>, idx: number) => {
        const id = String(row['Mã NV'] || row['id'] || `NV-IMP-${idx}`);
        return {
          id,
          name: String(row['Họ tên'] || row['name'] || ''),
          email: String(row['Email'] || row['email'] || ''),
          password: '123456',
          role: 'staff' as UserRole,
          department: String(row['Phòng ban'] || row['department'] || ''),
          position: String(row['Vị trí công việc'] || row['jobPosition'] || row['position'] || ''),
          avatar: '',
          annualLeave: Number(row['Phép năm'] || row['annualLeave'] || 12),
          phone: String(row['SĐT'] || row['phone'] || ''),
          joinDate: String(row['Ngày bắt đầu'] || row['startDate'] || row['joinDate'] || new Date().toISOString().split('T')[0]),
          gender: (String(row['Giới tính'] || row['gender'] || 'Nam') === 'Nữ' ? 'Nữ' : 'Nam') as Gender,
          birthDate: String(row['Ngày sinh'] || row['birthDate'] || ''),
          status: (String(row['Trạng thái'] || row['status'] || 'active') === 'inactive' ? 'inactive' : 'active') as EmployeeStatus,
          employmentType: (String(row['Phân loại'] || row['employmentType'] || 'official') === 'probation' ? 'probation' : 'official') as EmploymentType,
          title: String(row['Chức danh'] || row['title'] || ''),
          startDate: String(row['Ngày bắt đầu'] || row['startDate'] || new Date().toISOString().split('T')[0]),
          officialDate: String(row['Ngày chính thức'] || row['officialDate'] || ''),
          specialization: String(row['Khu vực / Chuyên môn'] || row['specialization'] || ''),
          jobPosition: String(row['Vị trí công việc'] || row['jobPosition'] || ''),
        };
      }).filter((u) => u.name && u.email);
      if (newUsers.length === 0) {
        setImportMsg({ type: 'error', text: 'File không có dữ liệu hợp lệ. Cần có ít nhất Họ tên và Email.' });
        return;
      }
      setUsers((prev) => [...newUsers, ...prev]);
      setImportMsg({ type: 'success', text: `Đã import thành công ${newUsers.length} nhân viên.` });
    } catch {
      setImportMsg({ type: 'error', text: 'Lỗi đọc file. Vui lòng kiểm tra định dạng Excel.' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportMsg(null), 3000);
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingUser(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      position: user.position,
      role: user.role,
      password: '',
      gender: user.gender,
      birthDate: user.birthDate,
      status: user.status,
      employmentType: user.employmentType,
      title: user.title,
      startDate: user.startDate,
      officialDate: user.officialDate,
      specialization: user.specialization,
      jobPosition: user.jobPosition,
    });
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email || !form.department || !form.position) return;
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, ...form, password: form.password || u.password } : u,
        ),
      );
    } else {
      const newId = `NV${String(users.length + 1).padStart(3, '0')}`;
      const newUser: User = {
        id: newId,
        name: form.name,
        email: form.email,
        password: form.password || '123456',
        role: form.role,
        department: form.department,
        position: form.position,
        avatar: '',
        annualLeave: 12,
        phone: form.phone,
        joinDate: form.startDate || new Date().toISOString().split('T')[0],
        gender: form.gender,
        birthDate: form.birthDate,
        status: form.status,
        employmentType: form.employmentType,
        title: form.title,
        startDate: form.startDate,
        officialDate: form.officialDate,
        specialization: form.specialization,
        jobPosition: form.jobPosition,
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const selectClass = "h-8 px-2.5 rounded-full border border-background-200/70 bg-background-50 text-xs text-foreground-600 focus:outline-none focus:border-primary-400 cursor-pointer";

  const thClass = "text-left text-xs font-semibold text-foreground-600 px-3 py-2.5 whitespace-nowrap";

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Search & Filters bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-400"></i>
          <input
            type="text"
            placeholder="Tìm theo tên, mã NV, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={selectClass}>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EmployeeStatus | 'all')} className={selectClass}>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={empTypeFilter} onChange={(e) => setEmpTypeFilter(e.target.value as EmploymentType | 'all')} className={selectClass}>
            {empTypeOptions.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')} className={selectClass}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3 rounded-lg border border-secondary-200/70 bg-secondary-100 text-secondary-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-secondary-200 transition-colors flex items-center gap-1.5"
          >
            <i className="ri-upload-line"></i>
            <span>Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <button
            onClick={handleExport}
            className="h-10 px-3 rounded-lg border border-accent-200/70 bg-accent-100 text-accent-700 text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-accent-200 transition-colors flex items-center gap-1.5"
          >
            <i className="ri-download-line"></i>
            <span>Export</span>
          </button>
          <button
            onClick={openAdd}
            className="h-10 px-4 bg-primary-500 text-white rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <i className="ri-add-line"></i>
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Import toast */}
      {importMsg && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2 ${importMsg.type === 'success' ? 'text-accent-700 bg-accent-100' : 'text-red-700 bg-red-100'}`}>
          <i className={importMsg.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
          {importMsg.text}
        </div>
      )}

      {/* Count badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground-500">{filtered.length} nhân viên</span>
        {filtered.length < users.length && (
          <span className="text-xs text-foreground-400">(lọc từ {users.length})</span>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-background-200/70 bg-background-100/50">
                <th className={`${thClass} sticky left-0 z-10 bg-background-100/90 backdrop-blur-sm`}>Nhân viên</th>
                <th className={thClass}>Phòng ban</th>
                <th className={thClass}>Chức danh</th>
                <th className={thClass}>Vị trí</th>
                <th className={thClass}>Trạng thái</th>
                <th className={thClass}>Phân loại</th>
                <th className={thClass}>Thâm niên</th>
                <th className={`${thClass} hidden 2xl:table-cell`}>Giới tính</th>
                <th className={`${thClass} hidden 2xl:table-cell`}>Ngày sinh</th>
                <th className={`${thClass} hidden 2xl:table-cell`}>Email</th>
                <th className={`${thClass} hidden 2xl:table-cell`}>Ngày BĐ</th>
                <th className={`${thClass} hidden 2xl:table-cell`}>Ngày CT</th>
                <th className={`${thClass} hidden 2xl:table-cell`}>Khu vực / CM</th>
                <th className="text-right text-xs font-semibold text-foreground-600 px-3 py-2.5 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const seniority = calcSeniority(user.startDate, '2026-07-15');
                const age = user.birthDate
                  ? new Date('2026-07-15').getFullYear() - new Date(user.birthDate).getFullYear()
                  : null;
                return (
                  <tr key={user.id} className="border-b border-background-200/70 last:border-0 hover:bg-background-100/30 transition-colors">
                    {/* Nhân viên */}
                    <td className="px-3 py-2.5 sticky left-0 z-10 bg-inherit backdrop-blur-sm">
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <i className="ri-user-line text-sm text-primary-500"></i>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground-950 truncate">{user.name}</p>
                          <p className="text-[10px] text-foreground-400 truncate">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Phòng ban */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full whitespace-nowrap">{user.department}</span>
                    </td>
                    {/* Chức danh */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-foreground-700 whitespace-nowrap">{user.title || user.position}</span>
                    </td>
                    {/* Vị trí */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-foreground-600 whitespace-nowrap">{user.jobPosition || user.position}</span>
                    </td>
                    {/* Trạng thái */}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${user.status === 'active' ? 'bg-accent-100 text-accent-700' : 'bg-foreground-100 text-foreground-500'}`}>
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    {/* Phân loại */}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${user.employmentType === 'official' ? 'bg-secondary-100 text-secondary-700' : 'bg-foreground-100 text-foreground-600'}`}>
                        {employmentTypeLabels[user.employmentType]}
                      </span>
                    </td>
                    {/* Thâm niên */}
                    <td className="px-3 py-2.5">
                      <span className="text-xs text-foreground-600 whitespace-nowrap">{seniority}</span>
                    </td>
                    {/* Giới tính */}
                    <td className="px-3 py-2.5 hidden 2xl:table-cell">
                      <span className="text-xs text-foreground-600">{user.gender}</span>
                    </td>
                    {/* Ngày sinh */}
                    <td className="px-3 py-2.5 hidden 2xl:table-cell">
                      <span className="text-xs text-foreground-600 whitespace-nowrap">
                        {user.birthDate ? `${new Date(user.birthDate).toLocaleDateString('vi-VN')}${age !== null ? ` (${age}t)` : ''}` : '-'}
                      </span>
                    </td>
                    {/* Email */}
                    <td className="px-3 py-2.5 hidden 2xl:table-cell">
                      <span className="text-xs text-foreground-600">{user.email}</span>
                    </td>
                    {/* Ngày bắt đầu */}
                    <td className="px-3 py-2.5 hidden 2xl:table-cell">
                      <span className="text-xs text-foreground-600 whitespace-nowrap">{user.startDate ? new Date(user.startDate).toLocaleDateString('vi-VN') : '-'}</span>
                    </td>
                    {/* Ngày chính thức */}
                    <td className="px-3 py-2.5 hidden 2xl:table-cell">
                      <span className="text-xs text-foreground-600 whitespace-nowrap">{user.officialDate ? new Date(user.officialDate).toLocaleDateString('vi-VN') : '-'}</span>
                    </td>
                    {/* Khu vực / CM */}
                    <td className="px-3 py-2.5 hidden 2xl:table-cell">
                      <span className="text-xs text-foreground-600">{user.specialization || '-'}</span>
                    </td>
                    {/* Thao tác */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-accent-100 transition-colors"
                        >
                          <i className="ri-edit-line text-xs text-foreground-600"></i>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          <i className="ri-delete-bin-line text-xs text-foreground-600"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-foreground-400">
            <i className="ri-user-search-line text-2xl block mb-2"></i>
            Không tìm thấy nhân viên nào
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-2">
        {filtered.map((user) => {
          const seniority = calcSeniority(user.startDate, '2026-07-15');
          return (
            <div key={user.id} className="bg-background-50 border border-background-200/70 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <i className="ri-user-line text-lg text-primary-500"></i>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground-950">{user.name}</p>
                      <p className="text-[11px] text-foreground-500">{user.id} · {user.gender} · {user.birthDate ? `${new Date(user.birthDate).toLocaleDateString('vi-VN')}` : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] bg-accent-100 text-accent-700 px-1.5 py-0.5 rounded-full">{user.department}</span>
                    <span className="text-[10px] bg-secondary-100 text-secondary-700 px-1.5 py-0.5 rounded-full">{user.title || user.position}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${user.status === 'active' ? 'bg-accent-100 text-accent-700' : 'bg-foreground-100 text-foreground-500'}`}>
                      {statusLabels[user.status]}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${user.employmentType === 'official' ? 'bg-secondary-100 text-secondary-700' : 'bg-foreground-100 text-foreground-600'}`}>
                      {employmentTypeLabels[user.employmentType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-foreground-500">{seniority}</span>
                    {user.email && <span className="text-[10px] text-foreground-400">{user.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(user)}
                    className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-accent-100 transition-colors"
                  >
                    <i className="ri-edit-line text-xs text-foreground-600"></i>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user)}
                    className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    <i className="ri-delete-bin-line text-xs text-foreground-600"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-foreground-400">
            <i className="ri-user-search-line text-2xl block mb-2"></i>
            Không tìm thấy nhân viên nào
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowAddModal(false); resetForm(); }}></div>
          <div className="relative bg-background-50 rounded-t-2xl lg:rounded-2xl w-full lg:max-w-xl max-h-[85vh] overflow-y-auto p-5 lg:p-6">
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4">
              {editingUser ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
            </h3>
            <div className="space-y-3">
              {/* Row 1: Họ tên + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Họ tên *</label>
                  <input
                    type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Email *</label>
                  <input
                    type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="email@company.vn"
                  />
                </div>
              </div>

              {/* Row 2: Giới tính + Ngày sinh + SĐT */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Giới tính</label>
                  <select
                    value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Ngày sinh</label>
                  <input
                    type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">SĐT</label>
                  <input
                    type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="090xxx"
                  />
                </div>
              </div>

              {/* Row 3: Phòng ban + Chức danh + Vị trí */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Phòng ban *</label>
                  <select
                    value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    <option value="">-- Chọn --</option>
                    {mockDepartments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Chức danh</label>
                  <input
                    type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="Chuyên viên"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Vị trí công việc</label>
                  <input
                    type="text" value={form.jobPosition} onChange={(e) => setForm({ ...form, jobPosition: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="Nhân viên KD"
                  />
                </div>
              </div>

              {/* Row 4: Trạng thái + Phân loại + Vai trò */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Trạng thái</label>
                  <select
                    value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    <option value="active">Đang làm</option>
                    <option value="inactive">Đã nghỉ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Phân loại</label>
                  <select
                    value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    <option value="official">Chính thức</option>
                    <option value="probation">Thử việc</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Vai trò</label>
                  <select
                    value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 cursor-pointer"
                  >
                    {roleOptions.filter((r) => r.value !== 'all').map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Ngày bắt đầu + Ngày chính thức + Mật khẩu */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Ngày bắt đầu</label>
                  <input
                    type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Ngày chính thức</label>
                  <input
                    type="date" value={form.officialDate} onChange={(e) => setForm({ ...form, officialDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Mật khẩu</label>
                  <input
                    type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder={editingUser ? 'Giữ nguyên nếu trống' : 'Mặc định: 123456'}
                  />
                </div>
              </div>

              {/* Row 6: Khu vực / Chuyên môn + Chức vụ (legacy) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Khu vực / Chuyên môn</label>
                  <input
                    type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="B2B Sales"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground-600 mb-1 block">Chức vụ *</label>
                  <input
                    type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-background-200/70 bg-background-50 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                    placeholder="Nhân viên kinh doanh"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 h-10 rounded-lg border border-background-200/70 text-sm font-medium text-foreground-600 cursor-pointer whitespace-nowrap hover:bg-background-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-10 rounded-lg bg-primary-500 text-white text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-primary-600 transition-colors"
              >
                {editingUser ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)}></div>
          <div className="relative bg-background-50 rounded-2xl w-[90%] max-w-sm p-5">
            <div className="text-center mb-4">
              <span className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-error-warning-line text-xl text-red-500"></i>
              </span>
              <h3 className="text-base font-heading font-semibold text-foreground-950">Xác nhận xóa</h3>
              <p className="text-sm text-foreground-500 mt-1">
                Bạn có chắc muốn xóa nhân viên <strong>{deleteConfirm.name}</strong> ({deleteConfirm.id})?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 rounded-lg border border-background-200/70 text-sm font-medium text-foreground-600 cursor-pointer whitespace-nowrap hover:bg-background-100 transition-colors">Hủy</button>
              <button onClick={handleDelete} className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-red-600 transition-colors">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}