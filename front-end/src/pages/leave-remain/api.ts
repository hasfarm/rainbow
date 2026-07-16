export interface LeaveRemainRecord {
  id: number;
  userCode: string;
  year: number;
  remainingDays: number;
  employeeName: string | null;
  department: string | null;
  position: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LeaveRemainPayload {
  userCode: string;
  year: number;
  remainingDays: number;
}

export interface LeaveRemainEmployeeOption {
  code: string;
  name: string;
  department: string;
  position: string;
}

type EmployeeApi = {
  employee_code: string | null;
  name: string;
  department: string | null;
  position: string | null;
};

function getAuthHeaders(withJson = false): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchLeaveRemainRecords(query?: string, year?: number): Promise<LeaveRemainRecord[]> {
  const url = new URL('/back-end/public/api/leaves-remain', window.location.origin);

  if (query && query.trim() !== '') {
    url.searchParams.set('q', query.trim());
  }

  if (typeof year === 'number' && Number.isFinite(year)) {
    url.searchParams.set('year', String(year));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: LeaveRemainRecord[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function createLeaveRemain(input: LeaveRemainPayload): Promise<LeaveRemainRecord> {
  const response = await fetch('/back-end/public/api/leaves-remain', {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      user_code: input.userCode,
      year: input.year,
      remaining_days: input.remainingDays,
    }),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: LeaveRemainRecord };
  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Khong the tao ban ghi phep ton');
  }

  return body.data;
}

export async function updateLeaveRemain(id: number, input: LeaveRemainPayload): Promise<LeaveRemainRecord> {
  const response = await fetch(`/back-end/public/api/leaves-remain/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      user_code: input.userCode,
      year: input.year,
      remaining_days: input.remainingDays,
    }),
  });

  const body = (await response.json()) as { message?: string; errors?: Record<string, string[]>; data?: LeaveRemainRecord };
  if (!response.ok || !body.data) {
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Khong the cap nhat ban ghi phep ton');
  }

  return body.data;
}

export async function deleteLeaveRemain(id: number): Promise<void> {
  const response = await fetch(`/back-end/public/api/leaves-remain/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? 'Khong the xoa ban ghi phep ton');
  }
}

export async function fetchLeaveRemainEmployees(): Promise<LeaveRemainEmployeeOption[]> {
  const url = new URL('/back-end/public/api/employees', window.location.origin);
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
      department: item.department ?? '',
      position: item.position ?? '',
    }));
}
