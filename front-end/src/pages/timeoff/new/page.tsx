import { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/hooks/useAuth';
import { mockTimeOffs, type TimeOffType, type TimeOffSubType, type TimeOffRecord, timeOffTypeLabels, timeOffTypeIcons, timeOffTypeColors, timeOffSubTypeLabels, timeOffSubTypeIcons } from '@/mocks/timeoff';
import { getWorkStartTime, getWorkEndTime, getWorkHoursLabel, WAREHOUSE_DEPT } from '@/utils/workRules';
import { format } from 'date-fns';

const timeOffTypes: { type: TimeOffType; icon: string; description: string }[] = [
  { type: 'late_arrival', icon: 'ri-login-box-line', description: 'Đi làm trễ hơn giờ quy định của bộ phận' },
  { type: 'early_departure', icon: 'ri-logout-box-line', description: 'Về sớm hơn giờ quy định của bộ phận' },
  { type: 'women_policy', icon: 'ri-women-line', description: 'Đi trễ hoặc về sớm theo chế độ phụ nữ' },
];

const womenSubTypes: { subType: TimeOffSubType; icon: string; label: string }[] = [
  { subType: 'late', icon: 'ri-login-box-line', label: 'Đi trễ' },
  { subType: 'early', icon: 'ri-logout-box-line', label: 'Về sớm' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

type ApproverOption = {
  code: string;
  name: string;
  role: string;
  department: string;
  position: string;
  avatar: string | null;
};

type UserApi = {
  employee_code: string | null;
  name: string;
  role: string | null;
  department: string | null;
  position: string | null;
  avatar?: string | null;
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hrm_auth_token');

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function createTimeoffRequest(payload: {
  type: TimeOffType;
  sub_type: TimeOffSubType | null;
  work_date: string;
  expected_time: string | null;
  reason: string;
  approver_code: string;
}): Promise<void> {
  const response = await fetch('/back-end/public/api/timeoffs', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    const firstError = body.errors ? Object.values(body.errors)[0]?.[0] : null;
    throw new Error(firstError ?? body.message ?? 'Khong the gui don di tre/ve som');
  }
}

async function fetchApproverUsers(): Promise<ApproverOption[]> {
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

  const payload = (await response.json()) as { data?: UserApi[] };
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

export default function TimeOffNewPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<TimeOffType | null>(null);
  const [womenSubType, setWomenSubType] = useState<TimeOffSubType | null>(null);
  const [date, setDate] = useState('');
  const [expectedHour, setExpectedHour] = useState('');
  const [expectedMinute, setExpectedMinute] = useState('');
  const [reason, setReason] = useState('');
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const [approverQuery, setApproverQuery] = useState('');
  const [isApproverDropdownOpen, setIsApproverDropdownOpen] = useState(false);
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const approverDropdownRef = useRef<HTMLDivElement>(null);

  const department = user?.department ?? 'Kinh Doanh';
  const isWarehouse = department === WAREHOUSE_DEPT;
  const workStart = getWorkStartTime(department);
  const workEnd = getWorkEndTime(department);
  const workHoursLabel = getWorkHoursLabel(department);
  const expectedTime = expectedHour && expectedMinute ? `${expectedHour}:${expectedMinute}` : '';
  const [workStartHour, workStartMinute] = workStart.split(':').map(Number);
  const [workEndHour, workEndMinute] = workEnd.split(':').map(Number);
  const workStartTotalMin = workStartHour * 60 + workStartMinute;
  const workEndTotalMin = workEndHour * 60 + workEndMinute;

  // Effective mode for women_policy: derive late/early from subType
  const effectiveMode = selectedType === 'women_policy' ? womenSubType : (selectedType === 'late_arrival' ? 'late' : selectedType === 'early_departure' ? 'early' : null);

  // Whether to show time picker: for late_arrival / early_departure always, for women_policy only after subType selected
  const showTimePicker = selectedType === 'late_arrival' || selectedType === 'early_departure' || (selectedType === 'women_policy' && womenSubType !== null);

  const approversList = useMemo(() => {
    const selfId = (user?.id ?? '').trim().toLowerCase();
    const selfName = (user?.name ?? '').trim().toLowerCase();

    return approvers.filter((u) => {
      const candidateId = u.code.trim().toLowerCase();
      const candidateName = u.name.trim().toLowerCase();

      if (selfId !== '' && candidateId === selfId) {
        return false;
      }

      return !(selfName !== '' && candidateName === selfName);
    });
  }, [approvers, user?.id, user?.name]);

  const filteredApprovers = useMemo(() => {
    const keyword = approverQuery.trim().toLowerCase();

    if (!keyword) {
      return approversList;
    }

    return approversList.filter((person) => {
      const haystack = `${person.name} ${person.position} ${person.department}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [approverQuery, approversList]);

  const selectedApprover = approversList.find((u) => u.code === selectedApproverId);

  const expectedHourNumber = expectedHour === '' ? null : Number(expectedHour);

  const isExpectedHourDisabled = (hour: string): boolean => {
    const value = Number(hour);

    if (effectiveMode === 'late') {
      return value < workStartHour;
    }

    if (effectiveMode === 'early') {
      return value < workStartHour || value >= workEndHour;
    }

    return false;
  };

  const isExpectedMinuteDisabled = (minute: string, hourValue: number | null = expectedHourNumber): boolean => {
    if (effectiveMode === null || hourValue === null) {
      return false;
    }

    const minuteValue = Number(minute);

    if (effectiveMode === 'late' && hourValue === workStartHour) {
      return minuteValue <= workStartMinute;
    }

    if (effectiveMode === 'early') {
      if (hourValue === workStartHour) {
        return minuteValue <= workStartMinute;
      }
    }

    return false;
  };

  const getMinDate = () => format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function loadApprovers() {
      try {
        const records = await fetchApproverUsers();
        setApprovers(records);
      } catch {
        setApprovers([]);
      } finally {
        setLoadingApprovers(false);
      }
    }

    void loadApprovers();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (approverDropdownRef.current && !approverDropdownRef.current.contains(e.target as Node)) {
        setIsApproverDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Calculate late/early duration
  const calcTimeDiff = (): string | null => {
    if (!expectedTime || !effectiveMode) return null;
    const [eh, em] = expectedTime.split(':').map(Number);
    const expectedTotalMin = eh * 60 + em;

    if (effectiveMode === 'late') {
      const [sh, sm] = workStart.split(':').map(Number);
      const startTotalMin = sh * 60 + sm;
      const diff = expectedTotalMin - startTotalMin;
      if (diff <= 0) return null;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      if (h > 0 && m > 0) return `${h}h${m}p`;
      if (h > 0) return `${h} tiếng`;
      return `${m} phút`;
    }
    if (effectiveMode === 'early') {
      const [eh2, em2] = workEnd.split(':').map(Number);
      const endTotalMin = eh2 * 60 + em2;
      const diff = endTotalMin - expectedTotalMin;
      if (diff <= 0) return null;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      if (h > 0 && m > 0) return `${h}h${m}p`;
      if (h > 0) return `${h} tiếng`;
      return `${m} phút`;
    }
    return null;
  };

  const timeDiff = calcTimeDiff();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedType) {
      newErrors.type = 'Vui lòng chọn loại đơn';
    }
    if (selectedType === 'women_policy' && !womenSubType) {
      newErrors.womenSubType = 'Vui lòng chọn đi trễ hoặc về sớm';
    }
    if (!date) {
      newErrors.date = 'Vui lòng chọn ngày';
    }
    if (showTimePicker) {
      if (!expectedHour || !expectedMinute) {
        newErrors.time = `Vui lòng chọn giờ ${effectiveMode === 'late' ? 'check-in dự kiến' : 'check-out dự kiến'}`;
      }
      if (expectedTime && effectiveMode) {
        const [eh, em] = expectedTime.split(':').map(Number);
        const expectedTotalMin = eh * 60 + em;
        if (effectiveMode === 'late') {
          if (expectedTotalMin <= workStartTotalMin) {
            newErrors.time = 'Giờ check-in dự kiến phải sau giờ vào làm';
          }
        }
        if (effectiveMode === 'early') {
          if (expectedTotalMin <= workStartTotalMin) {
            newErrors.time = 'Giờ check-out dự kiến phải sau giờ bắt đầu làm';
          } else if (expectedTotalMin >= workEndTotalMin) {
            newErrors.time = 'Giờ check-out dự kiến phải trước giờ tan làm';
          }
        }
      }
    }
    if (!selectedApproverId) {
      newErrors.approver = 'Vui lòng chọn người duyệt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createTimeoffRequest({
        type: selectedType as TimeOffType,
        sub_type: selectedType === 'women_policy' ? womenSubType : null,
        work_date: date,
        expected_time: showTimePicker ? expectedTime : null,
        reason: reason.trim(),
        approver_code: selectedApproverId,
      });
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : 'Khong the gui don di tre/ve som');
      return;
    }

    const newTimeOff: TimeOffRecord = {
      id: `TO-${String(mockTimeOffs.length + 1).padStart(3, '0')}`,
      userId: user.id,
      type: selectedType!,
      subType: selectedType === 'women_policy' ? womenSubType : undefined,
      date,
      expectedTime: showTimePicker ? expectedTime : null,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedBy: null,
      rejectedReason: null,
      approver: selectedApprover?.code ?? null,
    };

    mockTimeOffs.unshift(newTimeOff);
    setIsSubmitting(false);
    setShowSuccess(true);

    setTimeout(() => {
      navigate('/timeoff');
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mb-5 animate-bounce">
            <i className="ri-check-line text-3xl text-accent-600"></i>
          </div>
          <h2 className="text-lg font-heading font-bold text-foreground-950 mb-1">Đã gửi đơn thành công!</h2>
          <p className="text-sm text-foreground-500 mb-1">
            Đơn {selectedType && timeOffTypeLabels[selectedType].toLowerCase()} của bạn đã được gửi đến{' '}
            <span className="font-semibold text-foreground-700">{selectedApprover?.name}</span>.
          </p>
          <p className="text-xs text-foreground-400">Đang chuyển về danh sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/timeoff" className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center hover:bg-background-200 transition-colors cursor-pointer shrink-0">
          <i className="ri-arrow-left-line text-foreground-600"></i>
        </Link>
        <h1 className="text-lg font-heading font-bold text-foreground-950">Tạo đơn đi trễ / về sớm</h1>
      </div>

      {/* Department working hours info */}
      <div className={`border rounded-xl p-3.5 mb-5 flex items-start gap-3 ${isWarehouse ? 'bg-secondary-50 border-secondary-200/60' : 'bg-background-50 border-background-200/70'}`}>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isWarehouse ? 'bg-secondary-100' : 'bg-background-100'}`}>
          <i className={`ri-building-line text-lg ${isWarehouse ? 'text-secondary-600' : 'text-foreground-500'}`}></i>
        </span>
        <div>
          <p className="text-xs font-semibold text-foreground-950">{department}</p>
          <p className="text-[11px] text-foreground-600 mt-0.5">Giờ làm việc: {workHoursLabel}</p>
          {isWarehouse && (
            <p className="text-[10px] text-secondary-600 mt-0.5 font-medium">Kho Vận có khung giờ làm việc riêng, khác với các bộ phận khác</p>
          )}
        </div>
      </div>

      {/* ─────── 1. Loại đơn ─────── */}
      <div className="mb-5">
        <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
          Loại đơn <span className="text-primary-500">*</span>
        </h2>
        {errors.type && <p className="text-xs text-primary-500 mb-2">{errors.type}</p>}

        <div className="flex items-stretch gap-2">
          {timeOffTypes.map((item) => {
            const isSelected = selectedType === item.type;
            const typeColor = timeOffTypeColors[item.type];
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  setSelectedType(item.type);
                  setWomenSubType(null);
                  setExpectedHour('');
                  setExpectedMinute('');
                  setErrors({});
                }}
                className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-primary-400 bg-primary-50/50'
                    : 'border-background-200/70 bg-background-50 hover:border-background-300 hover:bg-background-100'
                }`}
              >
                <span className={`w-10 h-10 ${typeColor.split(' ')[0]} rounded-xl flex items-center justify-center`}>
                  <i className={`${item.icon} text-lg ${typeColor.split(' ')[1]}`}></i>
                </span>
                <span className={`text-xs font-semibold leading-tight text-center ${isSelected ? 'text-primary-700' : 'text-foreground-700'}`}>
                  {timeOffTypeLabels[item.type]}
                </span>
                <span className="text-[10px] text-foreground-500 text-center leading-tight">{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────── 1b. Sub-type cho Chế độ phụ nữ ─────── */}
      {selectedType === 'women_policy' && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Hình thức <span className="text-primary-500">*</span>
          </h2>
          {errors.womenSubType && <p className="text-xs text-primary-500 mb-2">{errors.womenSubType}</p>}

          <div className="flex items-stretch gap-2">
            {womenSubTypes.map((item) => {
              const isSelected = womenSubType === item.subType;
              return (
                <button
                  key={item.subType}
                  type="button"
                  onClick={() => {
                    setWomenSubType(item.subType);
                    setExpectedHour('');
                    setExpectedMinute('');
                    setErrors({});
                  }}
                  className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-primary-400 bg-primary-50/50'
                      : 'border-background-200/70 bg-background-50 hover:border-background-300 hover:bg-background-100'
                  }`}
                >
                  <span className={`w-10 h-10 ${isSelected ? 'bg-primary-100' : 'bg-background-100'} rounded-xl flex items-center justify-center`}>
                    <i className={`${item.icon} text-lg ${isSelected ? 'text-primary-600' : 'text-foreground-500'}`}></i>
                  </span>
                  <span className={`text-xs font-semibold leading-tight text-center whitespace-nowrap ${isSelected ? 'text-primary-700' : 'text-foreground-700'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-foreground-500 text-center leading-tight">
                    {item.subType === 'late' ? 'Vào làm muộn hơn giờ quy định' : 'Tan làm sớm hơn giờ quy định'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────── 2. Ngày dự kiến ─────── */}
      {selectedType && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            {selectedType === 'women_policy' && !womenSubType ? 'Ngày nghỉ' : 'Ngày dự kiến'} <span className="text-primary-500">*</span>
          </h2>
          <input
            type="date"
            value={date}
            min={getMinDate()}
            onChange={(e) => { setDate(e.target.value); setErrors((prev) => ({ ...prev, date: '' })); }}
            className={`w-full px-3.5 py-2.5 text-sm bg-background-50 border rounded-lg outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
              errors.date ? 'border-primary-400' : 'border-background-200/70'
            }`}
          />
          {errors.date && <p className="text-[11px] text-primary-500 mt-1">{errors.date}</p>}
        </div>
      )}

      {/* ─────── 3. Giờ dự kiến ─────── */}
      {showTimePicker && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            {effectiveMode === 'late' ? 'Giờ check-in dự kiến' : 'Giờ check-out dự kiến'} <span className="text-primary-500">*</span>
          </h2>

          {errors.time && <p className="text-xs text-primary-500 mb-2">{errors.time}</p>}

          {/* Reference line showing normal time */}
          <div className="flex items-center gap-2 mb-3 text-xs text-foreground-500 bg-background-50 border border-background-200/70 rounded-lg px-3 py-2">
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              <i className="ri-information-line text-foreground-400"></i>
            </span>
            <span>
              {effectiveMode === 'late'
                ? `Giờ vào làm chuẩn: ${workStart}`
                : `Giờ tan làm chuẩn: ${workEnd}`}
            </span>
            {effectiveMode === 'late' && (
              <span className="ml-auto text-[10px] font-medium text-accent-600 whitespace-nowrap">
                Chọn giờ sau {workStart}
              </span>
            )}
            {effectiveMode === 'early' && (
              <span className="ml-auto text-[10px] font-medium text-accent-600 whitespace-nowrap">
                Chọn giờ trước {workEnd}
              </span>
            )}
          </div>

          {/* 24h time picker */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <select
                value={expectedHour}
                onChange={(e) => {
                  const nextHour = e.target.value;
                  setExpectedHour(nextHour);

                  if (nextHour === '') {
                    setExpectedMinute('');
                  } else {
                    const nextHourNumber = Number(nextHour);
                    if (expectedMinute !== '' && isExpectedMinuteDisabled(expectedMinute, nextHourNumber)) {
                      setExpectedMinute('');
                    }
                  }

                  setErrors((prev) => ({ ...prev, time: '' }));
                }}
                className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none appearance-none cursor-pointer transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                  errors.time && !expectedHour ? 'border-primary-400' : 'border-background-200/70'
                }`}
              >
                <option value="">Giờ</option>
                {HOURS.map((h) => (
                  <option key={h} value={h} disabled={isExpectedHourDisabled(h)}>{h}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-foreground-400 text-xs"></i>
              </span>
            </div>
            <span className="text-foreground-400 text-sm font-medium">:</span>
            <div className="relative flex-1">
              <select
                value={expectedMinute}
                onChange={(e) => { setExpectedMinute(e.target.value); setErrors((prev) => ({ ...prev, time: '' })); }}
                className={`w-full px-3 py-2.5 text-sm bg-background-50 border rounded-lg outline-none appearance-none cursor-pointer transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
                  errors.time && !expectedMinute ? 'border-primary-400' : 'border-background-200/70'
                }`}
              >
                <option value="">Phút</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m} disabled={isExpectedMinuteDisabled(m)}>{m}</option>
                ))}
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-foreground-400 text-xs"></i>
              </span>
            </div>
          </div>

          {/* Time diff badge */}
          {expectedTime && timeDiff && (
            <div className="mt-3 bg-background-50 border border-background-200/70 rounded-lg px-3.5 py-3">
              <div className="flex items-center gap-2">
                {effectiveMode === 'late' ? (
                  <span className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center shrink-0">
                    <i className="ri-login-box-line text-secondary-600"></i>
                  </span>
                ) : (
                  <span className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center shrink-0">
                    <i className="ri-logout-box-line text-accent-600"></i>
                  </span>
                )}
                <div>
                  <p className="text-[11px] text-foreground-500">
                    {effectiveMode === 'late' ? 'Dự kiến đi trễ' : 'Dự kiến về sớm'}
                  </p>
                  <p className="text-sm font-heading font-bold text-foreground-950">{timeDiff}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-foreground-400">
                    {effectiveMode === 'late' ? `Check-in: ${expectedTime}` : `Check-out: ${expectedTime}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────── 4. Người duyệt ─────── */}
      {selectedType && (
        <div className="mb-5 animate-[fadeInUp_0.25s_ease-out] relative" ref={approverDropdownRef}>
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Người duyệt <span className="text-primary-500">*</span>
          </h2>
          {errors.approver && <p className="text-xs text-primary-500 mb-2">{errors.approver}</p>}

          <button
            type="button"
            onClick={() => {
              setIsApproverDropdownOpen(!isApproverDropdownOpen);
              if (!isApproverDropdownOpen) {
                setApproverQuery('');
              }
            }}
            disabled={loadingApprovers}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-background-50 border rounded-xl text-left transition-all duration-200 cursor-pointer ${
              isApproverDropdownOpen
                ? 'border-primary-400 ring-2 ring-primary-400/30'
                : errors.approver
                  ? 'border-primary-400'
                  : 'border-background-200/70 hover:border-background-300'
            }`}
          >
            {selectedApprover ? (
              <>
                <span className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-user-star-line text-base text-primary-600"></i>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground-950 font-medium">{selectedApprover.name}</p>
                  <p className="text-[11px] text-foreground-500">{selectedApprover.position} — {selectedApprover.department}</p>
                </div>
              </>
            ) : (
              <>
                <span className="w-9 h-9 bg-background-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-user-received-line text-base text-foreground-400"></i>
                </span>
                <span className="text-sm text-foreground-400 flex-1">{loadingApprovers ? 'Đang tải danh sách người duyệt...' : 'Chọn quản lý / admin duyệt...'}</span>
              </>
            )}
            <span className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 ${isApproverDropdownOpen ? 'rotate-180' : ''}`}>
              <i className="ri-arrow-down-s-line text-foreground-400"></i>
            </span>
          </button>

          {isApproverDropdownOpen && (
            <div className="absolute left-4 right-4 mt-1.5 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-40 max-h-56 overflow-y-auto animate-[fadeInUp_0.2s_ease-out]">
              <div className="p-2 border-b border-background-200/70 sticky top-0 bg-background-50 z-10">
                <input
                  type="text"
                  value={approverQuery}
                  onChange={(event) => setApproverQuery(event.target.value)}
                  placeholder="Tìm người duyệt theo tên/chức vụ/phòng ban..."
                  className="w-full rounded-lg border border-background-200/70 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50"
                />
              </div>

              {filteredApprovers.map((person) => (
                <button
                  key={person.code}
                  type="button"
                  onClick={() => {
                    setSelectedApproverId(person.code);
                    setIsApproverDropdownOpen(false);
                    setApproverQuery('');
                    setErrors((prev) => ({ ...prev, approver: '' }));
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer mb-0.5 ${
                    selectedApproverId === person.code ? 'bg-primary-50' : 'hover:bg-background-100'
                  }`}
                >
                  <span className="w-8 h-8 bg-background-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <i className="ri-user-line text-foreground-400"></i>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold leading-tight ${selectedApproverId === person.code ? 'text-primary-700' : 'text-foreground-950'}`}>
                      {person.name}
                    </p>
                    <p className="text-[10px] text-foreground-500 leading-tight">{person.position} — {person.department}</p>
                  </div>
                  {selectedApproverId === person.code && (
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      <i className="ri-check-line text-primary-500"></i>
                    </span>
                  )}
                </button>
              ))}

              {filteredApprovers.length === 0 && (
                <p className="px-3 py-3 text-xs text-foreground-500">Không tìm thấy người duyệt phù hợp</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────── 5. Lý do ─────── */}
      {selectedType && (
        <div className="mb-6 animate-[fadeInUp_0.25s_ease-out]">
          <h2 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
            Lý do <span className="text-[11px] text-foreground-400 font-normal">(không bắt buộc)</span>
          </h2>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setErrors((prev) => ({ ...prev, reason: '' })); }}
            placeholder={
              selectedType === 'women_policy'
                ? `Nhập lý do xin ${womenSubType === 'late' ? 'đi trễ' : womenSubType === 'early' ? 'về sớm' : 'nghỉ'} theo chế độ phụ nữ...`
                : selectedType === 'late_arrival'
                  ? 'Nhập lý do đi trễ...'
                  : 'Nhập lý do về sớm...'
            }
            maxLength={500}
            rows={4}
            className={`w-full px-3.5 py-3 text-sm bg-background-50 border rounded-xl outline-none resize-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50 ${
              errors.reason ? 'border-primary-400' : 'border-background-200/70'
            }`}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span />
            <p className="text-[11px] text-foreground-400">{reason.length}/500</p>
          </div>
        </div>
      )}

      {/* ─────── Submit ─────── */}
      {submitError && (
        <div className="mb-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
          {submitError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedType}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${
          !selectedType || isSubmitting
            ? 'bg-foreground-200 text-foreground-400 cursor-not-allowed'
            : 'bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.98]'
        }`}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Đang gửi...
          </>
        ) : (
          <>
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-send-plane-line text-sm"></i>
            </span>
            Gửi đơn
          </>
        )}
      </button>
    </div>
  );
}