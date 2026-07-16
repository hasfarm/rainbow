export type LeaveType =
  | 'annual_leave'
  | 'unpaid_leave'
  | 'late_arrival'
  | 'early_departure'
  | 'women_policy'
  | 'marriage_leave'
  | 'bereavement_leave'
  | 'business_trip';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveScope = 'owner' | 'approver';

export interface LeaveRecord {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  approvedBy: string | null;
  rejectedReason: string | null;
  handoverTo: string | null;
  handoverNote: string | null;
  approver: string | null;
}

export interface LeaveFormPayload {
  type: LeaveType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  handoverTo: string | null;
  handoverNote: string | null;
  approver: string | null;
}

export interface EmployeeOption {
  code: string;
  name: string;
  role: string;
  department: string;
  position: string;
  avatar: string | null;
}

type EmployeeApi = {
  employee_code: string | null;
  name: string;
  role: string | null;
  department: string | null;
  position: string | null;
  avatar?: string | null;
};

function getAuthHeaders(withJson = false): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeLeaveRecord(input: LeaveRecord): LeaveRecord {
  return {
    ...input,
    startTime: input.startTime,
    endTime: input.endTime,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export async function fetchLeaves(
  status?: LeaveStatus | 'all',
  scope: LeaveScope = 'owner'
): Promise<LeaveRecord[]> {
  const url = new URL('/back-end/public/api/leaves', window.location.origin);
  if (status && status !== 'all') {
    url.searchParams.set('status', status);
  }
  if (scope !== 'owner') {
    url.searchParams.set('scope', scope);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: LeaveRecord[] };
  const records = Array.isArray(payload.data) ? payload.data : [];

  return records.map(normalizeLeaveRecord);
}

export async function fetchLeaveById(id: string): Promise<LeaveRecord> {
  const response = await fetch(`/back-end/public/api/leaves/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Không tìm thấy đơn nghỉ phép' : 'Không thể tải chi tiết đơn nghỉ phép');
  }

  const payload = (await response.json()) as { data?: LeaveRecord };

  if (!payload.data) {
    throw new Error('Không có dữ liệu đơn nghỉ phép');
  }

  return normalizeLeaveRecord(payload.data);
}

export async function createLeave(payload: LeaveFormPayload): Promise<LeaveRecord> {
  const response = await fetch('/back-end/public/api/leaves', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      type: payload.type,
      start_date: payload.startDate,
      end_date: payload.endDate,
      start_time: payload.startTime,
      end_time: payload.endTime,
      reason: payload.reason,
      handover_to_code: payload.handoverTo,
      handover_note: payload.handoverNote,
      approver_code: payload.approver,
    }),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: LeaveRecord };

  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Không thể tạo đơn nghỉ phép');
  }

  return normalizeLeaveRecord(body.data);
}

export async function updateLeave(id: string, payload: LeaveFormPayload): Promise<LeaveRecord> {
  const response = await fetch(`/back-end/public/api/leaves/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      type: payload.type,
      start_date: payload.startDate,
      end_date: payload.endDate,
      start_time: payload.startTime,
      end_time: payload.endTime,
      reason: payload.reason,
      handover_to_code: payload.handoverTo,
      handover_note: payload.handoverNote,
      approver_code: payload.approver,
    }),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: LeaveRecord };

  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Không thể cập nhật đơn nghỉ phép');
  }

  return normalizeLeaveRecord(body.data);
}

export async function deleteLeave(id: string): Promise<void> {
  const response = await fetch(`/back-end/public/api/leaves/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? 'Không thể xoá đơn nghỉ phép');
  }
}

export async function decideLeave(
  id: string,
  payload: { decision: 'approved' | 'rejected'; comment: string }
): Promise<LeaveRecord> {
  const response = await fetch(`/back-end/public/api/leaves/${id}/decision`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      decision: payload.decision,
      comment: payload.comment,
    }),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: LeaveRecord };

  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Khong the duyet don nghi phep');
  }

  return normalizeLeaveRecord(body.data);
}

export async function fetchLeaveEmployees(): Promise<EmployeeOption[]> {
  const url = new URL('/back-end/public/api/users', window.location.origin);
  url.searchParams.set('per_page', '200');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: EmployeeApi[] };
  const records = Array.isArray(payload.data) ? payload.data : [];

  return records
    .filter((item) => !!item.employee_code)
    .map((item) => ({
      code: item.employee_code as string,
      name: item.name,
      role: item.role ?? '',
      department: item.department ?? '',
      position: item.position ?? '',
      avatar: item.avatar ?? null,
    }));
}

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual_leave: 'Nghi phep nam',
  unpaid_leave: 'Nghi khong luong',
  late_arrival: 'Di tre',
  early_departure: 'Ve som',
  women_policy: 'Che do phu nu',
  marriage_leave: 'Ket hon',
  bereavement_leave: 'Tang che',
  business_trip: 'Cong tac',
};

export const leaveTypeIcons: Record<LeaveType, string> = {
  annual_leave: 'ri-sun-line',
  unpaid_leave: 'ri-money-dollar-circle-line',
  late_arrival: 'ri-run-line',
  early_departure: 'ri-walk-line',
  women_policy: 'ri-women-line',
  marriage_leave: 'ri-heart-line',
  bereavement_leave: 'ri-empathize-line',
  business_trip: 'ri-suitcase-line',
};

export const leaveTypeColors: Record<LeaveType, string> = {
  annual_leave: 'bg-accent-100 text-accent-700',
  unpaid_leave: 'bg-secondary-100 text-secondary-700',
  late_arrival: 'bg-primary-100 text-primary-700',
  early_departure: 'bg-primary-100 text-primary-700',
  women_policy: 'bg-accent-100 text-accent-700',
  marriage_leave: 'bg-accent-100 text-accent-700',
  bereavement_leave: 'bg-foreground-100 text-foreground-700',
  business_trip: 'bg-secondary-100 text-secondary-700',
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: 'Cho duyet',
  approved: 'Da duyet',
  rejected: 'Tu choi',
};

export const leaveStatusColors: Record<LeaveStatus, string> = {
  pending: 'bg-secondary-100 text-secondary-700',
  approved: 'bg-accent-100 text-accent-700',
  rejected: 'bg-primary-100 text-primary-700',
};
