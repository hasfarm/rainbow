export interface NotificationItem {
  id: string;
  type: 'announcement' | 'private';
  title: string;
  content: string;
  senderName: string;
  senderPosition: string;
  senderAvatar: string | null;
  recipientId: string | null;
  date: string;
  isRead: boolean;
  priority: 'normal' | 'important' | 'urgent';
  actionUrl: string | null;
  relatedStatus?: string | null;
}

export interface OvertimeApprovalItem {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  overtimeType: 'regular' | 'weekend' | 'holiday';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
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

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await fetch('/back-end/public/api/notifications', {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: NotificationItem[] };

  return Array.isArray(payload.data) ? payload.data : [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const response = await fetch(`/back-end/public/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export async function fetchOvertimeApprovalById(id: string): Promise<OvertimeApprovalItem> {
  const response = await fetch(`/back-end/public/api/overtimes/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(response.status === 404 ? 'Không tìm thấy phiếu tăng ca' : 'Không thể tải chi tiết phiếu tăng ca');
  }

  const payload = (await response.json()) as { data?: OvertimeApprovalItem };
  if (!payload.data) {
    throw new Error('Không có dữ liệu phiếu tăng ca');
  }

  return payload.data;
}

export async function decideOvertimeApproval(
  id: string,
  payload: { decision: 'approved' | 'rejected'; comment: string }
): Promise<OvertimeApprovalItem> {
  const response = await fetch(`/back-end/public/api/overtimes/${id}/decision`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: OvertimeApprovalItem };

  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Không thể duyệt phiếu tăng ca');
  }

  return body.data;
}

export const priorityLabels: Record<NotificationItem['priority'], string> = {
  normal: 'Thuong',
  important: 'Quan trong',
  urgent: 'Khan',
};

export const priorityColors: Record<NotificationItem['priority'], string> = {
  normal: 'bg-background-100 text-foreground-600',
  important: 'bg-secondary-100 text-secondary-700',
  urgent: 'bg-primary-100 text-primary-700',
};
