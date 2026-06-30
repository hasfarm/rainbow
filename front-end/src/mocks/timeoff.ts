export type TimeOffType = 'late_arrival' | 'early_departure' | 'women_policy';

export type TimeOffSubType = 'late' | 'early';

export type TimeOffStatus = 'pending' | 'approved' | 'rejected';

export interface TimeOffRecord {
  id: string;
  userId: string;
  type: TimeOffType;
  subType?: TimeOffSubType;
  date: string;
  expectedTime: string | null;
  reason: string;
  status: TimeOffStatus;
  createdAt: string;
  approvedBy: string | null;
  rejectedReason: string | null;
  approver: string | null;
}

export const timeOffTypeLabels: Record<TimeOffType, string> = {
  late_arrival: 'Đi trễ',
  early_departure: 'Về sớm',
  women_policy: 'Chế độ phụ nữ',
};

export const timeOffTypeIcons: Record<TimeOffType, string> = {
  late_arrival: 'ri-run-line',
  early_departure: 'ri-walk-line',
  women_policy: 'ri-women-line',
};

export const timeOffTypeColors: Record<TimeOffType, string> = {
  late_arrival: 'bg-secondary-100 text-secondary-700',
  early_departure: 'bg-accent-100 text-accent-700',
  women_policy: 'bg-primary-100 text-primary-700',
};

export const timeOffStatusLabels: Record<TimeOffStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export const timeOffStatusColors: Record<TimeOffStatus, string> = {
  pending: 'bg-secondary-100 text-secondary-700',
  approved: 'bg-accent-100 text-accent-700',
  rejected: 'bg-primary-100 text-primary-700',
};

export const timeOffSubTypeLabels: Record<TimeOffSubType, string> = {
  late: 'Đi trễ',
  early: 'Về sớm',
};

export const timeOffSubTypeIcons: Record<TimeOffSubType, string> = {
  late: 'ri-login-box-line',
  early: 'ri-logout-box-line',
};

export const mockTimeOffs: TimeOffRecord[] = [
  {
    id: 'TO-001',
    userId: 'NV001',
    type: 'late_arrival',
    date: '2026-07-02',
    expectedTime: '09:00',
    reason: 'Sáng có hẹn khám sức khỏe định kỳ tại bệnh viện, dự kiến vào làm trễ 1 tiếng. Đã sắp xếp công việc buổi sáng.',
    status: 'approved',
    createdAt: '2026-07-01T17:30:00',
    approvedBy: 'Trần Thị Bình',
    rejectedReason: null,
    approver: 'NV002',
  },
  {
    id: 'TO-002',
    userId: 'NV001',
    type: 'early_departure',
    date: '2026-07-05',
    expectedTime: '15:30',
    reason: 'Chiều có việc gia đình cần về sớm, công việc trong ngày đã hoàn tất và bàn giao cho đồng nghiệp.',
    status: 'pending',
    createdAt: '2026-07-04T08:15:00',
    approvedBy: null,
    rejectedReason: null,
    approver: 'NV002',
  },
  {
    id: 'TO-003',
    userId: 'NV001',
    type: 'women_policy',
    subType: 'late',
    date: '2026-07-01',
    expectedTime: '09:30',
    reason: 'Xin đi trễ theo chế độ phụ nữ, sáng nay cảm thấy không được khỏe, dự kiến vào làm lúc 9h30.',
    status: 'approved',
    createdAt: '2026-06-29T07:45:00',
    approvedBy: 'Trần Thị Bình',
    rejectedReason: null,
    approver: 'NV002',
  },
  {
    id: 'TO-004',
    userId: 'NV003',
    type: 'late_arrival',
    date: '2026-07-03',
    expectedTime: '08:30',
    reason: 'Xe máy bị hỏng giữa đường, phải dắt đi sửa. Dự kiến vào làm trễ khoảng 30 phút.',
    status: 'approved',
    createdAt: '2026-07-03T07:10:00',
    approvedBy: 'Mai Thanh Tùng',
    rejectedReason: null,
    approver: 'NV009',
  },
  {
    id: 'TO-005',
    userId: 'NV003',
    type: 'early_departure',
    date: '2026-07-06',
    expectedTime: '15:00',
    reason: 'Có việc gia đình đột xuất, cần về sớm hơn 1 tiếng. Công việc trong ca đã hoàn tất.',
    status: 'pending',
    createdAt: '2026-07-05T14:00:00',
    approvedBy: null,
    rejectedReason: null,
    approver: 'NV009',
  },
  {
    id: 'TO-006',
    userId: 'NV003',
    type: 'late_arrival',
    date: '2026-06-25',
    expectedTime: '10:00',
    reason: 'Sáng đi làm thủ tục hành chính tại phường, dự kiến vào làm muộn 2 tiếng.',
    status: 'rejected',
    createdAt: '2026-06-24T16:00:00',
    approvedBy: 'Mai Thanh Tùng',
    rejectedReason: 'Ngày 25/6 kho đang kiểm kê cuối tháng cần đủ nhân sự từ sáng sớm. Vui lòng sắp xếp việc cá nhân vào ngày khác.',
    approver: 'NV009',
  },
  {
    id: 'TO-007',
    userId: 'NV003',
    type: 'women_policy',
    subType: 'early',
    date: '2026-07-10',
    expectedTime: '15:00',
    reason: 'Xin về sớm theo chế độ phụ nữ do sức khỏe không đảm bảo, dự kiến về lúc 15h00.',
    status: 'approved',
    createdAt: '2026-07-09T06:30:00',
    approvedBy: 'Mai Thanh Tùng',
    rejectedReason: null,
    approver: 'NV009',
  },
  {
    id: 'TO-008',
    userId: 'NV003',
    type: 'late_arrival',
    date: '2026-07-08',
    expectedTime: '08:45',
    reason: 'Sáng đưa con đi khám bệnh, dự kiến vào trễ 45 phút. Có nhờ Hải hỗ trợ nhận hàng đầu giờ.',
    status: 'pending',
    createdAt: '2026-07-07T20:00:00',
    approvedBy: null,
    rejectedReason: null,
    approver: 'NV009',
  },
];