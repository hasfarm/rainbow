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
  currentApproverId?: string | null;
  approvalStage?: number | null;
  createdAt: string;
  rejectReason: string | null;
}

function getAuthHeaders(withJson = false): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeOvertime(input: OvertimeRecord): OvertimeRecord {
  return {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export async function fetchOvertimeById(id: string): Promise<OvertimeRecord> {
  const response = await fetch(`/back-end/public/api/overtimes/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Không tìm thấy phiếu tăng ca' : 'Không thể tải chi tiết phiếu tăng ca');
  }

  const payload = (await response.json()) as { data?: OvertimeRecord };
  if (!payload.data) {
    throw new Error('Không có dữ liệu phiếu tăng ca');
  }

  return normalizeOvertime(payload.data);
}

export async function decideOvertime(
  id: string,
  payload: { decision: 'approved' | 'rejected'; comment: string }
): Promise<OvertimeRecord> {
  const response = await fetch(`/back-end/public/api/overtimes/${id}/decision`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: OvertimeRecord };

  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Không thể duyệt phiếu tăng ca');
  }

  return normalizeOvertime(body.data);
}