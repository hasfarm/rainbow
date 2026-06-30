export type OvertimeStatus = 'pending' | 'approved' | 'rejected';
export type OvertimeType = 'regular' | 'weekend' | 'holiday';

export interface OvertimeRecord {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  overtimeType: OvertimeType;
  reason: string;
  status: OvertimeStatus;
  approverId: string | null;
  approverName: string | null;
  approver2Id: string | null;
  approver2Name: string | null;
  createdAt: string;
  rejectReason: string | null;
}

export const overtimeTypeLabels: Record<OvertimeType, string> = {
  regular: 'Ngày thường',
  weekend: 'Cuối tuần',
  holiday: 'Ngày lễ',
};

export const overtimeTypeColors: Record<OvertimeType, string> = {
  regular: 'bg-secondary-100 text-secondary-700',
  weekend: 'bg-accent-100 text-accent-700',
  holiday: 'bg-primary-100 text-primary-700',
};

export const overtimeTypeIcons: Record<OvertimeType, string> = {
  regular: 'ri-calendar-line',
  weekend: 'ri-calendar-2-line',
  holiday: 'ri-calendar-event-line',
};

export const overtimeStatusLabels: Record<OvertimeStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export const overtimeStatusColors: Record<OvertimeStatus, string> = {
  pending: 'bg-secondary-100 text-secondary-700',
  approved: 'bg-accent-200 text-accent-800',
  rejected: 'bg-primary-100 text-primary-700',
};

export const overtimeStatusIcons: Record<OvertimeStatus, string> = {
  pending: 'ri-hourglass-line',
  approved: 'ri-verified-badge-line',
  rejected: 'ri-close-circle-line',
};

export const mockOvertimes: OvertimeRecord[] = [
  {
    id: 'OT-001',
    userId: 'NV001',
    date: '2026-07-02',
    startTime: '17:30',
    endTime: '21:00',
    hours: 3.5,
    overtimeType: 'regular',
    reason: 'Hoàn thành báo cáo doanh số tháng 6, cần tổng hợp số liệu từ các chi nhánh và lập bảng phân tích.',
    status: 'approved',
    approverId: 'NV002',
    approverName: 'Trần Thị Bình',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-06-28T14:30:00',
    rejectReason: null,
  },
  {
    id: 'OT-002',
    userId: 'NV001',
    date: '2026-07-05',
    startTime: '17:30',
    endTime: '19:30',
    hours: 2,
    overtimeType: 'regular',
    reason: 'Hỗ trợ team marketing chạy chiến dịch khuyến mãi mới, cần setup và kiểm tra hệ thống trước ngày ra mắt.',
    status: 'pending',
    approverId: null,
    approverName: null,
    approver2Id: null,
    approver2Name: null,
    createdAt: '2026-06-29T08:15:00',
    rejectReason: null,
  },
  {
    id: 'OT-003',
    userId: 'NV001',
    date: '2026-06-25',
    startTime: '17:30',
    endTime: '22:00',
    hours: 4.5,
    overtimeType: 'regular',
    reason: 'Kiểm kê hàng tồn kho cuối tháng, số lượng lớn cần nhiều thời gian để đối chiếu chính xác.',
    status: 'approved',
    approverId: 'NV002',
    approverName: 'Trần Thị Bình',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-06-22T10:00:00',
    rejectReason: null,
  },
  {
    id: 'OT-004',
    userId: 'NV001',
    date: '2026-06-18',
    startTime: '08:00',
    endTime: '12:00',
    hours: 4,
    overtimeType: 'weekend',
    reason: 'Tăng ca sáng Chủ nhật để tiếp đối tác nước ngoài tham quan nhà máy và ký kết hợp đồng mới.',
    status: 'rejected',
    approverId: 'NV006',
    approverName: 'Ngô Thị Phương',
    approver2Id: null,
    approver2Name: null,
    createdAt: '2026-06-15T16:45:00',
    rejectReason: 'Khối lượng công việc có thể hoàn thành trong giờ hành chính. Đề nghị sắp xếp thời gian hợp lý hơn.',
  },
  {
    id: 'OT-005',
    userId: 'NV001',
    date: '2026-06-10',
    startTime: '17:30',
    endTime: '20:00',
    hours: 2.5,
    overtimeType: 'regular',
    reason: 'Xử lý đơn hàng gấp cho khách VIP, cần đóng gói và vận chuyển ngay trong tối.',
    status: 'approved',
    approverId: 'NV002',
    approverName: 'Trần Thị Bình',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-06-09T11:30:00',
    rejectReason: null,
  },
  {
    id: 'OT-006',
    userId: 'NV001',
    date: '2026-07-08',
    startTime: '17:30',
    endTime: '21:30',
    hours: 4,
    overtimeType: 'regular',
    reason: 'Chuẩn bị tài liệu và slide thuyết trình cho buổi họp cổ đông quý 2, cần số liệu chính xác từ các phòng ban.',
    status: 'pending',
    approverId: null,
    approverName: null,
    approver2Id: null,
    approver2Name: null,
    createdAt: '2026-06-30T09:00:00',
    rejectReason: null,
  },
  {
    id: 'OT-007',
    userId: 'NV001',
    date: '2026-06-05',
    startTime: '17:30',
    endTime: '19:00',
    hours: 1.5,
    overtimeType: 'regular',
    reason: 'Họp online với đối tác Nhật Bản do chênh lệch múi giờ.',
    status: 'approved',
    approverId: 'NV002',
    approverName: 'Trần Thị Bình',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-06-02T13:20:00',
    rejectReason: null,
  },
  {
    id: 'OT-008',
    userId: 'NV001',
    date: '2026-06-15',
    startTime: '13:00',
    endTime: '17:00',
    hours: 4,
    overtimeType: 'holiday',
    reason: 'Tăng ca ngày lễ Giỗ Tổ Hùng Vương để hoàn thành đơn hàng xuất khẩu gấp cho đối tác Hàn Quốc.',
    status: 'approved',
    approverId: 'NV002',
    approverName: 'Trần Thị Bình',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-06-10T08:00:00',
    rejectReason: null,
  },
  {
    id: 'OT-009',
    userId: 'NV003',
    date: '2026-07-03',
    startTime: '16:30',
    endTime: '20:30',
    hours: 4,
    overtimeType: 'regular',
    reason: 'Nhập hàng container mới về kho số 3, cần kiểm đếm và sắp xếp lên kệ ngay trong ngày để kịp xuất hàng sáng mai.',
    status: 'approved',
    approverId: 'NV009',
    approverName: 'Mai Thanh Tùng',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-07-01T15:00:00',
    rejectReason: null,
  },
  {
    id: 'OT-010',
    userId: 'NV003',
    date: '2026-07-06',
    startTime: '16:30',
    endTime: '19:00',
    hours: 2.5,
    overtimeType: 'regular',
    reason: 'Kiểm kê tồn kho định kỳ quý 2, cần đối chiếu số liệu thực tế với hệ thống trước kỳ báo cáo tài chính.',
    status: 'pending',
    approverId: null,
    approverName: null,
    approver2Id: null,
    approver2Name: null,
    createdAt: '2026-07-02T09:00:00',
    rejectReason: null,
  },
  {
    id: 'OT-011',
    userId: 'NV003',
    date: '2026-06-28',
    startTime: '07:00',
    endTime: '11:30',
    hours: 4.5,
    overtimeType: 'weekend',
    reason: 'Tăng ca Chủ nhật để sắp xếp lại toàn bộ kho số 1 và kho số 2 sau đợt kiểm kê, chuẩn bị cho tuần cao điểm.',
    status: 'approved',
    approverId: 'NV009',
    approverName: 'Mai Thanh Tùng',
    approver2Id: 'NV006',
    approver2Name: 'Ngô Thị Phương',
    createdAt: '2026-06-25T16:30:00',
    rejectReason: null,
  },
];