import { mockUsers } from './users';

export const mockDepartments = [
  {
    id: 'DEPT-01',
    name: 'Kinh Doanh',
    managerId: 'NV002',
    managerName: 'Trần Thị Bình',
    totalEmployees: 2,
    description: 'Phụ trách hoạt động kinh doanh, phát triển thị trường và chăm sóc khách hàng',
    createdAt: '2022-01-15',
  },
  {
    id: 'DEPT-02',
    name: 'Kho Vận',
    managerId: 'NV009',
    managerName: 'Mai Thanh Tùng',
    totalEmployees: 4,
    description: 'Quản lý kho hàng, xuất nhập tồn, vận chuyển và logistics',
    createdAt: '2022-01-15',
  },
  {
    id: 'DEPT-03',
    name: 'Nhân Sự',
    managerId: 'NV004',
    managerName: 'Phạm Thị Dung',
    totalEmployees: 1,
    description: 'Tuyển dụng, đào tạo, chấm công và các chế độ phúc lợi nhân viên',
    createdAt: '2022-03-01',
  },
  {
    id: 'DEPT-04',
    name: 'Kế Toán',
    managerId: 'NV005',
    managerName: 'Hoàng Văn Em',
    totalEmployees: 1,
    description: 'Quản lý tài chính, kế toán, thuế và báo cáo tài chính',
    createdAt: '2022-01-15',
  },
];

export const mockAdminStats = {
  totalEmployees: mockUsers.length,
  totalDepartments: mockDepartments.length,
  activeToday: 5,
  pendingApprovals: 8,
  monthlyPayroll: 156000000,
  newHiresThisMonth: 2,
};

export const mockSystemSettings = {
  companyName: 'Công ty TNHH ABC Việt Nam',
  companyAddress: 'Số 123, Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  companyPhone: '028 3838 3838',
  companyEmail: 'info@abc-company.vn',
  workStartTime: '08:00',
  workEndTime: '17:30',
  lunchBreakStart: '12:00',
  lunchBreakEnd: '13:00',
  workDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'],
  overtimeRate: 1.5,
  overtimeWeekendRate: 2.0,
  overtimeHolidayRate: 3.0,
  maxLateMinutes: 15,
  annualLeaveDefault: 12,
  departmentWorkHours: [
    { departmentId: 'DEPT-01', departmentName: 'Kinh Doanh', startTime: '08:00', endTime: '17:30' },
    { departmentId: 'DEPT-02', departmentName: 'Kho Vận', startTime: '07:00', endTime: '16:30' },
    { departmentId: 'DEPT-03', departmentName: 'Nhân Sự', startTime: '08:00', endTime: '17:30' },
    { departmentId: 'DEPT-04', departmentName: 'Kế Toán', startTime: '08:00', endTime: '17:30' },
  ],
};

export const mockAdminAuditLog = [
  { id: 'LOG-01', userId: 'NV001', userName: 'Nguyễn Văn An', action: 'Chấm công - Check-in', timestamp: '2026-07-01 08:05', ip: '192.168.1.100' },
  { id: 'LOG-02', userId: 'NV003', userName: 'Lê Văn Cường', action: 'Tạo đơn tăng ca', timestamp: '2026-06-30 16:30', ip: '192.168.1.105' },
  { id: 'LOG-03', userId: 'NV004', userName: 'Phạm Thị Dung', action: 'Duyệt đơn nghỉ phép', timestamp: '2026-06-30 15:00', ip: '192.168.1.102' },
  { id: 'LOG-04', userId: 'NV002', userName: 'Trần Thị Bình', action: 'Duyệt đơn tạm ứng', timestamp: '2026-06-30 14:20', ip: '192.168.1.101' },
  { id: 'LOG-05', userId: 'NV005', userName: 'Hoàng Văn Em', action: 'Xác nhận phiếu lương T6/2026', timestamp: '2026-06-30 10:00', ip: '192.168.1.103' },
  { id: 'LOG-06', userId: 'NV001', userName: 'Nguyễn Văn An', action: 'Check-out', timestamp: '2026-06-30 17:35', ip: '192.168.1.100' },
  { id: 'LOG-07', userId: 'NV003', userName: 'Lê Văn Cường', action: 'Cập nhật thông tin cá nhân', timestamp: '2026-06-29 11:15', ip: '192.168.1.105' },
  { id: 'LOG-08', userId: 'NV006', userName: 'Ngô Thị Phương', action: 'Duyệt phiếu tăng ca', timestamp: '2026-06-29 09:45', ip: '192.168.1.106' },
];